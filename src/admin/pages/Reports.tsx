import React, { useState, useEffect, useCallback } from 'react';
import {
  getReportSummary,
  getZoneWiseReport,
  getRegionWiseReport,
  getAreaWiseReport,
  getCityWiseReport,
  getMRPerformanceReport,
  getTopPerformers,
  getZeroPledgeMRs,
  getPledgeTrend,
  getHierarchyPerformance,
  exportReport,
  getAllZones,
  getTodaysPledges,
  exportTodaysPledges,
  type ReportSummary,
  type ZoneReport,
  type RegionReport,
  type AreaReport,
  type CityReport,
  type MRPerformance,
  type PledgeTrend,
  type HierarchyPerformance,
  type Zone,
  type TodaysPledge,
  type PledgeFilters,
} from '../../services/adminApi';

type TabType = 'overview' | 'geographic' | 'mr-performance' | 'hierarchy' | 'trends';
type SortField = 'pledge_taken_at' | 'dr_name' | 'city' | 'terms_accepted_at';
type SortOrder = 'asc' | 'desc';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [zoneData, setZoneData] = useState<ZoneReport[]>([]);
  const [regionData, setRegionData] = useState<RegionReport[]>([]);
  const [areaData, setAreaData] = useState<AreaReport[]>([]);
  const [cityData, setCityData] = useState<CityReport[]>([]);
  const [mrData, setMRData] = useState<MRPerformance[]>([]);
  const [topPerformers, setTopPerformers] = useState<MRPerformance[]>([]);
  const [zeroPledgeMRs, setZeroPledgeMRs] = useState<MRPerformance[]>([]);
  const [pledgeTrend, setPledgeTrend] = useState<PledgeTrend[]>([]);
  const [hierarchyData, setHierarchyData] = useState<HierarchyPerformance[]>([]);
  const [todaysPledges, setTodaysPledges] = useState<TodaysPledge[]>([]);
  const [todaysPledgeCount, setTodaysPledgeCount] = useState(0);
  
  // Date range and sorting for pledges
  const [pledgeStartDate, setPledgeStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pledgeEndDate, setPledgeEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pledgeSortField, setPledgeSortField] = useState<SortField>('pledge_taken_at');
  const [pledgeSortOrder, setPledgeSortOrder] = useState<SortOrder>('desc');
  
  // Filters
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [hierarchyLevel, setHierarchyLevel] = useState<'ZM' | 'RM' | 'AM'>('ZM');
  const [geoView, setGeoView] = useState<'zone' | 'region' | 'area' | 'city'>('zone');

  // Fetch summary data
  const fetchSummary = useCallback(async () => {
    try {
      const response = await getReportSummary();
      if (response.success) {
        setSummary(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, []);

  // Fetch zones for filters
  const fetchZones = useCallback(async () => {
    try {
      const response = await getAllZones();
      if (response.success) {
        setZones(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch zones:', err);
    }
  }, []);

  // Fetch today's pledges
  const fetchTodaysPledges = useCallback(async (filters?: PledgeFilters) => {
    try {
      const response = await getTodaysPledges(filters || {
        start_date: pledgeStartDate,
        end_date: pledgeEndDate,
        sort_field: pledgeSortField,
        sort_order: pledgeSortOrder,
      });
      if (response.success) {
        setTodaysPledges(response.data.pledges);
        setTodaysPledgeCount(response.data.total_count);
      }
    } catch (err) {
      console.error('Failed to fetch pledges:', err);
    }
  }, [pledgeStartDate, pledgeEndDate, pledgeSortField, pledgeSortOrder]);

  // Fetch geographic data
  const fetchGeographicData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (geoView === 'zone') {
        const response = await getZoneWiseReport();
        if (response.success) setZoneData(response.data);
      } else if (geoView === 'region') {
        const response = await getRegionWiseReport(selectedZone || undefined);
        if (response.success) setRegionData(response.data);
      } else if (geoView === 'area') {
        const response = await getAreaWiseReport({ zone_id: selectedZone || undefined });
        if (response.success) setAreaData(response.data);
      } else if (geoView === 'city') {
        const response = await getCityWiseReport(50);
        if (response.success) setCityData(response.data);
      }
    } catch (err) {
      setError('Failed to fetch geographic data');
    } finally {
      setIsLoading(false);
    }
  }, [geoView, selectedZone]);

  // Fetch MR performance data
  const fetchMRData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mrResponse, topResponse, zeroResponse] = await Promise.all([
        getMRPerformanceReport({ limit: 100, zone_id: selectedZone || undefined }),
        getTopPerformers(10),
        getZeroPledgeMRs(),
      ]);

      if (mrResponse.success) setMRData(mrResponse.data);
      if (topResponse.success) setTopPerformers(topResponse.data);
      if (zeroResponse.success) setZeroPledgeMRs(zeroResponse.data);
    } catch (err) {
      setError('Failed to fetch MR data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedZone]);

  // Fetch hierarchy data
  const fetchHierarchyData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getHierarchyPerformance(hierarchyLevel);
      if (response.success) setHierarchyData(response.data);
    } catch (err) {
      setError('Failed to fetch hierarchy data');
    } finally {
      setIsLoading(false);
    }
  }, [hierarchyLevel]);

  // Fetch trend data
  const fetchTrendData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getPledgeTrend(30);
      if (response.success) setPledgeTrend(response.data);
    } catch (err) {
      setError('Failed to fetch trend data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await Promise.all([fetchSummary(), fetchZones(), fetchTodaysPledges()]);
      setIsLoading(false);
    };
    loadInitialData();
  }, [fetchSummary, fetchZones, fetchTodaysPledges]);

  // Load tab-specific data
  useEffect(() => {
    if (activeTab === 'geographic') {
      fetchGeographicData();
    } else if (activeTab === 'mr-performance') {
      fetchMRData();
    } else if (activeTab === 'hierarchy') {
      fetchHierarchyData();
    } else if (activeTab === 'trends') {
      fetchTrendData();
    }
  }, [activeTab, fetchGeographicData, fetchMRData, fetchHierarchyData, fetchTrendData]);

  // Refetch pledges when sorting changes
  useEffect(() => {
    fetchTodaysPledges();
  }, [pledgeSortField, pledgeSortOrder, fetchTodaysPledges]);

  // Handle export
  const handleExport = async (type: string) => {
    try {
      const blob = await exportReport(type, 'csv') as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export report');
    }
  };

  // Handle export pledges with date range
  const handleExportTodaysPledges = async () => {
    try {
      const blob = await exportTodaysPledges({
        start_date: pledgeStartDate,
        end_date: pledgeEndDate,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = pledgeStartDate === pledgeEndDate 
        ? `pledges_${pledgeStartDate}.csv`
        : `pledges_${pledgeStartDate}_to_${pledgeEndDate}.csv`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export pledges');
    }
  };

  // Handle sorting for pledges table
  const handlePledgeSort = (field: SortField) => {
    if (pledgeSortField === field) {
      setPledgeSortOrder(pledgeSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setPledgeSortField(field);
      setPledgeSortOrder('desc');
    }
  };

  // Get sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (pledgeSortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return pledgeSortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Get pledge card title based on date selection
  const getPledgeCardTitle = () => {
    const today = new Date().toISOString().split('T')[0];
    if (pledgeStartDate === today && pledgeEndDate === today) {
      return "Today's Pledges";
    } else if (pledgeStartDate === pledgeEndDate) {
      return `Pledges on ${new Date(pledgeStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      return `Pledges (${new Date(pledgeStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${new Date(pledgeEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})`;
    }
  };

  // Render KPI Card
  const KPICard = ({ title, value, subValue, color, icon }: { 
    title: string; 
    value: string | number; 
    subValue?: string;
    color: string;
    icon: React.ReactNode;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
        </div>
        <div className={`${color} p-3 rounded-lg text-white`}>{icon}</div>
      </div>
    </div>
  );

  // Render Progress Bar
  const ProgressBar = ({ value, max, color = 'bg-purple-600' }: { value: number; max: number; color?: string }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
    );
  };

  // Tab buttons
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'geographic', label: 'Geographic', icon: '🗺️' },
    { id: 'mr-performance', label: 'MR Performance', icon: '👥' },
    { id: 'hierarchy', label: 'Hierarchy', icon: '🏢' },
    { id: 'trends', label: 'Trends', icon: '📈' },
  ];

  if (isLoading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Comprehensive data analytics and performance insights</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('doctors')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Doctors
          </button>
          <button
            onClick={() => handleExport('mr_performance')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export MR Report
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-900">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && summary && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Doctors"
              value={summary.total_doctors.toLocaleString()}
              color="bg-blue-500"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <KPICard
              title="Pledges Taken"
              value={summary.pledged_doctors.toLocaleString()}
              subValue={`${summary.pledge_rate}% conversion`}
              color="bg-green-500"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <KPICard
              title="Pending Pledges"
              value={summary.pending_doctors.toLocaleString()}
              color="bg-yellow-500"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <KPICard
              title="Pledge Rate"
              value={`${summary.pledge_rate}%`}
              color="bg-purple-500"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            />
          </div>

          {/* MR Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title="Total MRs"
              value={summary.total_mrs.toLocaleString()}
              color="bg-indigo-500"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />
            <KPICard
              title="Active MRs"
              value={summary.active_mrs.toLocaleString()}
              subValue={`${summary.mr_activity_rate}% activity rate`}
              color="bg-teal-500"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
            />
            <KPICard
              title="Avg Pledges/MR"
              value={summary.avg_pledges_per_mr}
              color="bg-pink-500"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
            />
          </div>

          {/* Today's Pledges */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📅</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{getPledgeCardTitle()}</h3>
                    <p className="text-sm text-gray-500">
                      {pledgeStartDate === pledgeEndDate
                        ? new Date(pledgeStartDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                        : `${new Date(pledgeStartDate).toLocaleDateString('en-IN')} to ${new Date(pledgeEndDate).toLocaleDateString('en-IN')}`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">From:</label>
                    <input
                      type="date"
                      value={pledgeStartDate}
                      onChange={(e) => setPledgeStartDate(e.target.value)}
                      max={pledgeEndDate}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">To:</label>
                    <input
                      type="date"
                      value={pledgeEndDate}
                      onChange={(e) => setPledgeEndDate(e.target.value)}
                      min={pledgeStartDate}
                      max={new Date().toISOString().split('T')[0]}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => fetchTodaysPledges()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {todaysPledgeCount} Pledges
                  </span>
                  <button
                    onClick={handleExportTodaysPledges}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
            {todaysPledges.length > 0 ? (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                        onClick={() => handlePledgeSort('dr_name')}
                      >
                        <div className="flex items-center gap-1">
                          Doctor Name
                          <SortIcon field="dr_name" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                        onClick={() => handlePledgeSort('city')}
                      >
                        <div className="flex items-center gap-1">
                          City
                          <SortIcon field="city" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MR Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                      <th 
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                        onClick={() => handlePledgeSort('terms_accepted_at')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Terms Time
                          <SortIcon field="terms_accepted_at" />
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                        onClick={() => handlePledgeSort('pledge_taken_at')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Pledge Time
                          <SortIcon field="pledge_taken_at" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {todaysPledges.map((pledge, idx) => (
                      <tr key={pledge.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{pledge.pledge_date}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{pledge.dr_name}</p>
                          <p className="text-xs text-gray-500">{pledge.p_code || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{pledge.city || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900">{pledge.mr_name}</p>
                          <p className="text-xs text-gray-500">{pledge.mr_employee_id}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900">{pledge.area_name}</p>
                          <p className="text-xs text-gray-500">{pledge.region_name} • {pledge.zone_name}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {pledge.terms_accepted ? (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {pledge.terms_time}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            {pledge.pledge_time}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-lg">No pledges found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting the date range</p>
              </div>
            )}
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Conversion Funnel</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Total Doctors</span>
                  <span className="text-sm font-medium">{summary.total_doctors.toLocaleString()}</span>
                </div>
                <ProgressBar value={summary.total_doctors} max={summary.total_doctors} color="bg-blue-500" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Terms Accepted</span>
                  <span className="text-sm font-medium">{summary.terms_accepted.toLocaleString()} ({summary.terms_acceptance_rate}%)</span>
                </div>
                <ProgressBar value={summary.terms_accepted} max={summary.total_doctors} color="bg-yellow-500" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Pledges Taken</span>
                  <span className="text-sm font-medium">{summary.pledged_doctors.toLocaleString()} ({summary.pledge_rate}%)</span>
                </div>
                <ProgressBar value={summary.pledged_doctors} max={summary.total_doctors} color="bg-green-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Geographic Tab */}
      {activeTab === 'geographic' && (
        <div className="space-y-4">
          {/* View Selector */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2">
                {(['zone', 'region', 'area', 'city'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setGeoView(view)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      geoView === view ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}-wise
                  </button>
                ))}
              </div>
              {(geoView === 'region' || geoView === 'area') && (
                <select
                  value={selectedZone || ''}
                  onChange={(e) => setSelectedZone(e.target.value ? Number(e.target.value) : null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Zones</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
                </select>
              )}
              <button
                onClick={() => handleExport(geoView + '_wise')}
                className="ml-auto flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {geoView === 'city' ? 'City' : 'Name'}
                      </th>
                      {geoView !== 'zone' && geoView !== 'city' && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                      )}
                      {geoView !== 'city' && (
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">MRs</th>
                      )}
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Doctors</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pledged</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pending</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {geoView === 'zone' && zoneData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{item.total_mrs}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{item.total_doctors}</td>
                        <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">{item.pledged_doctors}</td>
                        <td className="px-4 py-3 text-sm text-center text-yellow-600">{item.pending_doctors}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium">{item.pledge_rate}%</td>
                        <td className="px-4 py-3 w-32"><ProgressBar value={item.pledged_doctors} max={item.total_doctors} /></td>
                      </tr>
                    ))}
                    {geoView === 'region' && regionData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.zone_name}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{item.total_mrs}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{item.total_doctors}</td>
                        <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">{item.pledged_doctors}</td>
                        <td className="px-4 py-3 text-sm text-center text-yellow-600">{item.pending_doctors}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium">{item.pledge_rate}%</td>
                        <td className="px-4 py-3 w-32"><ProgressBar value={item.pledged_doctors} max={item.total_doctors} /></td>
                      </tr>
                    ))}
                    {geoView === 'area' && areaData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.region_name}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{item.total_mrs}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{item.total_doctors}</td>
                        <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">{item.pledged_doctors}</td>
                        <td className="px-4 py-3 text-sm text-center text-yellow-600">{item.pending_doctors}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium">{item.pledge_rate}%</td>
                        <td className="px-4 py-3 w-32"><ProgressBar value={item.pledged_doctors} max={item.total_doctors} /></td>
                      </tr>
                    ))}
                    {geoView === 'city' && cityData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.city}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{item.total_doctors}</td>
                        <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">{item.pledged_doctors}</td>
                        <td className="px-4 py-3 text-sm text-center text-yellow-600">{item.pending_doctors}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium">{item.pledge_rate}%</td>
                        <td className="px-4 py-3 w-32"><ProgressBar value={item.pledged_doctors} max={item.total_doctors} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MR Performance Tab */}
      {activeTab === 'mr-performance' && (
        <div className="space-y-6">
          {/* Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🏆</span> Top 10 Performers
              </h3>
              <div className="space-y-3">
                {topPerformers.map((mr, idx) => (
                  <div key={mr.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white ${
                      idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-gray-300'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{mr.name}</p>
                      <p className="text-xs text-gray-500">{mr.area_name} • {mr.region_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{mr.pledged_doctors}</p>
                      <p className="text-xs text-gray-500">{mr.pledge_rate}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">⚠️</span> Zero Pledges ({zeroPledgeMRs.length} MRs)
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {zeroPledgeMRs.slice(0, 10).map((mr) => (
                  <div key={mr.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{mr.name}</p>
                      <p className="text-xs text-gray-500">{mr.area_name} • {mr.employee_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-600">{mr.total_doctors} doctors</p>
                      <p className="text-xs text-red-600">0 pledges</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Full MR List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">All MR Performance</h3>
              <select
                value={selectedZone || ''}
                onChange={(e) => setSelectedZone(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Zones</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MR Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Doctors</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pledged</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mrData.map((mr) => (
                      <tr key={mr.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{mr.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{mr.employee_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{mr.area_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{mr.region_name}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{mr.total_doctors}</td>
                        <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">{mr.pledged_doctors}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium">{mr.pledge_rate}%</td>
                        <td className="px-4 py-3 w-32"><ProgressBar value={mr.pledged_doctors} max={mr.total_doctors} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hierarchy Tab */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex gap-2">
              {(['ZM', 'RM', 'AM'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setHierarchyLevel(level)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    hierarchyLevel === level ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {level === 'ZM' ? 'Zonal Managers' : level === 'RM' ? 'Regional Managers' : 'Area Managers'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {hierarchyLevel === 'ZM' ? 'Zone' : hierarchyLevel === 'RM' ? 'Region' : 'Area'}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Team MRs</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Doctors</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pledged</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pending</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {hierarchyData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.employee_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {hierarchyLevel === 'ZM' ? item.zone_name : hierarchyLevel === 'RM' ? item.region_name : item.area_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{item.total_mrs}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{item.total_doctors}</td>
                        <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">{item.pledged_doctors}</td>
                        <td className="px-4 py-3 text-sm text-center text-yellow-600">{item.pending_doctors}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium">{item.pledge_rate}%</td>
                        <td className="px-4 py-3 w-32"><ProgressBar value={item.pledged_doctors} max={item.total_doctors} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Pledge Trend (Last 30 Days)</h3>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="h-64">
                {/* Simple bar chart */}
                <div className="flex items-end justify-between h-48 gap-1">
                  {pledgeTrend.slice(-30).map((item, idx) => {
                    const maxCount = Math.max(...pledgeTrend.map(t => t.count), 1);
                    const height = (item.count / maxCount) * 100;
                    return (
                      <div
                        key={idx}
                        className="flex-1 bg-purple-500 hover:bg-purple-600 rounded-t transition-colors cursor-pointer group relative"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${item.date}: ${item.count} pledges`}
                      >
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                          {item.date}: {item.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>{pledgeTrend[0]?.date || 'Start'}</span>
                  <span>{pledgeTrend[pledgeTrend.length - 1]?.date || 'End'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Total in Period</h4>
              <p className="text-3xl font-bold text-purple-600">
                {pledgeTrend.reduce((sum, t) => sum + t.count, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Daily Average</h4>
              <p className="text-3xl font-bold text-blue-600">
                {pledgeTrend.length > 0 
                  ? Math.round(pledgeTrend.reduce((sum, t) => sum + t.count, 0) / pledgeTrend.length)
                  : 0}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Peak Day</h4>
              <p className="text-3xl font-bold text-green-600">
                {Math.max(...pledgeTrend.map(t => t.count), 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
