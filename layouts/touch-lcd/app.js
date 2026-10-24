/* ============================================================
   Anchor Alarm — 4" square touch LCD concept gallery
   Target: Waveshare ESP32-S3-Touch-LCD-4, 480 × 480 IPS, RGB565,
   capacitive touch. All data simulated; same scenario as ../app.js:
   radius 150 ft · normal 38 ft · alarm 172 ft · no-fix 34 s
   ============================================================ */

'use strict';

const RADIUS = 150;
const SILENCE_S = 60; // bounded silence, matches the build guide's ACK policy

const STATES = {
  normal: {
    key: 'normal', dist: 38, margin: 112, bearing: 214, cog: 48, sog: 0.4,
    sats: 19, bands: 'L1+L5', acc: '~4 ft', fixAge: 1,
    link: 'DataHub', power: '12.4 V', lastKnown: null, noFixS: 0, maxDrift: 46,
  },
  alarm: {
    key: 'alarm', dist: 172, margin: -22, bearing: 236, cog: 52, sog: 1.8,
    sats: 17, bands: 'L1+L5', acc: '~6 ft', fixAge: 1,
    link: 'DataHub', power: '12.4 V', lastKnown: null, noFixS: 0, maxDrift: 173,
  },
  nofix: {
    key: 'nofix', dist: null, margin: null, bearing: null, cog: null, sog: null,
    sats: 0, bands: '—', acc: '—', fixAge: null,
    link: 'DataHub', power: '12.4 V', lastKnown: { dist: 41, at: '02:46:26' }, noFixS: 34, maxDrift: 42,
  },
};

/* ---------- helpers ---------- */

const v = (n) => `var(--${n})`;
const pad3 = (n) => String(n).padStart(3, '0') + '°';
const fmtBrg = (st) => (st.bearing != null ? pad3(st.bearing) : '———');
const fmtCog = (st) => (st.cog != null ? pad3(st.cog) : '———');
const fmtSog = (st) => (st.sog != null ? st.sog.toFixed(1) : '—.—');
const NA = '<span class="nd">--</span>';
const toneOf = (st) => (st.key === 'alarm' ? 'alarm' : st.key === 'nofix' ? 'warn' : 'ok');

function polar(cx, cy, r, deg) {
  const th = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(th), cy - r * Math.cos(th)];
}

/* boat position bearing FROM the anchor (reciprocal of bearing to anchor) */
const boatAngle = (st) => (st.bearing != null ? (st.bearing + 180) % 360 : 34);

/* ---------- icons (inline SVG, currentColor) ---------- */

