import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFieldTeam, bulkImportDoctors, downloadDoctorSampleCsv } from '../../services/adminApi';
import type { FieldTeam, Doctor } from '../../services/adminApi';
import { hasVideoInDB, getVideoStatusFromServer } from '../../services/api';

type FieldTeamWithDoctors = FieldTeam & { doctors?: Doctor[] };

const FieldTeamView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [fieldTeam, setFieldTeam] = useState<FieldTeamWithDoctors | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [videoAvailability, setVideoAvailability] = useState<Record<number, boolean>>({});
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [videoModalName, setVideoModalName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadVideoAvailability = async (doctors: Doctor[]) => {
    if (!doctors || doctors.length === 0) return;
    const availability: Record<number, boolean> = {};
    await Promise.all(
      doctors.map(async (doc: Doctor) => {
        try {
          const serverStatus = await getVideoStatusFromServer(doc.id);
          if (serverStatus.has_video) {
            availability[doc.id] = true;
          } else {
            availability[doc.id] = await hasVideoInDB(doc.id);
          }
        } catch {
          availability[doc.id] = false;
        }
      })
    );
    setVideoAvailability(availability);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const response = await getFieldTeam(parseInt(id));
        if (response.success) {
          setFieldTeam(response.data);
          await loadVideoAvailability(response.data.doctors || []);
        }
      } catch (error) {
        console.error('Failed to load field team:', error);
        navigate('/admin/field-team');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, navigate]);

  const closeVideoModal = () => {
    if (videoModalUrl && videoModalUrl.startsWith('blob:')) URL.revokeObjectURL(videoModalUrl);
    setVideoModalUrl(null);
    setVideoModalName('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!fieldTeam) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Field team member not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Field Team Details</h1>
          <p className="text-gray-600 mt-1">View field team member information</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/admin/field-team')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => navigate(`/admin/field-team/${id}/edit`)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Name</label>
              <p className="text-gray-800 font-medium">{fieldTeam.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Employee ID</label>
              <p className="text-gray-800 font-medium">{fieldTeam.employee_id}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Mobile</label>
              <p className="text-gray-800 font-medium">{fieldTeam.mobile || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="text-gray-800 font-medium">{fieldTeam.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Designation</label>
              <p className="text-gray-800 font-medium">{fieldTeam.designation_master?.name || fieldTeam.designation || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Reporting To</label>
              <p className="text-gray-800 font-medium">
                {fieldTeam.reporting_to ? `${fieldTeam.reporting_to.name} (${fieldTeam.reporting_to.employee_id})` : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Location Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Location</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">State</label>
              <p className="text-gray-800 font-medium">{fieldTeam.state_master?.name || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">HQ</label>
              <p className="text-gray-800 font-medium">{fieldTeam.hq_master?.name || '-'}</p>
            </div>
          </div>
        </div>

        {/* Aligned Doctors */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Aligned Doctors</h2>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                {fieldTeam.doctors?.length || 0} doctors
              </span>
              <button
                onClick={() => loadVideoAvailability(fieldTeam.doctors || [])}
                title="Refresh video status"
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={async () => {
                  try {
                    const blob = await downloadDoctorSampleCsv();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'doctors_sample.csv';
                    a.click();
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    alert('Failed to download sample CSV');
                  }
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Download Sample CSV
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !id) return;
                  setIsImporting(true);
                  try {
                    const result = await bulkImportDoctors(file, parseInt(id));
                    alert(result.message);
                    // Reload data
                    const response = await getFieldTeam(parseInt(id));
                    if (response.success) setFieldTeam(response.data);
                  } catch (error) {
                    alert(error instanceof Error ? error.message : 'Import failed');
                  } finally {
                    setIsImporting(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : 'Bulk Import Doctors'}
              </button>
            </div>
          </div>

          {fieldTeam.doctors && fieldTeam.doctors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mobile
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pledge Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Video
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fieldTeam.doctors.map((doctor: Doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const photo = localStorage.getItem(`doctor_photo_${doctor.id}`);
                            return photo ? (
                              <img src={photo} alt={doctor.dr_name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {doctor.dr_name.charAt(0).toUpperCase()}
                              </div>
                            );
                          })()}
                          <div className="font-medium text-gray-800">{doctor.dr_name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {doctor.registration_no || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {doctor.mobile || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {doctor.email || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {doctor.city || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {doctor.pledge_taken ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Taken
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Not Taken
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {videoAvailability[doctor.id] ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            Not Available
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => navigate(`/admin/doctors/${doctor.id}`)}
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="mt-2">No doctors aligned to this field team member</p>
            </div>
          )}
        </div>
      </div>

      {/* Video Playback Modal */}
      {videoModalUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 bg-purple-700">
              <span className="text-white font-semibold truncate">{videoModalName}</span>
              <button onClick={closeVideoModal} className="text-white hover:text-gray-200 text-2xl leading-none">&times;</button>
            </div>
            <div className="bg-black">
              <video
                src={videoModalUrl}
                controls
                autoPlay
                className="w-full max-h-[70vh]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldTeamView;
