import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDoctor } from '../../services/adminApi';
import type { Doctor } from '../../services/adminApi';
import { hasVideoInDB, getVideoFromDB, getVideoStatusFromServer } from '../../services/api';

const DoctorsView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [videoAvailable, setVideoAvailable] = useState(false);
  const [videoServerUrl, setVideoServerUrl] = useState<string | null>(null);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const response = await getDoctor(parseInt(id));
        if (response.success) {
          setDoctor(response.data);
          const serverStatus = await getVideoStatusFromServer(response.data.id);
          if (serverStatus.has_video) {
            setVideoAvailable(true);
            setVideoServerUrl(serverStatus.video_url);
          } else {
            const hasVideo = await hasVideoInDB(response.data.id);
            setVideoAvailable(hasVideo);
          }
        }
      } catch (error) {
        console.error('Failed to load doctor:', error);
        navigate('/admin/doctors');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, navigate]);

  const handlePlayVideo = async () => {
    if (!doctor) return;
    if (videoServerUrl) {
      setVideoModalUrl(videoServerUrl);
      return;
    }
    const blob = await getVideoFromDB(doctor.id);
    if (blob) {
      setVideoModalUrl(URL.createObjectURL(blob));
    }
  };

  const closeVideoModal = () => {
    if (videoModalUrl && videoModalUrl.startsWith('blob:')) URL.revokeObjectURL(videoModalUrl);
    setVideoModalUrl(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Doctor not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Doctor Details</h1>
          <p className="text-gray-600 mt-1">View doctor information and pledge status</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/admin/doctors')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => navigate(`/admin/doctors/${id}/edit`)}
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
              <p className="text-gray-800 font-medium">{doctor.dr_name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Registration Number</label>
              <p className="text-gray-800 font-medium">{doctor.registration_no || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">P-Code</label>
              <p className="text-gray-800 font-medium">{doctor.p_code || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Mobile</label>
              <p className="text-gray-800 font-medium">{doctor.mobile || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="text-gray-800 font-medium">{doctor.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">City</label>
              <p className="text-gray-800 font-medium">{doctor.city || '-'}</p>
            </div>
          </div>
        </div>

        {/* Pledge Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Pledge Status</h2>
          <div className="text-center py-4">
            {doctor.pledge_taken ? (
              <>
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-green-600 font-semibold text-lg">Pledge Taken</p>
                {doctor.pledge_taken_at && (
                  <p className="text-gray-500 text-sm mt-2">
                    on{' '}
                    {new Date(doctor.pledge_taken_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 font-semibold text-lg">Pledge Not Taken</p>
                <p className="text-gray-500 text-sm mt-2">Awaiting pledge</p>
              </>
            )}
          </div>
          {doctor.terms_accepted && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center text-sm text-green-600">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Terms & Conditions Accepted
              </div>
            </div>
          )}
        </div>

        {/* Video Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Video</h2>
          {videoAvailable ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <p className="text-purple-700 font-semibold">Video Available</p>
              <button
                onClick={handlePlayVideo}
                className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm transition-colors"
              >
                Play Video
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No Video</p>
              <p className="text-gray-400 text-sm mt-1">Not yet recorded</p>
            </div>
          )}
        </div>

        {/* Location Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Location</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">State</label>
              <p className="text-gray-800 font-medium">{doctor.field_team?.state_master?.name || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">HQ</label>
              <p className="text-gray-800 font-medium">{doctor.field_team?.hq_master?.name || '-'}</p>
            </div>
          </div>
        </div>

        {/* Field Team Info */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Assigned Field Team</h2>
          {doctor.field_team ? (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Name</label>
                    <p className="text-gray-800 font-medium">{doctor.field_team.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Employee ID</label>
                    <p className="text-gray-800 font-medium">{doctor.field_team.employee_id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Designation</label>
                    <p className="text-gray-800 font-medium">
                      {doctor.field_team.designation || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Mobile</label>
                    <p className="text-gray-800 font-medium">{doctor.field_team.mobile || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="text-gray-800 font-medium">{doctor.field_team.email || '-'}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/admin/field-team/${doctor.field_team?.id}`)}
                  className="mt-4 text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  View Field Team Details →
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <svg
                className="mx-auto h-10 w-10 text-gray-400 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <p>No field team assigned</p>
            </div>
          )}
        </div>
      </div>

      {/* Video Playback Modal */}
      {videoModalUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 bg-purple-700">
              <span className="text-white font-semibold truncate">{doctor?.dr_name}</span>
              <button onClick={closeVideoModal} className="text-white hover:text-gray-200 text-2xl leading-none">&times;</button>
            </div>
            <div className="bg-black">
              <video src={videoModalUrl} controls autoPlay className="w-full max-h-[70vh]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsView;