const ICON = {
  lock: (open) => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="${open ? 'M8 11V7a4 4 0 0 1 7.6-1.7' : 'M8 11V7a4 4 0 0 1 8 0v4'}" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>`,
  sat: `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="currentColor"/><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
  wifi: `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M2.5 9a14 14 0 0 1 19 0M6 12.6a9 9 0 0 1 12 0M9.4 16.1a4 4 0 0 1 5.2 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="19.4" r="1.7" fill="currentColor"/></svg>`,
  batt: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="2" y="7" width="18" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="20.5" y="10" width="2" height="4" rx="1" fill="currentColor"/><rect x="4.5" y="9.5" width="11" height="5" fill="currentColor"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="currentColor"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z" fill="currentColor"/><path d="M10 21a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
  expand: `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  anchor: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="5" r="2.4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.5V21M7 11h10M4 14a8 7 0 0 0 16 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
};

/* ---------- shared status bar ----------
   44 px tall. Left: state pill + clock. Right: GNSS, link, power,
   touch-lock chip. The lock chip is the wet-screen / accidental-touch guard. */

function statusBar(st, night, opts = {}) {
  const tone = toneOf(st);
  const label = st.key === 'alarm' ? 'ALARM' : st.key === 'nofix' ? 'NO FIX' : 'ARMED';
  const gnss = st.key === 'nofix'
    ? `<span class="sb-i warn">${ICON.sat}<b>0</b></span>`
    : `<span class="sb-i">${ICON.sat}<b>${st.sats}</b></span>`;
  // in alarm the silence control bypasses the lock (it is a slide/hold, so still guarded)
  const lock = st.key === 'alarm'
    ? `<span class="sb-lock open" title="Silence control live">${ICON.lock(true)}</span>`
    : `<span class="sb-lock" title="Touch locked">${ICON.lock(false)}</span>`;
  const dim = night ? `<span class="sb-i dimlvl">${ICON.moon}<b>8%</b></span>` : '';
  return `<div class="sb${opts.onTone ? ' on-tone' : ''}">
    <span class="pill ${tone}${st.key === 'alarm' ? ' pulse' : ''}">${label}</span>
    <span class="sb-clock">02:47</span>
    <span class="sb-sp"></span>
    ${dim}
    ${gnss}
    <span class="sb-i">${ICON.wifi}</span>
    <span class="sb-i">${ICON.batt}<b>12.4</b></span>
    ${lock}
  </div>`;
}

/* hold-to-confirm button with a partial fill to show progress affordance */
function holdButton(label, sub, cls = '', progress = 0) {
  return `<div class="hold ${cls}" role="button">
    <span class="hold-fill" style="width:${progress}%"></span>
    <span class="hold-l">${label}</span>${sub ? `<span class="hold-s">${sub}</span>` : ''}
  </div>`;
}

/* slide-to-confirm track, thumb at the start position */
function slider(label, cls = '') {
  return `<div class="slide ${cls}" role="slider" aria-label="${label}" aria-valuenow="0">
    <span class="slide-thumb"><svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M5 5l7 7-7 7M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <span class="slide-l">${label}</span>
    <span class="slide-chev">›››</span>
  </div>`;
}

/* ============================================================
   CONCEPT 01 — WATCH CIRCLE
   ============================================================ */

function watchSVG(st) {
  const cx = 240, cy = 178, edge = 140, k = edge / RADIUS;
  const isA = st.key === 'alarm', isN = st.key === 'nofix';
  const dist = st.dist != null ? st.dist : st.lastKnown.dist;
  const [bx, by] = polar(cx, cy, dist * k, boatAngle(st));
  const edgeCol = isA ? v('alarm') : isN ? v('warn') : v('ok');
  const rings = [50, 100].map((ft) =>
    `<circle cx="${cx}" cy="${cy}" r="${ft * k}" fill="none" style="stroke:${v('line')}" stroke-width="1.2"/>
     <text x="${cx + 6}" y="${cy + ft * k - 6}" class="t10" style="fill:${v('faint')}">${ft}</text>`).join('');

  // swing track: recent positions as fading dots
  let track = '';
  if (!isA) {
    for (let i = 0; i < 14; i++) {
      const a = 34 + 48 * Math.sin(i * 0.5 - 2.2);
      const d = 38 + 6 * Math.sin(i * 0.7);
      const [x, y] = polar(cx, cy, d * k, a);
      track += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" style="fill:${v('dim')}" opacity="${(0.15 + i * 0.04).toFixed(2)}"/>`;
    }
  } else {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const d = 40 + (172 - 40) * (i / 10) ** 1.4;
      const a = 34 + (56 - 34) * (i / 10);
      pts.push(polar(cx, cy, d * k, a));
    }
    track = `<polyline points="${pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')}" fill="none" style="stroke:${v('alarm')}" stroke-width="2.4" stroke-dasharray="2 5" stroke-linecap="round"/>`;
  }

  // radius drag handle on the ring at 135°
  const [hx, hy] = polar(cx, cy, edge, 135);
  const handle = isA ? '' : `
    <g class="handle">
      <circle cx="${hx}" cy="${hy}" r="27" style="fill:${v('bg')};stroke:${edgeCol}" stroke-width="3"/>
      <path d="M ${hx - 11} ${hy + 11} L ${hx + 11} ${hy - 11} M ${hx + 11} ${hy - 11} l -8 0 M ${hx + 11} ${hy - 11} l 0 8 M ${hx - 11} ${hy + 11} l 8 0 M ${hx - 11} ${hy + 11} l 0 -8" style="stroke:${edgeCol}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    </g>`;

  const boatFill = isA ? v('alarm') : isN ? v('warn') : v('ink');
  const cog = st.cog != null ? st.cog : 48;
  return `<svg class="wc-svg" viewBox="0 0 480 356" width="480" height="356" role="img" aria-label="Watch circle">
    <text x="${cx}" y="${cy - edge - 12}" class="t13" text-anchor="middle" style="fill:${v('dim')}">N</text>
    ${rings}
    <circle cx="${cx}" cy="${cy}" r="${edge}" fill="none" style="stroke:${edgeCol}" stroke-width="${isA ? 5 : 4}"${isN ? ' stroke-dasharray="10 8"' : ''} class="${isA ? 'pulse-stroke' : ''}"/>
    ${track}
    <g style="stroke:${v('dim')}" stroke-width="2"><line x1="${cx - 9}" y1="${cy}" x2="${cx + 9}" y2="${cy}"/><line x1="${cx}" y1="${cy - 9}" x2="${cx}" y2="${cy + 9}"/></g>
    <circle cx="${cx}" cy="${cy}" r="4" style="fill:${v('dim')}"/>
    ${isN ? `<line x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}" style="stroke:${v('warn')}" stroke-width="1.4" stroke-dasharray="3 5"/>
             <circle cx="${bx}" cy="${by}" r="22" fill="none" style="stroke:${v('warn')}" stroke-width="1.4" stroke-dasharray="3 4"/>` : ''}
    <g transform="translate(${bx.toFixed(1)} ${by.toFixed(1)}) rotate(${cog})" opacity="${isN ? 0.5 : 1}">
      <polygon points="0,-15 10,13 0,8 -10,13" style="fill:${boatFill}"/>
    </g>
    ${handle}
  </svg>`;
}

