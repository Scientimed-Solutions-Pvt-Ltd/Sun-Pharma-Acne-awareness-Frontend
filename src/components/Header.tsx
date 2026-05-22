import React from 'react';
import sunpharmalogo from '../assets/images/sun-pharma-logo.png';
//import logoImage from '../assets/images/logo.png';

interface HeaderProps {
  onMenuClick?: () => void;
  userName?: string;
  showMenu?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, userName, showMenu = true }) => {
  return (
    <>
      <header className="relative z-10">
        {/* Center Logo - Desktop/Large Tablet (absolute positioned, visible from lg:1024px+) */}
        {/* <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 pt-0 hidden lg:block">
          <img src={logoImage} alt="Logo" className="endologo h-10 lg:h-12 xl:h-16 2xl:h-20 xl:mt-[10px]" />
        </div> */}
        
        <div className="w-full px-2 md:px-16">
          <div className="flex items-center justify-between py-0.5">
            <div className="flex flex-col items-center">
              <span className="text-white leading-none" style={{ fontSize: '0.75rem' }}>
                An Awareness Initiative
              </span>
              <img 
                src={sunpharmalogo} 
                alt="Sun Pharma Logo" 
                className="w-auto"
                style={{height:62}}
              />
            </div>
            
          
            
            <div className="flex items-center gap-2 sm:gap-4">
              {userName && (
                <div className="text-white text-xs sm:text-sm md:text-base font-medium truncate max-w-[80px] sm:max-w-none">
                  {userName}
                </div>
              )}
              {showMenu && onMenuClick && (
                <button 
                  className="p-0 border-0 bg-transparent cursor-pointer transition-transform duration-300 hover:scale-110"
                  onClick={onMenuClick}
                  aria-label="Menu"
                >
                  <svg 
                    width="32" 
                    height="32" 
                    viewBox="0 0 40 40" 
                    fill="none"
                    className="sm:w-10 sm:h-10"
                  >
                    <line x1="8" y1="12" x2="32" y2="12" stroke="white" strokeWidth="2"/>
                    <line x1="8" y1="20" x2="32" y2="20" stroke="white" strokeWidth="2"/>
                    <line x1="8" y1="28" x2="32" y2="28" stroke="white" strokeWidth="2"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
