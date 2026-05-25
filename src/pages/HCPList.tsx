import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import bgDesktop from '../assets/images/bg01.png';
import { getUserData, getDoctorsByFieldTeam, getVideoFromDB, hasVideoInDB, saveVideoToDB, uploadVideoToServer } from '../services/api';

interface Doctor {
  id: number;
  dr_name: string;
  registration_no: string | null;
  mobile: string | null;
  email: string | null;
  p_code: string | null;
  city: string;
  pledge_taken: boolean;
  terms_accepted: boolean;
  field_team_id: number;
  created_at: string;
  updated_at: string;
}

const getDoctorPhoto = (id: number): string | null =>
  localStorage.getItem(`doctor_photo_${id}`);

const HCPList: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoAvailability, setVideoAvailability] = useState<Record<number, boolean>>({});
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [videoModalName, setVideoModalName] = useState('');

  // Retake video states
  const [retakeDoctor, setRetakeDoctor] = useState<Doctor | null>(null);
  const [retakeVideoBlob, setRetakeVideoBlob] = useState<Blob | null>(null);
  const [retakeVideoUrl, setRetakeVideoUrl] = useState<string | null>(null);
  const [retakePhase, setRetakePhase] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [retakeRecordingSeconds, setRetakeRecordingSeconds] = useState(0);
  const [_retakeVideoError, setRetakeVideoError] = useState('');
  const retakeMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const retakeVideoChunksRef = useRef<Blob[]>([]);
  const retakeLiveVideoRef = useRef<HTMLVideoElement>(null);
  const retakeCameraStreamRef = useRef<MediaStream | null>(null);
  const retakeUploadRef = useRef<HTMLInputElement>(null);
  const retakeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retakeStartTimeRef = useRef<number>(0);

  const MIN_RECORDING_SECONDS = 7;

  // Stable ref callback — only fires on mount/unmount, never on re-renders
  // This prevents the 500ms timer re-renders from resetting srcObject and flickering the preview
  const attachLiveVideo = useCallback((el: HTMLVideoElement | null) => {
    retakeLiveVideoRef.current = el;
    if (el && retakeCameraStreamRef.current) {
      el.srcObject = retakeCameraStreamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Handle selecting a doctor to edit
  const handleSelectDoctor = (doctor: Doctor) => {
    if (doctor.pledge_taken) return; // Already pledged — do nothing
    navigate('/hcp-details', { state: { selectedDoctor: doctor } });
  };

  // Handle try again for pending pledge - navigate to HCP details to fill missing info
  const handleTryAgain = (doctor: Doctor) => {
    navigate('/hcp-details', { state: { selectedDoctor: doctor } });
  };

  // Open video modal for a doctor
  const handlePlayVideo = async (doctor: Doctor) => {
    try {
      const blob = await getVideoFromDB(doctor.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setVideoModalUrl(url);
        setVideoModalName(doctor.dr_name);
      }
    } catch (err) {
      console.error('Failed to load video:', err);
    }
  };

  const closeVideoModal = () => {
    if (videoModalUrl) URL.revokeObjectURL(videoModalUrl);
    setVideoModalUrl(null);
    setVideoModalName('');
  };

// Retake video handlers
  const openRetakeModal = (doctor: Doctor) => {
    setRetakeDoctor(doctor);
    setRetakeVideoBlob(null);
    setRetakeVideoUrl(null);
    setRetakePhase('idle');
    setRetakeRecordingSeconds(0);
    setRetakeVideoError('');
  };

  const closeRetakeModal = useCallback(() => {
    if (retakeCameraStreamRef.current) {
      retakeCameraStreamRef.current.getTracks().forEach(t => t.stop());
      retakeCameraStreamRef.current = null;
    }
    if (retakeTimerRef.current) {
      clearInterval(retakeTimerRef.current);
      retakeTimerRef.current = null;
    }
    if (retakeVideoUrl) URL.revokeObjectURL(retakeVideoUrl);
    setRetakeDoctor(null);
    setRetakeVideoBlob(null);
    setRetakeVideoUrl(null);
    setRetakePhase('idle');
    setRetakeRecordingSeconds(0);
    setRetakeVideoError('');
  }, [retakeVideoUrl]);

  const startRetakeRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      retakeCameraStreamRef.current = stream;
      retakeVideoChunksRef.current = [];
      setRetakeRecordingSeconds(0);
      setRetakeVideoError('');

      const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
        .find(t => MediaRecorder.isTypeSupported(t)) || '';
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      retakeMediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) retakeVideoChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        if (retakeTimerRef.current) {
          clearInterval(retakeTimerRef.current);
          retakeTimerRef.current = null;
        }
        const elapsed = Math.round((Date.now() - retakeStartTimeRef.current) / 1000);
        stream.getTracks().forEach(t => t.stop());
        retakeCameraStreamRef.current = null;
        if (retakeLiveVideoRef.current) retakeLiveVideoRef.current.srcObject = null;

        if (elapsed < MIN_RECORDING_SECONDS) {
          setRetakePhase('idle');
          setRetakeVideoError(`Recording must be at least ${MIN_RECORDING_SECONDS} seconds. You recorded ${elapsed}s. Please try again.`);
          return;
        }
        const blobType = (mimeType || 'video/webm').split(';')[0];
        const blob = new Blob(retakeVideoChunksRef.current, { type: blobType });
        const url = URL.createObjectURL(blob);
        setRetakeVideoBlob(blob);
        setRetakeVideoUrl(url);
        setRetakePhase('preview');
      };

      recorder.start(250);
      retakeStartTimeRef.current = Date.now();
      retakeTimerRef.current = setInterval(() => {
        setRetakeRecordingSeconds(Math.floor((Date.now() - retakeStartTimeRef.current) / 1000));
      }, 500);
      setRetakePhase('recording');
    } catch {
      alert('Camera access denied. Please allow camera and microphone permissions.');
    }
  };

  const stopRetakeRecording = () => {
    retakeMediaRecorderRef.current?.stop();
  };

  const handleRetakeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (retakeVideoUrl) URL.revokeObjectURL(retakeVideoUrl);
      setRetakeVideoBlob(file);
      setRetakeVideoUrl(URL.createObjectURL(file));
      setRetakePhase('preview');
    }
  };

  const clearRetakeVideo = () => {
    if (retakeVideoUrl) URL.revokeObjectURL(retakeVideoUrl);
    setRetakeVideoBlob(null);
    setRetakeVideoUrl(null);
    setRetakePhase('idle');
    if (retakeUploadRef.current) retakeUploadRef.current.value = '';
  };

  const saveRetakeVideo = async () => {
    if (!retakeDoctor || !retakeVideoBlob) return;
    setIsSavingVideo(true);
    try {
      await saveVideoToDB(retakeDoctor.id, retakeVideoBlob);
      try {
        await uploadVideoToServer(retakeDoctor.id, retakeVideoBlob);
      } catch {
        console.error('Failed to upload retake video to server');
      }
      setVideoAvailability(prev => ({ ...prev, [retakeDoctor.id]: true }));
      closeRetakeModal();
    } catch {
      alert('Failed to save video. Please try again.');
    } finally {
      setIsSavingVideo(false);
    }
  };

  // Fetch doctors for the logged-in MR
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const userData = getUserData();
        
        if (!userData) {
          navigate('/');
          return;
        }

        setUserName(userData.name);

        // Fetch doctors for this MR's field team
        const response = await getDoctorsByFieldTeam(userData.id);
        
        if (response.success) {
          setDoctors(response.data);
          // Check video availability for each doctor
          const availability: Record<number, boolean> = {};
          await Promise.all(
            response.data.map(async (d: Doctor) => {
              availability[d.id] = await hasVideoInDB(d.id);
            })
          );
          setVideoAvailability(availability);
        } else {
          setError('Failed to load HCP list');
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Failed to load HCP list');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, [navigate]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image - Desktop only (hidden on mobile/tablet to avoid overlap with content) */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden lg:block"
        style={{ backgroundImage: `url(${bgDesktop})` }}
      />
      
      {/* Gradient Header Overlay */}
      <div className="absolute top-0 left-0 right-0 min-h-20 h-auto bg-gradient-to-r from-[#A82682] to-[#E3175F]" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header onMenuClick={toggleMenu} userName={userName} />
        <SideMenu isOpen={isMenuOpen} onClose={closeMenu} userName={userName} />
        
        <main className="flex-1 flex items-start justify-center px-4 md:px-8 py-8 mt-8">
          <div className="w-full max-w-7xl">
            {/* Page Title */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-purple-900 text-center mb-2">
                HCP List
              </h1>
              <p className="text-center text-gray-600">
                Healthcare Professionals registered under {userName}
              </p>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading HCP list...</p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Doctors List */}
            {!isLoading && !error && (
              <>
                {doctors.length === 0 ? (
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
                    <p className="text-gray-600 text-lg">
                      No HCPs registered yet. Start by adding HCP details!
                    </p>
                    <button
                      onClick={() => navigate('/hcp-details')}
                      className="mt-4 px-6 py-2 bg-purple-900 text-white rounded-lg hover:bg-purple-800 transition-colors"
                    >
                      Add HCP Details
                    </button>
                  </div>
                ) : (
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
                    {/* Table Header */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-purple-900 text-white">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              S.No
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Doctor Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              P.Code
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Mobile
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              City
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                              Pledge Status
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                              Video
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {doctors.map((doctor, index) => (
                            <tr 
                              key={doctor.id} 
                              className={`transition-colors ${doctor.pledge_taken ? 'cursor-default' : 'hover:bg-purple-50 cursor-pointer'}`}
                              onClick={() => handleSelectDoctor(doctor)}
                            >
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <div className="flex items-center gap-2">
                                  {getDoctorPhoto(doctor.id) ? (
                                    <img
                                      src={getDoctorPhoto(doctor.id)!}
                                      alt={doctor.dr_name}
                                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-700 text-xs font-bold">
                                      {doctor.dr_name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  {doctor.dr_name}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {doctor.p_code || 'N/A'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {doctor.mobile || 'N/A'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {doctor.city}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                {doctor.pledge_taken ? (
                                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    ✓ Taken
                                  </span>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                      Pending
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTryAgain(doctor);
                                      }}
                                      className="px-3 py-1 text-xs font-semibold text-white bg-purple-900 rounded-lg hover:bg-purple-800 transition-colors"
                                    >
                                      Try Again
                                    </button>
                                  </div>
                                )}
                              </td>
                              {/* Video Status */}
                              <td className="px-4 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                                {videoAvailability[doctor.id] ? (
                                  <button
                                    onClick={() => handlePlayVideo(doctor)}
                                    title="Play video"
                                    className="p-2 rounded-full bg-[#A82682] hover:bg-[#8e1f6e] text-white transition-colors inline-flex items-center justify-center"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z"/>
                                    </svg>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openRetakeModal(doctor)}
                                    title="Record or upload video"
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#A82682] hover:bg-[#8e1f6e] rounded-full transition-colors mx-auto"
                                  >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/>
                                    </svg>
                                    Retake
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Summary Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700">Total HCPs:</span>{' '}
                          <span className="text-purple-900 font-bold">{doctors.length}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Pledges Taken:</span>{' '}
                          <span className="text-green-600 font-bold">
                            {doctors.filter(d => d.pledge_taken).length}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Pending:</span>{' '}
                          <span className="text-yellow-600 font-bold">
                            {doctors.filter(d => !d.pledge_taken).length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="absolute bottom-2 right-4 md:bottom-4 md:right-6 z-10">
          <p className="text-xs text-white/90 text-right drop-shadow-md">
            All the images used in this material are for illustration purposes only
          </p>
        </footer>
      </div>

      {/* Retake Video Modal */}
      {retakeDoctor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
          onClick={closeRetakeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-[#A82682] to-[#E3175F]">
              <h3 className="text-white font-semibold text-base truncate">
                {retakeDoctor.dr_name} — Record / Upload Video
              </h3>
              <button onClick={closeRetakeModal} className="text-white/80 hover:text-white text-2xl leading-none ml-4">×</button>
            </div>

            <div className="p-5">
              {retakePhase === 'recording' && (
                <div className="flex flex-col items-center gap-3">
                  <video ref={attachLiveVideo} autoPlay muted playsInline className="w-full rounded-xl border border-gray-300" />
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse inline-block" />
                    <span className="text-sm font-mono font-semibold text-gray-700">
                      {String(Math.floor(retakeRecordingSeconds / 60)).padStart(2, '0')}:{String(retakeRecordingSeconds % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <button
                    onClick={stopRetakeRecording}
                    disabled={retakeRecordingSeconds < MIN_RECORDING_SECONDS}
                    className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full font-medium transition-all"
                  >
                    <span className="w-3 h-3 bg-white rounded-sm inline-block" />
                    Stop Recording
                  </button>
                </div>
              )}

              {retakePhase === 'idle' && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={startRetakeRecording}
                    className="flex items-center justify-center gap-2 w-full px-6 py-2.5 bg-[#A82682] hover:bg-[#8e1f6e] text-white rounded-full font-medium transition-all"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/>
                    </svg>
                    Record Video
                  </button>
                  <label className="flex items-center justify-center gap-2 w-full px-6 py-2.5 border-2 border-[#A82682] text-[#A82682] hover:bg-[#A82682] hover:text-white rounded-full font-medium transition-all cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload Video
                    <input ref={retakeUploadRef} type="file" accept="video/*" className="hidden" onChange={handleRetakeUpload} />
                  </label>
                </div>
              )}

              {retakePhase === 'preview' && (
                <div className="flex flex-col items-center gap-3">
                  <video key={retakeVideoUrl || ''} src={retakeVideoUrl || ''} controls playsInline preload="auto" className="w-full rounded-xl border border-gray-300" />
                  <button
                    onClick={clearRetakeVideo}
                    className="flex items-center gap-1.5 px-4 py-1.5 border border-gray-400 text-gray-600 hover:border-[#A82682] hover:text-[#A82682] rounded-full text-sm font-medium transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retake
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <button onClick={closeRetakeModal} className="px-5 py-2 text-sm text-gray-600 border border-gray-300 rounded-full hover:bg-gray-100 transition-all">
                Cancel
              </button>
              <button
                onClick={saveRetakeVideo}
                disabled={!retakeVideoBlob || isSavingVideo}
                className="px-5 py-2 text-sm text-white bg-[#A82682] hover:bg-[#8e1f6e] rounded-full font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSavingVideo ? 'Saving...' : 'Save Video'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Playback Modal */}
      {videoModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
          onClick={closeVideoModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-[#A82682] to-[#E3175F]">
              <h3 className="text-white font-semibold text-base truncate">{videoModalName} — Pledge Video</h3>
              <button
                onClick={closeVideoModal}
                className="text-white/80 hover:text-white text-2xl leading-none ml-4"
              >
                ×
              </button>
            </div>
            {/* Video Player */}
            <div className="p-4 bg-black">
              <video
                src={videoModalUrl}
                controls
                autoPlay
                playsInline
                className="w-full rounded-lg max-h-[60vh]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HCPList;
