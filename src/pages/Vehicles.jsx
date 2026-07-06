import { useMemo, useState } from 'react';
import { Car, Trash2, Plus, Pencil } from 'lucide-react';
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
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [editingServiceId, setEditingServiceId] = useState(null);

  const activeVehicleId = activeId || vehicles[0]?.id || null;
  const activeVehicle = vehicles.find((v) => v.id === activeVehicleId) || null;

  const vehicleServices = useMemo(
    () => services.filter((s) => s.vehicleId === activeVehicleId).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [services, activeVehicleId]
  );

  const upcoming = useMemo(
    () => vehicleServices.filter((s) => s.nextDueDate).sort((a, b) => (a.nextDueDate < b.nextDueDate ? -1 : 1)),
    [vehicleServices]
  );

  function openAddVehicle() {
    setVehicleForm(emptyVehicleForm);
    setEditingVehicleId(null);
    setModal('vehicle');
  }

  function openEditVehicle(v) {
    setVehicleForm({ name: v.name, notes: v.notes || '' });
    setEditingVehicleId(v.id);
    setModal('vehicle');
  }

  function saveVehicle(e) {
    e.preventDefault();
    if (!vehicleForm.name.trim()) return;
    if (editingVehicleId) {
      setVehicles(vehicles.map((v) => (v.id === editingVehicleId ? { id: editingVehicleId, ...vehicleForm } : v)));
    } else {
      const v = { id: makeId(), ...vehicleForm };
      setVehicles([...vehicles, v]);
      setActiveId(v.id);
    }
    setVehicleForm(emptyVehicleForm);
    setEditingVehicleId(null);
    setModal(null);
  }

  function removeVehicle(id) {
    setVehicles(vehicles.filter((v) => v.id !== id));
    setServices(services.filter((s) => s.vehicleId !== id));
    if (activeId === id) setActiveId(null);
    setModal(null);
  }

  function openAddService() {
    setServiceForm(emptyServiceForm);
    setEditingServiceId(null);
    setModal('service');
  }

  function openEditService(s) {
    setServiceForm({ type: s.type, date: s.date, mileage: s.mileage || '', nextDueDate: s.nextDueDate || '', notes: s.notes || '' });
    setEditingServiceId(s.id);
    setModal('service');
  }

  function saveService(e) {
    e.preventDefault();
    if (!activeVehicleId) return;
    if (editingServiceId) {
      setServices(services.map((s) => (s.id === editingServiceId ? { id: editingServiceId, vehicleId: activeVehicleId, ...serviceForm } : s)));
    } else {
      setServices([{ id: makeId(), vehicleId: activeVehicleId, ...serviceForm }, ...services]);
    }
    setServiceForm(emptyServiceForm);
    setEditingServiceId(null);
    setModal(null);
  }

  function removeService(id) {
    setServices(services.filter((s) => s.id !== id));
    setModal(null);
  }

  return (
    <>
      <PageHeader icon={Car} title="Vehicles" />
      <main className="app-main">
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <button className="btn" onClick={openAddVehicle}>
            <Plus size={15} /> Add Vehicle
          </button>
          {activeVehicle && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn-icon" onClick={() => openEditVehicle(activeVehicle)} aria-label="Edit vehicle">
                <Pencil size={15} />
              </button>
              <button className="btn-danger-text" onClick={() => removeVehicle(activeVehicleId)}>
                Remove
              </button>
            </div>
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
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" style={{ padding: 6 }} onClick={() => openEditService(s)} aria-label="Edit">
                        <Pencil size={15} />
                      </button>
                      <button className="btn-danger-text" onClick={() => removeService(s.id)} aria-label="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {vehicles.length > 0 && (
        <Fab onClick={openAddService} label="Log service" />
      )}

      {modal === 'vehicle' && (
        <Sheet title={editingVehicleId ? 'Edit Vehicle' : 'Add Vehicle'} onClose={() => setModal(null)}>
          <form className="form" onSubmit={saveVehicle}>
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
            <button type="submit" className="btn btn-primary btn-block">{editingVehicleId ? 'Save Changes' : 'Save Vehicle'}</button>
          </form>
        </Sheet>
      )}

      {modal === 'service' && (
        <Sheet title={editingServiceId ? 'Edit Service' : 'Log Service'} onClose={() => setModal(null)}>
          <form className="form" onSubmit={saveService}>
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
            <button type="submit" className="btn btn-primary btn-block">{editingServiceId ? 'Save Changes' : 'Save Service'}</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
