
// temporal desktop 
// 

const JOURNAL = `nov 14

had that dream again. the one with the hallway.
woke up at 3:17 and couldn't go back. made coffee
and watched the screensaver until it was light out.

bought a new monitor cable today. the old one was
giving me those lines on the left side of the screen.
hope that fixes it.

to do:
- call mum back
- finish the render before friday
- return that library book (overdue since october)

the machine has been running slow. defrag didn't help.
maybe it's the fan. sounds different than it used to.`;

const logInit = [
  "[10:22:31] System initialized. All components OK.",
  "[10:22:32] Loading desktop environment...",
  "[10:22:33] Registry scan complete. No errors found.",
  "[10:22:34] Desktop loaded in 1.2s",
  "[10:24:11] Application launched: Notes.exe",
  { t:"[10:31:05] WARNING: Low memory. Available: 14MB", c:"#dd0" },
  "[10:31:06] Application closed: Notes.exe",
  { t:"[10:44:23] Disk read error on sector 0x3F2A. Retrying...", c:"#d80" },
  { t:"[10:44:23] Disk read error on sector 0x3F2A. Retrying...", c:"#d80" },
  "[10:44:24] Disk read successful on retry.",
  { t:"[10:51:17] WARNING: Temperature threshold. CPU 71C", c:"#dd0" },
  "[10:55:02] System idle. Running background defrag.",
  "[10:58:44] Defrag complete. 3% contiguous.",
  "[11:03:10] Application launched: System.log",
];

const JUNK = 'abcdef\u2591\u2592\u2593\u2588\u2584\u2580\u25a0\u25a1\u2190\u2192\u25c6\u2660\u2663\u25d9\u263a\u2665\u266a\u2022';

const t0 = Date.now();
const DECAY_SECS = 180;

let pct = 0;
let zTop = 100;
let focused = null;
let smOpen = false;
let errCooldown = false;
let dead = false;

let drag = { el:null, sx:0, sy:0, ox:0, oy:0 };
let wins = {};

//  init 

document.getElementById('notepad').textContent = JOURNAL;

const logbox = document.getElementById('logbox');
logInit.forEach(e => {
  const d = document.createElement('div');
  if (typeof e === 'string') d.textContent = e;
  else { d.textContent = e.t; d.style.color = e.c; }
  logbox.appendChild(d);
});
document.getElementById('logcount').textContent = logbox.children.length;

setInterval(tick, 500);
setInterval(clocktick, 1000);
clocktick();



// windows

function show(id) {
  const el = document.getElementById(id);
  const isMaxed = !!wins[id]?.maxed || el.classList.contains('maxed');
  el.style.display = isMaxed ? 'flex' : 'block';
  el.classList.add('open');
  front(el);
  if (!wins[id]) { wins[id] = { min:false }; addtask(id); }
  else {
    wins[id].min = false;
    document.getElementById('tb_' + id)?.classList.remove('minimized');
  }
  focus(id);
 
  if (!el._drag) makedraggable(el);
}

function hide(id) {
  document.getElementById(id).style.display = 'none';
  document.getElementById(id).classList.remove('open');
  delete wins[id];
  rmtask(id);
  refocus();
}

function min(id) {
  document.getElementById(id).style.display = 'none';
  if (wins[id]) wins[id].min = true;
  refocus();
}

function front(el) { el.style.zIndex = ++zTop; }

function focus(id) {
  if (focused && focused !== id) {
    document.getElementById(focused)?.querySelector('.tbar')?.classList.add('dim');
  }
  focused = id;
  document.getElementById(id)?.querySelector('.tbar')?.classList.remove('dim');
  document.querySelectorAll('.tbtn').forEach(b => b.classList.toggle('on', b.dataset.id === id));
}

function refocus() {
  let best = -1, bestId = null;
  document.querySelectorAll('.win').forEach(w => {
    if (w.style.display !== 'none') {
      const z = parseInt(w.style.zIndex)||0;
      if (z > best) { best = z; bestId = w.id; }
    }
  });
  if (bestId) focus(bestId); else focused = null;
}

let wordWrap = false;

function setCompIconSize(size) {
  const expBody = document.querySelector('#win-comp .exp-body');
  expBody.classList.remove('icon-small', 'icon-medium', 'icon-large');
  
  if (size === 'small') {
    expBody.classList.add('icon-small');
  } else if (size === 'medium') {
    expBody.classList.add('icon-medium');
  } else if (size === 'large') {
    expBody.classList.add('icon-large');
  }
}

