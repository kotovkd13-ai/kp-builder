import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Builder from './components/Builder';
import History from './components/History';

const STORAGE_KEY = 'kp_history_v2';

const PASSWORD = 'britney';
const AUTH_KEY = 'kp_auth';

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveHistory(h) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); } catch {}
}

export default function App() {
  const [view, setView] = useState('builder'); // 'builder' | 'history'
  const [historyFilter, setHistoryFilter] = useState(null);
  const [history, setHistory] = useState(loadHistory);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [loadedData, setLoadedData] = useState(null);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleSave = useCallback((entry) => {
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, 100);
      saveHistory(next);
      return next;
    });
  }, []);

  const handleDelete = useCallback((id) => {
    setHistory(prev => {
      const next = prev.filter(e => e.id !== id);
      saveHistory(next);
      return next;
    });
  }, []);

  const handleLoad = useCallback((data) => {
    setLoadedData(data);
    setView('builder');
  }, []);

  const handleOpenFolder = useCallback((client) => {
    setHistoryFilter(client);
    setView('history');
  }, []);

  const handleShowHistory = useCallback(() => {
    setHistoryFilter(null);
    setView('history');
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        view={view}
        onNewKP={() => setView('builder')}
        onHistory={handleShowHistory}
        onOpenFolder={handleOpenFolder}
        history={history}
        dark={dark}
        onToggleDark={() => setDark(d => !d)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0 }}>
        {view === 'builder' ? (
          <Builder
            key={loadedData?.loadKey}
            initialData={loadedData}
            onSave={handleSave}
          />
        ) : (
          <History
            history={history}
            filter={historyFilter}
            onLoad={handleLoad}
            onDelete={handleDelete}
            onNew={() => setView('builder')}
          />
        )}
      </div>
    </div>
  );
}
