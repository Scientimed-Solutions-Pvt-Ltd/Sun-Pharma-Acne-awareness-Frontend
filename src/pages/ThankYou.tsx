import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import thanksBg from '../assets/images/thanks-bg.png';
import sunPharmaLogo from '../assets/images/sun-pharma-logo-black.png';
import { getPledgeCount } from '../services/api';

const ThankYou: React.FC = () => {
  const navigate = useNavigate();
  const [pledgeCount, setPledgeCount] = useState(0);
  const [targetCount, setTargetCount] = useState(0);

  useEffect(() => { document.title = 'Thank You | Acne Awareness Month'; }, []);

  // Format count to 4 digits
  const formatCount = (count: number): string[] => {
    return count.toString().padStart(4, '0').split('');
  };

  // Fetch pledge count from API
  useEffect(() => {
    const fetchPledgeCount = async () => {
      try {
        const response = await getPledgeCount();
        if (response.success) {
          setTargetCount(response.data.count);
        }
      } catch (error) {
        console.error('Failed to fetch pledge count:', error);
        // Set default count if API fails
        setTargetCount(0);
      }
    };

    fetchPledgeCount();
  }, []);

  // Animated counter effect
  useEffect(() => {
    if (targetCount === 0) return;

    const duration = 800; // Animation duration in ms
    const steps = 40; // Number of steps
    const increment = targetCount / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetCount) {
        setPledgeCount(targetCount);
        clearInterval(timer);
      } else {
        setPledgeCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [targetCount]);

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-right md:bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${thanksBg})` }}
      />
      
      {/* Gradient Header Overlay */}
      {/* <div className="absolute top-0 left-0 right-0 h-20 md:h-24 bg-gradient-to-r from-[#A82682] to-[#E3175F]" /> */}
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* <Header onMenuClick={toggleMenu} />
        <SideMenu isOpen={isMenuOpen} onClose={closeMenu} /> */}
        
        <main className="flex-1 flex items-center justify-center text-center">
          <div className="w-[90%] md:w-[80%] flex flex-col gap-2 justify-center items-center py-3 lg:py-2 text-center">
            
            {/* Thank You Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-none"
                style={{ background: 'linear-gradient(90deg, #A82682, #E3175F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Thank You!
            </h1>

            {/* Campaign Text */}
            <p className="text-sm md:text-base lg:text-lg text-gray-700 font-medium leading-snug max-w-2xl">
              for your participation in<br />
              <b><i className="text-base md:text-lg lg:text-xl" style={{ color: '#A82682' }}>"Regain coNFidence in my Acne patients" Campaign</i></b>
              <br />
              <span className="text-lg md:text-xl lg:text-2xl font-extrabold text-[#E3175F]">Acne Awareness Month</span>
            </p>

            {/* Live Count Section */}
            <div className="w-full max-w-lg rounded-2xl py-4 px-5" style={{ background: 'linear-gradient(135deg, rgba(168,38,130,0.08) 0%, rgba(227,23,95,0.08) 100%)', border: '2px solid rgba(168,38,130,0.25)' }}>
              {/* Live Count Label */}
              <p className="font-black uppercase tracking-wide leading-tight mb-3"
                 style={{ fontSize: 'clamp(0.95rem, 2.2vw, 1.35rem)', background: 'linear-gradient(90deg, #A82682, #E3175F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Live Count Across India,<br />
                Asia Book Of Record In Making
              </p>

              {/* Counter Display */}
              <div className="flex items-center justify-center gap-1">
                {formatCount(pledgeCount).map((digit, index) => (
                  <div 
                    key={index}
                    className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 rounded-lg flex items-center justify-center shadow-md counterbg">
                    <span className="text-xl md:text-2xl lg:text-3xl xl:text-4xl">{digit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sun Pharma Section */}
            <div className="text-center mt-1">
              <p className="text-xs md:text-sm text-gray-500 font-medium">Awareness initiative by:</p>
              <img src={sunPharmaLogo} alt="Sun Pharma Logo" className="h-8 md:h-10 lg:h-12 mx-auto my-1" />
              <p className="text-sm md:text-base font-semibold text-gray-700">Sun Pharma Laboratories Ltd.</p>
              <p className="text-gray-500 leading-snug" style={{ fontSize: '11px' }}>
                Sun House, Plot No. 201 B/1, Western Express Highway, Goregaon (East), Mumbai – 400 063, India
              </p>
            </div>

            {/* Home Button */}
            <button
              onClick={() => navigate('/hcp-details')}
              className="px-6 py-1.5 text-white font-semibold rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-sm md:text-base"
              style={{ backgroundColor: '#8f3c84' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7a3370'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8f3c84'}
            >
              Home
            </button>
          </div>
          
          <footer className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 z-10">
            <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-600" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            XXXXXXX &nbsp; &nbsp; &nbsp; &nbsp; For the use of registered medical practitioners or a hospital or a laboratory only.

            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default ThankYou;
