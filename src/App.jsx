import { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
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
import Settings from './pages/Settings';
import { useLocalStorage } from './hooks/useLocalStorage';
import { KEYS } from './utils/storageKeys';
import { SESSION_KEY } from './utils/auth';

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
  settings: Settings,
};

const THEME_COLORS = { dark: '#0d0f14', light: '#f4f5f7' };

export default function App() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [tab, setTab] = useState('dashboard');
  const [visibility, setVisibility] = useLocalStorage(KEYS.sectionVisibility, {});
  const [theme, setTheme] = useLocalStorage(KEYS.theme, 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[theme] || THEME_COLORS.dark);
  }, [theme]);

  if (!unlocked) {
    return <Login onSuccess={() => setUnlocked(true)} />;
  }

  function handleLock() {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
  }

  const ActivePage = PAGES[tab] || Dashboard;

  return (
    <div className="app">
      <ActivePage
        onNavigate={setTab}
        onLock={handleLock}
        visibility={visibility}
        setVisibility={setVisibility}
        theme={theme}
        setTheme={setTheme}
      />
      <BottomNav active={tab} onChange={setTab} visibility={visibility} />
    </div>
  );
}
