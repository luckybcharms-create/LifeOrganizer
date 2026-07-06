import { useMemo, useState } from 'react';
import { TrendingUp, Trash2 } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { makeId } from '../utils/id';
import { todayISO, formatDate, currency } from '../utils/date';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import Fab from '../components/Fab';
import EmptyState from '../components/EmptyState';
import StatTile from '../components/StatTile';

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

  const salesSorted = useMemo(() => [...sales].sort((a, b) => (a.date < b.date ? 1 : -1)), [sales]);
  const trainingSorted = useMemo(() => [...training].sort((a, b) => (a.date < b.date ? 1 : -1)), [training]);

  const totals = useMemo(() => {
    const totalSales = sales.reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const totalCommission = sales.reduce((s, x) => s + (Number(x.commission) || 0), 0);
    const monthCutoff = new Date();
    monthCutoff.setDate(1);
    monthCutoff.setHours(0, 0, 0, 0);
    const monthSales = sales
      .filter((s) => new Date(s.date) >= monthCutoff)
      .reduce((s, x) => s + (Number(x.amount) || 0), 0);
    return { totalSales, totalCommission, monthSales };
  }, [sales]);

  function addSale(e) {
    e.preventDefault();
    if (!saleForm.amount) return;
    setSales([{ id: makeId(), ...saleForm }, ...sales]);
    setSaleForm(emptySale);
    setShowForm(false);
  }

  function addTraining(e) {
    e.preventDefault();
    if (!trainingForm.title.trim()) return;
    setTraining([{ id: makeId(), ...trainingForm }, ...training]);
    setTrainingForm(emptyTraining);
    setShowForm(false);
  }

  function addGoal(e) {
    e.preventDefault();
    if (!goalForm.title.trim()) return;
    setGoals([{ id: makeId(), ...goalForm }, ...goals]);
    setGoalForm(emptyGoal);
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
                  <div className="list-item" key={s.id}>
                    <div className="list-item-main">
                      <div className="list-item-title">{formatDate(s.date)}</div>
                      {s.notes && <div className="list-item-meta">{s.notes}</div>}
                    </div>
                    <div className="list-item-side">
                      <span className="amount income">{currency(s.amount)}</span>
                      {s.commission && <span className="muted">Comm: {currency(s.commission)}</span>}
                      <button className="btn-danger-text" onClick={() => setSales(sales.filter((x) => x.id !== s.id))}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
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
                  <div className="list-item" key={t.id}>
                    <div className="list-item-main">
                      <div className="list-item-title">{t.title}</div>
                      <div className="list-item-sub">{formatDate(t.date)}</div>
                      {t.notes && <div className="list-item-meta">{t.notes}</div>}
                    </div>
                    <button className="btn-danger-text" onClick={() => setTraining(training.filter((x) => x.id !== t.id))}>
                      <Trash2 size={16} />
                    </button>
                  </div>
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
                  <div className="list-item" key={g.id}>
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
                    <button className="btn-danger-text" onClick={() => setGoals(goals.filter((x) => x.id !== g.id))}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Fab onClick={() => setShowForm(true)} label="Add entry" />

      {showForm && tab === 'sales' && (
        <Sheet title="Log Sale" onClose={() => setShowForm(false)}>
          <form className="form" onSubmit={addSale}>
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
            <button type="submit" className="btn btn-primary btn-block">Save Sale</button>
          </form>
        </Sheet>
      )}

      {showForm && tab === 'training' && (
        <Sheet title="Log Training Note" onClose={() => setShowForm(false)}>
          <form className="form" onSubmit={addTraining}>
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
            <button type="submit" className="btn btn-primary btn-block">Save Note</button>
          </form>
        </Sheet>
      )}

      {showForm && tab === 'goals' && (
        <Sheet title="Add Performance Goal" onClose={() => setShowForm(false)}>
          <form className="form" onSubmit={addGoal}>
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
            <button type="submit" className="btn btn-primary btn-block">Save Goal</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
