import { formatMoney } from '../utils/calc';
import { COMPARE_OPTIONS } from '../data/tariffs';

const LABELS = {
  ochnye:  { app_rassh:'АПП Расш.',bezlimit:'Безлимит','6':'6 приёмов','4':'4 приёма' },
  dom:     { '2':'2 в год',bezlimit:'Безлимит' },
  stom:    { base:'Базовая',rassh:'Расширенная' },
  checkup: { yes:'Да' },
  obs:     { yes:'Да',kt_mrt:'с КТ и МРТ',inc:'Безлимит' },
  anal:    { limit:'С лимитом',bezlimit:'Безлимит',inc:'Безлимит' },
  semya:   { yes:'Да' },
  psikh:   { bezlimit:'Безлимит',semeynyy:'Семейный','4':'4 конс.' },
  gosp:    { esp:'ЭСП',pesp:'ПЭСП' },
};

export default function CompareTable({ rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ background: '#0d3060', color: '#fff', padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700 }}>Опция</th>
            {rows.map(r => (
              <th key={r.id} style={{ background: 'var(--blue)', color: '#fff', padding: '8px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700 }}>
                {r.name}
                <br />
                <span style={{ fontSize: 9, fontWeight: 400, opacity: 0.75 }}>{r.region || 'РФ'} / {r.clinic || 'Стандарт'}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_OPTIONS.map(opt => {
            const vals = rows.map(r => {
              const isApp = r.ochnye === 'app_rassh';
              if (isApp && (opt.key === 'obs' || opt.key === 'anal')) return { text: 'Безлимит', green: true };
              if (!r[opt.key] || r[opt.key] === 'no') return { text: '—', green: false };
              const l = (LABELS[opt.key] || {})[r[opt.key]];
              return { text: l || 'Да', green: true };
            });
            const allSame = vals.every(v => v.text === vals[0].text);
            return (
              <tr key={opt.key}>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--border)', fontWeight: 600, background: 'var(--bg)' }}>{opt.label}</td>
                {vals.map((val, i) => (
                  <td key={i} style={{ padding: '7px 10px', borderBottom: '1px solid var(--border)', textAlign: 'center', background: !allSame && val.text !== '—' ? '#fef9c3' : 'transparent' }}>
                    {val.green
                      ? <span style={{ color: 'var(--g)', fontWeight: 700 }}>{val.text}</span>
                      : <span style={{ color: '#ccc' }}>—</span>}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ background: 'var(--gd)', color: '#fff', padding: '8px 10px', fontWeight: 800 }}>Цена / чел.</td>
            {rows.map(r => (
              <td key={r.id} style={{ background: 'var(--g)', color: '#fff', fontWeight: 800, padding: '8px 10px', textAlign: 'center' }}>
                {r.price ? formatMoney(parseFloat(r.price)) : '—'}
              </td>
            ))}
          </tr>
          <tr>
            <td style={{ background: 'var(--gd)', color: '#fff', padding: '8px 10px', fontWeight: 800 }}>Итого</td>
            {rows.map(r => {
              const n = parseInt(r.count) || 0;
              const p = parseFloat(r.price) || 0;
              return (
                <td key={r.id} style={{ background: 'var(--g)', color: '#fff', fontWeight: 800, padding: '8px 10px', textAlign: 'center' }}>
                  {p > 0 ? formatMoney(p * n) : '—'}
                  <br />
                  <small style={{ fontSize: 9, opacity: 0.7 }}>{n} чел.</small>
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
