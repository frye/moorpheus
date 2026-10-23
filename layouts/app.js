/* ============================================================
   Anchor Alarm — display layout concept gallery
   All data simulated. One shared scenario:
   radius 150 ft · normal 38 ft · alarm 172 ft · no-fix 34 s
   ============================================================ */

'use strict';

const RADIUS = 150;

const STATES = {
  normal: {
    key: 'normal', mode: 'ARMED', tone: 'ok',
    dist: 38, margin: 112, bearing: 214, cog: 48, sog: 0.4,
    sats: 19, bands: 'L1+L5', acc: '~4 ft', fixAge: 1,
    link: 'DataHub · Wi-Fi', power: '12.4 V',
    lastKnown: null, noFixS: 0,
  },
  alarm: {
    key: 'alarm', mode: 'ALARM', tone: 'alarm',
    dist: 172, margin: -22, bearing: 236, cog: 52, sog: 1.8,
    sats: 17, bands: 'L1+L5', acc: '~6 ft', fixAge: 1,
    link: 'DataHub · Wi-Fi', power: '12.4 V',
    lastKnown: null, noFixS: 0,
  },
  nofix: {
    key: 'nofix', mode: 'ARMED', tone: 'warn',
    dist: null, margin: null, bearing: null, cog: null, sog: null,
    sats: 0, bands: '—', acc: '—', fixAge: null,
    link: 'DataHub · Wi-Fi', power: '12.4 V',
    lastKnown: { dist: 41, at: '02:46:26' }, noFixS: 34,
  },
};

/* ---------- helpers ---------- */

function polar(cx, cy, r, bearingDeg) {
  const th = (bearingDeg * Math.PI) / 180;
  return [cx + r * Math.sin(th), cy - r * Math.cos(th)];
}

const fmtDist = (st) =>
  st.dist != null ? st.dist : '—';
const fmtBrg = (st) => (st.bearing != null ? String(st.bearing).padStart(3, '0') + '°' : '———');
const fmtCog = (st) => (st.cog != null ? String(st.cog).padStart(3, '0') + '°' : '———');
const fmtSog = (st) => (st.sog != null ? st.sog.toFixed(1) + ' kt' : '——');

/* ---------- radar (watch circle) ---------- */

