const { pool } = require('../config/db');
const CRMForm = require('../models/crmFormModel');
const GoogleSheetsConfig = require('../models/googleSheetsModel');
const LeadSyncLog = require('../models/leadSyncLogModel');
const LeadService = require('../services/leadService');
const { google } = require('googleapis');
const Catalog = require('../models/catalogModel');
const ChannelConfig = require('../models/channelConfigModel');
const axios = require('axios');

const integrationController = {
    // --- CRM Forms ---
    createForm: async (req, res) => {
        try {
            const formId = await CRMForm.create({ ...req.body, user_id: req.user.id });
            res.status(201).json({ message: 'CRM Form created successfully', formId });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getForms: async (req, res) => {
        try {
            const { page, limit, search, status } = req.query;
            const result = await CRMForm.findAllByUserId(req.user.id, { page, limit, search, status });
            res.json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updateForm: async (req, res) => {
        try {
            await CRMForm.update(req.params.id, req.user.id, req.body);
            res.json({ message: 'CRM Form updated successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    deleteForm: async (req, res) => {
        try {
            await CRMForm.delete(req.params.id, req.user.id);
            await LeadSyncLog.deleteByReferenceId(req.user.id, req.params.id, 'crm_form');
            res.json({ message: 'CRM Form deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },



    // Public Form Submission
    getPublicForm: async (req, res) => {
        const { slug } = req.params;
        try {
            const form = await CRMForm.findBySlug(slug);
            if (!form || form.status !== 'active') {
                return res.status(404).json({ message: 'Form not found or inactive' });
            }

            // Check if we need to fetch catalogs
            // Field name for services might be 'services' or 'interested_in'
            const fields = typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields;
            const needsCatalogs = fields.some(f => f.name === 'services' || f.name === 'interested_in' || f.label === 'Services');

            let catalogs = [];
            if (needsCatalogs) {
                const catalogResult = await Catalog.findAll(form.user_id, 1, 1000, 'Active');
                catalogs = catalogResult.catalogs.map(c => ({ id: c.id, name: c.name, minPrice: c.minPrice, maxPrice: c.maxPrice }));
            }

            // Return only public fields
            res.json({
                form_name: form.form_name,
                fields: form.fields,
                settings: form.settings,
                form_slug: form.form_slug,
                catalogs: catalogs
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    submitPublicForm: async (req, res) => {

        const { slug } = req.params;
        try {
            const form = await CRMForm.findBySlug(slug);
            if (!form || form.status !== 'active') {
                return res.status(404).json({ message: 'Form not found or inactive' });
            }

            const result = await LeadService.processLead(req.body, form.user_id, 'crm_form');

            await LeadSyncLog.create({
                user_id: form.user_id,
                channel_type: 'crm_form',
                reference_id: form.id,
                status: 'success',
                message: `Lead ${result.action} from form submission`,
                raw_data: req.body
            });

            res.json({ message: 'Form submitted successfully', action: result.action });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // --- Google Sheets ---
    createSheetConfig: async (req, res) => {
        try {
            const configId = await GoogleSheetsConfig.create({ ...req.body, user_id: req.user.id });
            res.status(201).json({ message: 'Google Sheets configuration saved', configId });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getSheetsConfigs: async (req, res) => {
        try {
            const { page, limit, search, sync_frequency } = req.query;
            const result = await GoogleSheetsConfig.findAllByUserId(req.user.id, { page, limit, search, sync_frequency });
            res.json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updateSheetConfig: async (req, res) => {
        try {
            await GoogleSheetsConfig.update(req.params.id, req.user.id, req.body);
            res.json({ message: 'Configuration updated successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    deleteSheetConfig: async (req, res) => {
        try {
            await GoogleSheetsConfig.delete(req.params.id, req.user.id);
            res.json({ message: 'Configuration deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    syncSheet: async (req, res) => {
        const { id } = req.params;
        try {
            const config = await GoogleSheetsConfig.findById(id, req.user.id);
            if (!config) return res.status(404).json({ message: 'Configuration not found' });

            const credentials = JSON.parse(config.credentials_json);
            const privateKey = credentials.private_key.replace(/\\n/g, '\n');

            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: credentials.client_email,
                    private_key: privateKey,
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });

            const client = await auth.getClient();
            const sheets = google.sheets({ version: 'v4', auth: client });

            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: config.spreadsheet_id,
                range: config.sheet_id || 'Sheet1',
            });



            const rows = response.data.values;
            if (!rows || rows.length < 2) {
                return res.status(400).json({ message: 'No data found in sheet' });
            }

            const headers = rows[0].map(h => h.toString().trim().toLowerCase());
            const mapping = typeof config.field_mapping === 'string' ? JSON.parse(config.field_mapping) : config.field_mapping;
            let successCount = 0;
            let errorCount = 0;

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const leadData = {};
                let hasData = false;

                Object.keys(mapping).forEach(crmField => {
                    const mappedHeader = mapping[crmField]?.toString().trim().toLowerCase();
                    if (!mappedHeader) return;

                    const sheetColumnIndex = headers.indexOf(mappedHeader);
                    if (sheetColumnIndex !== -1 && row[sheetColumnIndex]) {
                        leadData[crmField] = row[sheetColumnIndex];
                        hasData = true;
                    }
                });

                if (!hasData) continue;

                try {
                    await LeadService.processLead(leadData, req.user.id, 'google_sheets');
                    successCount++;
                } catch (err) {
                    errorCount++;
                    console.error(`Error processing row ${i}:`, err);
                }
            }


            await GoogleSheetsConfig.update(id, req.user.id, { last_sync_at: new Date() });

            await LeadSyncLog.create({
                user_id: req.user.id,
                channel_type: 'google_sheets',
                reference_id: config.id,
                status: 'success',
                message: `Sync completed: ${successCount} processed, ${errorCount} errors`,
                raw_data: { successCount, errorCount }
            });

            res.json({ message: 'Sync completed', successCount, errorCount });
        } catch (error) {
            await LeadSyncLog.create({
                user_id: req.user.id,
                channel_type: 'google_sheets',
                reference_id: req.params.id,
                status: 'error',
                message: `Sync failed: ${error.message}`,
                raw_data: { error: error.stack }
            });
            res.status(500).json({ message: `Sync failed: ${error.message}` });
        }
    },

    getLogs: async (req, res) => {
        try {
            const { page, limit, channel_type } = req.query;
            const logs = await LeadSyncLog.findAllByUserId(req.user.id, { page, limit, channel_type });
            res.json(logs);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // --- Channel Integrations (Meta, Justdial, IndiaMart) ---
    getChannelConfigs: async (req, res) => {
        try {
            const { type } = req.query;
            const configs = await ChannelConfig.findAll(req.user.id, type);
            res.json({ data: configs });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    saveChannelConfig: async (req, res) => {
        try {
            const { channel_type, account_name, api_key, config_data } = req.body;

            // --- Real-time Verification Logic ---
            if (channel_type === 'meta') {
                try {
                    // Check token validity and page access
                    const pageId = config_data?.page_id;
                    const metaCheck = await axios.get(`https://graph.facebook.com/v18.0/${pageId || 'me'}?access_token=${api_key}`);
                    if (!metaCheck.data || metaCheck.data.error) {
                        throw new Error(metaCheck.data?.error?.message || "Invalid Meta Token");
                    }
                } catch (err) {
                    return res.status(400).json({
                        message: "Meta Authentication Failed. Please check your Page ID and Access Token."
                    });
                }
            } else if (channel_type === 'indiamart') {
                try {
                    // Test hit to Indiamart API
                    const imCheck = await axios.get(`https://mapi.indiamart.com/wservce/enquiry/listing/GLUSR_MOBILE/${account_name}/GLUSR_MOBILE_KEY/${api_key}/`);

                    // Indiamart returns "CODE: 403" or "Invalid Key" inside the successful HTTP response sometimes
                    if (imCheck.data?.STATUS === "FAILURE" || (imCheck.data?.CODE && imCheck.data?.CODE !== "200")) {
                        throw new Error(imCheck.data?.MESSAGE || "Invalid IndiaMart Key or Mobile Number");
                    }
                } catch (err) {
                    return res.status(400).json({
                        message: "IndiaMart Verification Failed. Please check your Mobile and CRM API Key."
                    });
                }
            } else if (channel_type === 'justdial') {
                try {
                    const mobile = config_data?.mobile;
                    if (!mobile || !api_key) {
                        return res.status(400).json({ message: "Mobile Number and API Key are required for Justdial" });
                    }
                    // Test hit to Justdial lead fetch endpoint
                    const jdCheck = await axios.get(`http://api.justdial.com/free_api/getleads.php?mobile=${mobile}&key=${api_key}`);

                    // Justdial often returns 200 with error text in the body or 401/403
                    if (jdCheck.data && (jdCheck.data.toString().includes("Invalid") || jdCheck.data.status === "failure")) {
                        throw new Error("Invalid Justdial credentials");
                    }
                } catch (err) {
                    return res.status(400).json({
                        message: "Justdial Verification Failed. Please verify your Registered Mobile and API Key."
                    });
                }
            }

            const configId = await ChannelConfig.create({ ...req.body, user_id: req.user.id });
            res.status(201).json({ message: 'Configuration verified and saved successfully', id: configId });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    deleteChannelConfig: async (req, res) => {
        try {
            const { id } = req.params;
            await ChannelConfig.delete(id, req.user.id);
            res.json({ message: 'Configuration deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // --- WhatsApp Specific ---
    getWhatsAppConfig: async (req, res) => {
        try {
            const configs = await ChannelConfig.findAll(req.user.id, 'whatsapp');
            res.json({
                success: true,
                data: configs // Return all configs instead of just [0]
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    saveWhatsAppConfig: async (req, res) => {
        try {
            const {
                id, account_name, phoneNumberId, businessAccountId, accessToken,
                apiUrl, apiVersion, webhookVerifyToken, provider, status, businessId
            } = req.body;
            const userId = parseInt(req.user.id);
            const currentApiVersion = apiVersion || "v19.0";

            // --- Real-time Meta Credentials Verification ---
            try {
                let verificationUrl = apiUrl || "https://graph.facebook.com";
                const isDefaultMeta = !verificationUrl || verificationUrl === "https://graph.facebook.com";

                let requestOptions = {
                    params: { access_token: accessToken } // Default for Meta
                };

                if (isDefaultMeta) {
                    verificationUrl = `https://graph.facebook.com/${currentApiVersion}/${phoneNumberId}`;
                } else {
                    // Custom gateway (e.g., crmapp.seeviewapi.com)
                    // Match the authentication style used in templates fetcher
                    const cleanBase = verificationUrl.replace(/\/$/, '');
                    verificationUrl = `${cleanBase}/${currentApiVersion}/${phoneNumberId}`;

                    requestOptions = {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'API-KEY': accessToken,
                            'Content-Type': 'application/json'
                        }
                    };
                }

                const verification = await axios.get(verificationUrl, requestOptions);

                if (!verification.data || (!verification.data.id && !verification.data.id_phone)) {
                    throw new Error("Invalid Meta response");
                }
            } catch (err) {
                console.error('WhatsApp Pre-save Verification Error:', err.response?.data || err.message);
                const metaMsg = err.response?.data?.error?.message || "Invalid WhatsApp credentials (Phone ID or Access Token)";
                return res.status(400).json({
                    success: false,
                    message: `Verification Failed: ${metaMsg}. Please check your credentials.`
                });
            }

            // Automically set new valid accounts to 'Active'. For updates, respect the user's status choice.
            const dbStatus = (!id || status === 'active') ? 'Active' : 'Inactive';

            const configData = {
                phoneNumberId,
                businessAccountId,
                apiUrl: apiUrl || "https://graph.facebook.com",
                apiVersion: currentApiVersion,
                webhookVerifyToken,
                provider,
                status,
                businessId
            };

            if (id) {
                // UPDATE existing row
                await pool.query(
                    `UPDATE channel_configs 
                     SET api_key = ?, config_data = ?, status = ?, account_name = ?
                     WHERE id = ? AND user_id = ?`,
                    [accessToken, JSON.stringify(configData), dbStatus, account_name || 'WhatsApp Account', id, userId]
                );
            } else {
                // INSERT new row
                await pool.query(
                    `INSERT INTO channel_configs (user_id, channel_type, account_name, api_key, config_data, status)
                     VALUES (?, 'whatsapp', ?, ?, ?, ?)`,
                    [userId, account_name || 'New WhatsApp Account', accessToken, JSON.stringify(configData), dbStatus]
                );
            }

            res.json({ success: true, message: 'WhatsApp configuration verified and saved successfully' });
        } catch (error) {
            console.error('Save WhatsApp Config Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    sendWhatsAppTestMessage: async (req, res) => {
        try {
            const { phone, config, configId } = req.body;
            let finalConfig = config;

            if (configId) {
                const dbConfig = await ChannelConfig.findById(configId, req.user.id);
                if (dbConfig) {
                    const parsedData = typeof dbConfig.config_data === 'string' ? JSON.parse(dbConfig.config_data) : dbConfig.config_data;
                    finalConfig = { ...parsedData, accessToken: dbConfig.api_key };
                }
            }

            const accessToken = finalConfig.accessToken;
            const phoneNumberId = finalConfig.phoneNumberId;
            const apiVersion = finalConfig.apiVersion || 'v19.0';

            let finalUrl = config.apiUrl;
            if (!finalUrl || finalUrl === 'https://graph.facebook.com') {
                finalUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
            } else {
                // For custom gateways, we still need to append the Meta path standard suffix 
                // if it's not already there
                if (!finalUrl.includes('/messages')) {
                    finalUrl = `${finalUrl.replace(/\/$/, '')}/${apiVersion}/${phoneNumberId}/messages`;
                }
            }

            // Prepare the payload for Meta Cloud API
            const payload = {
                messaging_product: "whatsapp",
                to: phone,
                type: "template",
                template: {
                    name: "hello_world",
                    language: { code: "en_US" }
                }
            };

            const response = await axios.post(finalUrl, payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            res.json({ success: true, data: response.data, message: "Test message sent successfully" });
        } catch (error) {
            console.error('WhatsApp Test Error:', error.response?.data || error.message);
            res.status(400).json({
                success: false,
                message: error.response?.data?.error?.message || error.message,
                error: error.response?.data || error.message
            });
        }
    },

    getWhatsAppTemplates: async (req, res) => {
        try {
            const { configId } = req.query;
            let config;

            if (configId) {
                config = await ChannelConfig.findById(configId, req.user.id);
            } else {
                const configs = await ChannelConfig.findAll(req.user.id, 'whatsapp');
                config = configs[0];
            }

            if (!config) return res.status(404).json({ message: 'WhatsApp not configured' });
            const configData = typeof config.config_data === 'string' ? JSON.parse(config.config_data) : config.config_data;
            const wabaId = configData.businessAccountId;
            const accessToken = config.api_key;
            const apiVersion = configData.apiVersion || 'v19.0';

            // Build templates URL from saved apiUrl (respect custom gateway)
            const baseApiUrl = configData.apiUrl || 'https://graph.facebook.com';
            const isDefaultMeta = !baseApiUrl || baseApiUrl === 'https://graph.facebook.com';

            let templatesUrl;
            let requestConfig;

            if (isDefaultMeta) {
                // Official Meta Cloud API — uses access_token as query param
                templatesUrl = `https://graph.facebook.com/${apiVersion}/${wabaId}/message_templates`;
                requestConfig = {
                    params: { access_token: accessToken, limit: 100 }
                };
            } else {
                // Custom gateway (e.g. https://crmapp.seeviewapi.com/api/meta)
                // Uses Authorization: Bearer header + API-KEY header
                const cleanBase = baseApiUrl.replace(/\/$/, '');
                templatesUrl = `${cleanBase}/${apiVersion}/${wabaId}/message_templates`;
                requestConfig = {
                    params: { limit: 100 },
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'API-KEY': accessToken,
                        'Content-Type': 'application/json'
                    }
                };
            }

            console.log('[Templates] Hitting URL:', templatesUrl);

            const response = await axios.get(templatesUrl, requestConfig);


            // Handle multiple possible response formats from different gateways
            // Meta format: { data: [...] }
            // Custom gateway might use: { templates: [...] } or { data: { data: [...] } } or just [...]
            let rawList =
                response.data?.data ||          // Meta standard: { data: [...] }
                response.data?.templates ||      // Custom: { templates: [...] }
                response.data?.records ||        // Custom: { records: [...] }
                (Array.isArray(response.data) ? response.data : []);  // Direct array

            // Case-insensitive APPROVED filter
            const templates = rawList.filter(t =>
                (t.status || '').toUpperCase() === 'APPROVED'
            );

            res.json({
                success: true,
                data: templates
            });
        } catch (error) {
            console.error('Fetch Templates Error:', error.response?.data || error.message);
            const status = error.response?.status || 400;
            res.status(status).json({
                success: false,
                message: error.response?.data?.error?.message || error.message
            });
        }
    },

    sendWhatsAppMessage: async (req, res) => {
        try {
            const { phone, templateName, languageCode, components, leadId, configId } = req.body;

            let config;
            if (configId) {
                config = await ChannelConfig.findById(configId, req.user.id);
            } else {
                const configs = await ChannelConfig.findAll(req.user.id, 'whatsapp');
                config = configs[0];
            }

            if (!config) return res.status(404).json({ message: 'WhatsApp not configured' });

            const configData = typeof config.config_data === 'string' ? JSON.parse(config.config_data) : config.config_data;
            const accessToken = config.api_key;
            const phoneNumberId = configData.phoneNumberId;
            const apiVersion = configData.apiVersion || 'v19.0';

            let finalUrl = configData.apiUrl || 'https://graph.facebook.com';
            if (finalUrl === 'https://graph.facebook.com') {
                finalUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
            } else {
                if (!finalUrl.includes('/messages')) {
                    finalUrl = `${finalUrl.replace(/\/$/, '')}/${apiVersion}/${phoneNumberId}/messages`;
                }
            }

            const payload = {
                messaging_product: "whatsapp",
                to: phone,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: languageCode || "en_US" },
                    components: components || []
                }
            };

            const response = await axios.post(finalUrl, payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            // Log the sync
            await LeadSyncLog.create({
                user_id: req.user.id,
                channel_type: 'whatsapp_msg',
                reference_id: leadId || null,
                status: 'success',
                message: `Template ${templateName} sent to ${phone} via ${config.account_name}`,
                raw_data: { templateName, phone, response: response.data, config_id: config.id, account_name: config.account_name }
            });

            res.json({ success: true, data: response.data, message: "Message sent successfully" });
        } catch (error) {
            console.error('Send Template Error:', error.response?.data || error.message);
            res.status(400).json({
                success: false,
                message: error.response?.data?.error?.message || error.message
            });
        }
    },

    syncChannelLeads: async (req, res) => {
        const { id } = req.params;
        try {
            const config = await ChannelConfig.findById(id, req.user.id);
            if (!config) return res.status(404).json({ message: 'Configuration not found' });

            let successCount = 0;
            let errorCount = 0;

            // Logic varies by channel
            if (config.channel_type === 'indiamart') {
                // IndiaMart CRM API Example
                const response = await axios.get(`https://mapi.indiamart.com/wservce/enquiry/listing/GLUSR_MOBILE/${config.account_name}/GLUSR_MOBILE_KEY/${config.api_key}/`);

                const enquiries = response.data?.RESPONSE || [];
                for (const item of enquiries) {
                    try {
                        const leadData = {
                            name: item.SENDER_NAME,
                            email: item.SENDER_EMAIL,
                            mobile_number: item.SENDER_MOBILE,
                            interested_in: item.QUERY_PRODUCT_NAME,
                            location: item.SENDER_CITY,
                            message: item.QUERY_MESSAGE
                        };
                        await LeadService.processLead(leadData, req.user.id, 'indiamart');
                        successCount++;
                    } catch (e) { errorCount++; }
                }
            } else if (config.channel_type === 'meta') {
                // Meta would normally use webhooks, but manual sync could fetch from Meta API
                // For demo/dev purposes, we pretend to fetch 2 leads
                const mockMetaLeads = [
                    { name: "Meta Test User 1", email: "meta1@test.com", mobile_number: "9800000001", interested_in: "Facebook Ads Product" },
                    { name: "Meta Test User 2", email: "meta2@test.com", mobile_number: "9800000002", interested_in: "Insta Ads Product" }
                ];
                for (const lead of mockMetaLeads) {
                    await LeadService.processLead(lead, req.user.id, 'meta');
                    successCount++;
                }
            } else if (config.channel_type === 'justdial') {
                // Justdial API simulation
                const mockJDLeads = [
                    { name: "Justdial User", email: "jd@test.com", mobile_number: config.account_name, interested_in: "Local Service" }
                ];
                for (const lead of mockJDLeads) {
                    await LeadService.processLead(lead, req.user.id, 'justdial');
                    successCount++;
                }
            }

            await ChannelConfig.update(id, req.user.id, { last_sync_at: new Date() });

            await LeadSyncLog.create({
                user_id: req.user.id,
                channel_type: config.channel_type,
                reference_id: config.id,
                status: 'success',
                message: `Sync completed: ${successCount} leads found`,
                raw_data: { successCount, errorCount }
            });

            res.json({ message: 'Sync completed', successCount });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = integrationController;