function rWatch(st) {
  const isA = st.key === 'alarm', isN = st.key === 'nofix';
  const num = isN ? NA : st.dist;
  const sub = isA ? '<b class="c-alarm">+22 ft</b> beyond' : isN ? `last ${st.lastKnown.dist} ft<br>at ${st.lastKnown.at}` : 'margin <b>112 ft</b>';
  const maxRow = `<div class="wc-tr"><span class="k">MAX DRIFT</span><span class="v${isA ? ' c-alarm' : ''}">${st.maxDrift} ft</span></div>`;
  const tr = isN
    ? `<div class="wc-tr"><span class="k">NO FIX</span><span class="v c-warn">${st.noFixS} s</span></div>${maxRow}`
    : `${maxRow}<div class="wc-tr"><span class="k">BRG</span><span class="v">${fmtBrg(st)}</span></div>
       <div class="wc-tr"><span class="k">SOG</span><span class="v${isA ? ' c-alarm' : ''}">${fmtSog(st)} kt</span></div>`;
  const radiusChip = isA ? '' : `<div class="wc-rchip"><span class="k">RADIUS</span><b>150 ft</b><span class="hint">drag ring</span></div>`;
  const bar = isA
    ? `<div class="wc-bar">${holdButton('HOLD TO SILENCE', `${SILENCE_S} s · stays armed`, 'alarm', 35)}</div>`
    : `<div class="wc-bar">
        <div class="btn${isN ? ' disabled' : ''}">${ICON.anchor}<span>Re-set</span></div>
        <div class="btn">Radius</div>
        <div class="btn">Disarm…</div>
      </div>`;
  return `<div class="scr wc ${isA ? 'edge-alarm' : ''}">
    ${statusBar(st, sel.night)}
    <div class="wc-main">
      ${watchSVG(st)}
      <div class="wc-read">
        <div class="wc-num ${isA ? 'c-alarm' : isN ? 'c-warn' : ''}"><span class="n">${num}</span><span class="u">ft</span></div>
        <div class="wc-sub">${sub}</div>
      </div>
      <div class="wc-right">${tr}</div>
      ${radiusChip}
    </div>
    ${bar}
  </div>`;
}

/* ============================================================
   CONCEPT 02 — BIG DISTANCE
   ============================================================ */

function rBig(st) {
  const isA = st.key === 'alarm', isN = st.key === 'nofix';
  const band = isA
    ? `<div class="bd-band alarm pulse">DRAG ALARM · 22 FT BEYOND</div>`
    : isN
      ? `<div class="bd-band warn">NO FIX · ${st.noFixS} s · SEARCHING</div>`
      : `<div class="bd-band ok">INSIDE CIRCLE · MARGIN 112 FT</div>`;
  const pct = isN ? null : Math.min(st.dist / 200, 1) * 100;
  const bar = `<div class="bd-mbar${isN ? ' off' : ''}">
      <div class="z g" style="width:57%"></div><div class="z y" style="width:18%"></div><div class="z r" style="width:25%"></div>
      <div class="tick" style="left:75%"></div>
      ${pct != null ? `<div class="mk" style="left:${pct}%"></div>` : ''}
    </div>
    <div class="bd-scale"><span>0</span><span style="left:75%">150</span><span style="left:100%">200 ft</span></div>`;
  const row = isN
    ? `<div class="bd-row c-warn">last known ${st.lastKnown.dist} ft · ${st.lastKnown.at}</div>`
    : `<div class="bd-row"><span>BRG <b>${fmtBrg(st)}</b></span><span>COG <b>${fmtCog(st)}</b></span><span>SOG <b class="${isA ? 'c-alarm' : ''}">${fmtSog(st)}</b> kt</span></div>`;
  const foot = isA
    ? `<div class="bd-foot">${holdButton('HOLD TO SILENCE', `${SILENCE_S} s`, 'alarm')}</div>`
    : `<div class="bd-foot pager">
        <span class="pg-arrow" aria-hidden="true">‹</span>
        <span class="pg-mid"><span class="dots"><i class="on"></i><i></i><i></i><i></i></span><span class="pg-lbl">1/4 Distance · swipe for Track, GNSS, Power</span></span>
        <span class="pg-arrow" aria-hidden="true">›</span>
      </div>`;
  return `<div class="scr bd ${isA ? 'bd-alarm' : ''}">
    ${statusBar(st, sel.night, { onTone: isA })}
    ${band}
    <div class="bd-num ${isN ? 'c-warn' : ''}"><span class="n">${isN ? NA : st.dist}</span></div>
    <div class="bd-unit">${isA ? 'FT FROM ANCHOR · RADIUS 150' : isN ? 'FT · NO VALID POSITION' : 'FT FROM ANCHOR'}</div>
    ${bar}
    ${row}
    ${foot}
  </div>`;
}

/* ============================================================
   CONCEPT 03 — SWING TRAIL
   ============================================================ */

function trailPoints(key) {
  const pts = [];
  const N = 60; // 30 min at one point per 30 s
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    let a = 34 + 52 * Math.sin(i * 0.29) * (0.7 + 0.3 * Math.cos(i * 0.07));
    let d = 38 + 7 * Math.sin(i * 0.23 + 1) + 3 * Math.sin(i * 0.9);
    if (key === 'alarm' && i > 38) {
      const u = (i - 38) / (N - 1 - 38);
      d = d + (172 - d) * Math.min(1, u * 1.15) ** 1.3;
      a = a + (56 - a) * Math.min(1, u * 1.5);
    }
    if (key === 'nofix' && i > 47) break;
    pts.push({ a, d, t });
  }
  if (key === 'nofix') pts[pts.length - 1].d = 41;
  return pts;
}