function radarSVG(st, pre) {
  const c = (n) => `var(--${pre}-${n})`;
  const cx = 180, cy = 182, edge = 145, pxft = edge / RADIUS;
  const rings = [50, 100, 150];
  const dist = st.dist != null ? st.dist : st.lastKnown.dist;
  const brgFromAnchor = st.bearing != null ? (st.bearing + 180) % 360 : 34;
  const [bx, by] = polar(cx, cy, dist * pxft, brgFromAnchor);
  const cog = st.cog != null ? st.cog : 48;
  const isNoFix = st.key === 'nofix';
  const isAlarm = st.key === 'alarm';
  const dim = isNoFix ? c('warn') : isAlarm ? c('alarm') : c('dim');
  const boatFill = isNoFix ? c('warn') : isAlarm ? c('alarm') : c('ink');
  const swingR = 40;
  const [s1x, s1y] = polar(cx, cy, swingR, 305);
  const [s2x, s2y] = polar(cx, cy, swingR, 75);

  const ringsSvg = rings
    .map((ft) => {
      const r = ft * pxft;
      const isEdge = ft === RADIUS;
      const stroke = isEdge ? (isAlarm ? c('alarm') : isNoFix ? c('warn') : c('ok')) : c('line');
      const dash = isEdge && isNoFix ? ' stroke-dasharray="7 6"' : '';
      const w = isEdge ? 2.5 : 1;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${stroke}" stroke-width="${w}"${dash}/>`;
    })
    .join('');

  const labelsSvg = rings
    .map((ft) => {
      const r = ft * pxft;
      const isEdge = ft === RADIUS;
      return `<text x="${cx + 8}" y="${cy + r - 10}" font-size="10" font-family="var(--font-mono)" fill="${isEdge ? (isAlarm ? c('alarm') : isNoFix ? c('warn') : c('ok')) : c('faint')}">${ft}${isEdge ? ' ft' : ''}</text>`;
    })
    .join('');

  const boatOpacity = isNoFix ? '0.45' : '1';
  const lastKnownNote = isNoFix
    ? `<text x="${bx + 14}" y="${by + 4}" font-size="10" font-family="var(--font-mono)" fill="${c('warn')}">last known</text>`
    : '';

  return `<svg viewBox="0 0 360 360" role="img" aria-label="Watch circle plot">
    <line x1="${cx}" y1="${cy - edge - 13}" x2="${cx}" y2="${cy - edge - 4}" stroke="${c('faint')}" stroke-width="1.5"/>
    <text x="${cx}" y="${cy - edge - 17}" font-size="12" font-family="var(--font-mono)" fill="${c('dim')}" text-anchor="middle">N</text>
    ${ringsSvg}
    ${labelsSvg}
    <path d="M ${s1x} ${s1y} A ${swingR} ${swingR} 0 0 1 ${s2x} ${s2y}" fill="none" stroke="${c('faint')}" stroke-width="1.2" stroke-dasharray="2 6"/>
    <g stroke="${dim}" stroke-width="1.6">
      <line x1="${cx - 7}" y1="${cy}" x2="${cx + 7}" y2="${cy}"/>
      <line x1="${cx}" y1="${cy - 7}" x2="${cx}" y2="${cy + 7}"/>
      <circle cx="${cx}" cy="${cy}" r="3.4" fill="${dim}" stroke="none"/>
    </g>
    ${isNoFix ? `<line x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}" stroke="${c('warn')}" stroke-width="1" stroke-dasharray="3 5" opacity="0.6"/>` : ''}
    <g transform="translate(${bx} ${by}) rotate(${cog})" opacity="${boatOpacity}">
      <polygon points="0,-13 8.5,11 -8.5,11" fill="${boatFill}"/>
    </g>
    ${lastKnownNote}
  </svg>`;
}

/* ---------- distance history chart ---------- */

function distSeries(key) {
  if (key === 'alarm')
    return [34, 36, 38, 41, 44, 48, 53, 58, 65, 73, 82, 92, 104, 117, 131, 146, 158, 168, 172, 173, 172, 172, 173, 172, 172, 171, 172, 172, 173, 172];
  if (key === 'nofix')
    return [31, 33, 35, 38, 41, 39, 38, 40, 42, 41, 41, 41];
  return [30, 32, 35, 38, 42, 46, 43, 39, 36, 33, 30, 27, 25, 28, 32, 37, 41, 44, 41, 38, 35, 33, 36, 38, 37, 38, 38, 37, 38, 38];
}

function chartSVG(st, pre, w, h) {
  const c = (n) => `var(--${pre}-${n})`;
  const pl = 48, pr = 12, pt = 12, pb = 20;
  const yMax = 200;
  const X = (t) => pl + ((t + 30) / 30) * (w - pl - pr);
  const Y = (v) => pt + (1 - v / yMax) * (h - pt - pb);
  const series = distSeries(st.key);
  const N = series.length;
  // no-fix charts end at the moment data was lost (34 s ago), not at 'now'
  const tEnd = st.key === 'nofix' ? -(st.noFixS / 60) : 0;
  const tOf = (i) => -30 + (i * (30 + tEnd)) / (N - 1);

  const lineColor = st.key === 'alarm' ? c('alarm') : st.key === 'nofix' ? c('warn') : c('accent');

  let pathPts = [];
  let started = false;
  series.forEach((v, i) => {
    if (v == null) { started = false; return; }
    pathPts.push(`${started ? 'L' : 'M'} ${X(tOf(i)).toFixed(1)} ${Y(v).toFixed(1)}`);
    started = true;
  });
  const linePath = pathPts.join(' ');

  let noDataSeg = '';
  let current = null;
  if (st.key === 'nofix') {
    const lastV = 41;
    noDataSeg = `<line x1="${X(tOf(N - 1))}" y1="${Y(lastV)}" x2="${X(0)}" y2="${Y(lastV)}" stroke="${c('warn')}" stroke-width="1.6" stroke-dasharray="4 5"/>
      <text x="${X(-4)}" y="${Y(lastV) - 10}" font-size="10" font-family="var(--font-mono)" fill="${c('warn')}" text-anchor="middle">NO DATA 34 s</text>`;
    current = `<circle cx="${X(tOf(N - 1))}" cy="${Y(lastV)}" r="4" fill="${c('warn')}"/>`;
  } else {
    const lastV = series[N - 1];
    current = `<circle cx="${X(0)}" cy="${Y(lastV)}" r="4.5" fill="${lineColor}"/>`;
  }

  const gridSvg = [0, 50, 100, 150, 200]
    .map((v) => {
      const major = v === 150;
      const lbl = major ? '150 ft' : v === 0 ? '0' : v === 200 ? '' : String(v);
      return `<line x1="${pl}" y1="${Y(v)}" x2="${w - pr}" y2="${Y(v)}" stroke="${major ? c('alarm') : c('line')}" stroke-width="${major ? 1.4 : 1}"${major ? ' stroke-dasharray="6 5"' : ''} opacity="${v === 0 ? 0.9 : 0.7}"/>
        ${lbl ? `<text x="${pl - 6}" y="${Y(v) + 3}" font-size="9.5" font-family="var(--font-mono)" fill="${major ? c('alarm') : c('faint')}" text-anchor="end">${lbl}</text>` : ''}`;
    })
    .join('');

  const xLabels = `<text x="${X(-30)}" y="${h - 6}" font-size="9.5" font-family="var(--font-mono)" fill="${c('faint')}">-30 min</text>
    <text x="${X(-15)}" y="${h - 6}" font-size="9.5" font-family="var(--font-mono)" fill="${c('faint')}">-15</text>
    <text x="${X(0)}" y="${h - 6}" font-size="9.5" font-family="var(--font-mono)" fill="${c('dim')}" text-anchor="end">now</text>`;

  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Distance to anchor, last 30 minutes">
    ${gridSvg}
    ${xLabels}
    <text x="${w - pr}" y="${Y(150) - 6}" font-size="9.5" font-family="var(--font-mono)" fill="${c('alarm')}" text-anchor="end">RADIUS 150</text>
    <path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
    ${noDataSeg}
    ${current}
  </svg>`;
}

