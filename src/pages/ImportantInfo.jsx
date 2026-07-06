import { useRef, useState } from 'react';
import { Shield, HeartPulse, Lock, FileText, Download, Trash2, Plus, Eye, EyeOff, Copy, Pencil } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { KEYS } from '../utils/storageKeys';
import { makeId } from '../utils/id';
import { todayISO, formatDate } from '../utils/date';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import EmptyState from '../components/EmptyState';
import SwipeableRow from '../components/SwipeableRow';

const defaultInfo = {
  familyMembers: [],
  passwords: [],
  documents: [],
};

const emptyMember = { name: '', relationship: '', bloodType: '', allergies: '', medicalNotes: '' };
const emptyPassword = { name: '', username: '', password: '', notes: '' };
const emptyDocForm = { name: '', notes: '' };
const BLOOD_TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
const MAX_DOCUMENT_SIZE = 2 * 1024 * 1024; // 2 MB — localStorage quota is limited and shared

function formatFileSize(bytes) {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function ImportantInfo() {
  const [info, setInfo] = useLocalStorage(KEYS.importantInfo, defaultInfo);
  const [modal, setModal] = useState(null); // 'member' | 'password' | 'document' | null
  const [memberForm, setMemberForm] = useState(emptyMember);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [passwordForm, setPasswordForm] = useState(emptyPassword);
  const [editingPasswordId, setEditingPasswordId] = useState(null);
  const [revealed, setRevealed] = useState({});
  const [docForm, setDocForm] = useState(emptyDocForm);
  const [editingDocId, setEditingDocId] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const fileInputRef = useRef(null);

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

  function openAddDocument() {
    fileInputRef.current?.click();
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_DOCUMENT_SIZE) {
      window.alert(
        `"${file.name}" is ${formatFileSize(file.size)} — that's over the 2 MB limit for locally stored documents. Try a smaller file or a compressed scan.`
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingFile({ dataUrl: reader.result, mimeType: file.type, size: file.size, fileName: file.name });
      setDocForm({ name: file.name, notes: '' });
      setEditingDocId(null);
      setModal('document');
    };
    reader.onerror = () => window.alert('Could not read that file.');
    reader.readAsDataURL(file);
  }

  function openEditDocument(d) {
    setDocForm({ name: d.name, notes: d.notes || '' });
    setEditingDocId(d.id);
    setPendingFile(null);
    setModal('document');
  }

  function saveDocument(e) {
    e.preventDefault();
    if (!docForm.name.trim()) return;
    const documents = info.documents || [];
    if (editingDocId) {
      setInfo({
        ...info,
        documents: documents.map((d) => (d.id === editingDocId ? { ...d, name: docForm.name, notes: docForm.notes } : d)),
      });
    } else {
      if (!pendingFile) return;
      const doc = {
        id: makeId(),
        name: docForm.name,
        notes: docForm.notes,
        fileName: pendingFile.fileName,
        mimeType: pendingFile.mimeType,
        size: pendingFile.size,
        dataUrl: pendingFile.dataUrl,
        uploadedAt: todayISO(),
      };
      setInfo({ ...info, documents: [doc, ...documents] });
    }
    closeDocumentModal();
  }

  function removeDocument(id) {
    setInfo({ ...info, documents: (info.documents || []).filter((d) => d.id !== id) });
    closeDocumentModal();
  }

  function closeDocumentModal() {
    setModal(null);
    setPendingFile(null);
    setDocForm(emptyDocForm);
    setEditingDocId(null);
  }

  function viewDocument(d) {
    const win = window.open('', '_blank');
    if (!win) {
      window.alert('Please allow pop-ups for this site to view the document.');
      return;
    }
    const isImage = d.mimeType?.startsWith('image/');
    const isPdf = d.mimeType === 'application/pdf';
    const safeName = d.name.replace(/</g, '&lt;');
    let body;
    if (isImage) {
      body = `<img src="${d.dataUrl}" alt="${safeName}" style="max-width:100%;height:auto;display:block;margin:0 auto;" />`;
    } else if (isPdf) {
      body = `<embed src="${d.dataUrl}" type="application/pdf" style="width:100%;height:100vh;border:none;" />`;
    } else {
      body = `<div style="font-family:-apple-system,sans-serif;padding:32px;text-align:center;color:#333;">
        <p>Preview isn't available for this file type.</p>
        <a href="${d.dataUrl}" download="${d.fileName}">Download ${safeName}</a>
      </div>`;
    }
    win.document.write(
      `<!doctype html><html><head><title>${safeName}</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#0d0f14;">${body}</body></html>`
    );
    win.document.close();
  }

  function downloadDocument(d) {
    const a = document.createElement('a');
    a.href = d.dataUrl;
    a.download = d.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const familyMembers = info.familyMembers || [];
  const passwords = info.passwords || [];
  const documents = info.documents || [];

  return (
    <>
      <PageHeader icon={Shield} title="Important Info" />
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
          <EmptyState icon={Lock} message="No passwords saved yet." />
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

        <div className="flex-between">
          <div className="section-title mt-0">Documents</div>
          <button className="btn-icon" onClick={openAddDocument} aria-label="Add document">
            <Plus size={18} />
          </button>
        </div>
        <p className="muted" style={{ marginBottom: 10 }}>
          Stored locally on this device. Keep files under 2 MB — browser storage is limited.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        {documents.length === 0 && (
          <EmptyState icon={FileText} message="No documents uploaded yet." />
        )}
        {documents.length > 0 && (
          <div className="card">
            {documents.map((d) => (
              <SwipeableRow
                key={d.id}
                actions={[
                  { label: 'Edit', tone: 'edit', icon: <Pencil size={16} />, onClick: () => openEditDocument(d) },
                  { label: 'Delete', tone: 'delete', icon: <Trash2 size={16} />, onClick: () => removeDocument(d.id) },
                ]}
              >
                <div className="list-item">
                  <div className="list-item-main">
                    <div className="list-item-title">{d.name}</div>
                    <div className="list-item-sub">{formatFileSize(d.size)} · {formatDate(d.uploadedAt)}</div>
                    {d.notes && <div className="list-item-meta">{d.notes}</div>}
                    <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                      <button
                        type="button"
                        className="link-row"
                        style={{ background: 'none', border: 'none', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => viewDocument(d)}
                      >
                        <Eye size={12} /> View
                      </button>
                      <button
                        type="button"
                        className="link-row"
                        style={{ background: 'none', border: 'none', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => downloadDocument(d)}
                      >
                        <Download size={12} /> Download
                      </button>
                    </div>
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

      {modal === 'document' && (
        <Sheet title={editingDocId ? 'Edit Document' : 'Save Document'} onClose={closeDocumentModal}>
          <form className="form" onSubmit={saveDocument}>
            {pendingFile && (
              <p className="muted">{pendingFile.fileName} · {formatFileSize(pendingFile.size)}</p>
            )}
            <div className="field">
              <label>Name</label>
              <input
                type="text"
                value={docForm.name}
                onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea
                placeholder="Optional"
                value={docForm.notes}
                onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              {editingDocId ? 'Save Changes' : 'Save Document'}
            </button>
            {editingDocId && (
              <button type="button" className="btn-danger-text" style={{ alignSelf: 'center' }} onClick={() => removeDocument(editingDocId)}>
                Delete Document
              </button>
            )}
          </form>
        </Sheet>
      )}
    </>
  );
}
