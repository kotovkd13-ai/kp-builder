export function Btn({ variant = 'secondary', onClick, disabled, style, children }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px',
    borderRadius: 'var(--rs)', fontFamily: 'Manrope, sans-serif', fontSize: 12,
    fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    border: '1px solid transparent', transition: 'all .15s', whiteSpace: 'nowrap',
    opacity: disabled ? 0.6 : 1,
  };
  const variants = {
    primary:   { background: 'var(--g)',   color: '#fff', borderColor: 'var(--g)' },
    secondary: { background: 'var(--bg)',  color: 'var(--text)', borderColor: 'var(--border)' },
    ghost:     { background: 'transparent', color: 'var(--muted)', borderColor: 'var(--border)' },
    danger:    { background: 'var(--rl)',  color: 'var(--red)', borderColor: 'var(--rb)' },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--border)',
      borderRadius: 'var(--r)', padding: '14px 16px', ...style,
    }}>
      {children}
    </div>
  );
}

export function CardHd({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '.07em', color: 'var(--muted)', marginBottom: 12,
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {children}
    </div>
  );
}

export function Field({ label, required, error, children }) {
  return (
    <div style={{ marginBottom: 9 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {label} {required && <span style={{ color: 'var(--red)' }}>*</span>}
        </label>
      )}
      {children}
      {error && <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 3 }}>{error}</div>}
    </div>
  );
}

export function Input({ value, onChange, placeholder, type = 'text', invalid, style }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '7px 10px', border: `1px solid ${invalid ? 'var(--red)' : 'var(--border)'}`,
        borderRadius: 'var(--rs)', fontFamily: 'Manrope, sans-serif', fontSize: 12,
        color: 'var(--text)', background: invalid ? '#fff5f5' : 'var(--white)', outline: 'none',
        ...style,
      }}
      onFocus={e => e.target.style.borderColor = 'var(--g)'}
      onBlur={e => e.target.style.borderColor = invalid ? 'var(--red)' : 'var(--border)'}
    />
  );
}

export function Select({ value, onChange, options, style }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '7px 10px', border: '1px solid var(--border)',
        borderRadius: 'var(--rs)', fontFamily: 'Manrope, sans-serif', fontSize: 12,
        color: 'var(--text)', background: 'var(--white)', outline: 'none', ...style,
      }}
      onFocus={e => e.target.style.borderColor = 'var(--g)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
    >
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

export function Textarea({ value, onChange, placeholder, style }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '7px 10px', border: '1px solid var(--border)',
        borderRadius: 'var(--rs)', fontFamily: 'Manrope, sans-serif', fontSize: 12,
        color: 'var(--text)', background: 'var(--white)', outline: 'none',
        resize: 'vertical', minHeight: 70, ...style,
      }}
    />
  );
}

export function Badge({ variant = 'g', children }) {
  const colors = {
    g:    { background: 'var(--gl)', color: 'var(--gd)' },
    b:    { background: 'var(--bl)', color: 'var(--bt)' },
    gray: { background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' },
  };
  return (
    <span style={{ display:'inline-flex',alignItems:'center',padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700,...colors[variant] }}>
      {children}
    </span>
  );
}

export function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />;
}