/* ---------- margin bar ---------- */

function mbarHtml(st, cls) {
  const show = st.dist != null;
  const pct = show ? Math.min((st.dist / RADIUS) * 100, 100) : 0;
  return `<div class="${cls}-mbar"${show ? '' : ' style="opacity:0.35"'}>
    <div class="zone-g" style="width:66%"></div><div class="zone-y" style="width:21%"></div><div class="zone-r" style="width:13%"></div>
    ${show ? `<div class="marker" style="left:calc(${pct}% - 2px)"></div>` : ''}
  </div>`;
}

/* ============================================================
   PHONE SHELL
   ============================================================ */

function phoneShell(st, body) {
  const pill =
    st.key === 'alarm'
      ? '<span class="pill alarm">ALARM</span>'
      : st.key === 'nofix'
        ? '<span class="pill warn">NO FIX</span>'
        : '<span class="pill ok">ARMED</span>';

  const fresh =
    st.key === 'nofix'
      ? `<div class="p-fresh"><span>GPS searching · 0 sats</span><span class="bad">NO FIX ${st.noFixS} s</span></div>`
      : `<div class="p-fresh"><span>${st.bands} · ${st.sats} sats · acc ${st.acc}</span><span>fix ${st.fixAge} s ago</span></div>`;

  const banner =
    st.key === 'alarm'
      ? `<div class="p-banner alarm"><span>DRAG ALARM — 22 FT BEYOND RADIUS</span><span class="blink">&#9679; SOUNDING</span></div>`
      : st.key === 'nofix'
        ? `<div class="p-banner warn"><span>NO VALID POSITION — ${st.noFixS} s</span><span>last ${st.lastKnown.dist} ft · ${st.lastKnown.at}</span></div>`
        : '';

  const ctl = `<div class="p-ctl">
    <button>SET ANCHOR</button>
    <button>RADIUS 150 FT</button>
    <button class="${st.key === 'alarm' ? 'primary wide' : ''}">${st.key === 'alarm' ? 'SILENCE' : 'DISARM'}</button>
  </div>`;

  return `<div class="phone pm-scope"><div class="phone-screen">
    <div class="p-notch"></div>
    <div class="p-status"><span>02:47</span><span class="r"><span>Wi-Fi</span><span>84%</span></span></div>
    <div class="p-head">
      <div><div class="p-title">ANCHOR WATCH</div><div class="p-sub">${st.link} · anchor set 21:04</div></div>
      ${pill}
    </div>
    ${fresh}
    ${banner}
    <div class="p-body">${body}</div>
    ${ctl}
  </div></div>`;
}

/* ============================================================
   E-PAPER SHELL
   ============================================================ */

function epaperShell(st, body) {
  const banner =
    st.key === 'alarm'
      ? `<div class="e-banner"><span><span class="state-alarm">DRAG ALARM</span> · 22 FT BEYOND RADIUS · SOUNDING</span><span class="e-clock">02:47</span></div>`
      : st.key === 'nofix'
        ? `<div class="e-banner"><span><span class="state-warn">NO FIX</span> · ${st.noFixS} s · LAST ${st.lastKnown.dist} FT AT ${st.lastKnown.at}</span><span class="e-clock">02:47</span></div>`
        : `<div class="e-banner"><span><span class="state-ok">ARMED</span> · WITHIN CIRCLE</span><span class="e-clock">02:47 · FIX AGE ${st.fixAge} s</span></div>`;

  const foot =
    st.key === 'nofix'
      ? `<div class="e-foot"><span>screen updated 02:47 · full refresh &asymp; 19 s</span><span class="bad">GPS SEARCHING</span></div>`
      : `<div class="e-foot"><span>screen updated 02:47 · full refresh &asymp; 19 s</span><span>anchor set 21:04</span></div>`;

  return `<div class="epaper-wrap em-scope">
    <div class="e-label">4&Prime; e-Paper HAT+ (E) &middot; 600 &times; 400 &middot; Spectra 6 &middot; simulated</div>
    <div class="epaper">${banner}<div class="e-body">${body}</div>${foot}</div>
  </div>`;
}

