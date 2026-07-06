import { useMemo, useState } from 'react';
import { Car, Trash2, Plus } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { makeId } from '../utils/id';
import { todayISO, formatDate, daysUntil } from '../utils/date';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import Fab from '../components/Fab';
import EmptyState from '../components/EmptyState';

const SERVICE_TYPES = ['Oil Change', 'Tire Rotation', 'Brake Service', 'Battery', 'Inspection', 'Other'];
const emptyVehicleForm = { name: '', notes: '' };
const emptyServiceForm = { type: 'Oil Change', date: todayISO(), mileage: '', nextDueDate: '', notes: '' };

export default function Vehicles() {
  const [vehicles, setVehicles] = useLocalStorage(KEYS.vehicles, []);
  const [services, setServices] = useLocalStorage(KEYS.vehicleServices, []);
  const [activeId, setActiveId] = useState(null);
  const [modal, setModal] = useState(null); // 'vehicle' | 'service'
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);

  const activeVehicleId = activeId || vehicles[0]?.id || null;

  const vehicleServices = useMemo(
    () => services.filter((s) => s.vehicleId === activeVehicleId).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [services, activeVehicleId]
  );

  const upcoming = useMemo(
    () => vehicleServices.filter((s) => s.nextDueDate).sort((a, b) => (a.nextDueDate < b.nextDueDate ? -1 : 1)),
    [vehicleServices]
  );

  function addVehicle(e) {
    e.preventDefault();
    if (!vehicleForm.name.trim()) return;
    const v = { id: makeId(), ...vehicleForm };
    setVehicles([...vehicles, v]);
    setActiveId(v.id);
    setVehicleForm(emptyVehicleForm);
    setModal(null);
  }

  function removeVehicle(id) {
    setVehicles(vehicles.filter((v) => v.id !== id));
    setServices(services.filter((s) => s.vehicleId !== id));
    if (activeId === id) setActiveId(null);
  }

  function addService(e) {
    e.preventDefault();
    if (!activeVehicleId) return;
    setServices([{ id: makeId(), vehicleId: activeVehicleId, ...serviceForm }, ...services]);
    setServiceForm(emptyServiceForm);
    setModal(null);
  }

  function removeService(id) {
    setServices(services.filter((s) => s.id !== id));
  }

  return (
    <>
      <PageHeader icon={Car} title="Vehicles" />
      <main className="app-main">
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <button className="btn" onClick={() => setModal('vehicle')}>
            <Plus size={15} /> Add Vehicle
          </button>
          {activeVehicleId && (
            <button className="btn-danger-text" onClick={() => removeVehicle(activeVehicleId)}>
              Remove this vehicle
            </button>
          )}
        </div>

        {vehicles.length === 0 && (
          <EmptyState icon={Car} message="No vehicles added yet. Tap “Add Vehicle” above to add your first one." />
        )}

        {vehicles.length > 0 && (
          <>
            <div className="segmented" style={{ overflowX: 'auto' }}>
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  className={activeVehicleId === v.id ? 'active' : ''}
                  onClick={() => setActiveId(v.id)}
                >
                  {v.name}
                </button>
              ))}
            </div>

            {upcoming.length > 0 && (
              <>
                <div className="section-title">Upcoming Maintenance</div>
                <div className="card">
                  {upcoming.map((s) => {
                    const d = daysUntil(s.nextDueDate);
                    return (
                      <div className="list-item" key={s.id}>
                        <div className="list-item-main">
                          <div className="list-item-title">
                            {s.type}
                            {d < 0 ? (
                              <span className="badge badge-red">Overdue</span>
                            ) : d <= 14 ? (
                              <span className="badge badge-amber">Due soon</span>
                            ) : null}
                          </div>
                          <div className="list-item-sub">Due {formatDate(s.nextDueDate)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="section-title">Service History</div>
            {vehicleServices.length === 0 && (
              <EmptyState icon={Car} message="No service logged for this vehicle yet." />
            )}
            {vehicleServices.length > 0 && (
              <div className="card">
                {vehicleServices.map((s) => (
                  <div className="list-item" key={s.id}>
                    <div className="list-item-main">
                      <div className="list-item-title">{s.type}</div>
                      <div className="list-item-sub">
                        {formatDate(s.date)}{s.mileage ? ` · ${Number(s.mileage).toLocaleString()} mi` : ''}
                      </div>
                      {s.notes && <div className="list-item-meta">{s.notes}</div>}
                    </div>
                    <button className="btn-danger-text" onClick={() => removeService(s.id)} aria-label="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {vehicles.length > 0 && (
        <Fab onClick={() => setModal('service')} label="Log service" />
      )}

      {modal === 'vehicle' && (
        <Sheet title="Add Vehicle" onClose={() => setModal(null)}>
          <form className="form" onSubmit={addVehicle}>
            <div className="field">
              <label>Vehicle Name</label>
              <input
                type="text"
                placeholder="e.g. 2020 Honda Civic"
                value={vehicleForm.name}
                onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Notes</label>
              <input
                type="text"
                placeholder="Plate, VIN, etc. (optional)"
                value={vehicleForm.notes}
                onChange={(e) => setVehicleForm({ ...vehicleForm, notes: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">Save Vehicle</button>
          </form>
        </Sheet>
      )}

      {modal === 'service' && (
        <Sheet title="Log Service" onClose={() => setModal(null)}>
          <form className="form" onSubmit={addService}>
            <div className="field">
              <label>Type</label>
              <select value={serviceForm.type} onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value })}>
                {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Date</label>
                <input
                  type="date"
                  value={serviceForm.date}
                  onChange={(e) => setServiceForm({ ...serviceForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Mileage</label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={serviceForm.mileage}
                  onChange={(e) => setServiceForm({ ...serviceForm, mileage: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label>Next Due Date (optional)</label>
              <input
                type="date"
                value={serviceForm.nextDueDate}
                onChange={(e) => setServiceForm({ ...serviceForm, nextDueDate: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea
                placeholder="Optional"
                value={serviceForm.notes}
                onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">Save Service</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
