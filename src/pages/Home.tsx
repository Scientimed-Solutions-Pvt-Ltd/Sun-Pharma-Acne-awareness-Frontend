import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import SideMenu from '../components/SideMenu';
import bgDesktop from '../assets/images/bg01.png';
import bgTablet from '../assets/images/bg01-md.png';
import aamLogo from '../assets/images/aam-logo.png';
import { mrLogin, saveUserData } from '../services/api';

const Home: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { document.title = 'Acne Awareness Month | Sun Pharma'; }, []);

  // const toggleMenu = () => {
  //   setIsMenuOpen(!isMenuOpen);
  // };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogin = async (employeeCode: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await mrLogin(employeeCode, '');
      
      if (response.success) {
        // Save user data to localStorage
        saveUserData(response.data);
        
        // Navigate to HCP details page after successful login
        navigate('/hcp-details');
      } else {
        setError(response.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to connect to server. Please ensure the backend is running.');
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
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
    <div className="h-screen overflow-hidden flex flex-col relative bg-white lg:bg-transparent">
      {/* Background Image - Desktop only (lg+) */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden lg:block"
        style={{ backgroundImage: `url(${bgDesktop})`, backgroundPosition: 'right center', backgroundSize: 'contain' }}
      />
      
      {/* Gradient Header Overlay */}
      <div className="absolute top-0 left-0 right-0 min-h-20 h-auto bg-gradient-to-r from-[#A82682] to-[#E3175F]" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        <Header showMenu={false} />
        <SideMenu isOpen={isMenuOpen} onClose={closeMenu} />
        
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Form area — top-aligned on mobile/tablet, centered on desktop */}
          <div className="lg:flex-1 lg:flex lg:flex-col lg:justify-center">
            <div className="px-4 md:px-8 lg:px-16 py-3 md:py-5 lg:py-8 short-desktop:py-2">
              <div className="flex items-center justify-center lg:justify-start">
                <div className="w-full lg:w-1/2">
                  <div className="p-3 md:p-6 lg:p-8 max-w-md mx-auto lg:mx-0">
                    <img src={aamLogo} alt="Acne Awareness Month Logo" className="mb-4 md:mb-6 aam-logo mx-auto block" />
                    <div className="mt-3 md:mt-4">
                      <LoginForm onLogin={handleLogin} isLoading={isLoading} error={error} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile & Tablet (below lg): girl's photo at bottom, no overlap with form */}
          <div className="block lg:hidden flex-1 min-h-0 mt-2 md:mt-4">
            <img
              src={bgTablet}
              alt=""
              className="w-full h-full object-cover object-top"
            />
          </div>

          <footer className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden lg:block">
            <p className="text-xs text-black text-right writing-vertical whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              All the images used in this material are for illustration purposes only
            </p>
          </footer>
        </main>
      </div>
    </div>
    
  );
};

export default Home;
