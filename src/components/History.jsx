import { Btn } from './ui';
import { formatMoney } from '../utils/calc';

export default function History({ history, filter, onLoad, onDelete, onNew }) {
  const groups = {};
  history.forEach(e => {
    if (!groups[e.client]) groups[e.client] = [];
    groups[e.client].push(e);
  });
  const clients = filter ? [filter] : Object.keys(groups);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>{filter ? `Папка: ${filter}` : 'История коммерческих предложений'}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{filter ? `КП по клиенту: ${filter}` : 'Все сохранённые КП по клиентам'}</div>
        </div>
        <Btn variant="primary" onClick={onNew}>+ Новое КП</Btn>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {!history.length ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <div>Нет сохранённых КП. Создайте первое!</div>
          </div>
        ) : (
          clients.map(client => {
            const items = groups[client];
            if (!items) return null;
            return (
              <div key={client} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                  <span>Папка:</span> {client}
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                    {items.length} КП
                  </span>
                </div>
                {items.map(e => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--rs)', marginBottom: 5, background: 'var(--white)', cursor: 'pointer', transition: 'all .15s' }}
                    onMouseEnter={el => { el.currentTarget.style.borderColor = 'var(--g)'; el.currentTarget.style.background = 'var(--gl)'; }}
                    onMouseLeave={el => { el.currentTarget.style.borderColor = 'var(--border)'; el.currentTarget.style.background = 'var(--white)'; }}
                  >
                    <div style={{ width: 30, height: 30, background: 'var(--gl)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>📄</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{e.client}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{e.date} · {e.count} чел.</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gd)', whiteSpace: 'nowrap' }}>
                      {e.total > 0 ? formatMoney(e.total) : '—'}
                    </div>
                    <Btn variant="secondary" onClick={() => onLoad({ ...e.data, loadKey: Date.now() })} style={{ fontSize: 11, padding: '5px 10px' }}>
                      Открыть
                    </Btn>
                    <button onClick={() => { if (window.confirm('Удалить это КП?')) onDelete(e.id); }}
                      style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 13, borderRadius: 4 }}>
                      &#10005;
                    </button>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