function trailSVG(st) {
  const cx = 240, cy = 174, edge = 132;
  const isA = st.key === 'alarm', isN = st.key === 'nofix';
  // square-root radial scale: spreads out the swing near the anchor, keeps the 150 ft ring at the edge
  const R = (ft) => edge * Math.sqrt(ft / RADIUS);
  const pts = trailPoints(st.key).map((p) => ({ ...p, xy: polar(cx, cy, R(p.d), p.a) }));
  let segs = '';
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i - 1].xy, [x2, y2] = pts[i].xy;
    const out = pts[i].d > RADIUS;
    const op = (0.12 + 0.88 * pts[i].t ** 1.6).toFixed(2);
    const col = out ? v('alarm') : pts[i].t > 0.75 ? v('accent') : v('heat');
    segs += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" style="stroke:${col}" stroke-width="${(1.5 + 3 * pts[i].t).toFixed(1)}" stroke-linecap="round" opacity="${op}"/>`;
  }
  const last = pts[pts.length - 1];
  const [lx, ly] = last.xy;
  const edgeCol = isA ? v('alarm') : isN ? v('warn') : v('ok');
  const cog = st.cog != null ? st.cog : 48;
  // swing sector (where the boat has been in 30 min) — light wedge
  const wr = R(60);
  const [s1x, s1y] = polar(cx, cy, wr, -18);
  const [s2x, s2y] = polar(cx, cy, wr, 86);
  return `<svg viewBox="0 0 480 330" width="480" height="330" role="img" aria-label="Swing trail">
    <text x="${cx}" y="${cy - edge - 10}" class="t13" text-anchor="middle" style="fill:${v('dim')}">N</text>
    ${[25, 50, 100].map((ft) => `<circle cx="${cx}" cy="${cy}" r="${R(ft).toFixed(1)}" fill="none" style="stroke:${v('line')}" stroke-width="1"/>
      <text x="${cx + 5}" y="${(cy + R(ft) - 5).toFixed(1)}" class="t10" style="fill:${v('faint')}">${ft}</text>`).join('')}
    <path d="M ${cx} ${cy} L ${s1x} ${s1y} A ${wr} ${wr} 0 0 1 ${s2x} ${s2y} Z" style="fill:${v('heat')}" opacity="0.12"/>
    <circle cx="${cx}" cy="${cy}" r="${edge}" fill="none" style="stroke:${edgeCol}" stroke-width="3.5"${isN ? ' stroke-dasharray="10 8"' : ''}/>
    <text x="${cx + 6}" y="${cy + edge - 8}" class="t11" style="fill:${edgeCol}">150 ft</text>
    ${segs}
    <circle cx="${cx}" cy="${cy}" r="4.5" style="fill:${v('dim')}"/>
    ${isN
      ? `<circle cx="${lx}" cy="${ly}" r="7" fill="none" style="stroke:${v('warn')}" stroke-width="2.5"/>
         <circle cx="${lx}" cy="${ly}" r="24" fill="none" style="stroke:${v('warn')}" stroke-width="1.4" stroke-dasharray="3 4"/>
         <text x="${lx + 28}" y="${ly + 4}" class="t11" style="fill:${v('warn')}">? 34 s</text>`
      : `<g transform="translate(${lx.toFixed(1)} ${ly.toFixed(1)}) rotate(${cog})"><polygon points="0,-13 9,11 0,7 -9,11" style="fill:${isA ? v('alarm') : v('ink')}"/></g>`}
  </svg>`;
}

function rTrail(st) {
  const isA = st.key === 'alarm', isN = st.key === 'nofix';
  const read = isA
    ? `<div class="tr-read"><span class="n c-alarm">172</span><span class="u">ft</span><div class="s c-alarm">dragging · ${fmtSog(st)} kt</div></div>`
    : isN
      ? `<div class="tr-read"><span class="n c-warn">${NA}</span><span class="u">ft</span><div class="s c-warn">trail paused 34 s</div></div>`
      : `<div class="tr-read"><span class="n">38</span><span class="u">ft</span><div class="s">swing ±52° · 30 min</div></div>`;
  const cog = st.cog != null ? st.cog : 48;
  const rose = `<div class="tr-rose">
      <svg viewBox="0 0 76 76" width="76" height="76" aria-hidden="true">
        <circle cx="38" cy="38" r="33" fill="none" style="stroke:${v('line')}" stroke-width="1.5"/>
        <text x="38" y="14" class="t10" text-anchor="middle" style="fill:${v('faint')}">N</text>
        <g transform="rotate(34 38 38)"><path d="M38 70 L38 22 M31 30 L38 20 L45 30" fill="none" style="stroke:${v('heat')}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
        ${isN ? '' : `<g transform="rotate(${cog} 38 38)"><path d="M38 38 L38 10" style="stroke:${isA ? v('alarm') : v('ink')}" stroke-width="2" stroke-dasharray="3 3"/></g>`}
      </svg>
      <div class="tr-rl"><b>WIND ≈ SW</b><span>est. from swing</span>${isN ? '<span>COG ———</span>' : `<span>COG ${fmtCog(st)}</span>`}</div>
    </div>`;
  return `<div class="scr tr">
    ${statusBar(st, sel.night)}
    <div class="tr-main">
      ${trailSVG(st)}
      ${read}
      ${rose}
    </div>
    <div class="tr-legend"><span>−30 min</span><span class="grad"></span><span>now</span><span class="sq">· √ scale</span></div>
    <div class="tr-chips">
      <div class="chip">10 m</div><div class="chip on">30 m</div><div class="chip">2 h</div>
      ${isA ? `<div class="chip alarm wide">${ICON.bell}Hold · silence</div>` : '<div class="chip wide">Clear trail…</div>'}
    </div>
  </div>`;
}

/* ============================================================
   CONCEPT 04 — INSTRUMENT GRID
   ============================================================ */

function tile(cls, label, val, sub, extra = '') {
  return `<div class="tile ${cls}" role="button"><span class="tl">${label}</span><span class="tx">${ICON.expand}</span><span class="tv">${val}</span><span class="ts">${sub}</span>${extra}</div>`;
}

