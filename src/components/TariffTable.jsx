import { formatMoney } from '../utils/calc';
import { OPTIONS, REGIONS, CLINICS } from '../data/tariffs';

function SmallSelect({ value, onChange, options, locked }) {
  if (locked) {
    return <select disabled style={{ padding: '5px 6px', border: '1px solid #9de8c0', borderRadius: 5, fontFamily: 'Manrope,sans-serif', fontSize: 11, width: '100%', background: '#e8f7ef', color: '#0d7a44', fontWeight: 700 }}><option>Безлимит (вкл.)</option></select>;
  }
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '5px 6px', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'Manrope,sans-serif', fontSize: 11, width: '100%', background: 'var(--bg)', color: 'var(--text)' }}>
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

function RegionSelect({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '5px 6px', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'Manrope,sans-serif', fontSize: 11, width: '100%', background: 'var(--bg)', color: 'var(--text)' }}>
      <option value="">— регион —</option>
      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
    </select>
  );
}

function ClinicSelect({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '5px 6px', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'Manrope,sans-serif', fontSize: 11, width: '100%', background: 'var(--bg)', color: 'var(--text)' }}>
      <option value="">— категория —</option>
      {CLINICS.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

const cols = '95px 50px 85px 72px 1fr 90px 80px 48px';

export default function TariffTable({ rows, totCount, totSum, onUpdate, onRemove, onDup }) {
  if (!rows.length) {
    return <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>Нет позиций. Нажмите кнопку ниже.</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 4, padding: '5px 8px', background: 'var(--bg)', borderRadius: 'var(--rs)', marginBottom: 5, fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', minWidth: 680 }}>
        <div>Название</div><div>Дост.</div><div>Регион</div><div>Категория</div>
        <div>Наполнение</div><div>Цена/чел.</div><div style={{ textAlign: 'right' }}>Итого</div><div></div>
      </div>

      {rows.map(r => {
        const isApp = r.ochnye === 'app_rassh';
        const isVip = r.clinic === 'ВИП';
        const price = parseFloat(r.price) || 0;
        const n = parseInt(r.count) || 0;
        const tot = price * n;

        return (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: cols, gap: 4, alignItems: 'start', padding: 8, border: `1px solid ${isVip ? '#fbbf24' : 'var(--border)'}`, borderRadius: 'var(--rs)', marginBottom: 5, background: isVip ? '#fffdf0' : 'var(--white)', minWidth: 680 }}>

            {/* Название */}
            <input value={r.name} onChange={e => onUpdate(r.id, 'name', e.target.value)}
              style={{ padding: '5px 6px', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'Manrope,sans-serif', fontSize: 11, width: '100%', background: 'var(--bg)', color: 'var(--text)', fontWeight: 700 }} />

            {/* Доступов */}
            <input type="number" value={r.count} placeholder="0" min="1"
              onChange={e => onUpdate(r.id, 'count', e.target.value)}
              style={{ padding: '5px 6px', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'Manrope,sans-serif', fontSize: 11, width: '100%', background: 'var(--bg)', color: 'var(--text)' }} />

            {/* Регион */}
            <RegionSelect value={r.region} onChange={v => onUpdate(r.id, 'region', v)} />

            {/* Категория */}
            <ClinicSelect value={r.clinic} onChange={v => onUpdate(r.id, 'clinic', v)} />

            {/* Наполнение */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <SmallSelect value={r.ochnye} onChange={v => onUpdate(r.id, 'ochnye', v)} options={OPTIONS.ochnye} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <SmallSelect value={r.dom}  onChange={v => onUpdate(r.id, 'dom',  v)} options={OPTIONS.dom} />
                <SmallSelect value={r.stom} onChange={v => onUpdate(r.id, 'stom', v)} options={OPTIONS.stom} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <SmallSelect value={r.obs}  onChange={v => onUpdate(r.id, 'obs',  v)} options={OPTIONS.obs}  locked={isApp} />
                <SmallSelect value={r.anal} onChange={v => onUpdate(r.id, 'anal', v)} options={OPTIONS.anal} locked={isApp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
                <SmallSelect value={r.semya}  onChange={v => onUpdate(r.id, 'semya',  v)} options={OPTIONS.semya} />
                <SmallSelect value={r.psikh}  onChange={v => onUpdate(r.id, 'psikh',  v)} options={OPTIONS.psikh} />
                <SmallSelect value={r.gosp}   onChange={v => onUpdate(r.id, 'gosp',   v)} options={OPTIONS.gosp} />
              </div>
              <SmallSelect value={r.checkup} onChange={v => onUpdate(r.id, 'checkup', v)} options={OPTIONS.checkup} />
            </div>

            {/* Цена/чел — только ручной ввод */}
            <input
              type="number"
              value={r.price}
              placeholder="Введите цену"
              min="0"
              onChange={e => onUpdate(r.id, 'price', e.target.value)}
              style={{ padding: '5px 6px', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'Manrope,sans-serif', fontSize: 11, width: '100%', background: 'var(--bg)', color: 'var(--text)', fontWeight: 700 }}
            />

            {/* Итого */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gd)', paddingTop: 4, textAlign: 'right' }}>
              {tot > 0 ? formatMoney(tot) : '—'}
            </div>

            {/* Кнопки */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
              <button onClick={() => onRemove(r.id)} title="Удалить"
                style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 13, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&#10005;</button>
              <button onClick={() => onDup(r.id)} title="Дублировать"
                style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--blue)', fontSize: 13, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&#10697;</button>
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 4, padding: '9px 10px', background: 'var(--g)', borderRadius: 'var(--rs)', color: '#fff', fontWeight: 800, fontSize: 12, marginTop: 4, minWidth: 680 }}>
        <div>ИТОГО</div>
        <div style={{ textAlign: 'center' }}>{totCount}</div>
        <div /><div /><div /><div />
        <div style={{ textAlign: 'right' }}>{totSum > 0 ? formatMoney(totSum) : '—'}</div>
        <div />
      </div>
    </div>
  );
}