/* ============================================================
   CONCEPT 01 — WATCH CIRCLE
   ============================================================ */

function rWatchPhone(st) {
  const num = st.dist != null ? st.dist : '—';
  const numCls = st.key === 'alarm' ? ' style="color:var(--p-alarm)"' : st.key === 'nofix' ? ' style="color:var(--p-warn)"' : '';
  const sub =
    st.key === 'alarm'
      ? 'RADIUS 150 FT · 22 FT BEYOND · SOG 1.8 KT'
      : st.key === 'nofix'
        ? `RADIUS 150 FT · LAST ${st.lastKnown.dist} FT AT ${st.lastKnown.at}`
        : `RADIUS 150 FT · BRG ${fmtBrg(st)} · COG ${fmtCog(st)} · ${fmtSog(st)}`;
  return `<div class="wc-plot">${radarSVG(st, 'p')}</div>
    <div class="wc-read">
      <div class="wc-dist"><span class="n mono"${numCls}>${num}</span><span class="u">ft from anchor</span></div>
      <div class="wc-sub">${sub}</div>
    </div>`;
}

function rWatchPaper(st) {
  const num = st.dist != null ? st.dist : '—';
  const numStyle =
    st.key === 'alarm' ? 'color:var(--e-red)' : st.key === 'nofix' ? 'color:var(--e-yellow)' : '';
  const stateHtml =
    st.key === 'alarm'
      ? '<div class="e-wc-state" style="color:var(--e-red)">DRAG ALARM</div>'
      : st.key === 'nofix'
        ? '<div class="e-wc-state" style="color:var(--e-yellow)">NO FIX</div>'
        : '<div class="e-wc-state" style="color:var(--e-green)">ARMED</div>';
  const rad =
    st.key === 'alarm'
      ? 'RADIUS 150 FT · 22 FT BEYOND'
      : st.key === 'nofix'
        ? `RADIUS 150 FT · LAST ${st.lastKnown.dist} FT · ${st.lastKnown.at}`
        : 'RADIUS 150 FT · MARGIN 112 FT';
  const kv = (k, v) => `<div class="e-kv"><span class="k">${k}</span><span class="v">${v}</span></div>`;
  const fixKv =
    st.key === 'nofix'
      ? kv('FIX', 'SEARCHING · 0 sats') + kv('FIX LOST', st.noFixS + ' s ago')
      : kv('FIX', `${st.sats} sats`) + kv('ACC (EST)', st.acc);
  return `<div class="e-wc">
    <div class="e-wc-plot"><svg viewBox="0 0 360 360" style="width:330px;height:auto" role="img" aria-label="Watch circle">${radarSVG(st, 'e').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg></div>
    <div class="e-wc-side">
      ${stateHtml}
      <div class="e-wc-dist"><span class="n emk-mono" style="${numStyle}">${num}</span><span class="u">ft</span></div>
      <div class="e-wc-rad">${rad}</div>
      ${kv('BRG TO ANCHOR', fmtBrg(st))}
      ${kv('COG / SOG', `${fmtCog(st)} / ${fmtSog(st)}`)}
      ${fixKv}
    </div>
  </div>`;
}

/* ============================================================
   CONCEPT 02 — BIG NUMBER
   ============================================================ */

function rBigPhone(st) {
  const numCls = st.key === 'alarm' ? 'bad' : st.key === 'nofix' ? 'na' : '';
  const unit =
    st.key === 'alarm'
      ? 'FEET — 22 FT BEYOND RADIUS'
      : st.key === 'nofix'
        ? 'FEET · NO VALID FIX'
        : 'FEET · RADIUS 150 FT';
  const margin =
    st.key === 'alarm'
      ? '<div class="bn-margin bad">DRAG ALARM — SOUNDING</div>'
      : st.key === 'nofix'
        ? `<div class="bn-last" style="margin-top:0.7rem">last known ${st.lastKnown.dist} ft at ${st.lastKnown.at}</div>`
        : '<div class="bn-margin">112 ft inside the circle</div>';
  const row =
    st.key === 'nofix'
      ? 'BRG ——— · COG ——— · SOG ——'
      : `BRG ${fmtBrg(st)} · COG ${fmtCog(st)} · SOG ${fmtSog(st)}`;
  const last =
    st.key === 'nofix'
      ? 'GPS searching · 0 sats · no fix 34 s'
      : `${st.bands} · ${st.sats} sats · acc ${st.acc} · fix ${st.fixAge} s`;
  return `<div class="bn-wrap">
    <div class="bn-label">DISTANCE TO ANCHOR</div>
    <div class="bn-num mono ${numCls}">${st.dist != null ? st.dist : '—'}</div>
    <div class="bn-unit">${unit}</div>
    ${mbarHtml(st, 'p')}
    <div class="bn-scale"><span>0</span><span>100</span><span>150 FT</span></div>
    ${margin}
    <div class="bn-row">${row}</div>
    <div class="bn-last">${last}</div>
  </div>`;
}

