import React, { useEffect, useState } from 'react';
import { getManagerDetails, type ManagerDetails } from '../../services/leaderboardApi';

// Simple icon components
const XIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const AwardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

interface ManagerDetailModalProps {
  managerId: number;
  onClose: () => void;
}

const ManagerDetailModal: React.FC<ManagerDetailModalProps> = ({ managerId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<ManagerDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadManagerDetails();
  }, [managerId]);

  const loadManagerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getManagerDetails(managerId);
      setDetails(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load manager details');
    } finally {
      setLoading(false);
    }
  };

  const getManagerTypeLabel = (type: string) => {
    switch (type) {
      case 'ZM':
        return 'Zonal Manager';
      case 'RM':
        return 'Regional Manager';
      case 'AM':
        return 'Area Manager';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <XIcon />
          </button>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-white bg-opacity-30 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-white bg-opacity-30 rounded w-1/4"></div>
            </div>
          ) : details ? (
            <div>
              <h2 className="text-2xl font-bold mb-2">{details.name}</h2>
              <p className="text-sm opacity-90">
                {getManagerTypeLabel(details.user_type)} • {details.employee_id}
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span>📧 {details.email}</span>
                <span>📱 {details.mobile}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">
              <p>{error}</p>
              <button
                onClick={loadManagerDetails}
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Retry
              </button>
            </div>
          ) : details ? (
            <div className="p-6 space-y-6">
              {/* Location Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-orange-500"><AwardIcon /></span>
                  Territory Information
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Zone</p>
                    <p className="font-semibold text-gray-900">{details.zone_name}</p>
                  </div>
                  {details.region_name !== 'N/A' && (
                    <div>
                      <p className="text-gray-600">Region</p>
                      <p className="font-semibold text-gray-900">{details.region_name}</p>
                    </div>
                  )}
                  {details.area_name !== 'N/A' && (
                    <div>
                      <p className="text-gray-600">Area</p>
                      <p className="font-semibold text-gray-900">{details.area_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Stats */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-orange-500"><TrendingUpIcon /></span>
                  Performance Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{details.total_doctors}</p>
                    <p className="text-sm text-gray-600">Total Doctors</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{details.pledged_doctors}</p>
                    <p className="text-sm text-gray-600">Pledged</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">{details.pending_doctors}</p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{details.pledge_rate}%</p>
                    <p className="text-sm text-gray-600">Pledge Rate</p>
                  </div>
                </div>
              </div>

              {/* Team Structure */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-orange-500"><UsersIcon /></span>
                  Team Structure
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {details.total_rms !== undefined && (
                    <div className="bg-blue-50 p-3 rounded text-center">
                      <p className="text-xl font-bold text-blue-700">{details.total_rms}</p>
                      <p className="text-sm text-blue-600">Regional Managers</p>
                    </div>
                  )}
                  {details.total_ams !== undefined && (
                    <div className="bg-green-50 p-3 rounded text-center">
                      <p className="text-xl font-bold text-green-700">{details.total_ams}</p>
                      <p className="text-sm text-green-600">Area Managers</p>
                    </div>
                  )}
                  <div className="bg-purple-50 p-3 rounded text-center">
                    <p className="text-xl font-bold text-purple-700">{details.total_mrs}</p>
                    <p className="text-sm text-purple-600">Medical Reps</p>
                  </div>
                </div>

                {/* Subordinates List */}
                {details.regional_managers && details.regional_managers.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Regional Managers</h4>
                    <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
                      <div className="space-y-1 text-sm">
                        {details.regional_managers.map((rm, idx) => (
                          <div key={idx} className="flex justify-between py-1 border-b border-gray-200 last:border-0">
                            <span>{rm.name}</span>
                            <span className="text-gray-600">{rm.region}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {details.area_managers && details.area_managers.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Area Managers</h4>
                    <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
                      <div className="space-y-1 text-sm">
                        {details.area_managers.map((am, idx) => (
                          <div key={idx} className="flex justify-between py-1 border-b border-gray-200 last:border-0">
                            <span>{am.name}</span>
                            <span className="text-gray-600">{am.area}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {details.medical_representatives && details.medical_representatives.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Medical Representatives</h4>
                    <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
                      <div className="space-y-1 text-sm">
                        {details.medical_representatives.map((mr, idx) => (
                          <div key={idx} className="flex justify-between py-1 border-b border-gray-200 last:border-0">
                            <span>{mr.name}</span>
                            <span className="text-gray-600">{mr.employee_id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Performance Breakdown */}
              {(details.region_performance || details.area_performance || details.mr_performance) && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-orange-500"><TrendingUpIcon /></span>
                    Performance Breakdown
                  </h3>

                  {details.region_performance && details.region_performance.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">By Region</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left">Region</th>
                              <th className="px-4 py-2 text-left">RM</th>
                              <th className="px-4 py-2 text-right">Total</th>
                              <th className="px-4 py-2 text-right">Pledged</th>
                              <th className="px-4 py-2 text-right">Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {details.region_performance.map((region, idx) => (
                              <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="px-4 py-2">{region.region_name}</td>
                                <td className="px-4 py-2">{region.rm_name}</td>
                                <td className="px-4 py-2 text-right">{region.total_doctors}</td>
                                <td className="px-4 py-2 text-right font-semibold text-green-600">
                                  {region.pledged_doctors}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    {region.pledge_rate}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {details.area_performance && details.area_performance.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">By Area</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left">Area</th>
                              <th className="px-4 py-2 text-left">AM</th>
                              <th className="px-4 py-2 text-right">Total</th>
                              <th className="px-4 py-2 text-right">Pledged</th>
                              <th className="px-4 py-2 text-right">Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {details.area_performance.map((area, idx) => (
                              <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="px-4 py-2">{area.area_name}</td>
                                <td className="px-4 py-2">{area.am_name}</td>
                                <td className="px-4 py-2 text-right">{area.total_doctors}</td>
                                <td className="px-4 py-2 text-right font-semibold text-green-600">
                                  {area.pledged_doctors}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    {area.pledge_rate}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {details.mr_performance && details.mr_performance.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">By MR</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left">MR Name</th>
                              <th className="px-4 py-2 text-left">ID</th>
                              <th className="px-4 py-2 text-right">Total</th>
                              <th className="px-4 py-2 text-right">Pledged</th>
                              <th className="px-4 py-2 text-right">Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {details.mr_performance.map((mr, idx) => (
                              <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="px-4 py-2">{mr.mr_name}</td>
                                <td className="px-4 py-2 text-gray-600">{mr.employee_id}</td>
                                <td className="px-4 py-2 text-right">{mr.total_doctors}</td>
                                <td className="px-4 py-2 text-right font-semibold text-green-600">
                                  {mr.pledged_doctors}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    {mr.pledge_rate}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recent Activities */}
              {details.recent_pledges && details.recent_pledges.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-orange-500"><CalendarIcon /></span>
                    Recent Pledge Activities
                  </h3>
                  <div className="bg-gray-50 rounded p-4 max-h-60 overflow-y-auto">
                    <div className="space-y-3">
                      {details.recent_pledges.map((pledge, idx) => (
                        <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-xs font-semibold">✓</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{pledge.doctor_name}</p>
                            <p className="text-xs text-gray-600">MR: {pledge.mr_name}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(pledge.pledged_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ManagerDetailModal;
