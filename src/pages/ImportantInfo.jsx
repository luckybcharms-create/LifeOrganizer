import { useState } from 'react';
import { HeartPulse, Trash2, Plus } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { makeId } from '../utils/id';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import EmptyState from '../components/EmptyState';

const defaultInfo = {
  bloodType: '',
  allergies: '',
  medicalNotes: '',
  medications: [],
  emergencyContacts: [],
};

const emptyMed = { name: '', dosage: '', frequency: '' };
const emptyContact = { name: '', relationship: '', phone: '' };

export default function ImportantInfo() {
  const [info, setInfo] = useLocalStorage(KEYS.importantInfo, defaultInfo);
  const [modal, setModal] = useState(null); // 'medication' | 'contact' | null
  const [medForm, setMedForm] = useState(emptyMed);
  const [contactForm, setContactForm] = useState(emptyContact);

  function update(field, value) {
    setInfo({ ...info, [field]: value });
  }

  function addMed(e) {
    e.preventDefault();
    if (!medForm.name.trim()) return;
    setInfo({ ...info, medications: [{ id: makeId(), ...medForm }, ...(info.medications || [])] });
    setMedForm(emptyMed);
    setModal(null);
  }

  function removeMed(id) {
    setInfo({ ...info, medications: info.medications.filter((m) => m.id !== id) });
  }

  function addContact(e) {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phone.trim()) return;
    setInfo({ ...info, emergencyContacts: [{ id: makeId(), ...contactForm }, ...(info.emergencyContacts || [])] });
    setContactForm(emptyContact);
    setModal(null);
  }

  function removeContact(id) {
    setInfo({ ...info, emergencyContacts: info.emergencyContacts.filter((c) => c.id !== id) });
  }

  const medications = info.medications || [];
  const contacts = info.emergencyContacts || [];

  return (
    <>
      <PageHeader icon={HeartPulse} title="Important Info" />
      <main className="app-main">
        <div className="section-title">Health Details</div>
        <div className="card">
          <div className="form">
            <div className="field">
              <label>Blood Type</label>
              <select value={info.bloodType} onChange={(e) => update('bloodType', e.target.value)}>
                <option value="">Unknown</option>
                {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Allergies</label>
              <textarea
                placeholder="e.g. Penicillin, peanuts, bee stings"
                value={info.allergies}
                onChange={(e) => update('allergies', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Other Medical Notes</label>
              <textarea
                placeholder="Conditions, doctor info, etc."
                value={info.medicalNotes}
                onChange={(e) => update('medicalNotes', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex-between">
          <div className="section-title mt-0">Medications</div>
          <button className="btn-icon" onClick={() => setModal('medication')} aria-label="Add medication">
            <Plus size={18} />
          </button>
        </div>
        {medications.length === 0 && (
          <EmptyState icon={HeartPulse} message="No medications added yet." />
        )}
        {medications.length > 0 && (
          <div className="card">
            {medications.map((m) => (
              <div className="list-item" key={m.id}>
                <div className="list-item-main">
                  <div className="list-item-title">{m.name}</div>
                  <div className="list-item-sub">{[m.dosage, m.frequency].filter(Boolean).join(' · ')}</div>
                </div>
                <button className="btn-danger-text" onClick={() => removeMed(m.id)} aria-label="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex-between">
          <div className="section-title mt-0">Emergency Contacts</div>
          <button className="btn-icon" onClick={() => setModal('contact')} aria-label="Add contact">
            <Plus size={18} />
          </button>
        </div>
        {contacts.length === 0 && (
          <EmptyState icon={HeartPulse} message="No emergency contacts added yet." />
        )}
        {contacts.length > 0 && (
          <div className="card">
            {contacts.map((c) => (
              <div className="list-item" key={c.id}>
                <div className="list-item-main">
                  <div className="list-item-title">{c.name}</div>
                  <div className="list-item-sub">{c.relationship}</div>
                </div>
                <div className="list-item-side">
                  <a className="link-row" href={`tel:${c.phone}`}>{c.phone}</a>
                  <button className="btn-danger-text" onClick={() => removeContact(c.id)} aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modal === 'medication' && (
        <Sheet title="Add Medication" onClose={() => setModal(null)}>
          <form className="form" onSubmit={addMed}>
            <div className="field">
              <label>Name</label>
              <input
                type="text"
                value={medForm.name}
                onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Dosage</label>
                <input
                  type="text"
                  placeholder="e.g. 20mg"
                  value={medForm.dosage}
                  onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Frequency</label>
                <input
                  type="text"
                  placeholder="e.g. Once daily"
                  value={medForm.frequency}
                  onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block">Save Medication</button>
          </form>
        </Sheet>
      )}

      {modal === 'contact' && (
        <Sheet title="Add Emergency Contact" onClose={() => setModal(null)}>
          <form className="form" onSubmit={addContact}>
            <div className="field">
              <label>Name</label>
              <input
                type="text"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Relationship</label>
              <input
                type="text"
                placeholder="e.g. Spouse, Parent, Doctor"
                value={contactForm.relationship}
                onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Phone</label>
              <input
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">Save Contact</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