function rBigPaper(st) {
  const numStyle =
    st.key === 'alarm' ? 'color:var(--e-red)' : st.key === 'nofix' ? 'color:var(--e-yellow)' : '';
  const unit =
    st.key === 'alarm'
      ? 'FEET — 22 FT BEYOND RADIUS'
      : st.key === 'nofix'
        ? 'FEET · NO VALID FIX · 34 s'
        : 'FEET · RADIUS 150 FT';
  const margin =
    st.key === 'alarm'
      ? '<div class="e-bn-margin" style="color:var(--e-red)">DRAG ALARM — SOUNDING</div>'
      : st.key === 'nofix'
        ? `<div class="e-bn-sub" style="margin-top:0.6rem">last known ${st.lastKnown.dist} ft at ${st.lastKnown.at}</div>`
        : '<div class="e-bn-margin">112 FT INSIDE THE CIRCLE</div>';
  const sub =
    st.key === 'nofix'
      ? 'BRG ——— · COG ——— · SOG ——'
      : `BRG ${fmtBrg(st)} · COG ${fmtCog(st)} · SOG ${fmtSog(st)} · FIX ${st.fixAge} s`;
  return `<div class="e-bn">
    <div class="e-bn-label">DISTANCE TO ANCHOR</div>
    <div class="e-bn-num" style="${numStyle}">${st.dist != null ? st.dist : '—'}</div>
    <div class="e-bn-unit">${unit}</div>
    <div class="e-mbar">
      <div class="zone-g" style="width:66%"></div><div class="zone-y" style="width:21%"></div><div class="zone-r" style="width:13%"></div>
      ${st.dist != null ? `<div class="marker" style="left:calc(${Math.min((st.dist / RADIUS) * 100, 100)}% - 2px)"></div>` : ''}
    </div>
    <div class="e-bn-scale"><span>0</span><span>100</span><span>150 FT</span></div>
    ${margin}
    <div class="e-bn-sub">${sub}</div>
  </div>`;
}

/* ============================================================
   CONCEPT 03 — INSTRUMENT GRID
   ============================================================ */

function rGridPhone(st) {
  const na = st.key === 'nofix';
  const v = (x) => (na ? '—' : x);
  const heroNum =
    st.dist != null
      ? `${st.dist}<span style="font-size:1rem;color:var(--p-dim)"> ft</span>`
      : '<span style="color:var(--p-warn)">—</span>';
  const card = (k, val, s, extra = '') =>
    `<div class="ig-card ${extra}"><div class="k">${k}</div><div class="v">${val}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`;
  const heroSub = na
    ? `radius 150 ft · last ${st.lastKnown.dist} ft`
    : st.key === 'alarm'
      ? 'radius 150 ft · 22 ft beyond'
      : 'radius 150 ft · margin 112 ft';
  return `<div class="ig-body"><div class="ig-grid">
    <div class="ig-card hero"><div><div class="k">DISTANCE TO ANCHOR</div><div class="s">${heroSub}</div></div><div class="n mono">${heroNum}</div></div>
    ${card('BRG TO ANCHOR', v(fmtBrg(st)))}
    ${card('COG · SOG', v(`${fmtCog(st)} · ${fmtSog(st)}`))}
    ${card('GPS FIX', v(`${st.sats} sats`), na ? 'searching' : st.bands, na ? 'bad' : '')}
    ${card('ACCURACY (EST)', v(st.acc))}
    ${card('FIX AGE', na ? '—' : st.fixAge + ' s', na ? 'no fix ' + st.noFixS + ' s' : '', na ? 'na' : '')}
    ${card('DATA LINK', st.link, 'connected')}
    ${card('HOUSE BANK', st.power, 'unit supply')}
    ${card('ALARM SOUNDER', st.key === 'alarm' ? 'SOUNDING' : 'STANDBY', '', st.key === 'alarm' ? 'bad' : '')}
  </div></div>`;
}