function rGrid(st) {
  const isA = st.key === 'alarm', isN = st.key === 'nofix';
  const pct = isN ? null : Math.min(st.dist / 200, 1) * 100;
  const mbar = `<div class="g-mbar${isN ? ' off' : ''}"><div class="z g" style="width:57%"></div><div class="z y" style="width:18%"></div><div class="z r" style="width:25%"></div>${pct != null ? `<div class="mk" style="left:${pct}%"></div>` : ''}</div>`;
  const distTile = tile(
    `t-dist ${isA ? 'hot pulse-bg' : isN ? 'warn' : ''}`,
    'DISTANCE TO ANCHOR',
    `${isN ? NA : st.dist}<small>ft</small>`,
    isA ? '22 ft beyond 150 ft radius' : isN ? `last ${st.lastKnown.dist} ft · ${st.lastKnown.at}` : 'radius 150 · margin 112 ft',
    mbar + (isA ? `<div class="t-act">${holdButton('HOLD · SILENCE 60 s', '', 'inverse', 0)}</div>` : ''),
  );
  const tiles = [
    distTile,
    tile(isN ? 'na' : '', 'BRG ANCHOR', fmtBrg(st), isN ? 'no fix' : 'from boat'),
    tile(isA ? 'hot-txt' : isN ? 'na' : '', 'SOG', `${fmtSog(st)}<small>kt</small>`, `COG ${fmtCog(st)}`),
    tile(isN ? 'warn' : '', 'GNSS', isN ? `${st.noFixS}<small>s</small>` : `${st.sats}<small>sat</small>`, isN ? 'NO FIX · searching' : `${st.bands} · ${st.acc}`),
    tile('', 'POWER', '12.4<small>V</small>', 'house · ext'),
    tile('', 'LINK', 'Wi-Fi', 'DataHub · 2 s'),
  ];
  return `<div class="scr gr">
    ${statusBar(st, sel.night)}
    <div class="grid">${tiles.join('')}</div>
  </div>`;
}

/* ============================================================
   CONCEPT 05 — ALARM TAKEOVER
   ============================================================ */

function rTake(st) {
  if (st.key === 'alarm') {
    return `<div class="scr tk tk-alarm pulse-bg">
      ${statusBar(st, sel.night, { onTone: true })}
      <div class="tk-a-body">
        <div class="tk-a-icon">${ICON.bell}</div>
        <div class="tk-a-title">DRAG ALARM</div>
        <div class="tk-a-num"><span class="n">172</span><span class="u">ft</span></div>
        <div class="tk-a-sub">22 ft beyond the 150 ft radius</div>
        <div class="tk-a-meta"><span>ANCHOR <b>${fmtBrg(st)}</b></span><span>SOG <b>${fmtSog(st)} kt</b></span><span>${st.sats} sats</span></div>
      </div>
      <div class="tk-a-foot">
        ${slider(`slide to silence ${SILENCE_S} s`, 'on-alarm')}
        <div class="tk-a-note">buzzer sounding · re-sounds after ${SILENCE_S} s if still outside · stays armed</div>
      </div>
    </div>`;
  }
  if (st.key === 'nofix') {
    return `<div class="scr tk tk-warn">
      ${statusBar(st, sel.night, { onTone: true })}
      <div class="tk-w-body">
        <div class="tk-w-title">GPS FIX LOST</div>
        <div class="tk-a-num"><span class="n">34</span><span class="u">s</span></div>
        <div class="tk-a-sub">no valid position · alarm cannot be judged</div>
        <div class="tk-w-last">last known <b>41 ft</b> at <b>02:46:26</b></div>
      </div>
      <div class="tk-a-foot">
        ${slider('slide to acknowledge', 'on-warn')}
        <div class="tk-a-note">warning chirps every 10 s until a fix returns</div>
      </div>
    </div>`;
  }
  // calm armed screen: thin progress ring, one number, nothing else competing
  const cx = 240, cy = 150, r = 116, frac = st.dist / RADIUS;
  const [ex, ey] = polar(cx, cy, r, frac * 360);
  return `<div class="scr tk tk-calm">
    ${statusBar(st, sel.night)}
    <div class="tk-c-main">
      <svg viewBox="0 0 480 300" width="480" height="300" aria-hidden="true">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" style="stroke:${v('line')}" stroke-width="10"/>
        <path d="M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" style="stroke:${v('ok')}" stroke-width="10" stroke-linecap="round"/>
      </svg>
      <div class="tk-c-in">
        <div class="tk-c-state c-ok">ARMED</div>
        <div class="tk-c-num"><span class="n">38</span><span class="u">ft</span></div>
        <div class="tk-c-of">of 150 ft radius</div>
      </div>
    </div>
    <div class="tk-c-line">Watching · margin 112 ft · fix 1 s ago</div>
    <div class="tk-c-foot">
      <div class="tk-lockbar">${ICON.lock(false)}<span><b>Screen locked</b> · press and hold 2 s to unlock</span></div>
    </div>
  </div>`;
}

/* ============================================================
   CONCEPT 06 — ANCHOR CHART (MFD STYLE)
   Layout ideas inspired by Boatingwiththebaileys/Marine-Displays
   (no licence: ideas only, independent code and palette).
   ============================================================ */

/* sweeping COG tape: a large arc whose pivot sits far below the strip,
   fixed pointer at top centre */
