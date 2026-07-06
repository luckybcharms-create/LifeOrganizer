import { useMemo, useState } from 'react';
import { ShoppingBag, Trash2, ExternalLink, Pencil } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { makeId } from '../utils/id';
import { currency } from '../utils/date';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import Fab from '../components/Fab';
import EmptyState from '../components/EmptyState';
import StatTile from '../components/StatTile';
import SwipeableRow from '../components/SwipeableRow';

const emptyForm = { name: '', price: '', link: '', priority: 'medium', notes: '' };
const priorityRank = { high: 0, medium: 1, low: 2 };
const priorityBadge = { high: 'badge-red', medium: 'badge-amber', low: 'badge-neutral' };

export default function Wishlist() {
  const [items, setItems] = useLocalStorage(KEYS.wishlist, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const sorted = useMemo(
    () => [...items].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]),
    [items]
  );

  const total = useMemo(() => items.reduce((sum, i) => sum + (Number(i.price) || 0), 0), [items]);

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      setItems(items.map((i) => (i.id === editingId ? { id: editingId, ...form } : i)));
    } else {
      setItems([{ id: makeId(), ...form }, ...items]);
    }
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function remove(id) {
    setItems(items.filter((i) => i.id !== id));
    setShowForm(false);
    setEditingId(null);
  }

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(i) {
    setForm(i);
    setEditingId(i.id);
    setShowForm(true);
  }

  return (
    <>
      <PageHeader icon={ShoppingBag} title="Wishlist" />
      <main className="app-main">
        <div className="stat-row">
          <StatTile label="Items" value={items.length} />
          <StatTile label="Total Cost" value={currency(total)} />
        </div>

        {sorted.length === 0 && (
          <EmptyState icon={ShoppingBag} message="Your wishlist is empty. Tap + to add something you want." />
        )}
        {sorted.length > 0 && (
          <div className="card">
            {sorted.map((i) => (
              <SwipeableRow
                key={i.id}
                actions={[
                  { label: 'Edit', tone: 'edit', icon: <Pencil size={16} />, onClick: () => openEdit(i) },
                  { label: 'Delete', tone: 'delete', icon: <Trash2 size={16} />, onClick: () => remove(i.id) },
                ]}
              >
                <div className="list-item">
                  <div className="list-item-main">
                    <div className="list-item-title">
                      {i.name}
                      <span className={`badge ${priorityBadge[i.priority]}`}>{i.priority}</span>
                    </div>
                    {i.notes && <div className="list-item-meta">{i.notes}</div>}
                    {i.link && (
                      <a className="link-row" href={i.link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        View link <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <div className="list-item-side">
                    <span className="amount">{currency(i.price)}</span>
                  </div>
                </div>
              </SwipeableRow>
            ))}
          </div>
        )}
      </main>

      <Fab onClick={openAdd} label="Add item" />

      {showForm && (
        <Sheet title={editingId ? 'Edit Wishlist Item' : 'Add Wishlist Item'} onClose={() => setShowForm(false)}>
          <form className="form" onSubmit={submit}>
            <div className="field">
              <label>Item Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Link</label>
              <input
                type="url"
                placeholder="https://..."
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea
                placeholder="Optional"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">{editingId ? 'Save Changes' : 'Save Item'}</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
