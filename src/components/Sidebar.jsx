import logoImg from '../assets/logo-dark.png';

const S = {
  sb: { width: 215, minWidth: 215, background: 'var(--sb)', display: 'flex', flexDirection: 'column', height: '100vh' },
  logo: { padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,.07)' },
  logoImg: { height: 32, width: 'auto', display: 'block' },
  nav: { flex: 1, padding: '10px 8px', overflowY: 'auto' },
  sec: { fontSize: 9, fontWeight: 700, color: 'var(--sbm)', textTransform: 'uppercase', letterSpacing: '.1em', padding: '14px 8px 5px' },
  footer: { padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,.07)', fontSize: 10, color: 'var(--sbm)' },
};

function NavItem({ active, onClick, children }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
      borderRadius: 'var(--rs)', cursor: 'pointer', fontSize: 12, userSelect: 'none',
      color: active ? 'var(--g2)' : 'var(--sbm)',
      background: active ? 'rgba(33,198,115,.15)' : 'transparent',
      marginBottom: 2, transition: 'all .15s',
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,.07)'; e.currentTarget.style.color = '#fff'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sbm)'; } }}
    >
      {children}
    </div>
  );
}

function NavSub({ onClick, children }) {
  return (
    <div onClick={onClick} style={{
      padding: '5px 8px 5px 34px', fontSize: 11, color: 'var(--sbm)',
      cursor: 'pointer', borderRadius: 'var(--rs)', marginBottom: 2,
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.color = '#c8cfe0'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sbm)'; }}
    >
      {children}
    </div>
  );
}

export default function Sidebar({ view, onNewKP, onHistory, onOpenFolder, history, dark, onToggleDark }) {
  const clients = [...new Set(history.map(e => e.client))].slice(0, 10);

  return (
    <div style={S.sb}>
      <div style={S.logo}>
        <img src={logoImg} style={S.logoImg} alt="СберЗдоровье Компаниям" />
      </div>
      <div style={S.nav}>
        <div style={S.sec}>Рабочая область</div>
        <NavItem active={view === 'builder'} onClick={onNewKP}>
          <span style={{ fontSize: 14 }}>+</span> Новое КП
        </NavItem>
        <NavItem active={view === 'history'} onClick={onHistory}>
          История КП
        </NavItem>
        {clients.length > 0 && (
          <>
            <div style={S.sec}>Клиенты</div>
            {clients.map(cl => (
              <NavSub key={cl} onClick={() => onOpenFolder(cl)}>
                {cl.length > 22 ? cl.substring(0, 22) + '...' : cl}
              </NavSub>
            ))}
          </>
        )}
        <div style={S.sec}>Инструменты</div>
        <NavItem active={false} onClick={onNewKP}>
          Сформировать КП
        </NavItem>
      </div>
      <div style={S.footer}>
        <span style={{ color: '#4ade80' }}>v6.0</span>
        <div
          onClick={onToggleDark}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer' }}
        >
          <span style={{ fontSize: 11 }}>Тёмная тема</span>
          <div style={{
            width: 32, height: 18, background: dark ? 'var(--g)' : '#334155',
            borderRadius: 9, position: 'relative', transition: 'background .2s', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', width: 14, height: 14, background: '#fff',
              borderRadius: '50%', top: 2, left: dark ? 16 : 2, transition: 'left .2s',
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