function headingTape(st) {
  const cog = st.cog != null ? st.cog : 48;
  const cx = 240, r = 590, cy = 15 + r;
  const P = (off, rr) => polar(cx, cy, rr, off);
  const [ax, ay] = P(-26, r), [bx, by] = P(26, r);
  const card = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
  let ticks = '';
  for (let h = Math.ceil((cog - 26) / 5) * 5; h <= cog + 26; h += 5) {
    const off = h - cog, hh = ((h % 360) + 360) % 360;
    const major = hh % 10 === 0 || card[hh] != null;
    const [x1, y1] = P(off, r), [x2, y2] = P(off, r - (major ? 11 : 6));
    ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" style="stroke:${v(major ? 'ink' : 'dim')}" stroke-width="${major ? 2 : 1.2}"/>`;
    if (major && Math.abs(off) <= 16) {
      const [tx, ty] = P(off, r - 21);
      const lbl = card[hh] != null ? card[hh] : String(hh).padStart(3, '0');
      ticks += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" class="${card[hh] != null ? 't13' : 't11'}" style="fill:${v(card[hh] != null ? 'ink' : 'dim')}" transform="rotate(${off} ${tx.toFixed(1)} ${ty.toFixed(1)})">${lbl}</text>`;
    }
  }
  const isN = st.key === 'nofix';
  return `<div class="ch-tape${isN ? ' off' : ''}">
    <svg viewBox="0 0 480 48" width="480" height="48" aria-label="COG tape">
      <path d="M ${ax.toFixed(1)} ${ay.toFixed(1)} A ${r} ${r} 0 0 1 ${bx.toFixed(1)} ${by.toFixed(1)}" fill="none" style="stroke:${v('line')}" stroke-width="2"/>
      ${ticks}
      <polygon points="232,0 248,0 240,13" style="fill:${v(st.key === 'alarm' ? 'alarm' : 'accent')}"/>
    </svg>
    <span class="ch-tape-l">COG <b>${fmtCog(st)}</b></span>
    <span class="ch-tape-r">SOG <b>${fmtSog(st)}</b> kt</span>
  </div>`;
}

function chartPlot(st) {
  const W = 320, H = 292, cx = W / 2, cy = H / 2;
  const ring = 0.85 * Math.min(cx, cy); // fixed screen fraction; the scale follows the radius
  const k = ring / RADIUS;
  const isA = st.key === 'alarm', isN = st.key === 'nofix';
  const clampR = ring + 16;
  // track: one dot per 5 s over the last 5 min, older dots dimmer
  const N = isN ? 52 : 60;
  let dots = '';
  let last = null;
  for (let i = 0; i < N; i++) {
    const t = i / 59;
    let a = 34 + 30 * Math.sin(i * 0.11), d = 37 + 5 * Math.sin(i * 0.17 + 0.6);
    if (isA) { const u = Math.max(0, (i - 20) / 39); d = d + (172 - d) * u ** 1.5; a = a + (56 - a) * u; }
    if (isN && i === N - 1) d = 41;
    const rr = Math.min(d * k, clampR);
    const [x, y] = polar(cx, cy, rr, a);
    last = { x, y, d, a };
    if (i < N - 1) dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.3" style="fill:${v(d > RADIUS ? 'alarm' : 'accent')}" opacity="${(0.12 + 0.8 * t).toFixed(2)}"/>`;
  }
  const ringCol = isA ? v('alarm') : isN ? v('warn') : v('ring-armed');
  const clamped = st.dist != null && st.dist * k > clampR;
  const cog = st.cog != null ? st.cog : 48;
  const boat = isN
    ? `<circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="7" fill="none" style="stroke:${v('warn')}" stroke-width="2.5"/>
       <text x="${(last.x + 12).toFixed(1)}" y="${(last.y - 8).toFixed(1)}" class="t11" style="fill:${v('warn')}">last</text>`
    : `<g transform="translate(${last.x.toFixed(1)} ${last.y.toFixed(1)}) rotate(${cog})"><polygon points="0,-14 9,10 -9,10" style="fill:${isA ? v('alarm') : v('ink')}"/></g>
       ${clamped ? `<text x="${(last.x - 30).toFixed(1)}" y="${(last.y - 14).toFixed(1)}" class="t11" style="fill:${v('alarm')}">off-scale</text>` : ''}`;
  return `<svg class="ch-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Anchor chart">
    <text x="${cx}" y="12" class="t11" text-anchor="middle" style="fill:${v('dim')}">N</text>
    <circle cx="${cx}" cy="${cy}" r="${(ring / 2).toFixed(1)}" fill="none" style="stroke:${v('line')}" stroke-dasharray="2 5"/>
    <circle cx="${cx}" cy="${cy}" r="${ring.toFixed(1)}" fill="none" style="stroke:${ringCol}" stroke-width="3.5"${isN ? ' stroke-dasharray="10 8"' : ''} class="${isA ? 'pulse-stroke' : ''}"/>
    ${dots}
    <g transform="translate(${cx - 11} ${cy - 11})" style="color:${v('dim')}">${ICON.anchor}</g>
    ${boat}
    <text x="8" y="${H - 8}" class="t11" style="fill:${v('faint')}">ring = 150 ft · inner 75</text>
  </svg>`;
}