function toggleWrap() {
  wordWrap = !wordWrap;
  document.getElementById('notepad').style.whiteSpace = wordWrap ? 'pre-wrap' : 'pre';
  document.getElementById('wrap-item').textContent = (wordWrap ? '✓ ' : '') + 'Word Wrap';
}

function selectAll() {
  const pad = document.getElementById('notepad');
  pad.focus();
  const range = document.createRange();
  range.selectNodeContents(pad);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}
document.addEventListener('mousedown', e => {
  const w = e.target.closest('.win');
  if (w) { front(w); focus(w.id); }
}, true);

// drag 

function makedraggable(win) {
  win._drag = true;
  win.querySelector('.tbar').addEventListener('mousedown', e => {
    if (e.target.classList.contains('wbtn')) return;
    const r = win.getBoundingClientRect();
    drag = { el:win, sx:e.clientX, sy:e.clientY, ox:r.left, oy:r.top };
    e.preventDefault();
  });
}
const winPrev = {};

function maximize(id) {
  const el = document.getElementById(id);
  if (wins[id]?.maxed) {
    const p = winPrev[id];
    el.style.left = p.l; el.style.top = p.t;
    el.style.width = p.w; el.style.height = p.h;
    el.classList.remove('maxed');
    el.style.display = 'block';
    wins[id].maxed = false;
  } else {
    // read actual position before clearing anything
    const r = el.getBoundingClientRect();
    winPrev[id] = {
      l: r.left + 'px', t: r.top + 'px',
      w: el.style.width, h: el.style.height
    };
    el.classList.add('maxed');
    el.style.left = ''; el.style.top = ''; el.style.width = ''; el.style.height = '';
    el.style.display = 'flex';
    wins[id].maxed = true;
  }
}

document.addEventListener('mousemove', e => {
  if (!drag.el) return;
  drag.el.style.left = (drag.ox + e.clientX - drag.sx) + 'px';
  drag.el.style.top  = (drag.oy + e.clientY - drag.sy) + 'px';
});
document.addEventListener('mouseup', () => drag.el = null);

// menus
let openMenu = null;

function toggleMenu(id, e) {
  e.stopPropagation();
  const dd = document.getElementById(id);
  const wasOpen = dd.classList.contains('open');
  closeMenus();
  if (!wasOpen) { dd.classList.add('open'); openMenu = id; }
}
function closeMenus() {
  document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
  openMenu = null;
}
document.addEventListener('click', () => closeMenus());




// taskbar 

const tlabels = { 'win-comp':'My Computer', 'win-notes':'journal.txt', 'win-log':'system.log', 'win-bin':'Recycle Bin' };

function addtask(id) {
  const b = document.createElement('div');
  b.className = 'tbtn'; b.dataset.id = id; b.id = 'tb_' + id;
  b.textContent = tlabels[id] || id;
  b.onclick = () => {
    if (wins[id]?.min) { show(id); }
    else if (focused === id) { min(id); }
    else { front(document.getElementById(id)); focus(id); }
  };
  document.getElementById('tasklist').appendChild(b);
}
function rmtask(id) { document.getElementById('tb_' + id)?.remove(); }

// start menu 
function toggleStart() {
  smOpen = !smOpen;
  document.getElementById('smenu').classList.toggle('open', smOpen);
  document.getElementById('startbtn').classList.toggle('down', smOpen);
}
function closeStart() {
  smOpen = false;
  document.getElementById('smenu').classList.remove('open');
  document.getElementById('startbtn').classList.remove('down');
}
document.addEventListener('click', e => {
  if (smOpen && !e.target.closest('#smenu,#startbtn')) closeStart();
});

document.querySelectorAll('.icon').forEach(ic => {
  ic.addEventListener('click', e => {
    e.stopPropagation();
    document.querySelectorAll('.icon').forEach(i => i.classList.remove('sel'));
    ic.classList.add('sel');
  });
});
document.getElementById('desktop').addEventListener('click', () => {
  document.querySelectorAll('.icon').forEach(i => i.classList.remove('sel'));
  closeStart();
});

// clock 

