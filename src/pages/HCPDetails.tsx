import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import HCPDetailsForm from '../components/HCPDetailsForm';
import SideMenu from '../components/SideMenu';
import aamLogo from '../assets/images/aam-logo.png';
import bgDesktop from '../assets/images/bg01.png';
import bgTablet from '../assets/images/bg01-md.png';
import { getUserData, addDoctor, updateDoctor, saveDoctorData, getDoctorsByFieldTeam } from '../services/api';

const HCPDetails: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingDoctors, setExistingDoctors] = useState<any[]>([]);
  const [initialDoctor, setInitialDoctor] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation(); 

  useEffect(() => { document.title = 'Enter HCP Details | Acne Awareness Month'; }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleSubmit = async (data: any, existingDoctorId?: number) => {
    setIsLoading(true);
    setError('');

    try {
      let response;
      
      // If existingDoctorId is provided, update the doctor, otherwise create new
      if (existingDoctorId) {
        response = await updateDoctor(
          existingDoctorId,
          data.hcpname,
          data.city,
          data.mobile || undefined,
          data.pCode || undefined
        );
        console.log('Doctor updated successfully:', response.data);
      } else {
        response = await addDoctor(
          data.hcpname,
          data.city,
          data.mobile || undefined,
          data.pCode || undefined
        );
        console.log('Doctor created successfully:', response.data);
      }

      if (response.success) {
        // Save doctor data to localStorage
        saveDoctorData(response.data);
        console.log('Doctor data saved to localStorage');
        // Persist photo against doctor ID so HCP list can display it
        if (data.photo) {
          localStorage.setItem(`doctor_photo_${response.data.id}`, data.photo);
        }
        // Navigate to info slider page on success
        navigate('/info-slider');
      } else {
        setError(response.message || 'Failed to save HCP details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit HCP details');
      console.error('HCP submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is logged in and fetch existing doctors
  useEffect(() => {
    const userData = getUserData();
    if (!userData) {
      // Redirect to home if not logged in
      navigate('/');
    } else {
      // Set the MR name from user data
      setUserName(userData.name);
      
      // Fetch existing doctors for this field team
      const fetchDoctors = async () => {
        try {
          const response = await getDoctorsByFieldTeam(userData.id);
          if (response.success && response.data) {
            setExistingDoctors(response.data);
            console.log('Existing doctors loaded:', response.data);
          }
        } catch (err) {
          console.error('Failed to fetch existing doctors:', err);
          // Don't show error to user, just log it
        }
      };
      
      fetchDoctors();
    }
  }, [navigate]);

  // Check for selected doctor from HCPList navigation
  useEffect(() => {
    const state = location.state as { selectedDoctor?: any } | null;
    if (state?.selectedDoctor) {
      setInitialDoctor(state.selectedDoctor);
      // Clear the state to prevent re-selection on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
    <div className="h-screen overflow-hidden flex flex-col relative bg-white lg:bg-transparent">
      {/* Background Image - Desktop only (lg+) */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden lg:block"
        style={{ backgroundImage: `url(${bgDesktop})`, backgroundPosition: 'right center' }}
      />
      {/* Gradient Header Overlay */}
      <div className="absolute top-0 left-0 right-0 min-h-20 h-auto bg-gradient-to-r from-[#A82682] to-[#E3175F]" />
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        <Header onMenuClick={toggleMenu} userName={userName} showMenu={true} />
        <SideMenu isOpen={isMenuOpen} onClose={closeMenu} userName={userName} />
        
        <main className="flex-1 flex flex-col overflow-y-auto">

          {/* Form area — top-aligned on mobile/tablet, centered on desktop */}
          <div className="lg:flex-1 lg:flex lg:flex-col lg:justify-center">
            <div className="px-4 md:px-8 lg:px-16 py-3 md:py-5 lg:py-4">
              <div className="flex items-center justify-center lg:justify-start">
                <div className="w-full lg:w-1/2">
                  <div className="p-3 md:p-6 lg:p-8 max-w-md mx-auto lg:mx-0">
                    <img src={aamLogo} alt="AAM Logo" className="mb-4 md:mb-6 aam-logo mx-auto block" />
                    <div className="mt-2">
                      <HCPDetailsForm 
                        onBack={handleBack} 
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        error={error}
                        existingDoctors={existingDoctors}
                        initialDoctor={initialDoctor}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tablet only (md–lg): girl's photo at bottom, no overlap with form */}
          <div className="hidden md:block lg:hidden flex-1 min-h-0 mt-4">
            <img
              src={bgTablet}
              alt=""
              className="w-full h-full object-cover object-top"
            />
          </div>

          {/* Mobile: no photo */}

          <footer className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden lg:block">
            <p className="text-xs text-black text-right whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              All the images used in this material are for illustration purposes only
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default HCPDetails;
