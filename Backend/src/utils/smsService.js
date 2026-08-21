const http = require('http');

/**
 * Sends OTP SMS using TrueBulkSMS API endpoint.
 * Sample API: http://truebulksms.biz/api.php?username=SoftFYR&password=971236&sender=SSWAIT&sendto=919818839191&message=123456%20is%20your%20One%20Time%20Passcode%20for%20registration%2E%20SSWAIT&PEID=1701167637074678841&templateid=1707168794065317157
 */
const sendSmsOtp = async (mobileNumber, otp) => {
    try {
        const username = process.env.SMS_USER || 'SoftFYR';
        const password = process.env.SMS_PASS || '971236';
        const sender = process.env.SMS_SENDER || 'SSWAIT';
        const peid = process.env.SMS_PEID || '1701167637074678841';
        const templateid = process.env.SMS_TEMPLATE_ID || '1707168794065317157';

        // Clean and format phone number (ensure country code 91)
        let formattedPhone = mobileNumber.replace(/\D/g, '');
        if (formattedPhone.length === 10) {
            formattedPhone = `91${formattedPhone}`;
        }

        // Exact DLT template message: "{otp} is your One Time Passcode for registration. SSWAIT"
        const messageText = `${otp} is your One Time Passcode for registration. SSWAIT`;

        const baseUrl = process.env.SMS_API_URL || 'http://truebulksms.biz/api.php';
        const apiUrl = new URL(baseUrl);
        apiUrl.searchParams.append('username', username);
        apiUrl.searchParams.append('password', password);
        apiUrl.searchParams.append('sender', sender);
        apiUrl.searchParams.append('sendto', formattedPhone);
        apiUrl.searchParams.append('message', messageText);
        apiUrl.searchParams.append('PEID', peid);
        apiUrl.searchParams.append('templateid', templateid);

        console.log(`[SMS Service] Dispatching OTP to ${apiUrl.toString()} via TrueBulkSMS...`);

        return new Promise((resolve, reject) => {
            http.get(apiUrl.toString(), (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    console.log(`[SMS Service] Gateway Response: ${data}`);
                    resolve({ success: true, data });
                });
            }).on('error', (err) => {
                console.error('[SMS Service] Network error sending SMS:', err.message);
                reject(err);
            });
        });
    } catch (error) {
        console.error('[SMS Service] Exception sending SMS:', error.message);
        throw error;
    }
};

module.exports = { sendSmsOtp };
