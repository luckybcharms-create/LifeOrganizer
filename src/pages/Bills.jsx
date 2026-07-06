import { useMemo, useState } from 'react';
import { Receipt, Trash2, Check } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { makeId } from '../utils/id';
import { todayISO, formatDate, daysUntil, addInterval, currency } from '../utils/date';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import Fab from '../components/Fab';
import EmptyState from '../components/EmptyState';
import StatTile from '../components/StatTile';

const emptyForm = { name: '', amount: '', dueDate: todayISO(), recurring: true, paid: false };

function dueBadge(bill) {
  if (bill.paid) return <span className="badge badge-green">Paid</span>;
  const d = daysUntil(bill.dueDate);
  if (d < 0) return <span className="badge badge-red">Overdue {Math.abs(d)}d</span>;
  if (d === 0) return <span className="badge badge-amber">Due today</span>;
  if (d <= 7) return <span className="badge badge-amber">Due in {d}d</span>;
  return <span className="badge badge-neutral">Due in {d}d</span>;
}

export default function Bills() {
  const [bills, setBills] = useLocalStorage(KEYS.bills, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { overdue, upcoming, paid } = useMemo(() => {
    const overdue = [];
    const upcoming = [];
    const paid = [];
    for (const b of bills) {
      if (b.paid) paid.push(b);
      else if (daysUntil(b.dueDate) < 0) overdue.push(b);
      else upcoming.push(b);
    }
    overdue.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
    upcoming.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
    return { overdue, upcoming, paid };
  }, [bills]);

  const totalDue = useMemo(
    () => [...overdue, ...upcoming].reduce((sum, b) => sum + (Number(b.amount) || 0), 0),
    [overdue, upcoming]
  );

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.amount) return;
    setBills([{ id: makeId(), ...form, paid: false }, ...bills]);
    setForm(emptyForm);
    setShowForm(false);
  }

  function togglePaid(bill) {
    if (!bill.paid && bill.recurring) {
      setBills(bills.map((b) => (b.id === bill.id ? { ...b, dueDate: addInterval(b.dueDate, 'monthly'), paid: false } : b)));
    } else {
      setBills(bills.map((b) => (b.id === bill.id ? { ...b, paid: !b.paid } : b)));
    }
  }

  function remove(id) {
    setBills(bills.filter((b) => b.id !== id));
  }

  function renderBill(b) {
    return (
      <div className="list-item" key={b.id}>
        <div className="list-item-main">
          <div className="list-item-title">{b.name} {dueBadge(b)}</div>
          <div className="list-item-sub">Due {formatDate(b.dueDate)}{b.recurring ? ' · Monthly' : ''}</div>
        </div>
        <div className="list-item-side">
          <span className="amount">{currency(b.amount)}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn-icon" onClick={() => togglePaid(b)} aria-label="Mark paid" style={{ padding: 6 }}>
              <Check size={15} />
            </button>
            <button className="btn-danger-text" onClick={() => remove(b.id)} aria-label="Delete">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader icon={Receipt} title="Bills" />
      <main className="app-main">
        <div className="stat-row">
          <StatTile label="Overdue" value={overdue.length} tone={overdue.length ? 'negative' : ''} />
          <StatTile label="Upcoming" value={upcoming.length} />
          <StatTile label="Total Due" value={currency(totalDue)} />
        </div>

        {bills.length === 0 && (
          <EmptyState icon={Receipt} message="No bills tracked yet. Tap + to add a recurring bill." />
        )}

        {overdue.length > 0 && (
          <>
            <div className="section-title">Overdue</div>
            <div className="card">{overdue.map(renderBill)}</div>
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <div className="section-title">Coming Up</div>
            <div className="card">{upcoming.map(renderBill)}</div>
          </>
        )}

        {paid.length > 0 && (
          <>
            <div className="section-title">Paid</div>
            <div className="card">{paid.map(renderBill)}</div>
          </>
        )}
      </main>

      <Fab onClick={() => setShowForm(true)} label="Add bill" />

      {showForm && (
        <Sheet title="Add Bill" onClose={() => setShowForm(false)}>
          <form className="form" onSubmit={submit}>
            <div className="field">
              <label>Bill Name</label>
              <input
                type="text"
                placeholder="e.g. Rent, Electric, Internet"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.recurring}
                onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
              />
              Repeats monthly
            </label>
            <button type="submit" className="btn btn-primary btn-block">Save Bill</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
