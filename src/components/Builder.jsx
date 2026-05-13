import { useState, useEffect, useCallback } from 'react';
import { Btn, Card, CardHd, Field, Input, Select, Textarea, Badge } from './ui';
import TariffTable from './TariffTable';
import CompareTable from './CompareTable';
import { getTotalSum, formatMoney, newRow } from '../utils/calc';
import { generateAndPrint } from '../utils/print';

const REQUIRED_FIELDS = ['client', 'date', 'validity', 'manager', 'phone'];

function initState(data) {
  return {
    client: data?.client || '',
    inn: data?.inn || '',
    date: data?.date || new Date().toISOString().split('T')[0],
    validity: data?.validity || '',
    manager: data?.manager || '',
    phone: data?.phone || '',
    email: data?.email || '',
    maxUser: data?.maxUser || '',
    mnote: data?.mnote || '',
    payment: data?.payment || 'standard',
    discount: data?.discount || '0',
    kv: data?.kv || '0',
    instDates: data?.instDates || [],
    rows: data?.rows || [],
    taskBlocks: data?.taskBlocks || [],
    scBlocks: data?.scBlocks || [],
  };
}

export default function Builder({ initialData, onSave }) {
  const [s, setS] = useState(() => initState(initialData));
  const [rowCounter, setRowCounter] = useState(() => {
    if (initialData?.rows?.length) return Math.max(...initialData.rows.map(r => r.id));
    return 0;
  });
  const [blockCounter, setBlockCounter] = useState(0);
  const [showCompare, setShowCompare] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (initialData) { setS(initState(initialData)); } }, [initialData]);

  const set = useCallback((key, val) => setS(prev => ({ ...prev, [key]: val })), []);

  // Payment installment dates sync
  useEffect(() => {
    const n = s.payment === '3' ? 3 : s.payment === '4' ? 4 : 0;
    if (n) {
      const dates = [...s.instDates];
      while (dates.length < n) dates.push({ date: '' });
      setS(prev => ({ ...prev, instDates: dates.slice(0, n) }));
    } else {
      setS(prev => ({ ...prev, instDates: [] }));
    }
  }, [s.payment]);

  const kvPct   = parseFloat(s.kv)       || 0;
  const discPct = parseFloat(s.discount) || 0;
  const totSum  = getTotalSum(s.rows, kvPct);
  const discAmt = Math.round(totSum * discPct / 100);
  const totCount = s.rows.reduce((acc, r) => acc + (parseInt(r.count) || 0), 0);

  const errors = touched ? REQUIRED_FIELDS.reduce((acc, f) => {
    if (!s[f].trim()) acc[f] = 'Обязательное поле';
    return acc;
  }, {}) : {};
  const hasRows = s.rows.some(r => (parseInt(r.count) || 0) > 0);
  const isValid = Object.keys(errors).length === 0 && hasRows;

  const progress = (() => {
    const checks = [...REQUIRED_FIELDS.map(f => !!s[f].trim()), hasRows];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  })();

  // Row ops
  const addRow = useCallback(() => {
    const id = rowCounter + 1;
    setRowCounter(id);
    setS(prev => ({ ...prev, rows: [...prev.rows, newRow(id)] }));
  }, [rowCounter]);

  const addPreset = useCallback((key) => {
    const presets = {
      base:     { name: 'Базовый',           region: 'РФ',     clinic: 'Стандарт', ochnye: 'bezlimit',  dom: 'no',      stom: 'no',   checkup: 'no',  obs: 'yes',    anal: 'limit',   semya: 'no',  psikh: 'no',       gosp: 'no'  },
      standard: { name: 'Стандарт',          region: 'РФ',     clinic: 'Стандарт', ochnye: 'bezlimit',  dom: 'no',      stom: 'base', checkup: 'no',  obs: 'kt_mrt', anal: 'bezlimit', semya: 'yes', psikh: 'no',       gosp: 'esp' },
      extended: { name: 'Расширенный',       region: 'РФ',     clinic: 'Бизнес',   ochnye: 'app_rassh', dom: '2',       stom: 'rassh',checkup: 'yes', obs: 'inc',    anal: 'inc',      semya: 'yes', psikh: '4',        gosp: 'pesp'},
      vip:      { name: 'VIP / Руководство', region: 'Москва', clinic: 'ВИП',      ochnye: 'app_rassh', dom: 'bezlimit',stom: 'rassh',checkup: 'yes', obs: 'inc',    anal: 'inc',      semya: 'yes', psikh: 'bezlimit', gosp: 'pesp'},
    };
    const id = rowCounter + 1;
    setRowCounter(id);
    setS(prev => ({ ...prev, rows: [...prev.rows, { ...newRow(id), ...presets[key], priceOverride: '' }] }));
    setShowPresets(false);
  }, [rowCounter]);

  const updateRow = useCallback((id, key, val) => {
    setS(prev => ({
      ...prev,
      rows: prev.rows.map(r => {
        if (r.id !== id) return r;
        const updated = { ...r, [key]: val };
        if (key === 'ochnye') {
          if (val === 'app_rassh') { updated.obs = 'inc'; updated.anal = 'inc'; }
          else { if (r.obs === 'inc') updated.obs = ''; if (r.anal === 'inc') updated.anal = ''; }
        }
        return updated;
      }),
    }));
  }, []);

  const removeRow = useCallback((id) => setS(prev => ({ ...prev, rows: prev.rows.filter(r => r.id !== id) })), []);
  const dupRow = useCallback((id) => {
    const newId = rowCounter + 1;
    setRowCounter(newId);
    setS(prev => {
      const idx = prev.rows.findIndex(r => r.id === id);
      const clone = { ...prev.rows[idx], id: newId, name: prev.rows[idx].name + ' (копия)' };
      const next = [...prev.rows];
      next.splice(idx + 1, 0, clone);
      return { ...prev, rows: next };
    });
  }, [rowCounter]);

  // Block ops
  const addBlock = useCallback((type) => {
    const id = blockCounter + 1;
    setBlockCounter(id);
    setS(prev => ({ ...prev, [type]: [...prev[type], { id, title: '', body: '' }] }));
  }, [blockCounter]);
  const removeBlock = useCallback((type, id) => setS(prev => ({ ...prev, [type]: prev[type].filter(b => b.id !== id) })), []);
  const updateBlock = useCallback((type, id, key, val) => {
    setS(prev => ({ ...prev, [type]: prev[type].map(b => b.id === id ? { ...b, [key]: val } : b) }));
  }, []);

  const handleSave = () => {
    setTouched(true);
    if (!isValid) return;
    const entry = {
      id: Date.now(),
      client: s.client || 'Без имени',
      date: new Date().toLocaleDateString('ru-RU'),
      total: totSum,
      count: totCount,
      data: { ...s, loadKey: Date.now() },
    };
    onSave(entry);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePrint = () => {
    setTouched(true);
    if (!isValid) return;
    generateAndPrint(s);
  };

  const installPcts = s.payment === '3' ? ['33%', '33%', '33%'] : ['40%', '20%', '20%', '20%'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* TOPBAR */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Конструктор коммерческого предложения</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>СберЗдоровье Компаниям</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" onClick={() => { if (window.confirm('Сбросить все данные?')) { setS(initState(null)); setRowCounter(0); setBlockCounter(0); setTouched(false); } }}>Сброс</Btn>
          <Btn variant="secondary" onClick={handleSave}>{saved ? 'Сохранено!' : 'Сохранить'}</Btn>
          <Btn variant={isValid ? 'primary' : 'secondary'} onClick={handlePrint} disabled={touched && !isValid}>Сформировать КП</Btn>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* LEFT COLUMN */}
        <div style={{ width: 375, minWidth: 375, overflowY: 'auto', overflowX: 'hidden', padding: '14px 12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10, borderRight: '1px solid var(--border)', background: 'var(--white)', height: '100%' }}>

          {/* PROGRESS */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Готовность КП</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--g)' }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,var(--g),var(--g2))', borderRadius: 3, transition: 'width .4s' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 8 }}>
              {[...REQUIRED_FIELDS.map(f => ({ label: { client: 'Наименование', date: 'Дата КП', validity: 'Срок действия', manager: 'Менеджер', phone: 'Телефон' }[f], done: !!s[f].trim() })), { label: 'Тарифные позиции', done: hasRows }].map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--muted)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.done ? 'var(--g)' : 'var(--border)', flexShrink: 0 }} />
                  {c.label}
                </div>
              ))}
            </div>
          </Card>

          {touched && !isValid && (
            <div style={{ background: 'var(--rl)', border: '1px solid var(--rb)', borderRadius: 'var(--rs)', padding: '10px 14px', fontSize: 11, color: 'var(--red)', fontWeight: 700 }}>
              Заполните обязательные поля, выделенные красным
            </div>
          )}

          {/* CLIENT */}
          <Card>
            <CardHd>Данные клиента</CardHd>
            <Field label="Наименование" required error={errors.client}>
              <Input value={s.client} onChange={v => set('client', v)} placeholder="ООО «Ромашка»" invalid={!!errors.client} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 9 }}>
              <Field label="ИНН" style={{ margin: 0 }}>
                <Input value={s.inn} onChange={v => set('inn', v)} placeholder="7700000000" />
              </Field>
              <Field label="Дата КП" required error={errors.date} style={{ margin: 0 }}>
                <Input type="date" value={s.date} onChange={v => set('date', v)} invalid={!!errors.date} />
              </Field>
            </div>
            <Field label="Срок действия КП" required error={errors.validity}>
              <Input type="date" value={s.validity} onChange={v => set('validity', v)} invalid={!!errors.validity} />
            </Field>
          </Card>

          {/* MANAGER */}
          <Card>
            <CardHd>Менеджер</CardHd>
            <Field label="Имя и фамилия" required error={errors.manager}>
              <Input value={s.manager} onChange={v => set('manager', v)} placeholder="Иван Петров" invalid={!!errors.manager} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 9 }}>
              <Field label="Телефон" required error={errors.phone} style={{ margin: 0 }}>
                <Input value={s.phone} onChange={v => set('phone', v)} placeholder="8 999 000-00-00" invalid={!!errors.phone} />
              </Field>
              <Field label="Email" style={{ margin: 0 }}>
                <Input value={s.email} onChange={v => set('email', v)} placeholder="@sberhealth.ru" />
              </Field>
            </div>
            <Field label="MAX (Mattermost)">
              <Input value={s.maxUser} onChange={v => set('maxUser', v)} placeholder="@username" />
            </Field>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--rs)', padding: '10px 12px', marginTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>Заметка (только для вас — в КП не попадает)</div>
              <Textarea value={s.mnote} onChange={v => set('mnote', v)} placeholder="Почему такое наполнение? Особые договорённости?" style={{ border: '1px solid #fbbf24', background: 'transparent' }} />
            </div>
          </Card>

          {/* PAYMENT */}
          <Card>
            <CardHd>Условия оплаты</CardHd>
            <Field label="Формат оплаты">
              <Select value={s.payment} onChange={v => set('payment', v)} options={[
                { v: 'standard', l: 'Стандартная стоимость' },
                { v: 'full',     l: 'Единый платёж' },
                { v: '3',        l: 'Рассрочка на 3 платежа' },
                { v: '4',        l: 'Рассрочка на 4 платежа' },
              ]} />
            </Field>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--rs)', padding: '10px 12px', marginTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Скидка</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input type="number" value={s.discount} onChange={e => set('discount', e.target.value)} min="0" max="100" step="0.5"
                  style={{ width: 70, padding: '5px 8px', border: '1px solid #fbbf24', borderRadius: 5, fontFamily: 'Manrope,sans-serif', fontSize: 13, fontWeight: 700, background: 'transparent', color: 'var(--text)' }} />
                <span style={{ fontWeight: 700, color: '#92400e' }}>%</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                  {discAmt > 0 ? `= −${formatMoney(discAmt)}` : '= 0 руб.'}
                </span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>КВ (не отображается в КП)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" value={s.kv} onChange={e => set('kv', e.target.value)} min="0" max="100" step="0.5"
                  style={{ width: 70, padding: '5px 8px', border: '1px solid #fbbf24', borderRadius: 5, fontFamily: 'Manrope,sans-serif', fontSize: 13, fontWeight: 700, background: 'transparent', color: 'var(--text)' }} />
                <span style={{ fontWeight: 700, color: '#92400e' }}>%</span>
                <span style={{ fontSize: 11, color: '#92400e' }}>накидывается на цену</span>
              </div>
            </div>

            {(s.payment === '3' || s.payment === '4') && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 7 }}>Даты платежей</div>
                {s.instDates.map((d, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Платёж {i+1} ({installPcts[i]})</span>
                    <input type="date" value={d.date}
                      onChange={e => { const next = [...s.instDates]; next[i] = { ...next[i], date: e.target.value }; set('instDates', next); }}
                      style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'Manrope,sans-serif', fontSize: 11, color: 'var(--text)', background: 'var(--white)' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gd)' }}>
                      {totSum > 0 ? (() => {
                        const after = totSum - discAmt;
                        const parts = s.payment === '3'
                          ? [Math.round(after/3), Math.round(after/3), after - Math.round(after/3)*2]
                          : [Math.round(after*.4), Math.round(after*.2), Math.round(after*.2), after - Math.round(after*.4) - Math.round(after*.2)*2];
                        return formatMoney(parts[i] || 0);
                      })() : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* TASKS */}
          <Card>
            <CardHd>
              Задачи компании
              <Btn variant="secondary" onClick={() => addBlock('taskBlocks')} style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: 11 }}>+ Добавить</Btn>
            </CardHd>
            {s.taskBlocks.length === 0 && <div style={{ fontSize: 11, color: 'var(--muted)', padding: '8px 0' }}>Добавьте задачи клиента — они попадут в КП</div>}
            {s.taskBlocks.map(b => (
              <div key={b.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--rs)', padding: '10px 12px', marginBottom: 6, background: 'var(--bg)', position: 'relative' }}>
                <button onClick={() => removeBlock('taskBlocks', b.id)} style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 12 }}>&#10005;</button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <input value={b.title} onChange={e => updateBlock('taskBlocks', b.id, 'title', e.target.value)} placeholder="Задача" style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'Manrope,sans-serif', fontSize: 12, fontWeight: 700, background: 'var(--white)', color: 'var(--text)', outline: 'none' }} />
                  <input value={b.body}  onChange={e => updateBlock('taskBlocks', b.id, 'body',  e.target.value)} placeholder="Описание" style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'Manrope,sans-serif', fontSize: 12, background: 'var(--white)', color: 'var(--text)', outline: 'none' }} />
                </div>
              </div>
            ))}
          </Card>

          {/* SPECIAL CONDITIONS */}
          <Card>
            <CardHd>
              Специальные условия
              <Btn variant="secondary" onClick={() => addBlock('scBlocks')} style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: 11 }}>+ Добавить</Btn>
            </CardHd>
            {s.scBlocks.length === 0 && <div style={{ fontSize: 11, color: 'var(--muted)', padding: '8px 0' }}>Добавьте особые условия для этого клиента</div>}
            {s.scBlocks.map(b => (
              <div key={b.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--rs)', padding: '10px 12px', marginBottom: 6, background: 'var(--bg)', position: 'relative' }}>
                <button onClick={() => removeBlock('scBlocks', b.id)} style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 12 }}>&#10005;</button>
                <input value={b.title} onChange={e => updateBlock('scBlocks', b.id, 'title', e.target.value)} placeholder="Заголовок условия" style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'Manrope,sans-serif', fontSize: 12, fontWeight: 700, background: 'var(--white)', color: 'var(--text)', outline: 'none', marginBottom: 5 }} />
                <textarea value={b.body} onChange={e => updateBlock('scBlocks', b.id, 'body', e.target.value)} placeholder="Описание условия" style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'Manrope,sans-serif', fontSize: 12, background: 'var(--white)', color: 'var(--text)', outline: 'none', resize: 'vertical', minHeight: 60 }} />
              </div>
            ))}
          </Card>

          <Btn variant="primary" onClick={handleSave} style={{ width: '100%', justifyContent: 'center', padding: 10 }}>
            {saved ? 'Сохранено!' : 'Сохранить КП в историю'}
          </Btn>

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, height: '100%' }}>

          {/* STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              { label: 'Позиций',  val: s.rows.length },
              { label: 'Доступов', val: totCount },
              { label: 'Итого',    val: totSum > 0 ? formatMoney(totSum) : '0 руб.', green: true },
            ].map(st => (
              <div key={st.label} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{st.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 3, color: st.green ? 'var(--gd)' : 'var(--text)' }}>{st.val}</div>
              </div>
            ))}
          </div>

          {/* TARIFF TABLE */}
          <Card>
            <CardHd>
              Тарифные позиции
              <Badge variant="g" style={{ marginLeft: 'auto' }}>{s.rows.length} поз.</Badge>
            </CardHd>
            <TariffTable rows={s.rows} kvPct={kvPct} totCount={totCount} totSum={totSum} onUpdate={updateRow} onRemove={removeRow} onDup={dupRow} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <Btn variant="secondary" onClick={addRow} style={{ flex: 1, justifyContent: 'center' }}>+ Пустая позиция</Btn>
              <Btn variant="ghost" onClick={() => setShowPresets(p => !p)} style={{ flex: 1, justifyContent: 'center' }}>Шаблоны</Btn>
            </div>
            {showPresets && (
              <div style={{ marginTop: 8, background: 'var(--bg)', borderRadius: 'var(--rs)', padding: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Нажми — добавится готовая строка</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                  {[['base','Базовый'],['standard','Стандарт'],['extended','Расширенный'],['vip','VIP / Руководство']].map(([k, l]) => (
                    <Btn key={k} variant="secondary" onClick={() => addPreset(k)} style={{ justifyContent: 'flex-start', fontSize: 11 }}>{l}</Btn>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* COMPARE */}
          {s.rows.length > 1 && (
            <Card>
              <CardHd>
                Сравнение тарифов
                <Btn variant="ghost" onClick={() => setShowCompare(p => !p)} style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: 11 }}>
                  {showCompare ? 'Скрыть' : 'Показать'}
                </Btn>
              </CardHd>
              {showCompare && <CompareTable rows={s.rows} kvPct={kvPct} />}
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
