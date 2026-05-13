import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Builder from './components/Builder';
import History from './components/History';

const STORAGE_KEY = 'kp_history_v2';
const PASSWORD = 'britney';
const AUTH_KEY = 'kp_auth';

function LoginScreen({ onAuth }) {
  const [val, setVal] = useState('');
  const [err, setErr] = useState(false);

  const handle = () => {
    if (val === PASSWORD) {
      localStorage.setItem(AUTH_KEY, '1');
      onAuth();
    } else {
      setErr(true);
      setVal('');
      setTimeout(() => setErr(false), 2000);
    }
  };

  return (
    <div style={{ height: '100vh', background: '#0d2855', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 48px', width: 380, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#21c673', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>СберЗдоровье Компаниям</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1f2e' }}>КП Конструктор</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>Введите пароль для входа</div>
        </div>
        <input
          type="password"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()}
          placeholder="Пароль"
          autoFocus
          style={{
            width: '100%', padding: '12px 14px', fontSize: 15, fontFamily: 'Manrope,sans-serif',
            border: `2px solid ${err ? '#dc2626' : '#e0e4ea'}`, borderRadius: 8, outline: 'none',
            marginBottom: 12, color: '#1a1f2e', transition: 'border .15s',
          }}
        />
        {err && <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 10, textAlign: 'center', fontWeight: 600 }}>Неверный пароль</div>}
        <button
          onClick={handle}
          style={{
            width: '100%', padding: '12px', background: '#1a9e5c', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
            fontFamily: 'Manrope,sans-serif', cursor: 'pointer',
          }}
        >
          Войти
        </button>
      </div>
    </div>
  );
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveHistory(h) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); } catch {}
}

export default function App() {
  const [auth, setAuth] = useState(() => localStorage.getItem(AUTH_KEY) === '1');
  const [view, setView] = useState('builder');
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

  if (!auth) return <LoginScreen onAuth={() => setAuth(true)} />;

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
