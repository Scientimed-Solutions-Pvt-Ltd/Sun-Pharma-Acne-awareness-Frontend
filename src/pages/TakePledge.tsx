import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import RibbonProgress from '../components/RibbonProgress';
import clickGif from '../assets/images/click.gif';
import bgImage from '../assets/images/bg02.png';
import { getUserData, getDoctorData, acceptTerms, saveDoctorData, takePledge, getPledgeCount, saveVideoToDB, uploadVideoToServer } from '../services/api';

// Extend Window interface for SpeechRecognition API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

const TakePledge: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  //const [ribbonProgress, setRibbonProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConsent, setShowConsent] = useState(true);
  const [pledgeCompleted, setPledgeCompleted] = useState(false);
  const [userName, setUserName] = useState('');
  const [isAcceptingTerms, setIsAcceptingTerms] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  
  // Pledge count states
  const [_currentPledgeCount, setCurrentPledgeCount] = useState(0);
  const TARGET_PLEDGE_COUNT = 10000; // Target: 10,000 doctors
  
  // Speech recognition states
  const [isListening, setIsListening] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [showSkipButton, setShowSkipButton] = useState(false);

  // Video states
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoPhase, setVideoPhase] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [_videoError, setVideoError] = useState('');  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const MIN_RECORDING_SECONDS = 7;

  useEffect(() => { document.title = 'Take the Pledge | Acne Awareness Month'; }, []);

  const navigate = useNavigate();
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const skipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const uploadVideoRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  // Stable ref callback — only fires on mount/unmount, never on timer re-renders
  const attachLiveVideo = useCallback((el: HTMLVideoElement | null) => {
    liveVideoRef.current = el;
    if (el && cameraStreamRef.current) {
      el.srcObject = cameraStreamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  /**
   * Calculate ribbon progress percentage
   * - If count <= 200: Show minimum 25% fill
   * - If count > 200: Show actual percentage (count / 10,000) * 100
   */
  const calculateRibbonPercentage = (count: number): number => {
    if (count <= 200) {
      return 25; // Minimum 25% when count is 200 or less
    }
    // Calculate actual percentage for counts > 200
    return Math.min((count / TARGET_PLEDGE_COUNT) * 100, 100);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Get user data and check terms acceptance
  useEffect(() => {
    const userData = getUserData();
    if (userData) {
      setUserName(userData.name);
    }

    // Check if doctor has already accepted terms
    const doctorData = getDoctorData();
    console.log('TakePledge page loaded. Doctor data:', doctorData);
    
    if (doctorData) {
      setDoctorName(doctorData.dr_name);
      
      if (doctorData.terms_accepted) {
        // Terms already accepted, don't show popup
        console.log('Terms already accepted, hiding popup');
        setShowConsent(false);
      } else {
        console.log('Terms not accepted, showing popup');
      }
    } else {
      console.log('No doctor data found');
    }
    
    // Don't fetch pledge count on page load - only show ribbon after pledge is taken
  }, []);

  // Show skip button after 3 seconds when consent is accepted and page is ready
  useEffect(() => {
    if (!showConsent && !pledgeCompleted && !isListening) {
      // Start timer to show skip button after 3 seconds
      skipTimerRef.current = setTimeout(() => {
        setShowSkipButton(true);
      }, 3000);
    }

    return () => {
      // Cleanup timer if component unmounts or conditions change
      if (skipTimerRef.current) {
        clearTimeout(skipTimerRef.current);
        skipTimerRef.current = null;
      }
    };
  }, [showConsent, pledgeCompleted, isListening]);

  /**
   * Handle accepting terms and conditions
   */
  const handleAcceptTerms = async () => {
    setIsAcceptingTerms(true);

    try {
      const doctorData = getDoctorData();
      
      if (!doctorData) {
        console.error('No doctor data found');
        alert('Doctor information not found. Please fill HCP details first.');
        setShowConsent(false);
        setIsAcceptingTerms(false);
        return;
      }

      console.log('Calling acceptTerms API for doctor ID:', doctorData.id);

      // Call API to accept terms
      const response = await acceptTerms(doctorData.id);

      console.log('Accept terms response:', response);

      if (response.success) {
        // Update doctor data in localStorage
        saveDoctorData(response.data);
        console.log('Terms accepted successfully, updated data:', response.data);
        // Hide consent popup
        setShowConsent(false);
      } else {
        console.error('API returned success: false');
        alert('Failed to save terms acceptance');
      }
    } catch (err) {
      console.error('Failed to accept terms:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
      // Still hide the popup even if API fails
      setShowConsent(false);
    } finally {
      setIsAcceptingTerms(false);
    }
  };

  /**
   * Checks if transcript matches at least 50% of target phrase words
   * Target phrase: "Regain confidence in my acne patients"
   * @param text - The transcript text to check
   * @returns boolean indicating if a match was found
   */
  const checkForTargetWords = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    let matchCount = 0;
    
    // Check for key words from "Regain confidence in my acne patients"
    // Check for "regain" or similar
    if (words.some(w => w.includes('regain') || w.includes('gain') || w.includes('re'))) matchCount++;
    
    // Check for "confidence" or similar
    if (words.some(w => w.includes('confidence') || w.includes('confident'))) matchCount++;
    
    // Check for "acne" or similar
    if (words.some(w => w.includes('acne') || w.includes('acni') || w.includes('akne'))) matchCount++;
    
    // Check for "patients" or similar
    if (words.some(w => w.includes('patient') || w.includes('patients'))) matchCount++;
    
    // Check for "my"
    if (words.includes('my')) matchCount++;
    
    // Check for "in"
    if (words.includes('in')) matchCount++;
    
    // Need at least 3 out of 6 words (50%)
    const requiredMatches = 3;
    console.log(`Speech match count: ${matchCount}/${requiredMatches} required`);
    return matchCount >= requiredMatches;
  };

  /**
   * Handles successful speech detection
   * Stops recognition and saves pledge to database
   */
  const handleSuccessfulDetection = async () => {
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Clear skip button timer and hide skip button
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }
    setShowSkipButton(false);
    
    // Update visual states
    setIsListening(false);
    setIsAnimating(true);
    
    // Save pledge first to get updated count
    const completePledge = async () => {
      try {
        const doctorData = getDoctorData();
        if (doctorData) {
          console.log('Saving pledge to database for doctor:', doctorData.id);
          const response = await takePledge(doctorData.id);
          if (response.success) {
            saveDoctorData(response.data);
            console.log('Pledge saved successfully!');
          }
        }
        
        // Fetch updated pledge count
        const countResponse = await getPledgeCount();
        if (countResponse.success) {
          const newCount = countResponse.data.count;
          setCurrentPledgeCount(newCount);
          
          // Calculate target percentage based on count
          // If count <= 200: minimum 25%, otherwise actual percentage
          const targetPercentage = calculateRibbonPercentage(newCount);
          console.log(`New pledge count: ${newCount}/${TARGET_PLEDGE_COUNT} (${targetPercentage.toFixed(2)}%)`);
          
          // Animate ribbon to the actual percentage
          animateToPercentage(targetPercentage);
        }
      } catch (error) {
        console.error('Error saving pledge:', error);
        setPledgeCompleted(true);
      }
    };
    
    // Function to animate ribbon to target percentage
    const animateToPercentage = (_targetPercentage: number) => {
      const animationDuration = 2000; // Total animation time in ms
      // const startProgress = 0; // Always start from 0 since ribbon is empty initially
      let startTime: number | null = null;
      
      // Ease-out cubic for smooth deceleration
      // const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
      
      const animateProgress = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const linearProgress = Math.min(elapsed / animationDuration, 1);
        
        // Apply easing and interpolate from 0 to target percentage
        //const easedProgress = easeOutCubic(linearProgress);
        //const currentProgress = startProgress + (targetPercentage - startProgress) * easedProgress;
        //setRibbonProgress(currentProgress);
        
        if (linearProgress < 1) {
          requestAnimationFrame(animateProgress);
        } else {
          // Animation complete
          //setRibbonProgress(targetPercentage);
          setPledgeCompleted(true);
        }
      };
      
      requestAnimationFrame(animateProgress);
    };
    
    // Start the process
    await completePledge();
    
    console.log('Speech detected! Pledge completed!');
  };

  /**
   * Initializes and starts speech recognition
   */
  const startSpeechRecognition = () => {
    // Check browser support
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      setIsSupported(false);
      return;
    }

    // Create new recognition instance
    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    // Configure recognition settings
    recognition.continuous = true; // Keep listening until stopped
    recognition.interimResults = true; // Get results while speaking
    recognition.lang = 'en-US'; // Set language to English

    // Handle speech recognition start
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      console.log('Speech recognition started');
    };

    // Handle speech recognition results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const combinedTranscript = finalTranscript || interimTranscript;
      console.log('Transcript:', combinedTranscript);

      // Check if any target word is detected
      if (checkForTargetWords(combinedTranscript)) {
        console.log('Target word detected in:', combinedTranscript);
        handleSuccessfulDetection();
      }
    };

    // Handle speech recognition errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      switch (event.error) {
        case 'not-allowed':
          setError('Microphone access denied. Please allow microphone permissions and try again.');
          break;
        case 'no-speech':
          setError('No speech detected. Please try again and speak clearly.');
          break;
        case 'audio-capture':
          setError('No microphone found. Please connect a microphone and try again.');
          break;
        case 'network':
          setError('Network error occurred. Please check your connection.');
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
      }
    };

    // Handle speech recognition end
    recognition.onend = () => {
      console.log('Speech recognition ended');
      // Only reset if not navigating
      if (!isAnimating) {
        setIsListening(false);
      }
    };

    // Request microphone permission and start recognition
    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to start speech recognition. Please try again.');
    }
  };

  /**
   * Stops speech recognition manually
   */
  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  /**
   * Handles pledge button click - starts speech recognition
   */
  const handlePledgeClick = () => {
    if (isListening) {
      // If already listening, stop recognition
      stopSpeechRecognition();
      // Clear skip button timer
      if (skipTimerRef.current) {
        clearTimeout(skipTimerRef.current);
        skipTimerRef.current = null;
      }
      setShowSkipButton(false);
    } else {
      // Start speech recognition
      setError(null);
      setShowSkipButton(false);
      startSpeechRecognition();
      
      // Show skip button after 3 seconds
      skipTimerRef.current = setTimeout(() => {
        setShowSkipButton(true);
      }, 3000);
    }
  };

  /**
   * Handles skip button click - bypasses speech recognition
   */
  const handleSkipClick = () => {
    // Clear skip timer
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }
    setShowSkipButton(false);
    
    // Trigger successful detection (same as speech recognition success)
    handleSuccessfulDetection();
  };

  // Cleanup speech recognition on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if (skipTimerRef.current) {
        clearTimeout(skipTimerRef.current);
        skipTimerRef.current = null;
      }
      // Stop camera stream if active
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
      }
      // Revoke any object URL
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, []);

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      cameraStreamRef.current = stream;
      videoChunksRef.current = [];
      setRecordingSeconds(0);
      setVideoError('');

      const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
        .find(t => MediaRecorder.isTypeSupported(t)) || '';
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        const elapsed = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
        if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
        stream.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;

        if (elapsed < MIN_RECORDING_SECONDS) {
          setVideoPhase('idle');
          setVideoError(`Recording must be at least ${MIN_RECORDING_SECONDS} seconds. You recorded ${elapsed}s. Please try again.`);
          return;
        }
        const blobType = (mimeType || 'video/webm').split(';')[0];
        const blob = new Blob(videoChunksRef.current, { type: blobType });
        const url = URL.createObjectURL(blob);
        setVideoBlob(blob);
        setVideoUrl(url);
        setVideoError('');
        setVideoPhase('preview');
      };

      recorder.start(250);
      recordingStartTimeRef.current = Date.now();
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(Math.floor((Date.now() - recordingStartTimeRef.current) / 1000));
      }, 500);
      setVideoPhase('recording');
    } catch (err) {
      console.error('Camera error:', err);
      alert('Camera access denied. Please allow camera and microphone permissions.');
    }
  };

  const stopVideoRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      const url = URL.createObjectURL(file);
      setVideoBlob(file);
      setVideoUrl(url);
      setVideoError('');
      setVideoPhase('preview');
    }
  };

  const removeVideo = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoBlob(null);
    setVideoUrl(null);
    setVideoPhase('idle');
    if (uploadVideoRef.current) uploadVideoRef.current.value = '';
  };

  const handleContinue = async () => {
    const doctorData = getDoctorData();
    if (doctorData && videoBlob) {
      try {
        await saveVideoToDB(doctorData.id, videoBlob);
      } catch (err) {
        console.error('Failed to save video to IndexedDB:', err);
      }
      try {
        setIsUploading(true);
        setUploadProgress(0);
        await uploadVideoToServer(doctorData.id, videoBlob, (percent) => {
          setUploadProgress(percent);
        });
      } catch (err) {
        console.error('Failed to upload video to server:', err);
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    }
    navigate('/thank-you');
  };

  

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
    <div className="h-screen flex flex-col relative overflow-hidden md:overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-right md:bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      
      {/* Consent Popup */}
      {showConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white w-[95%] sm:w-[92%] md:w-[85%] lg:w-[80%] xl:w-[75%] max-w-5xl mx-2 sm:mx-4 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
            {/* Popup Header */}
           
            
            {/* Popup Content */}
            <div className="px-4 sm:px-6 md:px-8 py-8 sm:py-6 max-h-[50vh] sm:max-h-[55vh] md:max-h-[60vh] overflow-y-auto">
              <p className="text-black text-[18px] text-center">
                <b>CONSENT:</b> I hereby agree, declare and confirm my Personal Identifiable Information (PII) and / or Sensitive
Personal Data and Information (SPDI) to be used, stored by Sun Pharmaceutical Industries Ltd and I do hereby
provide my unconditional consent and authorize Sunpharma to act upon, use, store, transfer the information (PII
and/or SPDI) to third party for various purposes including but not limited to marketing activities, creating record in
Asia Book of Records for Acne Awareness Month. I understand, agree, declare, confirm and acknowledge that the
portal /platform used by Sunpharma may have servers residing outside of India and/ or managed by third party
technology providers who will have access to the PII and / or SPDI and I hereby expressly consent to my information
being stored/used through such portal/platform by Sunpharma and / or third party.
              </p>
              
            </div>
            
            {/* Popup Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 flex justify-center">
              <button
                onClick={handleAcceptTerms}
                disabled={isAcceptingTerms}
                className="prplbtn1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                {isAcceptingTerms ? 'Processing...' : 'I Agree'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content - Only visible after consent */}
      <div className={showConsent ? 'visible' : 'visible'}>
        {/* Gradient Header Overlay */}
        <div className="absolute top-0 left-0 right-0 min-h-20 h-auto bg-gradient-to-r from-[#A82682] to-[#E3175F]" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col min-h-screen">
        <Header onMenuClick={toggleMenu} userName={userName} />
        <SideMenu isOpen={isMenuOpen} onClose={closeMenu} userName={userName} />
        
        {/* Doctor Info - Right side below header */}
        <div className="relative lg:absolute lg:top-20 xl:top-28 right-2 lg:right-6 z-10 text-right px-4 py-2 lg:p-0 xl:right-10">
          <p className="text-[12px] lg:text-[14px] xl:text-[15px] text-gray-900 font-medium">Doctor Name: <span className="font-normal">{doctorName || 'N/A'}</span></p>
        </div>
        
       <main className="flex-1 flex items-center justify-center text-center overflow-y-auto">
  <div className="w-[90%] lg:w-[80%] flex flex-col md:flex-row gap-2 lg:gap-4 justify-center items-center py-2 lg:py-4 xl:py-8 pb-20 md:pb-4 text-center pledge-container">
              

                {/* Text Content */}
               <div className="w-full md:w-[57%] text-center">
                  {/* Show speech UI or Continue button after pledge */}
                  {!pledgeCompleted && !isAnimating ? (
                    <>
                      {/* Show pledge content only before success */}
                     <h3 className="text-gray-800 leading-tight mb-2 lg:mb-4 xl:mb-6 text-center pledge-text text-[18px] md:text-[26px] font-bold">
                       I pledge to regain coNFidence in my acne patients with minimal dietary restrictions and spreading awareness on treatment compliance
                      </h3>
                      
                    
                      
                      <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-purple-900 leading-relaxed mb-2 lg:mb-4 text-center pledge-heading">
                        {isListening ? 'Listening... Say the pledge!' : 'Click here and say'}
                      </p>
                      
                      {/* Recording Indicator - Shows when listening */}
                      {isListening && (
                        <div className="flex flex-col items-center justify-center mb-6">
                          {/* Pulsing Mic Animation */}
                          <div className="relative flex items-center justify-center">
                            {/* Outer pulse rings */}
                            <div className="absolute w-24 h-24 bg-red-400 rounded-full animate-ping opacity-20"></div>
                            <div className="absolute w-20 h-20 bg-red-500 rounded-full animate-ping opacity-30 animation-delay-200"></div>
                            {/* Inner mic circle */}
                            <div className="relative w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg z-10">
                              {/* Mic Icon */}
                              <svg 
                                className="w-8 h-8 text-white animate-pulse" 
                                fill="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Browser Support Warning */}
                      {!isSupported && (
                        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-700 text-sm">
                          Speech recognition not supported. Please use Chrome, Edge, or Safari.
                        </div>
                      )}
                      
                      <button
                        onClick={handlePledgeClick}
                        disabled={!isSupported}
                        className={`relative inline-flex items-center gap-2 rounded-full shadow-lg duration-300 mb-2 lg:mb-4 xl:mb-8 pldgbtn ${
                          isListening 
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                            : 'hover:shadow-xl hover:-translate-y-1'
                        } ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isListening ? 'Stop Listening' : '"Regain coNFidence in my Acne patients"'}
                        {!isListening && (
                          <span className="clickgif">
                            <img src={clickGif} alt="Click Animation" />
                          </span>
                        )}
                      </button>
                      
                      <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-purple-900 leading-relaxed mb-2 lg:mb-4 text-center pledge-subheading">
                        {isListening ? 'Say "Regain coNFidence in my Acne patients"' : 'to take pledge'}
                      </p>
                      
                      {/* Skip Button - Shows after 3 seconds */}
                      {showSkipButton && (
                        <button
                          onClick={handleSkipClick}
                          className="px-8 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-full text-lg font-medium transition-all duration-300 animate-fade-in mb-1 mt-4"
                        >
                          Continue
                        </button>
                      )}
                    </>
                  ) : (
                    /* Continue section - Shown after pledge is detected */
                    <div className="flex flex-col items-center justify-center animate-fade-in w-full">
                     <h3 className="text-gray-800 leading-snug mb-2 lg:mb-4 xl:mb-6 text-center pledge-text text-[20px] md:text-[30px] font-bold">
                       I pledge to regain coNFidence in my acne patients with minimal dietary restrictions and spreading awareness on treatment compliance
                      </h3>

                      {/* Video Record / Upload Section */}
                      <div className="w-full max-w-sm mx-auto mb-4">

                        {videoPhase === 'recording' && (
                          <div className="flex flex-col items-center gap-2">
                            <video
                              ref={attachLiveVideo}
                              autoPlay
                              muted
                              playsInline
                              className="w-full max-h-[40vh] object-contain rounded-xl border border-gray-300"
                            />
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse inline-block" />
                              <span className="text-sm font-mono font-semibold text-gray-700">
                                {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}
                              </span>
                            </div>
                            <button
                              onClick={stopVideoRecording}
                              disabled={recordingSeconds < MIN_RECORDING_SECONDS}
                              className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full font-medium transition-all duration-300"
                            >
                              <span className="w-3 h-3 bg-white rounded-sm inline-block" />
                              Stop Recording
                            </button>
                          </div>
                        )}

                        {videoPhase === 'idle' && (
                          <div className="flex flex-col gap-3">
                            <button
                              onClick={startVideoRecording}
                              className="flex items-center justify-center gap-2 w-full px-6 py-2 bg-[#A82682] hover:bg-[#8e1f6e] text-white rounded-full font-medium transition-all duration-300"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/>
                              </svg>
                              Record Video
                            </button>
                            <label className="flex items-center justify-center gap-2 w-full px-6 py-2 border-2 border-[#A82682] text-[#A82682] hover:bg-[#A82682] hover:text-white rounded-full font-medium transition-all duration-300 cursor-pointer">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              Upload Video
                              <input
                                ref={uploadVideoRef}
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={handleVideoUpload}
                              />
                            </label>
                            <p className="text-gray-500 text-xs text-center">* Recording or uploading a video is optional</p>
                          </div>
                        )}

                        {videoPhase === 'preview' && (
                          <div className="flex flex-col items-center gap-2">
                            <video
                              key={videoUrl || ''}
                              src={videoUrl || ''}
                              controls
                              playsInline
                              preload="auto"
                              className="w-full max-h-[40vh] object-contain rounded-xl border border-gray-300"
                            />
                            <button
                              onClick={removeVideo}
                              className="flex items-center gap-1.5 px-5 py-1.5 border border-gray-400 text-gray-600 hover:border-[#A82682] hover:text-[#A82682] rounded-full text-sm font-medium transition-all duration-300"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Retake
                            </button>
                          </div>
                        )}

                      </div>

                      {/* Sticky bottom buttons on mobile */}
                      <div className="fixed md:static bottom-0 left-0 right-0 md:relative bg-white/95 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none border-t md:border-t-0 border-gray-200 p-3 md:p-0 z-30 flex flex-col items-center">
                        <button
                          onClick={handleContinue}
                          disabled={isUploading}
                          className="prplbtn1 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
                        >
                          {isUploading ? 'Uploading...' : 'Continue'}
                        </button>

                        {isUploading && uploadProgress !== null && (
                          <div className="w-full max-w-xs mt-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Uploading video...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-[#A82682] to-[#E91E63] h-2.5 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                  {/* Gray Awareness Ribbon with Progress */}
                 <div className="w-full md:w-[30%] text-center z-20 flex flex-col items-center">
                   <RibbonProgress
                     percentage={pledgeCompleted || isAnimating ? 100 : 0}
                     transitionDuration={2000}
                     className={`m-auto ribbon-wrapper transition-transform duration-700 ease-out ${
                       isAnimating 
                         ? 'scale-105' 
                         : 'scale-100'
                     }`}
                   />
                   {/* Support Message 
                   <div className="mt-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-center">
                     <p className="text-[10px] md:text-xs text-gray-600 leading-snug">
                       For any issues, please reach out to me directly.
                     </p>
                     <p className="text-[11px] md:text-sm font-semibold text-[#A82682] mt-0.5">
                       Contact No: 9653437188
                     </p>
                   </div>
                   */}
                </div>
              </div>
            
          
          <footer className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 z-10">
            <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-900" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              All the images used in this material are for illustration purposes only
            </p>
          </footer>
        </main>
      </div>
      </div>
    </div>
  );
};

export default TakePledge;