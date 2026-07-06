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
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
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
