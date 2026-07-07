import { useMemo, useState } from 'react';
import { TrendingUp, Trash2, Pencil, Check } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { makeId } from '../utils/id';
import { todayISO, formatDate, currency, parseLocalDate } from '../utils/date';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import Fab from '../components/Fab';
import EmptyState from '../components/EmptyState';
import StatTile from '../components/StatTile';
import SwipeableRow from '../components/SwipeableRow';

const emptySale = { date: todayISO(), amount: '', commission: '', notes: '' };
const emptyTraining = { date: todayISO(), title: '', notes: '' };
const emptyGoal = { title: '', targetDate: '', notes: '', completed: false };

export default function Career() {
  const [tab, setTab] = useState('sales');
  const [sales, setSales] = useLocalStorage(KEYS.careerSales, []);
  const [training, setTraining] = useLocalStorage(KEYS.careerTraining, []);
  const [goals, setGoals] = useLocalStorage(KEYS.careerGoals, []);
  const [showForm, setShowForm] = useState(false);
  const [saleForm, setSaleForm] = useState(emptySale);
  const [trainingForm, setTrainingForm] = useState(emptyTraining);
  const [goalForm, setGoalForm] = useState(emptyGoal);
  const [editingId, setEditingId] = useState(null);

  const salesSorted = useMemo(() => [...sales].sort((a, b) => (a.date < b.date ? 1 : -1)), [sales]);
  const trainingSorted = useMemo(() => [...training].sort((a, b) => (a.date < b.date ? 1 : -1)), [training]);

  const totals = useMemo(() => {
    const totalSales = sales.reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const totalCommission = sales.reduce((s, x) => s + (Number(x.commission) || 0), 0);
    const monthCutoff = new Date();
    monthCutoff.setDate(1);
    monthCutoff.setHours(0, 0, 0, 0);
    const monthSales = sales
      .filter((s) => parseLocalDate(s.date) >= monthCutoff)
      .reduce((s, x) => s + (Number(x.amount) || 0), 0);
    return { totalSales, totalCommission, monthSales };
  }, [sales]);

  function openAdd() {
    setSaleForm(emptySale);
    setTrainingForm(emptyTraining);
    setGoalForm(emptyGoal);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditSale(s) {
    setSaleForm(s);
    setEditingId(s.id);
    setShowForm(true);
  }

  function openEditTraining(t) {
    setTrainingForm(t);
    setEditingId(t.id);
    setShowForm(true);
  }

  function openEditGoal(g) {
    setGoalForm(g);
    setEditingId(g.id);
    setShowForm(true);
  }

  function saveSale(e) {
    e.preventDefault();
    if (!saleForm.amount) return;
    if (editingId) {
      setSales(sales.map((s) => (s.id === editingId ? { id: editingId, ...saleForm } : s)));
    } else {
      setSales([{ id: makeId(), ...saleForm }, ...sales]);
    }
    setSaleForm(emptySale);
    setEditingId(null);
    setShowForm(false);
  }

  function saveTraining(e) {
    e.preventDefault();
    if (!trainingForm.title.trim()) return;
    if (editingId) {
      setTraining(training.map((t) => (t.id === editingId ? { id: editingId, ...trainingForm } : t)));
    } else {
      setTraining([{ id: makeId(), ...trainingForm }, ...training]);
    }
    setTrainingForm(emptyTraining);
    setEditingId(null);
    setShowForm(false);
  }

  function saveGoal(e) {
    e.preventDefault();
    if (!goalForm.title.trim()) return;
    if (editingId) {
      setGoals(goals.map((g) => (g.id === editingId ? { ...g, ...goalForm } : g)));
    } else {
      setGoals([{ id: makeId(), ...goalForm }, ...goals]);
    }
    setGoalForm(emptyGoal);
    setEditingId(null);
    setShowForm(false);
  }

  function toggleGoal(id) {
    setGoals(goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)));
  }

  return (
    <>
      <PageHeader icon={TrendingUp} title="Career" />
      <main className="app-main">
        <div className="segmented">
          <button className={tab === 'sales' ? 'active' : ''} onClick={() => setTab('sales')}>Sales</button>
          <button className={tab === 'training' ? 'active' : ''} onClick={() => setTab('training')}>Training</button>
          <button className={tab === 'goals' ? 'active' : ''} onClick={() => setTab('goals')}>Goals</button>
        </div>

        {tab === 'sales' && (
          <>
            <div className="stat-row">
              <StatTile label="This Month" value={currency(totals.monthSales)} />
              <StatTile label="Total Sales" value={currency(totals.totalSales)} />
              <StatTile label="Total Commission" value={currency(totals.totalCommission)} tone="positive" />
            </div>
            {salesSorted.length === 0 && (
              <EmptyState icon={TrendingUp} message="No sales logged yet. Tap + to add one." />
            )}
            {salesSorted.length > 0 && (
              <div className="card">
                {salesSorted.map((s) => (
                  <SwipeableRow
                    key={s.id}
                    actions={[
                      { label: 'Edit', tone: 'edit', icon: <Pencil size={16} />, onClick: () => openEditSale(s) },
                      { label: 'Delete', tone: 'delete', icon: <Trash2 size={16} />, onClick: () => setSales(sales.filter((x) => x.id !== s.id)) },
                    ]}
                  >
                    <div className="list-item">
                      <div className="list-item-main">
                        <div className="list-item-title">{formatDate(s.date)}</div>
                        {s.notes && <div className="list-item-meta">{s.notes}</div>}
                      </div>
                      <div className="list-item-side">
                        <span className="amount income">{currency(s.amount)}</span>
                        {s.commission && <span className="muted">Comm: {currency(s.commission)}</span>}
                      </div>
                    </div>
                  </SwipeableRow>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'training' && (
          <>
            {trainingSorted.length === 0 && (
              <EmptyState icon={TrendingUp} message="No training notes yet. Tap + to log one." />
            )}
            {trainingSorted.length > 0 && (
              <div className="card">
                {trainingSorted.map((t) => (
                  <SwipeableRow
                    key={t.id}
                    actions={[
                      { label: 'Edit', tone: 'edit', icon: <Pencil size={16} />, onClick: () => openEditTraining(t) },
                      { label: 'Delete', tone: 'delete', icon: <Trash2 size={16} />, onClick: () => setTraining(training.filter((x) => x.id !== t.id)) },
                    ]}
                  >
                    <div className="list-item">
                      <div className="list-item-main">
                        <div className="list-item-title">{t.title}</div>
                        <div className="list-item-sub">{formatDate(t.date)}</div>
                        {t.notes && <div className="list-item-meta">{t.notes}</div>}
                      </div>
                    </div>
                  </SwipeableRow>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'goals' && (
          <>
            {goals.length === 0 && (
              <EmptyState icon={TrendingUp} message="No performance goals yet. Tap + to add one." />
            )}
            {goals.length > 0 && (
              <div className="card">
                {goals.map((g) => (
                  <SwipeableRow
                    key={g.id}
                    actions={[
                      { label: g.completed ? 'Undo' : 'Complete', tone: 'positive', icon: <Check size={16} />, onClick: () => toggleGoal(g.id) },
                      { label: 'Edit', tone: 'edit', icon: <Pencil size={16} />, onClick: () => openEditGoal(g) },
                      { label: 'Delete', tone: 'delete', icon: <Trash2 size={16} />, onClick: () => setGoals(goals.filter((x) => x.id !== g.id)) },
                    ]}
                  >
                    <div className="list-item">
                      <label className="checkbox-field" style={{ alignItems: 'flex-start', flex: 1 }}>
                        <input type="checkbox" checked={g.completed} onChange={() => toggleGoal(g.id)} />
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
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Fab onClick={openAdd} label="Add entry" />

      {showForm && tab === 'sales' && (
        <Sheet title={editingId ? 'Edit Sale' : 'Log Sale'} onClose={() => setShowForm(false)}>
          <form className="form" onSubmit={saveSale}>
            <div className="field">
              <label>Date</label>
              <input type="date" value={saleForm.date} onChange={(e) => setSaleForm({ ...saleForm, date: e.target.value })} required />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Sale Amount</label>
                <input type="number" min="0" step="0.01" inputMode="decimal" value={saleForm.amount} onChange={(e) => setSaleForm({ ...saleForm, amount: e.target.value })} required />
              </div>
              <div className="field">
                <label>Commission</label>
                <input type="number" min="0" step="0.01" inputMode="decimal" value={saleForm.commission} onChange={(e) => setSaleForm({ ...saleForm, commission: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea value={saleForm.notes} onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary btn-block">{editingId ? 'Save Changes' : 'Save Sale'}</button>
          </form>
        </Sheet>
      )}

      {showForm && tab === 'training' && (
        <Sheet title={editingId ? 'Edit Training Note' : 'Log Training Note'} onClose={() => setShowForm(false)}>
          <form className="form" onSubmit={saveTraining}>
            <div className="field">
              <label>Title</label>
              <input type="text" value={trainingForm.title} onChange={(e) => setTrainingForm({ ...trainingForm, title: e.target.value })} required />
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" value={trainingForm.date} onChange={(e) => setTrainingForm({ ...trainingForm, date: e.target.value })} required />
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea value={trainingForm.notes} onChange={(e) => setTrainingForm({ ...trainingForm, notes: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary btn-block">{editingId ? 'Save Changes' : 'Save Note'}</button>
          </form>
        </Sheet>
      )}

      {showForm && tab === 'goals' && (
        <Sheet title={editingId ? 'Edit Performance Goal' : 'Add Performance Goal'} onClose={() => setShowForm(false)}>
          <form className="form" onSubmit={saveGoal}>
            <div className="field">
              <label>Goal</label>
              <input type="text" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} required />
            </div>
            <div className="field">
              <label>Target Date (optional)</label>
              <input type="date" value={goalForm.targetDate} onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })} />
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea value={goalForm.notes} onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary btn-block">{editingId ? 'Save Changes' : 'Save Goal'}</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
