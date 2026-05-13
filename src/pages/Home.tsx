import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import SideMenu from '../components/SideMenu';
import bgDesktop from '../assets/images/bg01.png';
import bgTablet from '../assets/images/bg01-md.png';
import bgMobile from '../assets/images/bg01-sm.png';
import aamLogo from '../assets/images/aam-logo.png';
import { mrLogin, saveUserData } from '../services/api';

const Home: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image - Mobile */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
        style={{ backgroundImage: `url(${bgMobile})` }}
      />
      {/* Background Image - Tablet */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block lg:hidden"
        style={{ backgroundImage: `url(${bgTablet})` }}
      />
      {/* Background Image - Desktop */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden lg:block"
        style={{ backgroundImage: `url(${bgDesktop})` }}
      />
      
      {/* Gradient Header Overlay */}
      <div className="absolute top-0 left-0 right-0 min-h-20 h-auto md:min-h-20 bg-gradient-to-r from-[#A82682] to-[#E3175F]" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header showMenu={false} />
        <SideMenu isOpen={isMenuOpen} onClose={closeMenu} />
        
        <main className="flex-1 flex flex-col justify-center">
          <div className="px-4 md:px-8 lg:px-16 py-8">
            <div className="flex items-center justify-center lg:justify-start">
              <div className="w-full lg:w-1/2">
                <div className="p-4 md:p-6 lg:p-8 max-w-md mx-auto lg:mx-0">
                  {/* Title */}
                  <img src={aamLogo} alt="Acne Awareness Month Logo" className="mb-6 aam-logo mx-auto block" />
                  
                  {/* Login Form */}
                  <div className="mt-4">
                    <LoginForm onLogin={handleLogin} isLoading={isLoading} error={error} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <footer className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
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
