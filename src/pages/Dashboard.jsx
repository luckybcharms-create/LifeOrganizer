import { useMemo } from 'react';
import { LayoutGrid } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { todayISO, daysUntil, currency } from '../utils/date';
import PageHeader from '../components/PageHeader';
import StatTile from '../components/StatTile';
import EmptyState from '../components/EmptyState';
import { visibleNavItems } from '../components/BottomNav';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard({ onNavigate, visibility = {} }) {
  const isVisible = (key) => visibility[key] !== false;
  const [transactions] = useLocalStorage(KEYS.finance, []);
  const [bills] = useLocalStorage(KEYS.bills, []);
  const [subs] = useLocalStorage(KEYS.subscriptions, []);
  const [goals] = useLocalStorage(KEYS.goals, []);
  const [habits] = useLocalStorage(KEYS.habits, []);
  const [habitLog] = useLocalStorage(KEYS.habitLog, {});
  const [wishlist] = useLocalStorage(KEYS.wishlist, []);
  const [workouts] = useLocalStorage(KEYS.fitness, []);

  const balance = useMemo(() => {
    let income = 0, expense = 0;
    for (const t of transactions) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') income += amt; else expense += amt;
    }
    return income - expense;
  }, [transactions]);

  const overdueBills = useMemo(
    () => bills.filter((b) => !b.paid && daysUntil(b.dueDate) < 0).length,
    [bills]
  );

  const subsMonthly = useMemo(
    () => subs.reduce((sum, s) => sum + ((s.cycle === 'annual' ? Number(s.cost) / 12 : Number(s.cost)) || 0), 0),
    [subs]
  );

  const activeGoals = useMemo(() => goals.filter((g) => !g.completed).length, [goals]);

  const today = todayISO();
  const habitsDoneToday = useMemo(
    () => habits.filter((h) => (habitLog[h.id] || []).includes(today)).length,
    [habits, habitLog, today]
  );

  const wishlistTotal = useMemo(
    () => wishlist.reduce((sum, i) => sum + (Number(i.price) || 0), 0),
    [wishlist]
  );

  const workoutsThisWeek = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return workouts.filter((w) => new Date(w.date) >= cutoff).length;
  }, [workouts]);

  return (
    <>
      <PageHeader icon={LayoutGrid} title={greeting()} />
      <main className="app-main">
        <div className="stat-row">
          {isVisible('finance') && (
            <StatTile label="Balance" value={currency(balance)} tone={balance >= 0 ? 'positive' : 'negative'} />
          )}
          {isVisible('bills') && (
            <StatTile label="Overdue Bills" value={overdueBills} tone={overdueBills ? 'negative' : ''} />
          )}
          {isVisible('subscriptions') && (
            <StatTile label="Subs / Month" value={currency(subsMonthly)} />
          )}
          {isVisible('goals') && (
            <StatTile label="Active Goals" value={activeGoals} />
          )}
          {isVisible('habits') && (
            <StatTile label="Habits Today" value={`${habitsDoneToday}/${habits.length}`} tone={habits.length && habitsDoneToday === habits.length ? 'positive' : ''} />
          )}
          {isVisible('fitness') && (
            <StatTile label="Workouts (7d)" value={workoutsThisWeek} />
          )}
          {isVisible('wishlist') && (
            <StatTile label="Wishlist Total" value={currency(wishlistTotal)} />
          )}
        </div>

        <div className="section-title">Jump To</div>
        {visibleNavItems(visibility).filter((n) => n.key !== 'dashboard').length === 0 ? (
          <EmptyState message="All sections are hidden. Enable some in Settings." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {visibleNavItems(visibility).filter((n) => n.key !== 'dashboard').map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                className="card"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, border: '1px solid var(--border-soft)', background: 'var(--bg-card)', cursor: 'pointer' }}
                onClick={() => onNavigate(key)}
              >
                <Icon size={22} color="var(--accent)" />
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
