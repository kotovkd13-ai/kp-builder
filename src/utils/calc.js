import { REGION_COEFF, CLINIC_COEFF } from '../data/tariffs';

export function getRowPrice(row, kvPct) {
  const price = parseFloat(row.price) || 0;
  if (!price) return 0;
  const kv = parseFloat(kvPct) || 0;
  return kv > 0 ? Math.ceil(price * (1 + kv / 100) / 10) * 10 : price;
}

export function getTotalSum(rows, kvPct) {
  return rows.reduce((s, r) => {
    const n = parseInt(r.count) || 0;
    return s + getRowPrice(r, kvPct) * n;
  }, 0);
}

export function getInstallmentParts(fmt, total) {
  if (fmt === '3') {
    const p = Math.round(total / 3);
    return [p, p, total - p * 2];
  }
  if (fmt === '4') {
    const p1 = Math.round(total * 0.4);
    const p2 = Math.round(total * 0.2);
    return [p1, p2, p2, total - p1 - p2 * 2];
  }
  return [];
}

export function formatMoney(n) {
  return Math.round(n).toLocaleString('ru') + '\u00a0\u20bd';
}

export function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return d; }
}

export function pluralSotrudnik(n) {
  if (n % 10 === 1 && n % 100 !== 11) return '';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'а';
  return 'ов';
}

export function getKpNumber() {
  const year = new Date().getFullYear();
  const key = `kp_counter_${year}`;
  const n = (parseInt(localStorage.getItem(key)) || 0) + 1;
  localStorage.setItem(key, n);
  return `КП-${year}-${String(n).padStart(4, '0')}`;
}

export function newRow(counter) {
  return {
    id: counter,
    name: `Вариант ${counter}`,
    region: 'РФ',
    clinic: 'Стандарт',
    count: '',
    ochnye: '',
    dom: '',
    stom: '',
    checkup: '',
    obs: '',
    anal: '',
    semya: '',
    psikh: '',
    gosp: '',
    price: '',
  };
}

export function buildContentLines(row) {
  const lines = ['Безлимитные онлайн-консультации (25 специальностей)', 'Медицинский советник'];
  const L = {
    ochnye: { app_rassh: 'АПП Расширенная', bezlimit: 'Безлимит на очные приёмы', '6': '6 очных приёмов', '4': '4 очных приёма' },
    dom: { '2': 'Выезд врача на дом (2 в год)', bezlimit: 'Выезд врача на дом (безлимит)' },
    stom: { base: 'Стоматология (базовая)', rassh: 'Стоматология (расширенная)' },
    checkup: { yes: 'Чекап (мужской/женский)' },
    obs: { yes: 'Обследования', kt_mrt: 'Обследования (с КТ и МРТ)', inc: 'Обследования безлимит' },
    anal: { limit: 'Анализы (с лимитом)', bezlimit: 'Анализы (безлимит)', inc: 'Анализы безлимит' },
    semya: { yes: 'Семейный доступ (+1 взр + 3 реб)' },
    psikh: { bezlimit: 'Психолог (безлимит)', semeynyy: 'Психолог (семейный)', '4': 'Психолог (4 конс.)' },
    gosp: { esp: 'Госпитализация (ЭСП)', pesp: 'Госпитализация (ПЭСП)' },
  };
  if (row.ochnye === 'app_rassh') {
    lines.push('АПП Расширенная (очные приёмы)', 'Обследования + КТ и МРТ (безлимит)', 'Анализы (безлимит)');
  } else {
    const lo = L.ochnye[row.ochnye]; if (lo) lines.push(lo);
    const obsV = row.obs === 'inc' ? L.obs.inc : L.obs[row.obs]; if (obsV) lines.push(obsV);
    const anV  = row.anal === 'inc' ? L.anal.inc : L.anal[row.anal]; if (anV) lines.push(anV);
  }
  ['dom','stom','checkup','semya','psikh','gosp'].forEach(k => {
    const lbl = L[k][row[k]]; if (lbl) lines.push(lbl);
  });
  lines.push('Бонус: скидки от партнёров до -25%');
  return lines;
}

export function getCountIdx(n) {
  for (let i = COUNT_THRESHOLDS.length - 1; i >= 0; i--) {
    if (n >= COUNT_THRESHOLDS[i]) return i;
  }
  return 0;
}

/**
 * Correct formula (reverse-engineered from Excel):
 *
 * Price = (APP/очные + DOM + STOM + GOSP + OBS + ANAL) × region × clinic
 *       + (BASE + SEMYA + PSIKH + CHECKUP)
 *
 * BASE, SEMYA, PSIKH, CHECKUP — не умножаются на регион/клиники.
 * Всё остальное — умножается.
 */
