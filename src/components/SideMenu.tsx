import React from 'react';
import { Link } from 'react-router-dom';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, userName }) => {
  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[998] transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />
      
      {/* Side Menu */}
      <div className={`fixed top-0 h-full w-80 max-w-[90vw] bg-gradient-to-b from-white to-gray-50 shadow-[-5px_0_25px_rgba(0,0,0,0.3)] z-[999] flex flex-col overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isOpen ? 'right-0' : '-right-[350px]'
      }`}>
        <div className="px-6 py-2 flex justify-end border-b border-gray-200 clsbtn">
          <span>{userName || 'User'}</span>
          <button 
            className="bg-transparent border-none cursor-pointer p-2 transition-transform duration-200 hover:rotate-90"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <line x1="6" y1="6" x2="24" y2="24" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
              <line x1="24" y1="6" x2="6" y2="24" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        
        <nav className="flex-1 pb-8">
          <ul className="list-none p-0 m-0">
            <li>
              <Link 
                to="/hcp-list" 
                onClick={onClose}
                className="block px-8 py-4 text-gray-800 no-underline text-lg font-medium transition-all duration-300 border-l-4 border-transparent hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent hover:border-l-primary hover:text-primary hover:pl-10"
              >
                HCP List
              </Link>
            </li>
            <li>
              <Link 
                to="/hcp-details" 
                onClick={onClose}
                className="block px-8 py-4 text-gray-800 no-underline text-lg font-medium transition-all duration-300 border-l-4 border-transparent hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent hover:border-l-primary hover:text-primary hover:pl-10"
              >
                Add HCP
              </Link>
            </li>
           
            <li>
              <a 
                href="/" 
                onClick={onClose}
                className="block px-8 py-4 text-gray-800 no-underline text-lg font-medium transition-all duration-300 border-l-4 border-transparent hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent hover:border-l-primary hover:text-primary hover:pl-10"
              >
                Logout
              </a>
            </li>
          </ul>
        </nav>
        
        {/* <div className="p-6 border-t border-gray-200 text-center bg-gradient-to-b from-transparent to-primary/5">
          <p className="my-1 text-primary font-medium text-sm">Endometriosis Awareness Month</p>
          <p className="my-1 text-primary-light font-bold text-xl">2026</p>
        </div> */}
      </div>
    </>
  );
};

export default SideMenu;