function rGridPaper(st) {
  const na = st.key === 'nofix';
  const v = (x) => (na ? '—' : x);
  const cell = (k, val, s = '', hero = false) =>
    `<div class="e-ig-cell${hero ? ' hero' : ''}"><div class="k">${k}</div><div class="v">${val}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`;
  const heroSub = na
    ? `radius 150&nbsp;ft · last ${st.lastKnown.dist}&nbsp;ft`
    : st.key === 'alarm'
      ? 'radius 150&nbsp;ft · 22&nbsp;ft beyond'
      : 'radius 150&nbsp;ft · margin 112&nbsp;ft';
  return `<div class="e-ig"><div class="e-ig-grid">
    ${cell('DISTANCE TO ANCHOR', (st.dist != null ? st.dist : '—') + ' ft', heroSub, true)}
    ${cell('BRG TO ANCHOR', v(fmtBrg(st)))}
    ${cell('COG · SOG', v(`${fmtCog(st)} · ${fmtSog(st)}`))}
    ${cell('GPS FIX', v(`${st.sats} sats`), na ? 'searching' : st.bands)}
    ${cell('ACCURACY (EST)', v(st.acc), 'estimate')}
    ${cell('FIX AGE', na ? '—' : st.fixAge + ' s', na ? 'no fix ' + st.noFixS + ' s' : 'fresh')}
    ${cell('DATA LINK', 'DataHub', 'Wi-Fi · connected')}
    ${cell('HOUSE BANK', st.power, 'unit supply')}
    ${cell('ALARM SOUNDER', st.key === 'alarm' ? 'SOUNDING' : 'STANDBY')}
  </div></div>`;
}

/* ============================================================
   CONCEPT 04 — SWING HISTORY
   ============================================================ */

function rSwingPhone(st) {
  const now =
    st.key === 'nofix'
      ? `<span class="now" style="color:var(--p-warn)">— ft</span>`
      : `<span class="now"${st.key === 'alarm' ? ' style="color:var(--p-alarm)"' : ''}>${st.dist} ft</span>`;
  const stats =
    st.key === 'nofix'
      ? `<span>BRG <b>———</b></span><span>COG <b>———</b></span><span>SOG <b>——</b></span><span>FIX <b style="color:var(--p-alarm)">lost 34 s</b></span>`
      : `<span>BRG <b>${fmtBrg(st)}</b></span><span>COG <b>${fmtCog(st)}</b></span><span>SOG <b>${fmtSog(st)}</b></span><span>FIX <b>${st.fixAge} s · ${st.sats} sats</b></span>`;
  return `<div class="sh-body">
    <div class="sh-title"><span>DISTANCE TO ANCHOR · LAST 30 MIN</span>${now}</div>
    <div class="sh-chart">${chartSVG(st, 'p', 330, 215)}</div>
    <div class="sh-stats">${stats}</div>
  </div>`;
}

function rSwingPaper(st) {
  const now =
    st.key === 'nofix'
      ? `<span class="now" style="color:var(--e-yellow)">— ft</span>`
      : `<span class="now"${st.key === 'alarm' ? ' style="color:var(--e-red)"' : ''}>${st.dist} ft</span>`;
  const stats =
    st.key === 'nofix'
      ? `<span>BRG <b>———</b></span><span>COG <b>———</b></span><span>SOG <b>——</b></span><span>FIX <b style="color:var(--e-red)">lost 34 s</b></span>`
      : `<span>BRG <b>${fmtBrg(st)}</b></span><span>COG <b>${fmtCog(st)}</b></span><span>SOG <b>${fmtSog(st)}</b></span><span>FIX <b>${st.fixAge} s · ${st.sats} sats</b></span>`;
  return `<div class="e-sh">
    <div class="e-sh-title"><span>DISTANCE TO ANCHOR · LAST 30 MIN</span>${now}</div>
    <div class="e-sh-chart">${chartSVG(st, 'e', 556, 240)}</div>
    <div class="e-sh-stats">${stats}<span style="margin-left:auto">updated 02:45</span></div>
  </div>`;
}

/* ============================================================
   CONCEPT 05 — STATUS LEDGER
   ============================================================ */

