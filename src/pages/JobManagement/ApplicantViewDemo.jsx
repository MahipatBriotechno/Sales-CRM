import React from "react";
import {
  User,
  X,
  MapPin,
  Calendar,
  Briefcase,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  GraduationCap,
  Award,
  FileText,
  Clock,
} from "lucide-react";

/**
 * ApplicantViewModal Component
 *
 * This component displays detailed information about a specific job applicant in a modal.
 *
 * Props:
 * - applicant: Object containing applicant details (name, email, phone, position, department,
 *   location, experience, education, appliedDate, status, resume, skills)
 * - onClose: Function to close the modal
 *
 * Usage:
 * <ApplicantViewModal
 *   applicant={selectedApplicant}
 *   onClose={() => setShowViewModal(false)}
 * />
 */

const ApplicantViewModal = ({ applicant, onClose }) => {
  // Don't render if no applicant is provided
  if (!applicant) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-sm shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER SECTION */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-full">
              <User size={24} />
            </div>
            <div className="bg-white bg-opacity-20 p-2 rounded-full">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{applicant.name}</h2>
              <p className="text-sm opacity-90">
                Applied for {applicant.position}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* CONTENT SECTION */}
        <div className="p-8">
          {/* QUICK INFO CARDS - 4 Cards in a Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Location Card */}
            <div className="bg-blue-50 p-4 rounded-sm border border-blue-100 flex flex-col items-center text-center group hover:shadow-md transition-shadow">
              <div className="bg-blue-600 p-2 rounded-sm text-white mb-2 group-hover:scale-110 transition-transform">
                <MapPin size={20} />
              </div>
              <span className="text-lg font-bold text-blue-900">{applicant.location}</span>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest mt-1">Location</span>
            </div>

            {/* Experience Card */}
            <div className="bg-green-50 p-4 rounded-sm border border-green-100 flex flex-col items-center text-center group hover:shadow-md transition-shadow">
              <div className="bg-green-600 p-2 rounded-sm text-white mb-2 group-hover:scale-110 transition-transform">
                <Briefcase size={20} />
              </div>
              <span className="text-lg font-bold text-green-900">{applicant.experience}</span>
              <span className="text-xs font-semibold text-green-600 uppercase tracking-widest mt-1">Experience</span>
            </div>

            {/* Education Card */}
            <div className="bg-orange-50 p-4 rounded-sm border border-orange-100 flex flex-col items-center text-center group hover:shadow-md transition-shadow">
              <div className="bg-orange-600 p-2 rounded-sm text-white mb-2 group-hover:scale-110 transition-transform">
                <GraduationCap size={20} />
              </div>
              <span className="text-lg font-bold text-orange-900">{applicant.education}</span>
              <span className="text-xs font-semibold text-orange-600 uppercase tracking-widest mt-1">Education</span>
            </div>

            {/* Department Card */}
            <div className="bg-purple-50 p-4 rounded-sm border border-purple-100 flex flex-col items-center text-center group hover:shadow-md transition-shadow">
              <div className="bg-purple-600 p-2 rounded-sm text-white mb-2 group-hover:scale-110 transition-transform">
                <Award size={20} />
              </div>
              <span className="text-lg font-bold text-purple-900">{applicant.department}</span>
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-widest mt-1">Department</span>
            </div>
          </div>

          {/* APPLICANT DETAILS SECTIONS */}
          <div className="space-y-6">
            {/* STATUS AND APPLIED DATE SECTION */}
            <div className="bg-gray-50 p-6 rounded-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    Application Status
                  </label>
                  <div className="flex items-center gap-2">
                    {applicant.status === "Shortlisted" ||
                      applicant.status === "Hired" ? (
                      <CheckCircle size={20} className="text-green-600" />
                    ) : applicant.status === "Rejected" ? (
                      <XCircle size={20} className="text-red-600" />
                    ) : (
                      <Clock size={20} className="text-yellow-600" />
                    )}
                    <span
                      className={`px-4 py-1.5 text-sm font-bold rounded-sm uppercase tracking-wide ${applicant.status === "Shortlisted"
                        ? "bg-green-100 text-green-700"
                        : applicant.status === "Under Review"
                          ? "bg-yellow-100 text-yellow-700"
                          : applicant.status === "Hired"
                            ? "bg-blue-100 text-blue-700"
                            : applicant.status === "Rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-200 text-gray-700"
                        }`}
                    >
                      {applicant.status}
                    </span>
                  </div>
                </div>

                {/* Applied Date */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    Applied Date
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-orange-600" />
                    <span className="text-gray-800 font-bold">
                      {applicant.appliedDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CONTACT INFORMATION SECTION */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                Contact Information
              </h3>
              <div className="bg-white border border-gray-200 p-6 rounded-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        Email
                      </p>
                      <p className="text-gray-800 font-semibold text-sm">
                        {applicant.email}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full text-green-600">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        Phone
                      </p>
                      <p className="text-gray-800 font-semibold text-sm">
                        {applicant.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SKILLS SECTION */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                Skills & Expertise
              </h3>
              <div className="bg-white border border-gray-200 p-6 rounded-sm">
                <div className="flex flex-wrap gap-2">
                  {applicant.skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-orange-50 text-orange-700 rounded-sm font-semibold text-xs border border-orange-100 uppercase tracking-wide"
                    >
                      {skill}
                    </span>
                  )) || (
                      <p className="text-gray-500 italic">No skills listed</p>
                    )}
                </div>
              </div>
            </div>

            {/* QUALIFICATIONS SECTION */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                Qualifications Summary
              </h3>
              <div className="bg-white border border-gray-200 p-6 rounded-sm">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="bg-orange-100 p-1 rounded-full mt-0.5">
                      <CheckCircle size={14} className="text-orange-600" />
                    </div>
                    <span className="text-gray-700 text-sm font-medium">
                      {applicant.experience} of professional experience in the
                      field
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-orange-100 p-1 rounded-full mt-0.5">
                      <CheckCircle size={14} className="text-orange-600" />
                    </div>
                    <span className="text-gray-700 text-sm font-medium">
                      {applicant.education} degree from accredited institution
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-orange-100 p-1 rounded-full mt-0.5">
                      <CheckCircle size={14} className="text-orange-600" />
                    </div>
                    <span className="text-gray-700 text-sm font-medium">
                      Strong expertise in {applicant.department} domain
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-orange-100 p-1 rounded-full mt-0.5">
                      <CheckCircle size={14} className="text-orange-600" />
                    </div>
                    <span className="text-gray-700 text-sm font-medium">
                      Currently based in {applicant.location}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* RESUME SECTION */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                Resume/CV
              </h3>
              <div className="bg-white border border-gray-200 p-6 rounded-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2.5 rounded-sm">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-gray-800 font-bold text-sm">
                        {applicant.resume || `${applicant.name}_Resume.pdf`}
                      </p>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">PDF Document</p>
                    </div>
                  </div>
                </div>
                <button className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-sm font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2">
                  <Download size={18} /> Download Resume
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER SECTION - Action Buttons */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3 z-10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-sm font-bold text-sm transition-all shadow-sm"
          >
            Close
          </button>
          <button className="px-6 py-2.5 bg-red-100 hover:bg-red-200 text-red-600 border border-red-200 rounded-sm font-bold text-sm transition-all shadow-sm">
            Reject
          </button>
          <button className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-sm font-bold text-sm shadow-md transition-all">
            Shortlist
          </button>
        </div>
      </div>
    </div>
  );
};

// Demo component to show the modal in action
const ApplicantViewDemo = () => {
  const [showModal, setShowModal] = React.useState(true);

  const sampleApplicant = {
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    position: "Senior Software Engineer",
    department: "Engineering",
    location: "San Francisco, CA",
    experience: "7+ Years",
    education: "Master's",
    appliedDate: "Dec 5, 2024",
    status: "Under Review",
    resume: "Sarah_Johnson_Resume.pdf",
    skills: [
      "React",
      "Node.js",
      "Python",
      "AWS",
      "TypeScript",
      "MongoDB",
      "Docker",
      "CI/CD",
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Applicant View Modal Demo
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-sm font-semibold shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all"
        >
          View Applicant Details
        </button>

        {showModal && (
          <ApplicantViewModal
            applicant={sampleApplicant}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ApplicantViewDemo;