function rChart(st) {
  const isA = st.key === 'alarm', isN = st.key === 'nofix';
  const row = (k, val, cls = '') => `<div class="ch-row"><span class="k">${k}</span><span class="v ${cls}">${val}</span></div>`;
  const side = [
    row('DISTANCE', isN ? `${NA}<small>ft</small>` : `${st.dist}<small>ft</small>`, isA ? 'c-alarm big' : isN ? 'c-warn big' : 'big'),
    isN ? row('NO FIX', `${st.noFixS}<small>s</small>`, 'c-warn') : row('BRG ANCHOR', fmtBrg(st)),
    row('MAX DRIFT', `${st.maxDrift}<small>ft</small>`, isA ? 'c-alarm' : ''),
    row('RADIUS', `150<small>ft</small>`),
  ].join('');
  const right = isA
    ? `<div class="ch-silence">${holdButton('HOLD · SILENCE', `${SILENCE_S} s`, 'alarm')}</div>`
    : `<div class="hold ch-drop${isN ? ' disabled' : ''}" role="button"><span class="hold-fill" style="width:0"></span><span class="hold-l">Drop here</span><span class="hold-s">hold 2 s</span></div>
       <div class="ch-tog" role="switch" aria-checked="true"><span class="ch-tl">Alarm</span><span class="ch-sw"><i></i></span></div>`;
  return `<div class="scr ch">
    ${statusBar(st, sel.night)}
    ${headingTape(st)}
    <div class="ch-main">
      ${chartPlot(st)}
      <div class="ch-side">${side}</div>
    </div>
    <div class="ch-band">
      <div class="step${isA ? ' disabled' : ''}" role="button" aria-label="Radius minus 10 ft">−</div>
      <div class="ch-rad"><b>150</b><span>ft · ±10</span></div>
      <div class="step${isA ? ' disabled' : ''}" role="button" aria-label="Radius plus 10 ft">+</div>
      ${right}
    </div>
    <div class="ch-pages"><span class="dots"><i class="on"></i><i></i><i></i><i></i></span><span class="pg-lbl">Anchor · swipe for Position, Graph, System</span></div>
  </div>`;
}

/* ============================================================
   GALLERY
   ============================================================ */

const CONCEPTS = [
  {
    id: 'watch', file: 'watch-circle', num: '01', name: 'Watch Circle', tag: 'spatial picture + direct radius edit',
    render: rWatch,
    note: 'A polar plot centred on the anchor fills the square screen, with the 150 ft alarm ring, recent swing positions and a big distance readout in the corner. <b>Touch:</b> drag the round handle on the ring to change the radius (value shown live, confirm on release); bottom buttons are 64 px tall. <i>Re-set</i> needs a long press; <i>Disarm…</i> opens a confirm sheet. In alarm the bar becomes a single <i>hold to silence</i> control that fills as you hold.',
  },
  {
    id: 'big', file: 'big-distance', num: '02', name: 'Big Distance', tag: 'readable across the cockpit',
    render: rBig,
    note: 'One huge distance number with a coloured status band and a margin bar. It reads from the helm or across the cabin in sunlight. <b>Touch:</b> swipe left/right (or tap the 64 px edge arrows) for secondary pages: track, GNSS and power. The page dots show where you are. In alarm the whole screen turns red, paging stops and the footer becomes <i>hold to silence</i>.',
  },
  {
    id: 'trail', file: 'swing-trail', num: '03', name: 'Swing Trail', tag: 'swing vs. drag at a glance',
    render: rTrail,
    note: 'A heat-trail shows where the boat has been over the last 30 min. Older track fades, the newest is bright, and anything outside the ring turns red. A square-root range scale spreads out the swing near the anchor while the 150 ft ring stays at the edge. A small rose estimates wind from the swing axis and shows COG. A steady arc is normal swinging; a straight line leaving the circle is a drag. <b>Touch:</b> 56 px time chips (10 m / 30 m / 2 h). <i>Clear trail…</i> asks for confirmation.',
  },
  {
    id: 'grid', file: 'instrument-grid', num: '04', name: 'Instrument Grid', tag: 'everything, tap to drill in',
    render: rGrid,
    note: 'A 3 × 3 grid: distance takes a 2 × 2 hero tile, and bearing, SOG/COG, GNSS, power and link fill the rest. Every tile is at least 140 × 128 px, so each is one large tap target. <b>Touch:</b> tap a tile to expand it full-screen with history and detail, then tap or swipe down to return. Faults colour only the affected tile. In alarm the distance tile pulses and carries the silence control.',
  },
  {
    id: 'takeover', file: 'alarm-takeover', num: '05', name: 'Alarm Takeover', tag: 'calm until it isn’t',
    render: rTake,
    note: 'The normal screen is deliberately quiet: one number and a thin progress ring, which suits a dimmed backlight at night. In alarm the whole screen turns red and shows one action, a full-width <b>slide to silence</b> (60 s, stays armed). A drip of water or a bumped elbow cannot complete a slide. A lost fix gets its own amber takeover with <i>slide to acknowledge</i>. The touch lock is shown in the status bar and the lock bar. The silence slider always works, even while the screen is locked.',
  },
  {
    id: 'chart', file: 'anchor-chart', num: '06', name: 'Anchor Chart (MFD style)', tag: 'chartplotter-style anchor page',
    render: rChart,
    note: 'An anchor page in the style of a multifunction display. The alarm ring is always drawn at the same fraction of the plot, so the scale follows the radius. The boat is a triangle pointing along COG and is pinned just outside the ring when it is off-scale. Track dots (one per 5 s) fade with age. A sweeping COG tape runs across the top, and the side column shows distance, bearing, <b>max drift</b> and radius. <b>Touch:</b> 52 × 52 px <i>−</i>/<i>+</i> steppers change the radius in 10 ft steps. <i>Drop here</i> is hold-to-confirm, and tapping the chart never moves the anchor. The <i>Alarm</i> switch and the ring colour show armed (solid) or disarmed (muted, dashed). Swipe for Position (DD / DDM / DMS), Graph and System pages. <br><small>Layout ideas inspired by Boatingwiththebaileys/Marine-Displays (no licence; ideas only, no code or assets reused) — see docs/ui-design-references.md</small>',
  },
];

