import { useMemo, useState } from 'react';
import { CheckSquare, Trash2, Flame, Pencil } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { makeId } from '../utils/id';
import { todayISO, toLocalISODate, formatDate } from '../utils/date';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import Fab from '../components/Fab';
import EmptyState from '../components/EmptyState';
import SwipeableRow from '../components/SwipeableRow';

// Sunday-to-Saturday of the current week (not a rolling 7-day window).
function currentWeekDays() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(toLocalISODate(d));
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
  while (set.has(toLocalISODate(cursor))) {
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
  const [editingId, setEditingId] = useState(null);

  const days = useMemo(() => currentWeekDays(), []);
  const today = todayISO();
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const { todoHabits, doneHabits } = useMemo(() => {
    const todo = [];
    const done = [];
    for (const h of habits) {
      const isDoneToday = (log[h.id] || []).includes(today);
      (isDoneToday ? done : todo).push(h);
    }
    return { todoHabits: todo, doneHabits: done };
  }, [habits, log, today]);

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    if (editingId) {
      setHabits(habits.map((h) => (h.id === editingId ? { ...h, name } : h)));
    } else {
      setHabits([...habits, { id: makeId(), name }]);
    }
    setName('');
    setEditingId(null);
    setShowForm(false);
  }

  function openAdd() {
    setName('');
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(h) {
    setName(h.name);
    setEditingId(h.id);
    setShowForm(true);
  }

  // Toggles completion for any date on or before today — lets you go back
  // and fix a day you forgot to mark, not just today.
  function toggleDate(habitId, dateStr) {
    if (dateStr > today) return;
    const dates = log[habitId] || [];
    const has = dates.includes(dateStr);
    setLog({ ...log, [habitId]: has ? dates.filter((d) => d !== dateStr) : [...dates, dateStr] });
  }

  function remove(habitId) {
    setHabits(habits.filter((h) => h.id !== habitId));
    const next = { ...log };
    delete next[habitId];
    setLog(next);
  }

  function renderHabit(h) {
    const dates = log[h.id] || [];
    const streak = calcStreak(dates);
    const doneToday = dates.includes(today);
    return (
      <SwipeableRow
        key={h.id}
        className="card-swipe-row"
        actions={[
          { label: 'Edit', tone: 'edit', icon: <Pencil size={16} />, onClick: () => openEdit(h) },
          { label: 'Delete', tone: 'delete', icon: <Trash2 size={16} />, onClick: () => remove(h.id) },
        ]}
      >
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <div>
              <div className="list-item-title">{h.name}</div>
              <div className="list-item-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Flame size={13} color="var(--amber)" /> {streak} day streak
              </div>
            </div>
            <button
              className="btn"
              onClick={() => toggleDate(h.id, today)}
              style={doneToday ? { background: 'var(--green-dim)', color: 'var(--green)', borderColor: 'var(--green)' } : undefined}
            >
              {doneToday ? 'Done Today' : 'Mark Today'}
            </button>
          </div>
          <div className="habit-grid">
            {days.map((d, i) => {
              const isFuture = d > today;
              const isDone = dates.includes(d);
              return (
                <button
                  type="button"
                  key={d}
                  className={`habit-day ${isDone ? 'done' : ''} ${isFuture ? 'disabled' : ''}`}
                  disabled={isFuture}
                  onClick={() => toggleDate(h.id, d)}
                  title={isFuture ? undefined : `${formatDate(d)} — tap to ${isDone ? 'unmark' : 'mark'} done`}
                  aria-label={`${formatDate(d)}${isDone ? ', done' : ''}`}
                >
                  {dayLabels[i]}
                </button>
              );
            })}
          </div>
        </div>
      </SwipeableRow>
    );
  }

  return (
    <>
      <PageHeader icon={CheckSquare} title="Habits" />
      <main className="app-main">
        {habits.length === 0 && (
          <EmptyState icon={CheckSquare} message="No habits yet. Tap + to start tracking one." />
        )}

        {todoHabits.length > 0 && (
          <>
            {doneHabits.length > 0 && <div className="section-title mt-0">To Do</div>}
            {todoHabits.map(renderHabit)}
          </>
        )}

        {doneHabits.length > 0 && (
          <>
            <div className="section-title">Completed Today</div>
            {doneHabits.map(renderHabit)}
          </>
        )}
      </main>

      <Fab onClick={openAdd} label="Add habit" />

      {showForm && (
        <Sheet title={editingId ? 'Edit Habit' : 'Add Habit'} onClose={() => setShowForm(false)}>
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
            <button type="submit" className="btn btn-primary btn-block">{editingId ? 'Save Changes' : 'Save Habit'}</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
