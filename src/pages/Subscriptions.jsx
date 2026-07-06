import { useMemo, useState } from 'react';
import { Repeat, Trash2, Pencil } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { makeId } from '../utils/id';
import { todayISO, formatDate, daysUntil, currency } from '../utils/date';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import Fab from '../components/Fab';
import EmptyState from '../components/EmptyState';
import StatTile from '../components/StatTile';
import SwipeableRow from '../components/SwipeableRow';

const emptyForm = { name: '', cost: '', cycle: 'monthly', renewalDate: todayISO(), notes: '' };

export default function Subscriptions() {
  const [subs, setSubs] = useLocalStorage(KEYS.subscriptions, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const totals = useMemo(() => {
    let monthly = 0;
    for (const s of subs) {
      const cost = Number(s.cost) || 0;
      monthly += s.cycle === 'annual' ? cost / 12 : cost;
    }
    return { monthly, annual: monthly * 12 };
  }, [subs]);

  const sorted = useMemo(
    () => [...subs].sort((a, b) => (a.renewalDate < b.renewalDate ? -1 : 1)),
    [subs]
  );

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.cost) return;
    if (editingId) {
      setSubs(subs.map((s) => (s.id === editingId ? { id: editingId, ...form } : s)));
    } else {
      setSubs([{ id: makeId(), ...form }, ...subs]);
    }
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function remove(id) {
    setSubs(subs.filter((s) => s.id !== id));
    setShowForm(false);
    setEditingId(null);
  }

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(s) {
    setForm(s);
    setEditingId(s.id);
    setShowForm(true);
  }

  return (
    <>
      <PageHeader icon={Repeat} title="Subscriptions" />
      <main className="app-main">
        <div className="stat-row">
          <StatTile label="Monthly total" value={currency(totals.monthly)} />
          <StatTile label="Annual total" value={currency(totals.annual)} />
          <StatTile label="Active" value={subs.length} />
        </div>

        <div className="section-title">All Subscriptions</div>
        {sorted.length === 0 && (
          <EmptyState icon={Repeat} message="No subscriptions logged yet. Tap + to add one." />
        )}
        {sorted.length > 0 && (
          <div className="card">
            {sorted.map((s) => {
              const d = daysUntil(s.renewalDate);
              return (
                <SwipeableRow
                  key={s.id}
                  actions={[
                    { label: 'Edit', tone: 'edit', icon: <Pencil size={16} />, onClick: () => openEdit(s) },
                    { label: 'Delete', tone: 'delete', icon: <Trash2 size={16} />, onClick: () => remove(s.id) },
                  ]}
                >
                  <div className="list-item">
                    <div className="list-item-main">
                      <div className="list-item-title">
                        {s.name}
                        <span className="badge badge-neutral">{s.cycle === 'annual' ? 'Annual' : 'Monthly'}</span>
                      </div>
                      <div className="list-item-sub">
                        Renews {formatDate(s.renewalDate)} {d >= 0 ? `(in ${d}d)` : `(${Math.abs(d)}d overdue)`}
                      </div>
                      {s.notes && <div className="list-item-meta">{s.notes}</div>}
                    </div>
                    <div className="list-item-side">
                      <span className="amount">{currency(s.cost)}</span>
                    </div>
                  </div>
                </SwipeableRow>
              );
            })}
          </div>
        )}
      </main>

      <Fab onClick={openAdd} label="Add subscription" />

      {showForm && (
        <Sheet title={editingId ? 'Edit Subscription' : 'Add Subscription'} onClose={() => setShowForm(false)}>
          <form className="form" onSubmit={submit}>
            <div className="field">
              <label>Name</label>
              <input
                type="text"
                placeholder="e.g. Netflix, Gym Membership"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Cost</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Billing Cycle</label>
                <select value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })}>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Renewal Date</label>
              <input
                type="date"
                value={form.renewalDate}
                onChange={(e) => setForm({ ...form, renewalDate: e.target.value })}
                required
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
            <button type="submit" className="btn btn-primary btn-block">{editingId ? 'Save Changes' : 'Save Subscription'}</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
