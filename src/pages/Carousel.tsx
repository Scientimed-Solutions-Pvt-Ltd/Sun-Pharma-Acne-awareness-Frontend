import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import { getUserData } from '../services/api';

// Import all carousel images
import slide1 from '../assets/images/scrn1.png';
import slide2 from '../assets/images/scrn2.png';
//import slide3 from '../assets/images/scrn3.png';

const slides = [
  { id: 1, image: slide1, alt: 'Endometriosis Awareness Slide 1' },
  { id: 2, image: slide2, alt: 'Endometriosis Awareness Slide 2' },
  //{ id: 3, image: slide3, alt: 'Endometriosis Awareness Slide 3' },
];

const Carousel: React.FC = () => {
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

  // const goToSlide = (index: number) => {
  //   setCurrentSlide(index);
  // };

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
      <div className="absolute top-0 left-0 right-0 h-20 md:h-24 bg-gradient-to-r from-[#A82682] to-[#E3175F]" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header onMenuClick={toggleMenu} userName={userName} />
        
        <SideMenu isOpen={isMenuOpen} onClose={closeMenu} userName={userName} />
        
        <main className="flex-1 flex flex-col relative ">
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
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4">
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