function clocktick() {
  let h = new Date().getHours(), m = new Date().getMinutes();
  if (pct > 70) h = (h + Math.floor((pct-70)/6)) % 24;
  if (pct > 85 && Math.random() < .4) m = (m + Math.floor(Math.random()*5)) % 60;
  document.getElementById('clk').textContent = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
}

// decay 

function mangle(str, rate) {
  if (rate <= 0) return str;
  return str.split('').map(c => c === ' ' || c === '\n' ? c
    : Math.random() < rate ? JUNK[Math.floor(Math.random()*JUNK.length)] : c
  ).join('');
}

const badlog = [
  () => "[ERR] Kernel panic: null ptr deref at 0x0000",
  () => "[ERR] Sector 0x" + (Math.random()*0xFFFF|0).toString(16).toUpperCase() + " unreadable",
  () => "[WARN] Memory checksum failed. Block 0x" + (Math.random()*0xFFF|0).toString(16).toUpperCase(),
  () => "[ERR] " + mangle("CRITICAL_PROCESS_DIED", .3),
  () => "[ERR] Fan RPM: 0 -- thermal shutdown imminent",
];

const errpool = [
  {
    title: 'TEMPORAL.EXE - Application Error',
    html: 'The instruction at "0x004F2A17" referenced memory at "0x00000000".<br>The memory could not be "read".<br><br>Click OK to terminate the program, or Cancel to debug.'
  },
  {
    title: 'Explorer.exe - Fatal Error',
    html: 'A fatal error occurred in the desktop shell.<br>The system will attempt to recover automatically.<br><br>Error code: 0xC0000005'
  },
  {
    title: 'temporal_fs.dll - Stack Overflow',
    html: 'Stack overflow at address 0x77F04B2E.<br>The application cannot continue.<br><br>Report this error to your system administrator.'
  },
];

function showerr() {
  const e = errpool[Math.floor(Math.random() * errpool.length)];
  const dlg = document.getElementById('errdlg');
  document.getElementById('errtitle').textContent = e.title;
  document.getElementById('errtext').innerHTML = e.html;
  dlg.classList.add('open');
  dlg.style.zIndex = ++zTop;
  dlg.style.left = ((innerWidth - 340) / 2) + 'px';
  dlg.style.top = ((innerHeight - 200) / 2) + 'px';
  dlg.style.transform = 'none';
}

function closedlg() {
  document.getElementById('errdlg').classList.remove('open');
  errCooldown = false;
}

function tick() {
  if (dead) return;
  pct = Math.min(100, ((Date.now() - t0) / 1000 / DECAY_SECS) * 100);
  if (pct > 15) document.getElementById('scanlines').style.opacity = Math.min(.65, ((pct-15)/85)*.65);
  if (pct > 10) document.getElementById('vignette').style.opacity = Math.min(.7, ((pct-10)/90)*.7);

  // noise -- tiny canvas scaled up = free pixelated grain
  if (pct > 40) {
    const cv = document.getElementById('noisecv');
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(4, 4);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() < .5 ? 255 : 0;
      img.data[i] = img.data[i+1] = img.data[i+2] = v;
      img.data[i+3] = ((pct-40)/60)*30 | 0;
    }
    ctx.putImageData(img, 0, 0);
    cv.style.opacity = Math.min(.15, (pct-40)/60*.15);
  }

  // hue shift
  if (pct > 25) {
    document.body.style.filter = `hue-rotate(${(pct-25)*1.4}deg) saturate(${1+(pct-25)*.008})`;
  }

  // flicker speeds up as things get worse
  if (pct > 20) {
    document.body.classList.add('dying');
    document.body.style.animationDuration = Math.max(.5, 3-(pct-20)*.025) + 's';
  }


  // corrupt all [data-orig] labels
  if (pct > 12) {
    const rate = Math.pow((pct-12)/88, 2) * .55;
    document.querySelectorAll('[data-orig]').forEach(el => {
      el.textContent = mangle(el.dataset.orig, rate);
    });
  }

  // notepad
  if (pct > 18) {
    const rate = Math.pow((pct-18)/82, 2) * .45;
    const pad = document.getElementById('notepad');
    if (document.activeElement !== pad) pad.textContent = mangle(JOURNAL, rate);
  }

  // random bad log entries
  if (pct > 30 && Math.random() < .04) {
    const d = document.createElement('div');
    d.textContent = badlog[Math.floor(Math.random()*badlog.length)]();
    d.style.color = pct > 60 ? '#f55' : '#dd0';
    logbox.appendChild(d);
    logbox.scrollTop = logbox.scrollHeight;
    document.getElementById('logcount').textContent = logbox.children.length;
  }

  // retroactively corrupt existing log lines, kind of cool tbh
  if (pct > 65 && Math.random() < .06) {
    const lines = logbox.querySelectorAll('div');
    const t = lines[Math.floor(Math.random()*lines.length)];
    if (t) {
      if (!t._raw) t._raw = t.textContent;
      t.textContent = mangle(t._raw, (pct-65)/150);
    }
  }

  // windows drift
  if (pct > 45 && Math.random() < .12) {
    const amt = (pct-45)/55 * 2;
    document.querySelectorAll('.win.open').forEach(w => {
      if (drag.el === w) return;
      w.style.left = (parseFloat(w.style.left)||100) + (Math.random()-.5)*amt + 'px';
      w.style.top  = (parseFloat(w.style.top)||60)  + (Math.random()-.5)*amt + 'px';
    });
  }

  if (pct > 42 && !errCooldown && Math.random() < .004) {
    errCooldown = true;
    showerr();
    setTimeout(() => errCooldown = false, 25000);
  }

  if (pct >= 98) { dead = true; setTimeout(bsod, 1200); }

}


