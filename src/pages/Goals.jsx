import { useMemo, useState } from 'react';
import { Target, Trash2, Pencil, Check } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { makeId } from '../utils/id';
import { formatDate } from '../utils/date';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import Fab from '../components/Fab';
import EmptyState from '../components/EmptyState';
import SwipeableRow from '../components/SwipeableRow';

const emptyForm = { title: '', term: 'short', targetDate: '', notes: '' };

export default function Goals() {
  const [goals, setGoals] = useLocalStorage(KEYS.goals, []);
  const [filter, setFilter] = useState('short');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const filtered = useMemo(() => {
    const list = goals.filter((g) => g.term === filter);
    return {
      active: list.filter((g) => !g.completed),
      completed: list.filter((g) => g.completed),
    };
  }, [goals, filter]);

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editingId) {
      setGoals(goals.map((g) => (g.id === editingId ? { ...g, ...form } : g)));
    } else {
      setGoals([{ id: makeId(), ...form, completed: false }, ...goals]);
    }
    setForm({ ...emptyForm, term: filter });
    setEditingId(null);
    setShowForm(false);
  }

  function toggle(id) {
    setGoals(goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)));
  }

  function remove(id) {
    setGoals(goals.filter((g) => g.id !== id));
    setShowForm(false);
    setEditingId(null);
  }

  function openAdd() {
    setForm({ ...emptyForm, term: filter });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(g) {
    setForm({ title: g.title, term: g.term, targetDate: g.targetDate || '', notes: g.notes || '' });
    setEditingId(g.id);
    setShowForm(true);
  }

  function renderGoal(g) {
    return (
      <SwipeableRow
        key={g.id}
        actions={[
          { label: g.completed ? 'Undo' : 'Complete', tone: 'positive', icon: <Check size={16} />, onClick: () => toggle(g.id) },
          { label: 'Edit', tone: 'edit', icon: <Pencil size={16} />, onClick: () => openEdit(g) },
          { label: 'Delete', tone: 'delete', icon: <Trash2 size={16} />, onClick: () => remove(g.id) },
        ]}
      >
        <div className="list-item">
          <label className="checkbox-field" style={{ alignItems: 'flex-start', flex: 1 }}>
            <input type="checkbox" checked={g.completed} onChange={() => toggle(g.id)} />
            <div className="list-item-main">
              <div
                className="list-item-title"
                style={g.completed ? { textDecoration: 'line-through', color: 'var(--text-faint)' } : undefined}
              >
                {g.title}
              </div>
              {g.targetDate && <div className="list-item-sub">Target: {formatDate(g.targetDate)}</div>}
              {g.notes && <div className="list-item-meta">{g.notes}</div>}
            </div>
          </label>
        </div>
      </SwipeableRow>
    );
  }

  return (
    <>
      <PageHeader icon={Target} title="Goals" />
      <main className="app-main">
        <div className="segmented">
          <button className={filter === 'short' ? 'active' : ''} onClick={() => setFilter('short')}>Short-Term</button>
          <button className={filter === 'long' ? 'active' : ''} onClick={() => setFilter('long')}>Long-Term</button>
        </div>

        {filtered.active.length === 0 && filtered.completed.length === 0 && (
          <EmptyState icon={Target} message="No goals here yet. Tap + to set one." />
        )}

        {filtered.active.length > 0 && (
          <>
            <div className="section-title">In Progress</div>
            <div className="card">{filtered.active.map(renderGoal)}</div>
          </>
        )}

        {filtered.completed.length > 0 && (
          <>
            <div className="section-title">Completed</div>
            <div className="card">{filtered.completed.map(renderGoal)}</div>
          </>
        )}
      </main>

      <Fab onClick={openAdd} label="Add goal" />

      {showForm && (
        <Sheet title={editingId ? 'Edit Goal' : 'Add Goal'} onClose={() => setShowForm(false)}>
          <form className="form" onSubmit={submit}>
            <div className="field">
              <label>Goal</label>
              <input
                type="text"
                placeholder="What do you want to achieve?"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Term</label>
              <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}>
                <option value="short">Short-Term</option>
                <option value="long">Long-Term</option>
              </select>
            </div>
            <div className="field">
              <label>Target Date (optional)</label>
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea
                placeholder="Optional details"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">{editingId ? 'Save Changes' : 'Save Goal'}</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
