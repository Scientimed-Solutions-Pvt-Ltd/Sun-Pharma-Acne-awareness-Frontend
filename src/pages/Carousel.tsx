import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import { getUserData } from '../services/api';

// Background images
import bgDesktop from '../assets/images/bg01.png';
import bgTablet from '../assets/images/bg01-md.png';
import bgMobile from '../assets/images/bg01-sm.png';

const Carousel: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Get user data
  useEffect(() => {
    const userData = getUserData();
    if (userData) {
      setUserName(userData.name);
    }
  }, []);

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
        <Header onMenuClick={toggleMenu} userName={userName} />
        
        <SideMenu isOpen={isMenuOpen} onClose={closeMenu} userName={userName} />
        
        <main className="flex-1 flex flex-col relative ">
          {/* Content Container */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            {/* Bottom Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4">
              {/* Next Button */}
              <button
                onClick={() => navigate('/take-pledge')}
                className="prplbtn1 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
              >
                Next
              </button>
            </div>
          </div>
          
          <footer className="absolute bottom-2 right-4 md:bottom-4 md:right-6 z-30">
            <p className="text-xs text-white/90 text-right drop-shadow-md">
              All the images used in this material are for illustration purposes only
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Carousel;
