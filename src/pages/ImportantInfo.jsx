import { useState } from 'react';
import { HeartPulse, Trash2, Plus, Eye, EyeOff, Copy, Pencil } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { makeId } from '../utils/id';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import EmptyState from '../components/EmptyState';
import SwipeableRow from '../components/SwipeableRow';

const defaultInfo = {
  familyMembers: [],
  passwords: [],
};

const emptyMember = { name: '', relationship: '', bloodType: '', allergies: '', medicalNotes: '' };
const emptyPassword = { name: '', username: '', password: '', notes: '' };
const BLOOD_TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export default function ImportantInfo() {
  const [info, setInfo] = useLocalStorage(KEYS.importantInfo, defaultInfo);
  const [modal, setModal] = useState(null); // 'member' | 'password' | null
  const [memberForm, setMemberForm] = useState(emptyMember);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [passwordForm, setPasswordForm] = useState(emptyPassword);
  const [editingPasswordId, setEditingPasswordId] = useState(null);
  const [revealed, setRevealed] = useState({});

  function openAddMember() {
    setMemberForm(emptyMember);
    setEditingMemberId(null);
    setModal('member');
  }

  function openEditMember(member) {
    setMemberForm(member);
    setEditingMemberId(member.id);
    setModal('member');
  }

  function saveMember(e) {
    e.preventDefault();
    if (!memberForm.name.trim()) return;
    const familyMembers = info.familyMembers || [];
    if (editingMemberId) {
      setInfo({
        ...info,
        familyMembers: familyMembers.map((m) => (m.id === editingMemberId ? { ...memberForm, id: editingMemberId } : m)),
      });
    } else {
      setInfo({ ...info, familyMembers: [{ id: makeId(), ...memberForm }, ...familyMembers] });
    }
    setModal(null);
  }

  function removeMember(id) {
    setInfo({ ...info, familyMembers: (info.familyMembers || []).filter((m) => m.id !== id) });
    setModal(null);
  }

  function openAddPassword() {
    setPasswordForm(emptyPassword);
    setEditingPasswordId(null);
    setModal('password');
  }

  function openEditPassword(p) {
    setPasswordForm(p);
    setEditingPasswordId(p.id);
    setModal('password');
  }

  function savePassword(e) {
    e.preventDefault();
    if (!passwordForm.name.trim() || !passwordForm.password.trim()) return;
    const passwords = info.passwords || [];
    if (editingPasswordId) {
      setInfo({ ...info, passwords: passwords.map((p) => (p.id === editingPasswordId ? { ...passwordForm, id: editingPasswordId } : p)) });
    } else {
      setInfo({ ...info, passwords: [{ id: makeId(), ...passwordForm }, ...passwords] });
    }
    setPasswordForm(emptyPassword);
    setEditingPasswordId(null);
    setModal(null);
  }

  function removePassword(id) {
    setInfo({ ...info, passwords: info.passwords.filter((p) => p.id !== id) });
    setRevealed((r) => { const next = { ...r }; delete next[id]; return next; });
    setModal(null);
  }

  function toggleReveal(id) {
    setRevealed((r) => ({ ...r, [id]: !r[id] }));
  }

  async function copyPassword(pw) {
    try {
      await navigator.clipboard.writeText(pw);
    } catch {
      // clipboard API unavailable — silently ignore
    }
  }

  const familyMembers = info.familyMembers || [];
  const passwords = info.passwords || [];

  return (
    <>
      <PageHeader icon={HeartPulse} title="Important Info" />
      <main className="app-main">
        <div className="flex-between">
          <div className="section-title mt-0">Family Health Info</div>
          <button className="btn-icon" onClick={openAddMember} aria-label="Add family member">
            <Plus size={18} />
          </button>
        </div>
        {familyMembers.length === 0 && (
          <EmptyState icon={HeartPulse} message="No one added yet. Tap + to add yourself, your spouse, or a child." />
        )}
        {familyMembers.length > 0 && (
          <div className="card">
            {familyMembers.map((m) => (
              <SwipeableRow
                key={m.id}
                actions={[
                  { label: 'Edit', tone: 'edit', icon: <Pencil size={16} />, onClick: () => openEditMember(m) },
                  { label: 'Delete', tone: 'delete', icon: <Trash2 size={16} />, onClick: () => removeMember(m.id) },
                ]}
              >
                <div className="list-item">
                  <div className="list-item-main">
                    <div className="list-item-title">
                      {m.name}
                      {m.relationship && <span className="badge badge-neutral">{m.relationship}</span>}
                      {m.bloodType && <span className="badge badge-neutral">{m.bloodType}</span>}
                    </div>
                    {m.allergies && <div className="list-item-sub">Allergies: {m.allergies}</div>}
                    {m.medicalNotes && <div className="list-item-meta">{m.medicalNotes}</div>}
                  </div>
                </div>
              </SwipeableRow>
            ))}
          </div>
        )}

        <div className="flex-between">
          <div className="section-title mt-0">Passwords</div>
          <button className="btn-icon" onClick={openAddPassword} aria-label="Add password">
            <Plus size={18} />
          </button>
        </div>
        <p className="muted" style={{ marginBottom: 10 }}>
          Stored locally on this device only, in plain text — don't rely on this if others can access your browser.
        </p>
        {passwords.length === 0 && (
          <EmptyState icon={HeartPulse} message="No passwords saved yet." />
        )}
        {passwords.length > 0 && (
          <div className="card">
            {passwords.map((p) => (
              <SwipeableRow
                key={p.id}
                actions={[
                  { label: 'Edit', tone: 'edit', icon: <Pencil size={16} />, onClick: () => openEditPassword(p) },
                  { label: 'Delete', tone: 'delete', icon: <Trash2 size={16} />, onClick: () => removePassword(p.id) },
                ]}
              >
                <div className="list-item">
                  <div className="list-item-main">
                    <div className="list-item-title">{p.name}</div>
                    {p.username && <div className="list-item-sub">{p.username}</div>}
                    <div className="list-item-meta" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: revealed[p.id] ? 'normal' : '2px' }}>
                        {revealed[p.id] ? p.password : '••••••••'}
                      </span>
                      <button className="btn-icon" style={{ padding: 4 }} onClick={() => toggleReveal(p.id)} aria-label="Toggle visibility">
                        {revealed[p.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button className="btn-icon" style={{ padding: 4 }} onClick={() => copyPassword(p.password)} aria-label="Copy password">
                        <Copy size={14} />
                      </button>
                    </div>
                    {p.notes && <div className="list-item-meta">{p.notes}</div>}
                  </div>
                </div>
              </SwipeableRow>
            ))}
          </div>
        )}
      </main>

      {modal === 'member' && (
        <Sheet title={editingMemberId ? 'Edit Family Member' : 'Add Family Member'} onClose={() => setModal(null)}>
          <form className="form" onSubmit={saveMember}>
            <div className="form-row">
              <div className="field">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="e.g. Me, Sarah, Jack"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Me, Wife, Son, Daughter"
                  value={memberForm.relationship}
                  onChange={(e) => setMemberForm({ ...memberForm, relationship: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label>Blood Type</label>
              <select value={memberForm.bloodType} onChange={(e) => setMemberForm({ ...memberForm, bloodType: e.target.value })}>
                <option value="">Unknown</option>
                {BLOOD_TYPES.map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Allergies</label>
              <textarea
                placeholder="e.g. Penicillin, peanuts, bee stings"
                value={memberForm.allergies}
                onChange={(e) => setMemberForm({ ...memberForm, allergies: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Medical Notes</label>
              <textarea
                placeholder="Conditions, medications, doctor info, etc."
                value={memberForm.medicalNotes}
                onChange={(e) => setMemberForm({ ...memberForm, medicalNotes: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              {editingMemberId ? 'Save Changes' : 'Add Family Member'}
            </button>
            {editingMemberId && (
              <button type="button" className="btn-danger-text" style={{ alignSelf: 'center' }} onClick={() => removeMember(editingMemberId)}>
                Remove {memberForm.name || 'this person'}
              </button>
            )}
          </form>
        </Sheet>
      )}

      {modal === 'password' && (
        <Sheet title={editingPasswordId ? 'Edit Password' : 'Add Password'} onClose={() => setModal(null)}>
          <form className="form" onSubmit={savePassword}>
            <div className="field">
              <label>Site / Service</label>
              <input
                type="text"
                placeholder="e.g. Gmail, Bank of America"
                value={passwordForm.name}
                onChange={(e) => setPasswordForm({ ...passwordForm, name: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Username / Email</label>
              <input
                type="text"
                value={passwordForm.username}
                onChange={(e) => setPasswordForm({ ...passwordForm, username: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="text"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                value={passwordForm.password}
                onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea
                placeholder="Security questions, PIN, etc. (optional)"
                value={passwordForm.notes}
                onChange={(e) => setPasswordForm({ ...passwordForm, notes: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">{editingPasswordId ? 'Save Changes' : 'Save Password'}</button>
            {editingPasswordId && (
              <button type="button" className="btn-danger-text" style={{ alignSelf: 'center' }} onClick={() => removePassword(editingPasswordId)}>
                Delete Password
              </button>
            )}
          </form>
        </Sheet>
      )}
    </>
  );
}
