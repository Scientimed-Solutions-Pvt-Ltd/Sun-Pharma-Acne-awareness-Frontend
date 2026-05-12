import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import HCPDetails from './pages/HCPDetails';
import HCPList from './pages/HCPList';
import Carousel from './pages/Carousel';
import InfoSlider from './pages/InfoSlider';
import TakePledge from './pages/TakePledge';
import ThankYou from './pages/ThankYou';
import InstallPrompt from './components/InstallPrompt';

// Admin imports
import AdminLayout from './admin/components/AdminLayout';
import AdminLogin from './admin/pages/AdminLogin';
import Dashboard from './admin/pages/Dashboard';
import FieldTeamList from './admin/pages/FieldTeamList';
import FieldTeamForm from './admin/pages/FieldTeamForm';
import FieldTeamView from './admin/pages/FieldTeamView';
import DoctorsList from './admin/pages/DoctorsList';
import DoctorsForm from './admin/pages/DoctorsForm';
import DoctorsView from './admin/pages/DoctorsView';
import ZonesList from './admin/pages/ZonesList';
import ZonesForm from './admin/pages/ZonesForm';
import RegionsList from './admin/pages/RegionsList';
import RegionsForm from './admin/pages/RegionsForm';
import HqsList from './admin/pages/HqsList';
import HqsForm from './admin/pages/HqsForm';
import Reports from './admin/pages/Reports';

// Leaderboard imports
import LeaderboardLogin from './leaderboard/pages/LeaderboardLogin';
import LeaderboardDashboard from './leaderboard/pages/LeaderboardDashboard';

function App() {
  return (
    <Router>
      <InstallPrompt />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/hcp-details" element={<HCPDetails />} />
        <Route path="/hcp-list" element={<HCPList />} />
        <Route path="/carousel" element={<Carousel />} />
        <Route path="/info-slider" element={<InfoSlider />} />
        <Route path="/take-pledge" element={<TakePledge />} />
        <Route path="/thank-you" element={<ThankYou />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Field Team */}
          <Route path="field-team" element={<FieldTeamList />} />
          <Route path="field-team/create" element={<FieldTeamForm />} />
          <Route path="field-team/:id" element={<FieldTeamView />} />
          <Route path="field-team/:id/edit" element={<FieldTeamForm />} />
          
          {/* Doctors */}
          <Route path="doctors" element={<DoctorsList />} />
          <Route path="doctors/create" element={<DoctorsForm />} />
          <Route path="doctors/:id" element={<DoctorsView />} />
          <Route path="doctors/:id/edit" element={<DoctorsForm />} />
          
          {/* Masters - Zones */}
          <Route path="masters/zones" element={<ZonesList />} />
          <Route path="masters/zones/create" element={<ZonesForm />} />
          <Route path="masters/zones/:id/edit" element={<ZonesForm />} />
          
          {/* Masters - Regions */}
          <Route path="masters/regions" element={<RegionsList />} />
          <Route path="masters/regions/create" element={<RegionsForm />} />
          <Route path="masters/regions/:id/edit" element={<RegionsForm />} />
          
          {/* Masters - HQs */}
          <Route path="masters/hqs" element={<HqsList />} />
          <Route path="masters/hqs/create" element={<HqsForm />} />
          <Route path="masters/hqs/:id/edit" element={<HqsForm />} />
          
          {/* Reports */}
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Leaderboard routes */}
        <Route path="/leaderboard/login" element={<LeaderboardLogin />} />
        <Route path="/leaderboard" element={<LeaderboardDashboard />} />
        <Route path="/leaderboard/dashboard" element={<LeaderboardDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
