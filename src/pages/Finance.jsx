import { useMemo, useState } from 'react';
import { Wallet, Trash2, Pencil, CreditCard, Plus } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { makeId } from '../utils/id';
import { todayISO, formatShortDate, currency, parseLocalDate } from '../utils/date';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import Fab from '../components/Fab';
import EmptyState from '../components/EmptyState';
import StatTile from '../components/StatTile';
import SwipeableRow from '../components/SwipeableRow';

const EXPENSE_CATEGORIES = ['Food', 'Housing', 'Transportation', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'];
const CARD_NETWORKS = ['Visa', 'Mastercard', 'Amex', 'Discover', 'Other'];
const CARD_TYPES = ['Credit', 'Debit'];

const emptyForm = { date: todayISO(), type: 'expense', category: 'Food', amount: '', description: '' };
const emptyCardForm = { nickname: '', network: 'Visa', type: 'Credit', last4: '', expiry: '', notes: '' };

function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date - start) / 86400000) + 1;
}

export default function Finance() {
  const [transactions, setTransactions] = useLocalStorage(KEYS.finance, []);
  const [cards, setCards] = useLocalStorage(KEYS.paymentCards, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardForm, setCardForm] = useState(emptyCardForm);
  const [editingCardId, setEditingCardId] = useState(null);

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

  const incomeProjection = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const yearIncome = transactions
      .filter((t) => t.type === 'income' && parseLocalDate(t.date).getFullYear() === year)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const elapsed = dayOfYear(now);
    const totalDays = isLeapYear(year) ? 366 : 365;
    const projected = elapsed > 0 ? (yearIncome / elapsed) * totalDays : 0;
    return { yearIncome, projected };
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

  function openAddCard() {
    setCardForm(emptyCardForm);
    setEditingCardId(null);
    setCardModalOpen(true);
  }

  function openEditCard(c) {
    setCardForm(c);
    setEditingCardId(c.id);
    setCardModalOpen(true);
  }

  function saveCard(e) {
    e.preventDefault();
    if (!cardForm.nickname.trim() || !cardForm.last4.trim()) return;
    if (editingCardId) {
      setCards(cards.map((c) => (c.id === editingCardId ? { id: editingCardId, ...cardForm } : c)));
    } else {
      setCards([{ id: makeId(), ...cardForm }, ...cards]);
    }
    setCardForm(emptyCardForm);
    setEditingCardId(null);
    setCardModalOpen(false);
  }

  function removeCard(id) {
    setCards(cards.filter((c) => c.id !== id));
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
        <div className="stat-row">
          <StatTile label="Annual Income" value={currency(incomeProjection.yearIncome)} tone="positive" />
          <StatTile label="Projected Annual" value={currency(incomeProjection.projected)} />
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

        <div className="flex-between">
          <div className="section-title mt-0">Payment Cards</div>
          <button className="btn-icon" onClick={openAddCard} aria-label="Add payment card">
            <Plus size={18} />
          </button>
        </div>
        {cards.length === 0 && (
          <EmptyState icon={CreditCard} message="No payment cards added yet." />
        )}
        {cards.length > 0 && (
          <div className="card">
            {cards.map((c) => (
              <SwipeableRow
                key={c.id}
                actions={[
                  { label: 'Edit', tone: 'edit', icon: <Pencil size={16} />, onClick: () => openEditCard(c) },
                  { label: 'Delete', tone: 'delete', icon: <Trash2 size={16} />, onClick: () => removeCard(c.id) },
                ]}
              >
                <div className="list-item">
                  <div className="list-item-main">
                    <div className="list-item-title">
                      {c.nickname}
                      <span className="badge badge-neutral">{c.network}</span>
                      <span className="badge badge-neutral">{c.type}</span>
                    </div>
                    <div className="list-item-sub">•••• {c.last4}{c.expiry ? ` · Exp ${c.expiry}` : ''}</div>
                    {c.notes && <div className="list-item-meta">{c.notes}</div>}
                  </div>
                </div>
              </SwipeableRow>
            ))}
          </div>
        )}

        <div className="section-title">Transactions</div>
        {sorted.length === 0 && (
          <EmptyState icon={Wallet} message="No transactions yet. Tap + to log income or an expense." />
        )}
        {sorted.length > 0 && (
          <div className="card">
            {sorted.map((t) => (
              <SwipeableRow
                key={t.id}
                actions={[
                  { label: 'Edit', tone: 'edit', icon: <Pencil size={16} />, onClick: () => openEdit(t) },
                  { label: 'Delete', tone: 'delete', icon: <Trash2 size={16} />, onClick: () => remove(t.id) },
                ]}
              >
                <div className="list-item">
                  <div className="list-item-main">
                    <div className="list-item-title">{t.description || t.category}</div>
                    <div className="list-item-sub">{t.category} · {formatShortDate(t.date)}</div>
                  </div>
                  <div className="list-item-side">
                    <span className={`amount ${t.type === 'income' ? 'income' : 'expense'}`}>
                      {t.type === 'income' ? '+' : '-'}{currency(t.amount)}
                    </span>
                  </div>
                </div>
              </SwipeableRow>
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

      {cardModalOpen && (
        <Sheet title={editingCardId ? 'Edit Payment Card' : 'Add Payment Card'} onClose={() => setCardModalOpen(false)}>
          <form className="form" onSubmit={saveCard}>
            <div className="field">
              <label>Nickname</label>
              <input
                type="text"
                placeholder="e.g. Chase Sapphire"
                value={cardForm.nickname}
                onChange={(e) => setCardForm({ ...cardForm, nickname: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Network</label>
                <select value={cardForm.network} onChange={(e) => setCardForm({ ...cardForm, network: e.target.value })}>
                  {CARD_NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Type</label>
                <select value={cardForm.type} onChange={(e) => setCardForm({ ...cardForm, type: e.target.value })}>
                  {CARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Last 4 Digits</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1234"
                  value={cardForm.last4}
                  onChange={(e) => setCardForm({ ...cardForm, last4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  required
                />
              </div>
              <div className="field">
                <label>Expiry (optional)</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={cardForm.expiry}
                  onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea
                placeholder="Optional"
                value={cardForm.notes}
                onChange={(e) => setCardForm({ ...cardForm, notes: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">{editingCardId ? 'Save Changes' : 'Save Card'}</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
