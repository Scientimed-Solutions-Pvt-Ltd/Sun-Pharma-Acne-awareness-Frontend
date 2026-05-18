import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import slider1Img from '../assets/images/acne-aware-slider1-img.png';
import slider1Text from '../assets/images/acne-aware-slider1-text.png';
import slider1TextSm from '../assets/images/acne-aware-slider1-text-sm.png';
import slider2Img from '../assets/images/acne-aware-slider2-img.png';
import slider2Text from '../assets/images/acne-aware-slider2-text.png';
import { getUserData } from '../services/api';

// Slide 1 Component - Acne Awareness Statistics
const Slide1: React.FC = () => (
  <div className="w-full h-full relative overflow-hidden bg-white">
    <div className="flex flex-col md:flex-row h-full items-center justify-center">
      {/* Left Side - Woman Image */}
      <div className="w-full lg:w-1/2 h-1/2 md:h-full flex items-end justify-center md:justify-end">
        <img 
          src={slider1Img} 
          alt="Acne Awareness" 
          className="h-full w-auto object-contain object-center"
        />
      </div>
      
      {/* Right Side - Text Content */}
      <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col items-center justify-center md:justify-center md:items-start p-0 md:p-2">
        {/* Mobile/Tablet Image (below 1025px) */}
        <img 
          src={slider1TextSm} 
          alt="Acne Statistics" 
          className="max-w-full max-h-[85%] object-contain min-[1025px]:hidden"
        />
        {/* Desktop Image (1025px and above) */}
        <img 
          src={slider1Text} 
          alt="Acne Statistics" 
          className="max-w-full max-h-[85%] object-contain hidden min-[1025px]:block"
        />
        <p className="ml-6 text-[8px] sm:text-[9px] md:text-[10px] text-black mt-2 px-2 md:px-0 max-w-md">
          <b>References:</b> 1. Madnani N, Saraswat A, Nott A, et al. PRACT-India: Practical Recommendations on Acne Care and Medical Treatment in India-A Modified Delphi Consensus. <em>Antibiotics (Basel).</em> 2025;14(8):844.
        </p>
      </div>
    </div>
  </div>
);

// Slide 2 Component - Acne Awareness Info
const Slide2: React.FC = () => (
  <div className="w-full h-full relative overflow-hidden bg-white">
    <div className="flex flex-col md:flex-row h-full items-center justify-center">
      {/* Left Side - Woman Image */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full flex items-end justify-center md:justify-start">
        <img 
          src={slider2Img} 
          alt="Acne Awareness" 
          className="h-full w-auto object-contain object-center"
        />
      </div>
      
      {/* Right Side - Text Content */}
      <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col items-center justify-start md:justify-start md:items-start p-0 md:p-2">
        <img 
          src={slider2Text} 
          alt="Acne Information" 
          className="max-w-full max-h-[85%] object-contain"
        />
         <p className="text-[7px] sm:text-[8px] md:text-[8px] text-black mt-2 px-2 md:px-0 max-w-md">
         <b>References:</b> 1. Adams JA, Adams AJ, Klepser ME. Pharmacist Prescriptive Authority for Acne: An Evidence-Based Approach to Policy. Innov
Pharm. 2021 Apr 27;12(2):10.24926/iip.v12i2.3897. 2. Jisa TA, Rahat MTI, Sumi MSA et al. Prevalence of Acne and Its Impact on Quality of Life,
Social Appearance Anxiety and Treatment Practices Among Young Adults. J Cosmet Dermatol. 2026;25(1):e70654. 3. Del Rosso JQ. Rationale for
Use of Micronized Isotretinoin for Treatment of Acne Vulgaris: Practical Considerations and Therapeutic Advantages. J Clin Aesthet Dermatol.
2023;16(9):20-24. 4. Santer M, Burden-Teh E, Ravenscroft J. Managing acne vulgaris: an update. Drug Ther Bull. 2023 Dec 27;62(1):6-10.
        </p>
      </div>
    </div>
  </div>
);

// Slides array with components
const slides = [
  { id: 1, Component: Slide1 },
  { id: 2, Component: Slide2 },
];

const InfoSlider: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Get user data
  useEffect(() => {
    const userData = getUserData();
    if (userData) {
      setUserName(userData.name);
    }
  }, []);

  // const goToSlide = (index: number) => {
  //   setCurrentSlide(index);
  // };

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-right md:bg-center bg-no-repeat"
        // style={{ backgroundImage: `url(${bgImage})` }}
      />
      
      {/* Gradient Header Overlay */}
      <div className="absolute top-0 left-0 right-0 min-h-20 h-auto bg-gradient-to-r from-[#A82682] to-[#E3175F]" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header onMenuClick={toggleMenu} userName={userName} />
        
        <SideMenu isOpen={isMenuOpen} onClose={closeMenu} userName={userName} />
        
        <main className="flex-1 flex flex-col relative">
          {/* Carousel Container */}
          <div className="flex-1 relative overflow-hidden">
            {/* Slides */}
            <div className="absolute inset-0">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className="absolute inset-0"
                  style={{ 
                    transform: `translateX(${(index - currentSlide) * 100}%)`,
                    transition: 'transform 700ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <slide.Component />
                </div>
              ))}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-8 md:bottom-4 lg:bottom-4 right-4 md:right-8 z-30 flex flex-col items-end gap-4">
              {/* Dot Indicators */}
              {/* <div className="flex items-center gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`transition-all duration-300 rounded-full ${
                      index === currentSlide
                        ? 'w-8 h-3 bg-white'
                        : 'w-3 h-3 bg-white/50 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div> */}
              
              {/* Next Button */}
              <button
                onClick={() => {
                  if (currentSlide < slides.length - 1) {
                    nextSlide();
                  } else {
                    navigate('/take-pledge');
                  }
                }}
                className="prplbtn2 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 mt-1"
              >
                Next 
              </button>
            </div>
          </div>

           <footer className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 z-10">
            <p className="text-[8px] sm:text-[10px] md:text-xs text-white/90 drop-shadow-md" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              All the images used in this material are for illustration purposes only
            </p>
          </footer>

        </main>
      </div>
    </div>
  );
};

export default InfoSlider;
