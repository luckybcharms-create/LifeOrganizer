import { useState } from 'react';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Fitness from './pages/Fitness';
import Finance from './pages/Finance';
import Bills from './pages/Bills';
import Subscriptions from './pages/Subscriptions';
import ImportantInfo from './pages/ImportantInfo';
import Goals from './pages/Goals';
import Habits from './pages/Habits';
import Wishlist from './pages/Wishlist';
import Vehicles from './pages/Vehicles';
import Career from './pages/Career';
import Notes from './pages/Notes';

const PAGES = {
  dashboard: Dashboard,
  fitness: Fitness,
  finance: Finance,
  bills: Bills,
  subscriptions: Subscriptions,
  info: ImportantInfo,
  goals: Goals,
  habits: Habits,
  wishlist: Wishlist,
  vehicles: Vehicles,
  career: Career,
  notes: Notes,
};

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const ActivePage = PAGES[tab] || Dashboard;

  return (
    <div className="app">
      <ActivePage onNavigate={setTab} />
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
