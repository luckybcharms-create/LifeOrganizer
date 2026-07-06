import { useMemo, useState } from 'react';
import { NotebookPen, Trash2, Search, Pencil } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { makeId } from '../utils/id';
import { todayISO, formatDate } from '../utils/date';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import Fab from '../components/Fab';
import EmptyState from '../components/EmptyState';

const emptyForm = { title: '', body: '' };

export default function Notes() {
  const [notes, setNotes] = useLocalStorage(KEYS.notes, []);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...notes].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (!q) return list;
    return list.filter(
      (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
    );
  }, [notes, query]);

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim() && !form.body.trim()) return;
    if (editingId) {
      setNotes(notes.map((n) => (n.id === editingId ? { ...n, ...form } : n)));
    } else {
      setNotes([{ id: makeId(), createdAt: todayISO(), ...form }, ...notes]);
    }
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function remove(id) {
    setNotes(notes.filter((n) => n.id !== id));
    setShowForm(false);
    setEditingId(null);
  }

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(n) {
    setForm({ title: n.title, body: n.body });
    setEditingId(n.id);
    setShowForm(true);
  }

  return (
    <>
      <PageHeader icon={NotebookPen} title="Notes" />
      <main className="app-main">
        <div className="field" style={{ marginBottom: 14, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-faint)' }} />
          <input
            type="text"
            placeholder="Search notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>

        {filtered.length === 0 && (
          <EmptyState icon={NotebookPen} message={notes.length === 0 ? 'No notes yet. Tap + to jot something down.' : 'No notes match your search.'} />
        )}

        {filtered.map((n) => (
          <div className="card" key={n.id}>
            <div className="flex-between" style={{ alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                {n.title && <div className="list-item-title">{n.title}</div>}
                <div className="list-item-meta" style={{ marginTop: n.title ? 4 : 0 }}>{formatDate(n.createdAt)}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn-icon" style={{ padding: 6 }} onClick={() => openEdit(n)} aria-label="Edit">
                  <Pencil size={15} />
                </button>
                <button className="btn-danger-text" onClick={() => remove(n.id)} aria-label="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {n.body && <p style={{ marginTop: 10, fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{n.body}</p>}
          </div>
        ))}
      </main>

      <Fab onClick={openAdd} label="Add note" />

      {showForm && (
        <Sheet title={editingId ? 'Edit Note' : 'New Note'} onClose={() => setShowForm(false)}>
          <form className="form" onSubmit={submit}>
            <div className="field">
              <label>Title (optional)</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Note</label>
              <textarea
                style={{ minHeight: 120 }}
                placeholder="Write your thoughts, ideas, or reminders..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">{editingId ? 'Save Changes' : 'Save Note'}</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
