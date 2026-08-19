import React from "react";
import {
  Briefcase,
  X,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Layers,
  FileText,
} from "lucide-react";

/**
 * JobViewModal Component
 *
 * This component displays detailed information about a specific job posting in a modal.
 *
 * Props:
 * - job: Object containing job details (title, department, location, type, positions, applicants, status, postedDate)
 * - onClose: Function to close the modal
 *
 * Usage:
 * <JobViewModal
 *   job={selectedJob}
 *   onClose={() => setShowViewModal(false)}
 * />
 */

const JobViewModal = ({ job, onClose }) => {
  if (!job) return null;

  const getList = (items) => {
    if (Array.isArray(items)) return items;
    if (typeof items === 'string') {
      try {
        return JSON.parse(items);
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const responsibilities = getList(job.responsibilities);
  const requirements = getList(job.requirements);
  const interviewRounds = getList(job.interview_rounds);
  const applicationFields = getList(job.application_fields);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-sm shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* HEADER SECTION - Original Gradient Style */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Briefcase size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white leading-tight">{job.title}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-white text-opacity-90 text-sm font-medium">{job.department} Department</span>
                  <span className="w-1.5 h-1.5 bg-white rounded-full opacity-50"></span>
                  <span className="bg-white bg-opacity-20 text-white px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">
                    {job.status}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-all text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* CONTENT SECTION */}
        <div className="p-8 space-y-8 font-sans overflow-y-auto">

          {/* QUICK INFO CARDS - Original Colored Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-sm border border-blue-100 flex flex-col items-center text-center group hover:shadow-md transition-shadow">
              <div className="bg-blue-600 p-2 rounded-sm text-white mb-2 group-hover:scale-110 transition-transform">
                <MapPin size={20} />
              </div>
              <span className="text-base font-bold text-blue-900 line-clamp-1" title={job.location}>{job.location}</span>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">Location</span>
            </div>

            <div className="bg-green-50 p-4 rounded-sm border border-green-100 flex flex-col items-center text-center group hover:shadow-md transition-shadow">
              <div className="bg-green-600 p-2 rounded-sm text-white mb-2 group-hover:scale-110 transition-transform">
                <Clock size={20} />
              </div>
              <span className="text-base font-bold text-green-900 line-clamp-1">{job.type}</span>
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest mt-1">Job Type</span>
            </div>

            <div className="bg-orange-50 p-4 rounded-sm border border-orange-100 flex flex-col items-center text-center group hover:shadow-md transition-shadow">
              <div className="bg-orange-600 p-2 rounded-sm text-white mb-2 group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <span className="text-base font-bold text-orange-900">{job.applicants}</span>
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">Applicants</span>
            </div>

            <div className="bg-purple-50 p-4 rounded-sm border border-purple-100 flex flex-col items-center text-center group hover:shadow-md transition-shadow">
              <div className="bg-purple-600 p-2 rounded-sm text-white mb-2 group-hover:scale-110 transition-transform">
                <Briefcase size={20} />
              </div>
              <span className="text-base font-bold text-purple-900">{job.positions}</span>
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mt-1">Positions</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* MAIN COLUMN */}
            <div className="lg:col-span-2 space-y-8">
              {/* JOB DESCRIPTION - Boxy Style */}
              <section>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-orange-500 rounded-full"></div> Job Description
                </h3>
                <div className="bg-gray-50 p-5 rounded-sm border border-gray-200 max-h-60 overflow-y-auto">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                    {job.description}
                  </p>
                </div>
              </section>

              {/* RESPONSIBILITIES - Boxy Style */}
              <section>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-orange-500 rounded-full"></div> Key Responsibilities
                </h3>
                <div className="bg-white border border-gray-200 p-3 rounded-sm shadow-sm max-h-60 overflow-y-auto">
                  <ul className="space-y-3">
                    {responsibilities.length > 0 ? (
                      responsibilities.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm group">
                          <div className="bg-orange-100 p-1 rounded-full mt-0.5 group-hover:bg-orange-200 transition-colors">
                            <CheckCircle size={14} className="text-orange-600" />
                          </div>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))
                    ) : (
                      <p className="text-gray-400 italic text-sm">No specific responsibilities listed.</p>
                    )}
                  </ul>
                </div>
              </section>

              {/* REQUIREMENTS - Boxy Style */}
              <section>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-500 rounded-full"></div> Requirements
                </h3>
                <div className="bg-white border border-gray-200 p-3 rounded-sm shadow-sm max-h-60 overflow-y-auto">
                  <ul className="space-y-3">
                    {requirements.length > 0 ? (
                      requirements.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm group">
                          <div className="bg-blue-100 p-1 rounded-full mt-0.5 group-hover:bg-blue-200 transition-colors">
                            <CheckCircle size={14} className="text-blue-600" />
                          </div>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))
                    ) : (
                      <p className="text-gray-400 italic text-sm">No specific requirements listed.</p>
                    )}
                  </ul>
                </div>
              </section>
            </div>

            {/* SIDE COLUMN */}
            <div className="space-y-8">
              {/* INTERVIEW PROCESS - Timeline Style (Kept as it's cleaner than list) */}
              {interviewRounds.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Layers size={16} className="text-orange-500" /> Interview Process
                  </h3>
                  <div className="bg-orange-50 border border-orange-100 p-3 rounded-sm">
                    <div className="space-y-4">
                      {interviewRounds.map((round, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                            {index + 1}
                          </div>
                          <span className="font-semibold text-gray-800 text-sm">{round}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* APPLICATION CONFIGURATION - New Data, Boxy Style */}
              {applicationFields.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-blue-500" /> Application Form
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      {applicationFields.map((field, index) => (
                        <div key={index} className="p-3 hover:bg-gray-50 transition-colors flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-gray-800 uppercase">{field.label}</p>
                            <p className="text-[10px] font-medium text-gray-500 capitalize">{field.type} Input</p>
                          </div>
                          {field.required ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded-sm">Required</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase rounded-sm">Optional</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* POSTED DATE & INFO */}
              <section className="bg-gray-50 p-4 rounded-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar size={18} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Posted Date</p>
                    <p className="text-sm font-bold text-gray-800">{new Date(job.posted_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="w-full h-px bg-gray-200 my-3"></div>
                <div className="flex items-center gap-3">
                  <Briefcase size={18} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Department</p>
                    <p className="text-sm font-bold text-gray-800">{job.department}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

        </div>

        {/* FOOTER SECTION */}
        <div className="flex justify-between items-center px-8 py-5 border-t border-gray-200 bg-gray-50 mt-auto rounded-b-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users size={16} />
            <span><strong className="text-gray-800">{job.applicants}</strong> Applicants</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-sm hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm text-sm"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobViewModal;
