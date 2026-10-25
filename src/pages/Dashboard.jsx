import { useMemo } from 'react';
import { LayoutGrid, CheckSquare } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { todayISO, daysUntil, currency, parseLocalDate } from '../utils/date';
import PageHeader from '../components/PageHeader';
import StatTile from '../components/StatTile';
import EmptyState from '../components/EmptyState';

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
  const [habitLog, setHabitLog] = useLocalStorage(KEYS.habitLog, {});
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
  const habitsDueToday = useMemo(
    () => habits.filter((h) => !(habitLog[h.id] || []).includes(today)),
    [habits, habitLog, today]
  );

  function markHabitDone(habitId) {
    const dates = habitLog[habitId] || [];
    if (dates.includes(today)) return;
    setHabitLog({ ...habitLog, [habitId]: [...dates, today] });
  }

  const wishlistTotal = useMemo(
    () => wishlist.reduce((sum, i) => sum + (Number(i.price) || 0), 0),
    [wishlist]
  );

  const workoutsThisWeek = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return workouts.filter((w) => parseLocalDate(w.date) >= cutoff).length;
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

        {isVisible('habits') && (
          <>
            <div className="section-title">Habits Due Today</div>
            {habits.length === 0 ? (
              <EmptyState icon={CheckSquare} message="No habits yet. Add some in Habits." />
            ) : habitsDueToday.length === 0 ? (
              <EmptyState icon={CheckSquare} message="All habits done for today. Nice work!" />
            ) : (
              <div className="card">
                {habitsDueToday.map((h) => (
                  <div key={h.id} className="list-item">
                    <button
                      type="button"
                      className="list-item-main"
                      style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                      onClick={() => onNavigate('habits')}
                    >
                      <div className="list-item-title">{h.name}</div>
                    </button>
                    <button className="btn" onClick={() => markHabitDone(h.id)}>
                      Mark Today
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
