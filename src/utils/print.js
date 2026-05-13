import { getRowPrice, getTotalSum, getInstallmentParts, formatMoney, formatDate, pluralSotrudnik, getKpNumber, buildContentLines } from './calc';
import { COMPARE_OPTIONS } from '../data/tariffs';

const LOGO_WHITE_URL = '/logo-white.png';

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function generateAndPrint(state) {
  const { client, inn, date, validity, manager, phone, email, maxUser, payment, discount, kv, instDates, rows, taskBlocks, scBlocks } = state;

  const kvPct   = parseFloat(kv)       || 0;
  const discPct = parseFloat(discount) || 0;
  // Use pre-calculated values if passed, otherwise recalculate
  const totCount = rows.reduce((s, r) => s + (parseInt(r.count) || 0), 0);
  const totSum   = state.totSum  !== undefined ? state.totSum  : rows.reduce((s, r) => s + (parseFloat(r.price)||0)*(parseInt(r.count)||0), 0);
  const kvAmt    = state.kvAmt   !== undefined ? state.kvAmt   : Math.round(totSum * kvPct / 100);
  const totWithKv = totSum + kvAmt;
  const discAmt  = state.discAmt !== undefined ? state.discAmt : Math.round(totWithKv * discPct / 100);
  const afterDisc = state.afterDisc !== undefined ? state.afterDisc : totWithKv - discAmt;
  const kpNum = getKpNumber();
  const ds = formatDate(date);
  const vs = formatDate(validity);
  const payLabels = { standard: 'Стандартная стоимость', full: 'Единый платёж', '3': 'Рассрочка на 3 платежа', '4': 'Рассрочка на 4 платежа' };
  const payLbl = payLabels[payment] || '';

  // ── Tariff rows ──
  const tRows = rows.map(r => {
    const n = parseInt(r.count) || 0;
    const p = parseFloat(r.price) || 0;
    const rt = p * n;
    const isVip = r.clinic === 'ВИП';
    const lines = buildContentLines(r);
    return `<tr>
      <td><span class="tag ${isVip ? 'tag-vip' : 'tag-blue'}">${esc(r.name || '—')}</span></td>
      <td class="content-cell">${lines.map(l => `<span class="bullet">&#8226; ${esc(l)}</span>`).join('')}</td>
      <td>${esc(r.region || '—')}</td>
      <td>${esc(r.clinic || '—')}</td>
      <td class="num">${n || '—'}</td>
      <td class="num">${p ? formatMoney(p) : '—'}</td>
      <td class="num">${rt > 0 ? formatMoney(rt) : '—'}</td>
    </tr>`;
  }).join('');

  const discRows = discPct > 0 && totSum > 0 ? `
    <tr class="disc-row"><td colspan="5">Скидка ${discPct}%</td><td></td><td class="num">&#8722;${formatMoney(discAmt)}</td></tr>
    <tr class="disc-row bold"><td colspan="5">Итого со скидкой</td><td></td><td class="num">${formatMoney(afterDisc)}</td></tr>` : '';

  // ── Installment ──
  let instHTML = '';
  if ((payment === '3' || payment === '4') && afterDisc > 0 && instDates.length) {
    const cells = instDates.map((d, i) => {
      const pct = parseFloat(d.pct) || 0;
      const amt = Math.round(afterDisc * pct / 100);
      const dStr = d.date ? formatDate(d.date) : '—';
      return `<div class="inst-cell">
        <div class="ic-lbl">Платёж ${i + 1} · ${pct}%</div>
        <div class="ic-date">${dStr}</div>
        <div class="ic-val">${formatMoney(amt)}</div>
      </div>`;
    }).join('');
    instHTML = `<div class="p-section avoid-break"><h2>График платежей</h2>
      <div class="inst-grid" style="grid-template-columns:repeat(${instDates.length},1fr)">${cells}</div></div>`;
  }

  // ── Tasks ──
  const tasksHTML = taskBlocks.length
    ? `<ul class="task-list">${taskBlocks.map(b => `<li class="avoid-break"><span class="task-title">${esc(b.title || '—')}</span>${b.body ? ` <span class="task-body">${esc(b.body)}</span>` : ''}</li>`).join('')}</ul>`
    : '<p style="color:#9ca3af;font-size:12px;">Задачи не указаны</p>';

  // ── Special conditions ──
  const scHTML = scBlocks.length
    ? scBlocks.map(b => `<div class="sc-item avoid-break">${b.title ? `<div class="sc-title">${esc(b.title)}</div>` : ''}${b.body ? `<div class="sc-body">${esc(b.body)}</div>` : ''}</div>`).join('')
    : '';

  // ── Compare ──
  let cmpHTML = '';
  if (rows.length > 1) {
    const headerCols = rows.map(r => `<th>${esc(r.name)}</th>`).join('');
    const bodyRows = COMPARE_OPTIONS.map(opt => {
      const vals = rows.map(r => {
        const isApp = r.ochnye === 'app_rassh';
        if (isApp && (opt.key === 'obs' || opt.key === 'anal')) return { text: 'Безлимит', green: true };
        if (!r[opt.key] || r[opt.key] === 'no') return { text: '—', green: false };
        const labels = { ochnye: { app_rassh:'АПП Расш.',bezlimit:'Безлимит','6':'6 приёмов','4':'4 приёма' }, dom:{'2':'2 в год',bezlimit:'Безлимит'}, stom:{base:'Базовая',rassh:'Расширенная'}, checkup:{yes:'Да'}, obs:{yes:'Да',kt_mrt:'с КТ и МРТ',inc:'Безлимит'}, anal:{limit:'С лимитом',bezlimit:'Безлимит',inc:'Безлимит'}, semya:{yes:'Да'}, psikh:{bezlimit:'Безлимит',semeynyy:'Семейный','4':'4 конс.'}, gosp:{esp:'ЭСП',pesp:'ПЭСП'} };
        const l = (labels[opt.key] || {})[r[opt.key]];
        return { text: l || 'Да', green: true };
      });
      const allSame = vals.every(v => v.text === vals[0].text);
      const cells = vals.map(v => `<td class="${!allSame && v.text !== '—' ? 'diff' : ''}">${v.green ? `<span class="cmp-green">${v.text}</span>` : '<span style="color:#ccc">—</span>'}</td>`).join('');
      return `<tr><td class="rh">${opt.label}</td>${cells}</tr>`;
    }).join('');
    const priceCells = rows.map(r => `<td>${formatMoney(getRowPrice(r, kvPct))}</td>`).join('');
    const totalCells = rows.map(r => { const n = parseInt(r.count)||0; return `<td>${formatMoney(getRowPrice(r,kvPct)*n)}<br><small>${n} чел.</small></td>`; }).join('');
    cmpHTML = `<div class="p-section" style="page-break-before:always">
      <h2>Сравнение вариантов</h2>
      <table class="cmp-tbl">
        <thead><tr><th class="rh">Опция</th>${headerCols}</tr></thead>
        <tbody>${bodyRows}</tbody>
        <tfoot>
          <tr class="price-r"><td class="rh">Цена / чел.</td>${priceCells}</tr>
          <tr class="price-r"><td class="rh">Итого</td>${totalCells}</tr>
        </tfoot>
      </table>
    </div>`;
  }

  const mgr = `<div class="mgr-card avoid-break">
    <div class="mgr-av">${esc((manager || 'МН').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase())}</div>
    <div>
      <div class="mgr-name">${esc(manager || '—')}</div>
      ${phone ? `<div class="mgr-d">${esc(phone)}</div>` : ''}
      ${email ? `<div class="mgr-d green">${esc(email)}</div>` : ''}
      ${maxUser ? `<div class="mgr-d">MAX: ${esc(maxUser)}</div>` : ''}
    </div>
  </div>`;

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>${kpNum}</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Manrope',sans-serif;background:#fff;color:#1a1f2e;font-size:13px;}
.cover{background:#0d2855;color:#fff;padding:60px;min-height:100vh;display:flex;flex-direction:column;justify-content:space-between;page-break-after:always;}
.cover-logo{height:36px;width:auto;display:block;margin-bottom:40px;}
.cover-num{font-size:11px;color:rgba(255,255,255,.4);letter-spacing:.05em;margin-bottom:16px;}
.cover-h1{font-size:36px;font-weight:800;line-height:1.2;}
.cover-h1 em{color:#21c673;font-style:normal;}
.cover-meta{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:40px;}
.cover-meta-item label{display:block;font-size:9px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;}
.cover-meta-item span{font-size:13px;font-weight:600;color:#fff;}
.cover-foot{font-size:11px;color:rgba(255,255,255,.35);display:flex;justify-content:space-between;margin-top:40px;padding-top:16px;border-top:1px solid rgba(255,255,255,.1);}
.content{max-width:960px;margin:0 auto;padding:48px 60px;}
.p-section{margin-bottom:40px;}
.p-section h2{font-size:17px;font-weight:700;color:#1a1f2e;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #21c673;}
.avoid-break{page-break-inside:avoid;}
.solution-box{background:#f8fafc;border-left:3px solid #1a9e5c;padding:14px 16px;border-radius:0 6px 6px 0;font-size:12px;color:#374151;line-height:1.6;margin-top:12px;}
.task-list{list-style:none;padding:0;display:flex;flex-direction:column;gap:8px;}
.task-list li{display:flex;gap:10px;font-size:12px;align-items:baseline;}
.task-list li::before{content:"";width:7px;height:7px;min-width:7px;border-radius:50%;background:#1a9e5c;margin-top:5px;}
.task-title{font-weight:700;color:#1a1f2e;min-width:160px;}
.task-body{color:#6b7280;}
.feat-grid,.biz-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.feat-item,.biz-item{padding:12px 14px;background:#f8fafc;border-radius:6px;border-left:2.5px solid #1a9e5c;page-break-inside:avoid;}
.biz-item{background:#f0f2f5;border-left:none;}
.feat-item strong,.biz-item strong{display:block;font-size:11px;font-weight:700;margin-bottom:3px;}
.feat-item p,.biz-item p{font-size:10px;color:#6b7280;line-height:1.5;margin:0;}
.svc-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;}
.svc-item{padding:10px 12px;border:1px solid #e0e4ea;border-radius:6px;page-break-inside:avoid;}
.svc-item strong{display:block;font-size:11px;font-weight:700;margin-bottom:2px;}
.svc-item p{font-size:10px;color:#6b7280;line-height:1.4;margin:0;}
.step-list{display:flex;flex-direction:column;gap:12px;}
.step-item{display:flex;gap:14px;align-items:flex-start;page-break-inside:avoid;}
.step-num{width:28px;height:28px;min-width:28px;border-radius:50%;background:#1a4a8a;color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;}
.step-content strong{display:block;font-size:12px;font-weight:700;margin-bottom:3px;}
.step-content p{font-size:11px;color:#6b7280;line-height:1.5;margin:0;}
.kp-tbl{width:100%;border-collapse:collapse;font-size:11px;page-break-inside:auto;}
.kp-tbl thead{display:table-header-group;}
.kp-tbl th{background:#1a4a8a;color:#fff;padding:9px 11px;text-align:left;font-weight:700;font-size:10px;}
.kp-tbl td{padding:9px 11px;border-bottom:1px solid #e0e4ea;vertical-align:top;}
.content-cell{line-height:1;}
.bullet{display:block;font-size:10px;line-height:1.6;}
.num{text-align:right;font-weight:700;color:#0d7a44;}
.kp-foot td{background:#1a9e5c;color:#fff!important;font-weight:800;font-size:12px;border:none;}
.disc-row td{background:#fef9c3;color:#92400e;font-weight:700;border:none;}
.disc-row.bold td{font-weight:800;}
.tag{display:inline-block;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;}
.tag-blue{background:#dbeafe;color:#1e40af;}
.tag-vip{background:#fef3c7;color:#92400e;}
.inst-grid{display:grid;gap:10px;}
.inst-cell{background:#f0f2f5;border-radius:6px;padding:12px;page-break-inside:avoid;}
.ic-lbl{font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;}
.ic-date{font-size:10px;color:#6b7280;margin-top:2px;}
.ic-val{font-size:16px;font-weight:800;color:#1a1f2e;margin-top:3px;}
.cmp-tbl{width:100%;border-collapse:collapse;font-size:11px;}
.cmp-tbl th{background:#1a4a8a;color:#fff;padding:8px 10px;text-align:center;font-size:10px;font-weight:700;}
.cmp-tbl th.rh{text-align:left;background:#0d3060;}
.cmp-tbl td{padding:7px 10px;border-bottom:1px solid #e0e4ea;text-align:center;font-size:11px;}
.cmp-tbl td.rh{text-align:left;font-weight:600;background:#f8fafc;}
.price-r td{background:#1a9e5c;color:#fff;font-weight:800;border:none;}
.price-r td.rh{background:#0d7a44;}
.diff{background:#fef9c3;}
.cmp-green{color:#1a9e5c;font-weight:700;}
.cmp-tbl small{font-size:9px;opacity:.7;}
.sc-section{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:24px;page-break-inside:avoid;}
.sc-section h2{border-bottom-color:#fbbf24;color:#92400e;}
.sc-item{margin-bottom:10px;padding:10px 14px;background:rgba(255,255,255,.7);border-radius:6px;}
.sc-title{font-size:12px;font-weight:700;color:#92400e;margin-bottom:3px;}
.sc-body{font-size:11px;color:#78350f;line-height:1.5;}
.mgr-card{display:flex;gap:16px;background:#f8fafc;border-radius:10px;border:1px solid #e0e4ea;padding:20px;}
.mgr-av{width:44px;height:44px;min-width:44px;border-radius:50%;background:#e8f7ef;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#0d7a44;}
.mgr-name{font-size:16px;font-weight:800;}
.mgr-d{font-size:12px;color:#6b7280;margin-top:3px;}
.mgr-d.green{color:#1a9e5c;}
@media print{
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .cover{page-break-after:always;}
}
</style>
</head>
<body>

<div class="cover">
  <div>
    <img src="${LOGO_WHITE_URL}" class="cover-logo" alt="СберЗдоровье Компаниям" onerror="this.style.display='none'">
    <div class="cover-num">${kpNum}</div>
    <div class="cover-h1">Коммерческое предложение<br>для <em>${esc(client)}</em><br>на <em>${totCount}&nbsp;сотрудник${pluralSotrudnik(totCount)}</em></div>
    <div class="cover-meta">
      <div class="cover-meta-item"><label>Дата</label><span>${ds}</span></div>
      ${vs ? `<div class="cover-meta-item"><label>Действует до</label><span>${vs}</span></div>` : ''}
      ${inn ? `<div class="cover-meta-item"><label>ИНН</label><span>${esc(inn)}</span></div>` : ''}
      <div class="cover-meta-item"><label>Оплата</label><span>${payLbl}</span></div>
    </div>
  </div>
  <div class="cover-foot">
    <span>Менеджер: ${esc(manager)}</span>
    <span>${esc(phone)}</span>
  </div>
</div>

<div class="content">

<div class="p-section avoid-break">
  <h2>Задачи компании &laquo;${esc(client)}&raquo;</h2>
  ${tasksHTML}
  <div class="solution-box">
    &laquo;Корпоративное здоровье&raquo; от СберЗдоровья &mdash; широкая программа медицинского сопровождения с прямым доступом к врачам.
    Врач без согласований определяет маршрут помощи: анализы, обследования, консультации других специалистов &mdash;
    в зависимости от состояния здоровья и клинических рекомендаций.
  </div>
</div>

<div class="p-section">
  <h2>Тарифы и стоимость</h2>
  <table class="kp-tbl">
    <thead>
      <tr>
        <th style="width:80px">Тариф</th>
        <th>Наполнение</th>
        <th style="width:90px">Регион</th>
        <th style="width:70px">Клиники</th>
        <th style="width:55px;text-align:right">Дост.</th>
        <th style="width:85px;text-align:right">Цена/чел.</th>
        <th style="width:90px;text-align:right">Итого</th>
      </tr>
    </thead>
    <tbody>${tRows}</tbody>
    <tfoot>
      <tr class="kp-foot avoid-break">
        <td colspan="4">ИТОГО</td>
        <td class="num">${totCount}</td>
        <td></td>
        <td class="num">${formatMoney(totSum)}</td>
      </tr>
      ${discRows}
    </tfoot>
  </table>
</div>

${instHTML}

<div class="p-section" style="page-break-before:always">
  <h2>Особенности программы &laquo;Корпоративное здоровье&raquo;</h2>
  <div class="feat-grid">
    <div class="feat-item"><strong>Нет фиксированного годового лимита</strong><p>Объём помощи определяется состоянием сотрудника и медицинской необходимостью, а не заранее установленной суммой покрытия.</p></div>
    <div class="feat-item"><strong>Нет понятия &laquo;страховой случай&raquo;</strong><p>Сотрудник может обратиться к врачу в любой момент. Врач оценивает состояние и определяет дальнейшую тактику лечения.</p></div>
    <div class="feat-item"><strong>Нет доплат за хронические и онкологические состояния</strong><p>В отличие от ДМС, наблюдение серьёзных заболеваний не требует доплат.</p></div>
    <div class="feat-item"><strong>Прямой доступ к врачам 27 специализаций</strong><p>Без направления от терапевта &mdash; через единый цифровой сервис. Экономит время сотрудника.</p></div>
    <div class="feat-item"><strong>Помощь по всей территории России</strong><p>Более 7000 клиник-партнёров. Подключение дополнительных регионов без доплат.</p></div>
    <div class="feat-item"><strong>Сопровождение на каждом этапе</strong><p>Медсоветник помогает с записью, подбором врача редкой специальности и госпитализацией.</p></div>
    <div class="feat-item"><strong>Высокие стандарты оказания помощи</strong><p>Более 2000 врачей по 27+ специальностям, в т.ч. с учёной степенью. Строгий квалификационный отбор.</p></div>
    <div class="feat-item"><strong>Здоровье пациента на первом месте</strong><p>Врач не видит лимиты программы &mdash; принимает решения исходя из медицинской необходимости.</p></div>
    <div class="feat-item"><strong>Единый цифровой сервис</strong><p>Консультации, запись в клиники и сопровождение внутри одного сервиса. Заключения в онлайн-медкарте.</p></div>
    <div class="feat-item"><strong>Опыт работы с корпоративными клиентами</strong><p>3000 компаний доверяют СберЗдоровью здоровье своих команд. 14 лет на рынке медицинских услуг.</p></div>
  </div>
</div>

<div class="p-section">
  <h2>Бизнес-выгоды для компании</h2>
  <div class="biz-grid">
    <div class="biz-item"><strong>Нет повышающих возрастных коэффициентов</strong><p>Стоимость программы не увеличивается из-за возраста сотрудников. Бюджет предсказуем при любом составе команды.</p></div>
    <div class="biz-item"><strong>Ценность для найма и удержания</strong><p>Семейный доступ, ведение хронических состояний, частичное покрытие онкологии усиливают привлекательность работодателя.</p></div>
    <div class="biz-item"><strong>Снижение операционной нагрузки на HR</strong><p>HR-кабинет с управлением доступами, простая механика подключения, личный аккаунт-менеджер.</p></div>
    <div class="biz-item"><strong>Налоговые льготы</strong><p>Малый бизнес (УСН 15%): до 78% суммы договора в расходы (ст. 346.16 НК РФ). Средний и крупный: до 6% от ФОТ (ст. 252&ndash;255 НК РФ).</p></div>
  </div>
</div>

<div class="p-section">
  <h2>Доступные услуги</h2>
  <div class="svc-grid">
    <div class="svc-item"><strong>Онлайн-консультации врачей</strong><p>Круглосуточно, без ограничений по количеству. 25+ специальностей, включая редких специалистов.</p></div>
    <div class="svc-item"><strong>Амбулаторно-поликлиническая помощь</strong><p>Очные приёмы в клиниках-партнёрах по всей России, от фиксированного числа до безлимита.</p></div>
    <div class="svc-item"><strong>Лабораторная и инструментальная диагностика</strong><p>УЗИ, ЭКГ, ЭхоКГ, КТ, МРТ, лабораторные исследования по направлению врача.</p></div>
    <div class="svc-item"><strong>Стоматологические услуги</strong><p>Консультации, диагностика, анестезия, терапевтическое и хирургическое лечение.</p></div>
    <div class="svc-item"><strong>Наблюдение хронических состояний</strong><p>Диспансерное наблюдение с заданным объёмом консультаций, анализов и исследований.</p></div>
    <div class="svc-item"><strong>Поддерживающее наблюдение при онкологии</strong><p>Сценарии сопровождения на этапе поддерживающей терапии: осмотры, УЗИ, КТ, онкоцитология.</p></div>
    <div class="svc-item"><strong>Физиотерапия и восстановление</strong><p>Магнитотерапия, ударно-волновая терапия, групповые занятия ЛФК.</p></div>
    <div class="svc-item"><strong>Вызов врача на дом</strong><p>Выезд врача-терапевта на дом в пределах территории обслуживания.</p></div>
    <div class="svc-item"><strong>Чекап и профилактика</strong><p>Комплексный чекап, профилактические и оздоровительные обследования, вакцинация.</p></div>
    <div class="svc-item"><strong>Стационарная помощь</strong><p>Экстренная и плановая госпитализация.</p></div>
    <div class="svc-item"><strong>Скорая и неотложная помощь</strong><p>Организация скорой помощи в пределах территории, указанной в договоре.</p></div>
    <div class="svc-item"><strong>Медицинский советник</strong><p>Сопровождение и координация маршрута лечения на каждом этапе.</p></div>
  </div>
</div>

<div class="p-section">
  <h2>Как организована медицинская помощь</h2>
  <div class="step-list">
    <div class="step-item"><div class="step-num">1</div><div class="step-content"><strong>Сотрудник обращается к врачу онлайн</strong><p>Звонок, видео-консультация или чат. Срочные вопросы &mdash; дежурные врачи от 5 минут. Сложные &mdash; запись к специалисту, среднее ожидание до 24 часов.</p></div></div>
    <div class="step-item"><div class="step-num">2</div><div class="step-content"><strong>Врач оценивает состояние</strong><p>Собирает анамнез, уточняет жалобы, даёт рекомендации. При необходимости назначает диагностику и определяет тактику лечения.</p></div></div>
    <div class="step-item"><div class="step-num">3</div><div class="step-content"><strong>Медицинский советник помогает с записью</strong><p>Организует приём в клинике, лабораторные исследования, инструментальную диагностику или госпитализацию по медицинским показаниям.</p></div></div>
  </div>
</div>

${cmpHTML}

${scBlocks.length ? `<div class="p-section sc-section" style="page-break-before:always"><h2>Специальные условия</h2>${scHTML}</div>` : ''}

<div class="p-section"><h2>Ваш персональный менеджер</h2>${mgr}</div>

<div style="text-align:center;font-size:10px;color:#9ca3af;padding-bottom:30px;">
  ${kpNum} &nbsp;&middot;&nbsp; ${esc(client)} &nbsp;&middot;&nbsp; СберЗдоровье Компаниям
</div>

</div>
</body>
</html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 1000);
}
