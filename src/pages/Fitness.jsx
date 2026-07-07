import { useMemo, useState } from 'react';
import { Dumbbell, Trash2, Pencil } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { makeId } from '../utils/id';
import { todayISO, formatDate, parseLocalDate } from '../utils/date';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import Fab from '../components/Fab';
import EmptyState from '../components/EmptyState';
import StatTile from '../components/StatTile';
import SwipeableRow from '../components/SwipeableRow';

const emptyForm = { date: todayISO(), exercise: '', sets: '', reps: '', notes: '' };

export default function Fitness() {
  const [workouts, setWorkouts] = useLocalStorage(KEYS.fitness, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const grouped = useMemo(() => {
    const byDate = {};
    for (const w of workouts) {
      if (!byDate[w.date]) byDate[w.date] = [];
      byDate[w.date].push(w);
    }
    return Object.entries(byDate).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [workouts]);

  const stats = useMemo(() => {
    const thisWeekCutoff = new Date();
    thisWeekCutoff.setDate(thisWeekCutoff.getDate() - 7);
    const thisWeek = workouts.filter((w) => parseLocalDate(w.date) >= thisWeekCutoff).length;
    const totalSets = workouts.reduce((sum, w) => sum + (Number(w.sets) || 0), 0);
    const uniqueDays = new Set(workouts.map((w) => w.date)).size;
    return { thisWeek, totalSets, uniqueDays };
  }, [workouts]);

  function submit(e) {
    e.preventDefault();
    if (!form.exercise.trim()) return;
    if (editingId) {
      setWorkouts(workouts.map((w) => (w.id === editingId ? { id: editingId, ...form } : w)));
    } else {
      setWorkouts([{ id: makeId(), ...form }, ...workouts]);
    }
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function remove(id) {
    setWorkouts(workouts.filter((w) => w.id !== id));
    setShowForm(false);
    setEditingId(null);
  }

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(w) {
    setForm(w);
    setEditingId(w.id);
    setShowForm(true);
  }

  return (
    <>
      <PageHeader icon={Dumbbell} title="Fitness" />
      <main className="app-main">
        <div className="stat-row">
          <StatTile label="Logged this week" value={stats.thisWeek} />
          <StatTile label="Active days" value={stats.uniqueDays} />
          <StatTile label="Total sets" value={stats.totalSets} />
        </div>

        <div className="section-title">Workout History</div>
        {grouped.length === 0 && (
          <EmptyState icon={Dumbbell} message="No workouts logged yet. Tap + to add your first one." />
        )}
        {grouped.map(([date, entries]) => (
          <div className="card" key={date}>
            <div className="card-title">{formatDate(date)}</div>
            {entries.map((w) => (
              <SwipeableRow
                key={w.id}
                actions={[
                  { label: 'Edit', tone: 'edit', icon: <Pencil size={16} />, onClick: () => openEdit(w) },
                  { label: 'Delete', tone: 'delete', icon: <Trash2 size={16} />, onClick: () => remove(w.id) },
                ]}
              >
                <div className="list-item">
                  <div className="list-item-main">
                    <div className="list-item-title">{w.exercise}</div>
                    <div className="list-item-sub">
                      {w.sets || 0} sets x {w.reps || 0} reps
                    </div>
                    {w.notes && <div className="list-item-meta">{w.notes}</div>}
                  </div>
                </div>
              </SwipeableRow>
            ))}
          </div>
        ))}
      </main>

      <Fab onClick={openAdd} label="Log workout" />

      {showForm && (
        <Sheet title={editingId ? 'Edit Workout' : 'Log Workout'} onClose={() => setShowForm(false)}>
          <form className="form" onSubmit={submit}>
            <div className="field">
              <label>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Exercise</label>
              <input
                type="text"
                placeholder="e.g. Bench Press"
                value={form.exercise}
                onChange={(e) => setForm({ ...form, exercise: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Sets</label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={form.sets}
                  onChange={(e) => setForm({ ...form, sets: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Reps</label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={form.reps}
                  onChange={(e) => setForm({ ...form, reps: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea
                placeholder="Weight used, how it felt, etc."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">{editingId ? 'Save Changes' : 'Save Workout'}</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
