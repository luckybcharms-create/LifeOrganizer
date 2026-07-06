import { useRef, useState } from 'react';
import { Settings as SettingsIcon, Download, Upload } from 'lucide-react';
import { KEYS } from '../utils/storageKeys';
import PageHeader from '../components/PageHeader';

function buildExportPayload() {
  const data = {};
  for (const key of Object.values(KEYS)) {
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  }
  return { app: 'life-organizer', exportedAt: new Date().toISOString(), data };
}

export default function Settings() {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message }

  function handleExport() {
    const payload = buildExportPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-organizer-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus({ type: 'success', message: 'Backup downloaded.' });
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      let payload;
      try {
        payload = JSON.parse(reader.result);
      } catch {
        setStatus({ type: 'error', message: 'That file is not valid JSON.' });
        return;
      }
      if (!payload || typeof payload.data !== 'object') {
        setStatus({ type: 'error', message: 'That file is not a Life Organizer backup.' });
        return;
      }
      const confirmed = window.confirm(
        'Importing will overwrite all current data in the app with the contents of this backup. Continue?'
      );
      if (!confirmed) return;

      for (const [key, value] of Object.entries(payload.data)) {
        localStorage.setItem(key, value);
      }
      setStatus({ type: 'success', message: 'Import successful. Reloading…' });
      setTimeout(() => window.location.reload(), 600);
    };
    reader.onerror = () => setStatus({ type: 'error', message: 'Could not read that file.' });
    reader.readAsText(file);
  }

  return (
    <>
      <PageHeader icon={SettingsIcon} title="Settings" />
      <main className="app-main">
        <div className="section-title">Backup &amp; Restore</div>
        <div className="card">
          <p className="muted" style={{ marginBottom: 16 }}>
            Export everything you've entered across every section into a single JSON file you can
            keep as a backup or move to another device. Importing a backup replaces all current
            data in the app.
          </p>
          <div className="form">
            <button className="btn btn-primary btn-block" onClick={handleExport}>
              <Download size={16} /> Export All Data
            </button>
            <button className="btn btn-block" onClick={handleImportClick}>
              <Upload size={16} /> Import Backup
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
          {status && (
            <p
              className="muted"
              style={{ marginTop: 12, color: status.type === 'error' ? 'var(--red)' : 'var(--green)' }}
            >
              {status.message}
            </p>
          )}
        </div>
      </main>
    </>
  );
}