function ledgerRows(st, pre) {
  const ok = (rk, rv, stx) => ({ cls: 'ok', rk, rv, stx });
  const rows = [];
  if (st.key === 'alarm') {
    rows.push({ cls: 'bad', rk: 'ANCHOR ALARM', rv: '172 ft vs 150 ft radius', stx: 'SOUNDING' });
  } else if (st.key === 'nofix') {
    rows.push(ok('ANCHOR ALARM', 'armed · radius 150 ft', 'ARMED'));
  } else {
    rows.push(ok('ANCHOR ALARM', 'armed · radius 150 ft · 38 ft', 'ARMED'));
  }
  if (st.key === 'nofix') {
    rows.push({ cls: 'bad', rk: 'GPS FIX', rv: 'searching · 0 sats · lost 34 s', stx: 'FAULT' });
  } else {
    rows.push(ok('GPS FIX', `${st.bands} · ${st.sats} sats · age 1&nbsp;s`, 'OK'));
  }
  rows.push(ok('DATA LINK', st.link.toLowerCase() + ' · phone connected', 'OK'));
  rows.push(ok('ALARM SOUNDER', st.key === 'alarm' ? 'sounding — drag alarm' : 'standby', st.key === 'alarm' ? 'ON' : 'READY'));
  rows.push(ok('E-PAPER', 'updated 02:45 · full refresh', 'OK'));
  rows.push(ok('POWER', st.power + ' house bank', 'OK'));
  return rows;
}

function ledgerEvents(st) {
  if (st.key === 'alarm')
    return [
      { t: '02:33', x: 'DRAG ALARM — position beyond radius', hot: true },
      { t: '02:31', x: 'swing re-centered' },
      { t: '01:12', x: 'fix degraded 12 s — recovered' },
      { t: '21:06', x: 'armed · radius 150 ft' },
    ];
  if (st.key === 'nofix')
    return [
      { t: '02:46', x: 'GPS fix lost — antenna check advised', hot: true },
      { t: '02:31', x: 'swing re-centered' },
      { t: '01:12', x: 'fix degraded 12 s — recovered' },
      { t: '21:06', x: 'armed · radius 150 ft' },
    ];
  return [
    { t: '02:31', x: 'swing re-centered' },
    { t: '01:12', x: 'fix degraded 12 s — recovered' },
    { t: '21:06', x: 'armed · radius 150 ft' },
    { t: '21:04', x: 'anchor position set' },
  ];
}

function rLedgerPhone(st) {
  const rows = ledgerRows(st)
    .map(
      (r) => `<div class="led-row ${r.cls}"><span class="dot"></span><span class="rk">${r.rk}</span><span class="rv">${r.rv}</span><span class="st">${r.stx}</span></div>`
    )
    .join('');
  const events = ledgerEvents(st)
    .map((e) => `<div class="led-ev${e.hot ? ' hot' : ''}"><span class="t">${e.t}</span><span>${e.x}</span></div>`)
    .join('');
  return `<div class="led-body">
    <div class="led-rows">${rows}</div>
    <div class="led-log"><div class="lt">EVENT LOG</div>${events}</div>
  </div>`;
}

function rLedgerPaper(st) {
  const rows = ledgerRows(st)
    .map(
      (r) => `<div class="e-led-row ${r.cls}"><span class="sq"></span><span class="rk">${r.rk}</span><span class="rv">${r.rv}</span><span class="st">${r.stx}</span></div>`
    )
    .join('');
  const events = ledgerEvents(st)
    .map((e) => `<div class="e-ev${e.hot ? ' hot' : ''}"><span class="t">${e.t}</span><span>${e.x}</span></div>`)
    .join('');
  return `<div class="e-led">
    <div class="e-led-rows">${rows}</div>
    <div class="e-led-log"><div class="lt">EVENT LOG</div>${events}</div>
  </div>`;
}

/* ============================================================
   GALLERY
   ============================================================ */

const CONCEPTS = [
  {
    id: 'watch', num: '01', name: 'Watch Circle', tag: 'spatial at a glance',
    note: 'Polar plot centered on the anchor with the alarm boundary as the outer ring. The best single picture of the anchorage: where the boat is, which way it is swinging, and how much margin is left.',
    phone: rWatchPhone, epaper: rWatchPaper,
  },
  {
    id: 'big', num: '02', name: 'Big Number', tag: 'readable across the cabin',
    note: 'One giant distance readout with a green-yellow-red margin bar. Trades all detail for glanceability — strongest when paired with the buzzer and a slow e-paper refresh.',
    phone: rBigPhone, epaper: rBigPaper,
  },
  {
    id: 'grid', num: '03', name: 'Instrument Grid', tag: 'data-dense monitoring',
    note: 'Every key metric in cards: distance, bearing, fix quality, link, sounder, power. The most complete single screen, but no spatial picture of the swing.',
    phone: rGridPhone, epaper: rGridPaper,
  },
  {
    id: 'swing', num: '04', name: 'Swing History', tag: 'drift vs. swing',
    note: 'A 30-minute distance trend dominates, with the 150 ft radius as a threshold line. Separates a slow drag from normal swinging — the chart is the screen.',
    phone: rSwingPhone, epaper: rSwingPaper,
  },
  {
    id: 'ledger', num: '05', name: 'Status Ledger', tag: '3 a.m. fault triage',
    note: 'Subsystem health rows plus an event log. Answers the half-awake question directly: what is wrong, since when, and is the alarm itself healthy?',
    phone: rLedgerPhone, epaper: rLedgerPaper,
  },
];

