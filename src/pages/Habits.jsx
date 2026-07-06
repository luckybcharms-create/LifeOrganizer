import { useMemo, useState } from 'react';
import { CheckSquare, Trash2, Flame } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { makeId } from '../utils/id';
import { todayISO } from '../utils/date';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import Fab from '../components/Fab';
import EmptyState from '../components/EmptyState';

function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function calcStreak(doneDates) {
  const set = new Set(doneDates);
  const today = todayISO();
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!set.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function Habits() {
  const [habits, setHabits] = useLocalStorage(KEYS.habits, []);
  const [log, setLog] = useLocalStorage(KEYS.habitLog, {});
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  const days = useMemo(() => last7Days(), []);
  const today = todayISO();
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setHabits([...habits, { id: makeId(), name }]);
    setName('');
    setShowForm(false);
  }

  function toggleToday(habitId) {
    const dates = log[habitId] || [];
    const has = dates.includes(today);
    setLog({ ...log, [habitId]: has ? dates.filter((d) => d !== today) : [...dates, today] });
  }

  function remove(habitId) {
    setHabits(habits.filter((h) => h.id !== habitId));
    const next = { ...log };
    delete next[habitId];
    setLog(next);
  }

  return (
    <>
      <PageHeader icon={CheckSquare} title="Habits" />
      <main className="app-main">
        {habits.length === 0 && (
          <EmptyState icon={CheckSquare} message="No habits yet. Tap + to start tracking one." />
        )}

        {habits.map((h) => {
          const dates = log[h.id] || [];
          const streak = calcStreak(dates);
          const doneToday = dates.includes(today);
          return (
            <div className="card" key={h.id}>
              <div className="flex-between" style={{ marginBottom: 12 }}>
                <div>
                  <div className="list-item-title">{h.name}</div>
                  <div className="list-item-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Flame size={13} color="var(--amber)" /> {streak} day streak
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    className="btn"
                    onClick={() => toggleToday(h.id)}
                    style={doneToday ? { background: 'var(--green-dim)', color: 'var(--green)', borderColor: 'var(--green)' } : undefined}
                  >
                    {doneToday ? 'Done Today' : 'Mark Today'}
                  </button>
                  <button className="btn-danger-text" onClick={() => remove(h.id)} aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="habit-grid">
                {days.map((d, i) => (
                  <div key={d} className={`habit-day ${dates.includes(d) ? 'done' : ''}`}>
                    {dayLabels[new Date(d + 'T00:00:00').getDay()]}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </main>

      <Fab onClick={() => setShowForm(true)} label="Add habit" />

      {showForm && (
        <Sheet title="Add Habit" onClose={() => setShowForm(false)}>
          <form className="form" onSubmit={submit}>
            <div className="field">
              <label>Habit</label>
              <input
                type="text"
                placeholder="e.g. Drink water, Meditate, Read"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">Save Habit</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
