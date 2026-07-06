import {
  LayoutGrid,
  Dumbbell,
  Wallet,
  Receipt,
  Repeat,
  HeartPulse,
  Target,
  CheckSquare,
  ShoppingBag,
  Car,
  TrendingUp,
  NotebookPen,
  Settings,
} from 'lucide-react';

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Home', icon: LayoutGrid },
  { key: 'fitness', label: 'Fitness', icon: Dumbbell },
  { key: 'finance', label: 'Finance', icon: Wallet },
  { key: 'bills', label: 'Bills', icon: Receipt },
  { key: 'subscriptions', label: 'Subs', icon: Repeat },
  { key: 'info', label: 'Info', icon: HeartPulse },
  { key: 'goals', label: 'Goals', icon: Target },
  { key: 'habits', label: 'Habits', icon: CheckSquare },
  { key: 'wishlist', label: 'Wishlist', icon: ShoppingBag },
  { key: 'vehicles', label: 'Vehicles', icon: Car },
  { key: 'career', label: 'Career', icon: TrendingUp },
  { key: 'notes', label: 'Notes', icon: NotebookPen },
  { key: 'settings', label: 'Settings', icon: Settings },
];

// Always reachable, regardless of section visibility settings.
export const PINNED_KEYS = ['dashboard', 'settings'];

export function visibleNavItems(visibility = {}) {
  return NAV_ITEMS.filter(({ key }) => PINNED_KEYS.includes(key) || visibility[key] !== false);
}

export default function BottomNav({ active, onChange, visibility }) {
  const items = visibleNavItems(visibility);
  return (
    <nav className="bottom-nav">
      {items.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          className={`nav-item ${active === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
        >
          <Icon strokeWidth={active === key ? 2.4 : 2} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