const ALIASES = {
  'watch-circle': 'watch', 'big-distance': 'big', 'swing-trail': 'trail', swing: 'trail',
  'instrument-grid': 'grid', 'alarm-takeover': 'takeover', alarm: 'takeover', 'anchor-chart': 'chart', mfd: 'chart',
};

const params = new URLSearchParams(location.search);
const pConcept = params.get('concept');
const sel = {
  concept: CONCEPTS.some((c) => c.id === pConcept) ? pConcept : ALIASES[pConcept] || 'watch',
  state: STATES[params.get('state')] ? params.get('state') : 'normal',
  night: params.get('night') === '1',
};
const SHOT = params.get('shot') === '1';

const $ = (id) => document.getElementById(id);

function screenHtml(conceptId, stateKey, night) {
  const c = CONCEPTS.find((x) => x.id === conceptId);
  const prev = sel.night;
  sel.night = night; // status bar reads sel.night
  const html = `<div class="lcd ${night ? 'night' : 'day'}">${c.render(STATES[stateKey])}</div>`;
  sel.night = prev;
  return html;
}

function deviceHtml(inner) {
  return `<div class="device">
    <div class="dev-label">ESP32-S3-Touch-LCD-4 &middot; 480 &times; 480 &middot; simulated</div>
    <div class="bezel"><div class="glass">${inner}</div></div>
  </div>`;
}

function syncUrl() {
  const q = new URLSearchParams({ concept: sel.concept, state: sel.state });
  if (sel.night) q.set('night', '1');
  try { history.replaceState(null, '', '?' + q.toString()); } catch (_) { /* file:// in some browsers */ }
}

function buildControls() {
  $('conceptTabs').innerHTML = CONCEPTS.map(
    (c) => `<button class="ctab" role="tab" data-id="${c.id}" aria-selected="${sel.concept === c.id}"><span class="num">${c.num}</span>${c.name}</button>`,
  ).join('');
  $('stateSeg').innerHTML = `
    <button data-id="normal">Normal</button>
    <button data-id="alarm" class="alarm">Alarm</button>
    <button data-id="nofix" class="warn">No fix</button>`;
  $('themeSeg').innerHTML = `
    <button data-id="day">Day</button>
    <button data-id="night" class="nightb">Night</button>`;
}

function renderStage() {
  $('fitbox').innerHTML = `<div class="fit-inner">${deviceHtml(screenHtml(sel.concept, sel.state, sel.night))}</div>`;
  const c = CONCEPTS.find((x) => x.id === sel.concept);
  $('caption').innerHTML = `<div class="c-name"><span class="num">${c.num}</span>${c.name}<span class="c-tag">${c.tag}</span></div><p class="c-note">${c.note}</p>
    <p class="c-file">Screenshot name: <code>${c.file}-touch-${sel.state}${sel.night ? '-night' : ''}.png</code></p>`;
  document.querySelectorAll('#conceptTabs .ctab').forEach((b) => b.setAttribute('aria-selected', b.dataset.id === sel.concept));
  document.querySelectorAll('#stateSeg button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.id === sel.state));
  document.querySelectorAll('#themeSeg button').forEach((b) => b.setAttribute('aria-pressed', (b.dataset.id === 'night') === sel.night));
  document.body.classList.toggle('g-night', sel.night);
  buildThumbs();
  fitStage();
  syncUrl();
}

function fitStage() {
  const inner = document.querySelector('#fitbox .fit-inner');
  if (!inner) return;
  const dev = inner.firstElementChild;
  const wrap = document.querySelector('.stage-wrap');
  const availW = wrap.clientWidth - 16;
  const availH = Math.max(320, window.innerHeight - 300);
  const w = dev.offsetWidth || 1, h = dev.offsetHeight || 1;
  const s = Math.min(1, availW / w, availH / h);
  inner.style.transform = `scale(${s})`;
  $('fitbox').style.height = h * s + 'px';
  $('fitbox').style.width = w * s + 'px';
}

function buildThumbs() {
  $('thumbs').innerHTML = CONCEPTS.map((c) => `<button class="thumb" data-id="${c.id}" aria-pressed="${sel.concept === c.id}">
      <div class="thumb-view"><div class="thumb-scale">${screenHtml(c.id, sel.state, sel.night)}</div></div>
      <div><div class="thumb-name"><span class="num">${c.num}</span>${c.name}</div><div class="thumb-tag">${c.tag}</div></div>
    </button>`).join('');
}

/* ---------- boot ---------- */

if (SHOT) {
  // bare 480 × 480 screen at 1:1, no gallery chrome, no animation
  document.body.className = 'shot';
  document.body.innerHTML = screenHtml(sel.concept, sel.state, sel.night);
} else {
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('#conceptTabs .ctab');
    const st = e.target.closest('#stateSeg button');
    const th = e.target.closest('#themeSeg button');
    const thumb = e.target.closest('.thumb');
    if (tab) sel.concept = tab.dataset.id;
    else if (st) sel.state = st.dataset.id;
    else if (th) sel.night = th.dataset.id === 'night';
    else if (thumb) { sel.concept = thumb.dataset.id; window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else return;
    renderStage();
  });
  window.addEventListener('resize', fitStage);
  buildControls();
  renderStage();
  if (document.fonts) document.fonts.ready.then(fitStage);
}