const sel = { concept: 'watch', canvas: 'epaper', state: 'normal' };

const $ = (id) => document.getElementById(id);

function buildControls() {
  $('conceptTabs').innerHTML = CONCEPTS.map(
    (c) => `<button class="ctab" role="tab" data-id="${c.id}" aria-selected="${sel.concept === c.id}"><span class="num">${c.num}</span>${c.name}</button>`
  ).join('');

  $('canvasSeg').innerHTML = `
    <button data-id="epaper" aria-pressed="${sel.canvas === 'epaper'}">E-Paper 4&Prime;</button>
    <button data-id="phone" aria-pressed="${sel.canvas === 'phone'}">Phone app</button>`;

  $('stateSeg').innerHTML = `
    <button data-id="normal" aria-pressed="${sel.state === 'normal'}">Normal</button>
    <button data-id="alarm" class="alarm" aria-pressed="${sel.state === 'alarm'}">Alarm</button>
    <button data-id="nofix" class="warn" aria-pressed="${sel.state === 'nofix'}">No fix</button>`;

  const nb = $('nightBtn');
  nb.disabled = sel.canvas === 'epaper';
  nb.setAttribute('aria-pressed', document.body.classList.contains('night') ? 'true' : 'false');
}

function currentMockup() {
  const st = STATES[sel.state];
  const c = CONCEPTS.find((x) => x.id === sel.concept);
  return sel.canvas === 'phone' ? phoneShell(st, c.phone(st)) : epaperShell(st, c.epaper(st));
}

function renderStage() {
  $('fitbox').innerHTML = `<div class="fit-inner">${currentMockup()}</div>`;
  const c = CONCEPTS.find((x) => x.id === sel.concept);
  $('caption').innerHTML = `<div class="c-name"><span class="num">${c.num}</span>${c.name}<span class="c-tag">${c.tag}</span></div><p class="c-note">${c.note}</p>`;
  fitStage();
  document.querySelectorAll('#conceptTabs .ctab').forEach((b) => b.setAttribute('aria-selected', b.dataset.id === sel.concept));
  document.querySelectorAll('#canvasSeg button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.id === sel.canvas));
  document.querySelectorAll('#stateSeg button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.id === sel.state));
  $('nightBtn').disabled = sel.canvas === 'epaper';
  document.querySelectorAll('.thumb').forEach((t) => t.setAttribute('aria-pressed', t.dataset.id === sel.concept));
}

function fitStage() {
  const inner = document.querySelector('#fitbox .fit-inner');
  if (!inner) return;
  // measure the content (phone / epaper-wrap), not the flex wrapper,
  // which can be stretched to a stale container height
  const content = inner.firstElementChild || inner;
  const wrap = document.querySelector('.stage-wrap');
  const availW = wrap.clientWidth - 16;
  const availH = Math.max(300, window.innerHeight - 330);
  const w = content.offsetWidth || 1;
  const h = content.offsetHeight || 1;
  const s = Math.min(1, availW / w, availH / h);
  inner.style.transform = `scale(${s})`;
  $('fitbox').style.height = h * s + 'px';
}

function buildThumbs() {
  const st = STATES.normal;
  $('thumbs').innerHTML = CONCEPTS.map((c) => {
    const paper = epaperShell(st, c.epaper(st));
    return `<button class="thumb" data-id="${c.id}" aria-pressed="${sel.concept === c.id}">
      <div class="thumb-view"><div class="fit-inner">${paper}</div></div>
      <div><div class="thumb-name"><span class="num">${c.num}</span>${c.name}</div><div class="thumb-tag">${c.tag}</div></div>
    </button>`;
  }).join('');
}

/* ---------- events ---------- */

document.addEventListener('click', (e) => {
  const tab = e.target.closest('#conceptTabs .ctab');
  const seg = e.target.closest('#canvasSeg button, #stateSeg button');
  const thumb = e.target.closest('.thumb');
  const night = e.target.closest('#nightBtn');

  if (tab) { sel.concept = tab.dataset.id; renderStage(); }
  else if (seg) {
    sel[seg.parentElement.id === 'canvasSeg' ? 'canvas' : 'state'] = seg.dataset.id;
    renderStage();
  }
  else if (thumb) { sel.concept = thumb.dataset.id; renderStage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  else if (night) {
    document.body.classList.toggle('night');
    night.setAttribute('aria-pressed', document.body.classList.contains('night') ? 'true' : 'false');
  }
});

window.addEventListener('resize', fitStage);

/* ---------- boot ---------- */

buildControls();
buildThumbs();
renderStage();
