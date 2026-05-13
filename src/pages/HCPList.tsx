import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import bgDesktop from '../assets/images/bg01.png';
import bgTablet from '../assets/images/bg01-md.png';
import bgMobile from '../assets/images/bg01-sm.png';
import { getUserData, getDoctorsByFieldTeam } from '../services/api';

interface Doctor {
  id: number;
  dr_name: string;
  registration_no: string | null;
  mobile: string | null;
  email: string | null;
  p_code: string | null;
  city: string;
  pledge_taken: boolean;
  terms_accepted: boolean;
  field_team_id: number;
  created_at: string;
  updated_at: string;
}

const HCPList: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Handle selecting a doctor to edit
  const handleSelectDoctor = (doctor: Doctor) => {
    navigate('/hcp-details', { state: { selectedDoctor: doctor } });
  };

  // Handle try again for pending pledge - navigate to HCP details to fill missing info
  const handleTryAgain = (doctor: Doctor) => {
    navigate('/hcp-details', { state: { selectedDoctor: doctor } });
  };

  // Fetch doctors for the logged-in MR
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const userData = getUserData();
        
        if (!userData) {
          navigate('/');
          return;
        }

        setUserName(userData.name);

        // Fetch doctors for this MR's field team
        const response = await getDoctorsByFieldTeam(userData.id);
        
        if (response.success) {
          setDoctors(response.data);
        } else {
          setError('Failed to load HCP list');
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Failed to load HCP list');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, [navigate]);

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
        
        <main className="flex-1 flex items-start justify-center px-4 md:px-8 py-8 mt-8">
          <div className="w-full max-w-7xl">
            {/* Page Title */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-purple-900 text-center mb-2">
                HCP List
              </h1>
              <p className="text-center text-gray-600">
                Healthcare Professionals registered under {userName}
              </p>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading HCP list...</p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Doctors List */}
            {!isLoading && !error && (
              <>
                {doctors.length === 0 ? (
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
                    <p className="text-gray-600 text-lg">
                      No HCPs registered yet. Start by adding HCP details!
                    </p>
                    <button
                      onClick={() => navigate('/hcp-details')}
                      className="mt-4 px-6 py-2 bg-purple-900 text-white rounded-lg hover:bg-purple-800 transition-colors"
                    >
                      Add HCP Details
                    </button>
                  </div>
                ) : (
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
                    {/* Table Header */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-purple-900 text-white">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              S.No
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Doctor Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              P.Code
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Mobile
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              City
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                              Pledge Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {doctors.map((doctor, index) => (
                            <tr 
                              key={doctor.id} 
                              className="hover:bg-purple-50 transition-colors cursor-pointer"
                              onClick={() => handleSelectDoctor(doctor)}
                            >
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {doctor.dr_name}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {doctor.p_code || 'N/A'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {doctor.mobile || 'N/A'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {doctor.city}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                {doctor.pledge_taken ? (
                                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    ✓ Taken
                                  </span>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                      Pending
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTryAgain(doctor);
                                      }}
                                      className="px-3 py-1 text-xs font-semibold text-white bg-purple-900 rounded-lg hover:bg-purple-800 transition-colors"
                                    >
                                      Try Again
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Summary Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700">Total HCPs:</span>{' '}
                          <span className="text-purple-900 font-bold">{doctors.length}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Pledges Taken:</span>{' '}
                          <span className="text-green-600 font-bold">
                            {doctors.filter(d => d.pledge_taken).length}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Pending:</span>{' '}
                          <span className="text-yellow-600 font-bold">
                            {doctors.filter(d => !d.pledge_taken).length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="absolute bottom-2 right-4 md:bottom-4 md:right-6 z-10">
          <p className="text-xs text-white/90 text-right drop-shadow-md">
            All the images used in this material are for illustration purposes only
          </p>
        </footer>
      </div>
    </div>
  );
};

export default HCPList;
