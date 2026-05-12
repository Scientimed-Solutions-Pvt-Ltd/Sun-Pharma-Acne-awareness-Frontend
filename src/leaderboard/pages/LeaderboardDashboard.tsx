import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getLeaderboard,
  getFilters,
  leaderboardLogout,
  getLeaderboardData,
  isLeaderboardAuthenticated,
  exportLeaderboard,
  type LeaderboardData,
  type FilterOptions,
  type ManagerStats,
} from '../../services/leaderboardApi';
import ManagerDetailModal from '../components/ManagerDetailModal';

const LeaderboardDashboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [filters, setFilters] = useState<FilterOptions | null>(null);
  const [selectedZone, setSelectedZone] = useState<number | undefined>(undefined);
  const [selectedRegion, setSelectedRegion] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'AM' | 'RM' | 'ZM'>('ZM');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);
  const navigate = useNavigate();

  const user = getLeaderboardData();

  useEffect(() => {
    if (!isLeaderboardAuthenticated()) {
      navigate('/leaderboard/login');
      return;
    }
    loadData();
    loadFilters();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [navigate, selectedZone, selectedRegion]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await getLeaderboard({
        limit: 10,
        zone_id: selectedZone,
        region_id: selectedRegion,
      });
      setLeaderboardData(response.data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilters = async () => {
    try {
      const response = await getFilters();
      setFilters(response.data);
    } catch (err) {
      console.error('Failed to load filters:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await leaderboardLogout();
      navigate('/leaderboard/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await exportLeaderboard({
        zone_id: selectedZone,
        region_id: selectedRegion,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pledged_doctors_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export pledged doctors data');
    }
  };

  const getRankSuffix = (rank: number) => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  const renderLeaderboardCard = (manager: ManagerStats) => {
    const rank = manager.rank;
    const isTop3 = rank <= 3;
    const bgColors = [
      'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300 shadow-md', 
      'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 shadow-md', 
      'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300 shadow-md'
    ];
    const rankBadgeColors = [
      'bg-yellow-500 text-white',
      'bg-gray-500 text-white', 
      'bg-orange-500 text-white'
    ];

    return (
      <div
        key={manager.id}
        onClick={() => setSelectedManagerId(manager.id)}
        className={`p-4 rounded-lg border-2 transition-all hover:shadow-xl cursor-pointer ${
          isTop3 ? bgColors[rank - 1] : 'bg-white border-gray-200 hover:border-yellow-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                isTop3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gray-200'
              }`}>
                {isTop3 ? (
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ) : (
                  <span className="text-gray-600 font-bold text-lg">{rank}</span>
                )}
              </div>
              <span className={`text-xs font-bold mt-1 px-2 py-0.5 rounded ${
                isTop3 ? rankBadgeColors[rank - 1] : 'text-gray-700 bg-gray-100'
              }`}>
                {rank}{getRankSuffix(rank)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{manager.name}</h3>
              <p className="text-sm text-gray-600">{manager.employee_id}</p>
              <p className="text-xs text-gray-500">
                {manager.area_name && `${manager.area_name} • `}
                {manager.region_name && `${manager.region_name} • `}
                {manager.zone_name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-yellow-600">{manager.pledged_doctors}</p>
            <p className="text-xs text-gray-600">Pledges</p>
            <p className="text-sm font-medium text-green-600 mt-1">
              {manager.pledge_rate}% rate
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-2 bg-white rounded">
            <p className="text-gray-600">MRs</p>
            <p className="font-semibold text-gray-900">{manager.total_mrs}</p>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <p className="text-gray-600">Doctors</p>
            <p className="font-semibold text-gray-900">{manager.total_doctors}</p>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <p className="text-gray-600">Today</p>
            <p className="font-semibold text-green-600">{manager.today_pledges}</p>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && !leaderboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <svg
                  className="w-8 h-8 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Leaderboard
              </h1>
              <p className="text-yellow-100 mt-1">Endometriosis Awareness Month</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold">{user?.name}</p>
                <p className="text-sm text-yellow-100">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white text-yellow-700 rounded-lg hover:bg-yellow-50 transition-all font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}



        {/* Summary Stats */}
        {leaderboardData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Pledges</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {leaderboardData.summary.pledged_doctors}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pledge Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {leaderboardData.summary.pledge_rate}%
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Today's Pledges</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {leaderboardData.summary.today_pledges}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Managers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {leaderboardData.summary.total_managers}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {filters && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
                <select
                  value={selectedZone || ''}
                  onChange={(e) => {
                    setSelectedZone(e.target.value ? Number(e.target.value) : undefined);
                    setSelectedRegion(undefined);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="">All Zones</option>
                  {filters.zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <select
                  value={selectedRegion || ''}
                  onChange={(e) => setSelectedRegion(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  disabled={!selectedZone}
                >
                  <option value="">All Regions</option>
                  {filters.regions
                    .filter((region) => !selectedZone || region.zone_id === selectedZone)
                    .map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Export CSV */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              {(['ZM', 'RM', 'AM'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-6 py-4 text-center font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Top {tab}
                  {tab === 'ZM' && ' (Zonal Managers)'}
                  {tab === 'RM' && ' (Regional Managers)'}
                  {tab === 'AM' && ' (Area Managers)'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {leaderboardData && (
              <div className="space-y-4">
                {activeTab === 'ZM' && leaderboardData.top_zm.map((manager) => renderLeaderboardCard(manager))}
                {activeTab === 'RM' && leaderboardData.top_rm.map((manager) => renderLeaderboardCard(manager))}
                {activeTab === 'AM' && leaderboardData.top_am.map((manager) => renderLeaderboardCard(manager))}
                
                {((activeTab === 'ZM' && leaderboardData.top_zm.length === 0) ||
                  (activeTab === 'RM' && leaderboardData.top_rm.length === 0) ||
                  (activeTab === 'AM' && leaderboardData.top_am.length === 0)) && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No data available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Auto-refreshes every 30 seconds • Last updated: {leaderboardData && new Date(leaderboardData.summary.last_updated).toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Manager Detail Modal */}
      {selectedManagerId && (
        <ManagerDetailModal
          managerId={selectedManagerId}
          onClose={() => setSelectedManagerId(null)}
        />
      )}
    </div>
  );
};

export default LeaderboardDashboard;