export function calcBasePrice(row) {
  const n = parseInt(row.count) || 0;
  if (!n) return 0;
  const i = getCountIdx(n);

  // ── Блок 1: × регион × клиники ──
  let variable = 0;

  if (row.ochnye === '4')             variable += TARIFFS.app4[i];
  else if (row.ochnye === '6')        variable += TARIFFS.app6[i];
  else if (row.ochnye === 'bezlimit') variable += TARIFFS.appBez[i];
  else if (row.ochnye === 'app_rassh') variable += TARIFFS.appRassh[i];

  if (row.stom === 'base')            variable += TARIFFS.stomBase[i];
  else if (row.stom === 'rassh')      variable += TARIFFS.stomRassh[i];

  if (row.ochnye !== 'app_rassh') {
    if (row.obs === 'yes')            variable += TARIFFS.obs[i];
    else if (row.obs === 'kt_mrt')    variable += TARIFFS.obs[i] + TARIFFS.ktmrt[i];
    if (row.anal === 'limit')         variable += TARIFFS.anal[i] * 0.5;
    else if (row.anal === 'bezlimit') variable += TARIFFS.anal[i];
  }

  if (row.dom === '2')                variable += TARIFFS.dom2[i];
  else if (row.dom === 'bezlimit')    variable += TARIFFS.domBez[i];

  if (row.gosp === 'esp')             variable += TARIFFS.esp[i];
  else if (row.gosp === 'pesp')       variable += TARIFFS.pesp[i];

  // ── Блок 2: фиксированные (без коэффициентов) ──
  let fixed = TARIFFS.base[i]; // BASE всегда включена

  if (row.semya === 'yes')            fixed += TARIFFS.semya[i];
  if (row.psikh === 'bezlimit')       fixed += TARIFFS.psikh_bez[i];
  else if (row.psikh === 'semeynyy')  fixed += TARIFFS.psikh_sem[i];
  else if (row.psikh === '4')         fixed += TARIFFS.psikh_4[i];
  if (row.checkup === 'yes')          fixed += TARIFFS.checkup[i];

  const rCoeff = REGION_COEFF[row.region] || 1.0;
  const cCoeff = CLINIC_COEFF[row.clinic] || 1.0;

  // Excel использует ROUNDUP до ближайших 10 рублей (как в справочнике)
  const raw = variable * rCoeff * cCoeff + fixed;
  return Math.ceil(raw / 10) * 10;
}

export function getRowPrice(row, kvPct) {
  const base   = calcBasePrice(row);
  const manual = parseFloat(row.priceOverride) || 0;
  let price    = manual > 0 ? manual : base;
  if (kvPct > 0) price = Math.round(price * (1 + kvPct / 100));
  return price;
}

export function getTotalSum(rows, kvPct) {
  return rows.reduce((s, r) => {
    const n = parseInt(r.count) || 0;
    return s + getRowPrice(r, kvPct) * n;
  }, 0);
}

export function getInstallmentParts(fmt, total) {
  if (fmt === '3') {
    const p = Math.round(total / 3);
    return [p, p, total - p * 2];
  }
  if (fmt === '4') {
    const p1 = Math.round(total * 0.4);
    const p2 = Math.round(total * 0.2);
    return [p1, p2, p2, total - p1 - p2 * 2];
  }
  return [];
}

export function formatMoney(n) {
  return Math.round(n).toLocaleString('ru') + '\u00a0\u20bd';
}

export function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return d; }
}

export function pluralSotrudnik(n) {
  if (n % 10 === 1 && n % 100 !== 11) return '';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'а';
  return 'ов';
}

export function getKpNumber() {
  const year = new Date().getFullYear();
  const key  = `kp_counter_${year}`;
  const n    = (parseInt(localStorage.getItem(key)) || 0) + 1;
  localStorage.setItem(key, n);
  return `КП-${year}-${String(n).padStart(4, '0')}`;
}

export function newRow(counter) {
  return {
    id: counter,
    name: `Вариант ${counter}`,
    region: 'РФ',
    clinic: 'Стандарт',
    count: '',
    ochnye: '',
    dom: '',
    stom: '',
    checkup: '',
    obs: '',
    anal: '',
    semya: '',
    psikh: '',
    gosp: '',
    priceOverride: '',
  };
}

export function buildContentLines(row) {
  const lines = [
    'Безлимитные онлайн-консультации (25 специальностей)',
    'Медицинский советник',
  ];
  const L = {
    ochnye:  { app_rassh: 'АПП Расширенная', bezlimit: 'Безлимит на очные приёмы', '6': '6 очных приёмов', '4': '4 очных приёма' },
    dom:     { '2': 'Выезд врача на дом (2 в год)', bezlimit: 'Выезд врача на дом (безлимит)' },
    stom:    { base: 'Стоматология (базовая)', rassh: 'Стоматология (расширенная)' },
    checkup: { yes: 'Чекап (мужской/женский)' },
    obs:     { yes: 'Обследования', kt_mrt: 'Обследования (с КТ и МРТ)', inc: 'Обследования безлимит' },
    anal:    { limit: 'Анализы (с лимитом)', bezlimit: 'Анализы (безлимит)', inc: 'Анализы безлимит' },
    semya:   { yes: 'Семейный доступ (+1 взр + 3 реб)' },
    psikh:   { bezlimit: 'Психолог (безлимит)', semeynyy: 'Психолог (семейный)', '4': 'Психолог (4 конс.)' },
    gosp:    { esp: 'Госпитализация (ЭСП)', pesp: 'Госпитализация (ПЭСП)' },
  };

  if (row.ochnye === 'app_rassh') {
    lines.push('АПП Расширенная (очные приёмы)', 'Обследования + КТ и МРТ (безлимит)', 'Анализы (безлимит)');
  } else {
    const lo   = L.ochnye[row.ochnye];                              if (lo)   lines.push(lo);
    const obsV = row.obs  === 'inc' ? L.obs.inc  : L.obs[row.obs]; if (obsV) lines.push(obsV);
    const anV  = row.anal === 'inc' ? L.anal.inc : L.anal[row.anal]; if (anV) lines.push(anV);
  }

  ['dom', 'stom', 'checkup', 'semya', 'psikh', 'gosp'].forEach(k => {
    const lbl = L[k][row[k]]; if (lbl) lines.push(lbl);
  });

  lines.push('Бонус: скидки от партнёров до -25%');
  return lines;
}
