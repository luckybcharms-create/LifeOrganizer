import { useMemo, useState } from 'react';
import { Wallet, Trash2, Pencil } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { makeId } from '../utils/id';
import { todayISO, formatShortDate, currency } from '../utils/date';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import Fab from '../components/Fab';
import EmptyState from '../components/EmptyState';
import StatTile from '../components/StatTile';

const EXPENSE_CATEGORIES = ['Food', 'Housing', 'Transportation', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'];

const emptyForm = { date: todayISO(), type: 'expense', category: 'Food', amount: '', description: '' };

export default function Finance() {
  const [transactions, setTransactions] = useLocalStorage(KEYS.finance, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') income += amt;
      else expense += amt;
    }
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const breakdown = useMemo(() => {
    const byCat = {};
    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      byCat[t.category] = (byCat[t.category] || 0) + (Number(t.amount) || 0);
    }
    const total = Object.values(byCat).reduce((a, b) => a + b, 0);
    return Object.entries(byCat)
      .map(([category, amount]) => ({ category, amount, pct: total ? (amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [transactions]
  );

  function submit(e) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;
    if (editingId) {
      setTransactions(transactions.map((t) => (t.id === editingId ? { id: editingId, ...form } : t)));
    } else {
      setTransactions([{ id: makeId(), ...form }, ...transactions]);
    }
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function remove(id) {
    setTransactions(transactions.filter((t) => t.id !== id));
    setShowForm(false);
    setEditingId(null);
  }

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(t) {
    setForm(t);
    setEditingId(t.id);
    setShowForm(true);
  }

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <>
      <PageHeader icon={Wallet} title="Finance" />
      <main className="app-main">
        <div className="stat-row">
          <StatTile label="Balance" value={currency(stats.balance)} tone={stats.balance >= 0 ? 'positive' : 'negative'} />
          <StatTile label="Income" value={currency(stats.income)} tone="positive" />
          <StatTile label="Expenses" value={currency(stats.expense)} tone="negative" />
        </div>

        {breakdown.length > 0 && (
          <>
            <div className="section-title">Spending Breakdown</div>
            <div className="card">
              {breakdown.map((b) => (
                <div key={b.category} style={{ marginBottom: 12 }}>
                  <div className="flex-between" style={{ marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{b.category}</span>
                    <span className="muted">{currency(b.amount)} · {b.pct.toFixed(0)}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${b.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="section-title">Transactions</div>
        {sorted.length === 0 && (
          <EmptyState icon={Wallet} message="No transactions yet. Tap + to log income or an expense." />
        )}
        {sorted.length > 0 && (
          <div className="card">
            {sorted.map((t) => (
              <div className="list-item" key={t.id}>
                <div className="list-item-main">
                  <div className="list-item-title">{t.description || t.category}</div>
                  <div className="list-item-sub">{t.category} · {formatShortDate(t.date)}</div>
                </div>
                <div className="list-item-side">
                  <span className={`amount ${t.type === 'income' ? 'income' : 'expense'}`}>
                    {t.type === 'income' ? '+' : '-'}{currency(t.amount)}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-icon" style={{ padding: 6 }} onClick={() => openEdit(t)} aria-label="Edit">
                      <Pencil size={15} />
                    </button>
                    <button className="btn-danger-text" onClick={() => remove(t.id)} aria-label="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Fab onClick={openAdd} label="Log transaction" />

      {showForm && (
        <Sheet title={editingId ? 'Edit Transaction' : 'Log Transaction'} onClose={() => setShowForm(false)}>
          <form className="form" onSubmit={submit}>
            <div className="segmented">
              <button
                type="button"
                className={form.type === 'expense' ? 'active' : ''}
                onClick={() => setForm({ ...form, type: 'expense', category: EXPENSE_CATEGORIES[0] })}
              >
                Expense
              </button>
              <button
                type="button"
                className={form.type === 'income' ? 'active' : ''}
                onClick={() => setForm({ ...form, type: 'income', category: INCOME_CATEGORIES[0] })}
              >
                Income
              </button>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Description</label>
              <input
                type="text"
                placeholder="Optional note"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block">{editingId ? 'Save Changes' : 'Save Transaction'}</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