function bsod() {
  const s = document.createElement('div');
  s.style.cssText = 'position:fixed;inset:0;background:#000080;color:#c0c0c0;font-family:"Courier New",monospace;font-size:13px;padding:48px 64px;z-index:999999;line-height:2;';
  s.innerHTML = `
    <div style="background:#c0c0c0;color:#000080;padding:4px 10px;display:inline-block;margin-bottom:24px;font-weight:bold;font-size:15px">Windows</div>
    <p>A fatal exception <b>0E</b> has occurred at 0028:<b>C0034B21</b> in VxD TEMPORAL(03)</p>
    <p>+ 00034B21. The current application will be terminated.</p><br>
    <p>&nbsp;* Press any key to terminate the current application.</p>
    <p>&nbsp;* Press CTRL+ALT+DEL to restart your computer. You will</p>
    <p>&nbsp;&nbsp;lose any unsaved information in all applications.</p><br><br>
    <p>Press any key to continue <span id="bcur">_</span></p><br>
    <p style="font-size:10px;color:#8080c0">Exception 0E &nbsp; Page Fault &nbsp; Temporal Desktop (build 2001.11.14)</p>`;
  document.body.appendChild(s);

  setInterval(() => {
    const c = document.getElementById('bcur');
    if (c) c.style.visibility = c.style.visibility === 'hidden' ? '' : 'hidden';
  }, 600);

  const restart = () => {
    s.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:14px">Starting Temporal Desktop...</div>';
    setTimeout(() => location.reload(), 1800);
  };
  s.addEventListener('click', restart);
  document.addEventListener('keydown', restart, { once:true });
}

// open my computer by default
show('win-comp');





function openShutdown() {
  const d = document.getElementById('shutdown-dlg');
  d.style.display = 'flex';
}

function closeShutdown() {
  document.getElementById('shutdown-dlg').style.display = 'none';
}

function doShutdown() {
  const opt = document.querySelector('input[name="sdopt"]:checked')?.value;
  closeShutdown();
  const s = document.createElement('div');
  s.style.cssText = 'position:fixed;inset:0;background:#000;z-index:999999;display:flex;align-items:center;justify-content:center;color:#c0c0c0;font-family:"Courier New",monospace;font-size:14px;flex-direction:column;gap:16px;';
  if (opt === 'restart') {
    s.innerHTML = '<div>Windows is restarting...</div><div style="font-size:11px;color:#808080;">Please wait.</div>';
    document.body.appendChild(s);
    setTimeout(() => location.reload(), 2500);
  } else if (opt === 'standby') {
    s.innerHTML = '<div style="font-size:11px;color:#404040;">Click anywhere to wake.</div>';
    document.body.appendChild(s);
    s.addEventListener('click', () => s.remove());
  } else {
    s.innerHTML = '<div>It is now safe to turn off your computer.</div>';
    document.body.appendChild(s);
  }
}