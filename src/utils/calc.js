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
