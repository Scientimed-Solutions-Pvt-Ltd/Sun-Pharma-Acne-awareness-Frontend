import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import {
  getDoctors,
  deleteDoctor,
  exportDoctors,
  importDoctors,
  getAllStates,
  getAllHqs,
} from '../../services/adminApi';
import { hasVideoInDB, getVideoFromDB, getVideoStatusFromServer } from '../../services/api';
import type { Doctor, State, Hq } from '../../services/adminApi';

const DoctorsList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    state_id: 0,
    hq_id: 0,
    pledge_taken: '',
  });

  // Filter options
  const [states, setStates] = useState<State[]>([]);
  const [hqs, setHqs] = useState<Hq[]>([]);

  // Video states
  const [videoAvailability, setVideoAvailability] = useState<Record<number, boolean>>({});
  const [videoUrls, setVideoUrls] = useState<Record<number, string>>({});
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [videoModalName, setVideoModalName] = useState('');

  const fetchData = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await getDoctors({
        page,
        search,
        state_id: filters.state_id || undefined,
        hq_id: filters.hq_id || undefined,
        pledge_taken: filters.pledge_taken === '' ? undefined : filters.pledge_taken === '1',
      });
      if (response.success) {
        setData(response.data.data);
        setPagination({
          currentPage: response.data.current_page,
          lastPage: response.data.last_page,
          total: response.data.total,
          perPage: response.data.per_page,
        });
        // Load video availability for this page from server (cross-browser)
        const availability: Record<number, boolean> = {};
        const urls: Record<number, string> = {};
        await Promise.all(
          response.data.data.map(async (d: Doctor) => {
            const serverStatus = await getVideoStatusFromServer(d.id);
            if (serverStatus.has_video) {
              availability[d.id] = true;
              if (serverStatus.video_url) urls[d.id] = serverStatus.video_url;
            } else {
              // Fallback to IndexedDB (same-browser recordings not yet uploaded)
              availability[d.id] = await hasVideoInDB(d.id);
            }
          })
        );
        setVideoAvailability(availability);
        setVideoUrls(urls);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setIsLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const statesRes = await getAllStates();
        if (statesRes.success) setStates(statesRes.data);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    loadFilterOptions();
  }, []);

  useEffect(() => {
    if (filters.state_id) {
      getAllHqs(filters.state_id).then((res) => {
        if (res.success) setHqs(res.data);
      });
    } else {
      setHqs([]);
      setFilters((prev) => ({ ...prev, hq_id: 0 }));
    }
  }, [filters.state_id]);

  const handleDelete = async (item: Doctor) => {
    if (!window.confirm(`Are you sure you want to delete ${item.dr_name}?`)) return;
    try {
      await deleteDoctor(item.id);
      fetchData(pagination.currentPage);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportDoctors();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'doctors.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to export');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const result = await importDoctors(file);
      alert(result.message);
      fetchData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to import');
    }
  };

  const handlePlayVideo = async (doctor: Doctor) => {
    try {
      // Prefer server URL, fallback to IndexedDB
      if (videoUrls[doctor.id]) {
        setVideoModalUrl(videoUrls[doctor.id]);
        setVideoModalName(doctor.dr_name);
        return;
      }
      const blob = await getVideoFromDB(doctor.id);
      if (blob) {
        setVideoModalUrl(URL.createObjectURL(blob));
        setVideoModalName(doctor.dr_name);
      }
    } catch (err) {
      console.error('Failed to load video:', err);
    }
  };

  const closeVideoModal = () => {
    // Only revoke object URLs (not server URLs)
    if (videoModalUrl && videoModalUrl.startsWith('blob:')) URL.revokeObjectURL(videoModalUrl);
    setVideoModalUrl(null);
    setVideoModalName('');
  };

  const columns = [
    { 
      key: 'dr_name', 
      title: 'Name',
      render: (item: Doctor) => {
        const photo = localStorage.getItem(`doctor_photo_${item.id}`);
        return (
          <div className="flex items-center gap-2">
            {photo ? (
              <img src={photo} alt={item.dr_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-700 text-xs font-bold">
                {item.dr_name.charAt(0).toUpperCase()}
              </div>
            )}
            <span>{item.dr_name}</span>
          </div>
        );
      },
    },
    { 
      key: 'registration_no', 
      title: 'Registration No.',
      render: (item: Doctor) => item.registration_no,
    },
    { key: 'mobile', title: 'Mobile' },
    { key: 'email', title: 'Email' },
    { key: 'city', title: 'City' },
    {
      key: 'field_team',
      title: 'Field Team',
      render: (item: Doctor) => item.field_team?.name || '-',
    },
    {
      key: 'pledge_taken',
      title: 'Pledge Status',
      render: (item: Doctor) =>
        item.pledge_taken ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Taken
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Not Taken
          </span>
        ),
    },
    {
      key: 'pledge_taken_at',
      title: 'Pledge Date',
      render: (item: Doctor) =>
        item.pledge_taken_at
          ? new Date(item.pledge_taken_at).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '-',
    },
    {
      key: 'video_status',
      title: 'Video',
      render: (item: Doctor) =>
        videoAvailability[item.id] ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            Available
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
            Not Available
          </span>
        ),
    },
  ];

  const filterComponent = (
    <div className="flex flex-wrap gap-4">
      <select
        value={filters.state_id}
        onChange={(e) =>
          setFilters({ ...filters, state_id: Number(e.target.value), hq_id: 0 })
        }
        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
      >
        <option value={0}>All States</option>
        {states.map((state) => (
          <option key={state.id} value={state.id}>
            {state.name}
          </option>
        ))}
      </select>
      <select
        value={filters.hq_id}
        onChange={(e) => setFilters({ ...filters, hq_id: Number(e.target.value) })}
        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
        disabled={!filters.state_id}
      >
        <option value={0}>All HQs</option>
        {hqs.map((hq) => (
          <option key={hq.id} value={hq.id}>
            {hq.name}
          </option>
        ))}
      </select>
      <select
        value={filters.pledge_taken}
        onChange={(e) => setFilters({ ...filters, pledge_taken: e.target.value })}
        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
      >
        <option value="">All Pledge Status</option>
        <option value="1">Pledge Taken</option>
        <option value="0">Not Taken</option>
      </select>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Doctors</h1>
        <p className="text-gray-600 mt-1">Manage doctor records and pledges</p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        pagination={{ ...pagination, onPageChange: fetchData }}
        onView={(item) => navigate(`/admin/doctors/${item.id}`)}
        onEdit={(item) => navigate(`/admin/doctors/${item.id}/edit`)}
        onDelete={handleDelete}
        onSearch={setSearch}
        onExport={handleExport}
        onImport={handleImport}
        onCreate={() => navigate('/admin/doctors/create')}
        searchPlaceholder="Search by name, registration, mobile..."
        filters={filterComponent}
        extraActions={(item) =>
          videoAvailability[item.id] ? (
            <button
              onClick={() => handlePlayVideo(item)}
              title="Play video"
              className="text-purple-600 hover:text-purple-900"
            >
              <svg className="w-5 h-5 inline" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          ) : null
        }
      />

      {/* Video Playback Modal */}
      {videoModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
          onClick={closeVideoModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 bg-purple-700">
              <h3 className="text-white font-semibold text-base truncate">{videoModalName} &mdash; Pledge Video</h3>
              <button onClick={closeVideoModal} className="text-white/80 hover:text-white text-2xl leading-none ml-4">&times;</button>
            </div>
            <div className="p-4 bg-black">
              <video
                src={videoModalUrl}
                controls
                autoPlay
                playsInline
                className="w-full rounded-lg max-h-[60vh]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsList;
