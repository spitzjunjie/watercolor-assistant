import { PIGMENTS, PALETTE_PRESETS, TECHNIQUES, RULES, MNEMONIC } from './kb.js';
import { preparePigments, solveRecipe, describeRecipe, waterLabel } from './mixer.js';
import { rgbToLab, labToRgb, rgbToHex, colorFamily } from './color.js';
import { imageToData, analyze, valueMap, clusterMap } from './analyze.js';
import { buildClusterInfo, buildPlan, sceneTips } from './planner.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- 颜料盘（本地记忆） ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 隐私模式下忽略 */ } },
};
let enabled = new Set(store.get('wc.enabled', PALETTE_PRESETS.landscape.ids));
let customHex = store.get('wc.hex', {});

function currentPalette() {
  return preparePigments(PIGMENTS.filter(p => enabled.has(p.id)).map(p => ({ ...p, hex: customHex[p.id] || p.hex })));
}
const pigHex = p => customHex[p.id] || p.hex;

function renderPaletteDialog() {
  $('#presets').innerHTML = Object.entries(PALETTE_PRESETS)
    .map(([k, v]) => `<button type="button" class="ghost small" data-preset="${k}">${v.name}</button>`).join('');
  $('#pigList').innerHTML = PIGMENTS.map(p => `
    <label class="pig-row">
      <input type="checkbox" data-pig="${p.id}" ${enabled.has(p.id) ? 'checked' : ''}>
      <input type="color" data-hex="${p.id}" value="${pigHex(p)}">
      <span>${p.name}${p.code ? ' ' + p.code : ''}<br><small>${p.desc}</small></span>
    </label>`).join('');
}
$('#paletteBtn').onclick = () => { renderPaletteDialog(); $('#paletteDlg').showModal(); };
$('#presets').onclick = e => {
  const k = e.target.dataset.preset; if (!k) return;
  enabled = new Set(PALETTE_PRESETS[k].ids); renderPaletteDialog();
};
$('#pigList').onchange = e => {
  if (e.target.dataset.pig) e.target.checked ? enabled.add(e.target.dataset.pig) : enabled.delete(e.target.dataset.pig);
  if (e.target.dataset.hex) customHex[e.target.dataset.hex] = e.target.value;
};
$('#resetPig').onclick = () => { customHex = {}; renderPaletteDialog(); };
$('#paletteDlg').addEventListener('close', () => {
  if (enabled.size < 2) enabled = new Set(PALETTE_PRESETS.core.ids);
  store.set('wc.enabled', [...enabled]); store.set('wc.hex', customHex);
  if (state.img) runAnalysis();
});

// ---------- 载入图片 ----------
const state = { img: null, result: null, info: null, plan: null, view: 'orig', highlight: null };

const drop = $('#drop');
drop.onclick = e => { if (e.target.id !== 'demoBtn') $('#file').click(); };
drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
drop.ondragleave = () => drop.classList.remove('over');
drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) loadFile(f); };
$('#file').onchange = e => { const f = e.target.files[0]; if (f) loadFile(f); e.target.value = ''; };
$('#newImg').onclick = () => $('#file').click();
$('#demoBtn').onclick = () => loadSrc(makeDemo());
document.addEventListener('paste', e => {
  const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
  if (item) loadFile(item.getAsFile());
});

function loadFile(f) {
  const r = new FileReader();
  r.onload = () => loadSrc(r.result);
  r.readAsDataURL(f);
}
function loadSrc(src) {
  const img = new Image();
  img.onload = () => { state.img = img; drop.hidden = true; $('#workspace').hidden = false; runAnalysis(); };
  img.src = src;
}

$('#kRange').oninput = e => { $('#kVal').textContent = e.target.value; };
$('#kRange').onchange = () => runAnalysis();

function runAnalysis() {
  const data = imageToData(state.img);
  state.result = analyze(data, +$('#kRange').value);
  state.info = buildClusterInfo(state.result.clusters, currentPalette())
    .sort((a, b) => b.L - a.L); // 浅 → 深，与作画顺序一致
  state.plan = buildPlan(state.info, state.result.scene);
  state.highlight = null;
  $('#pickInfo').hidden = true;
  renderView(); renderOverview(); renderColors(); renderPlan(); renderTips();
}

// ---------- 画布 ----------
const view = $('#view');
function renderView() {
  const { result, img } = state;
  const ctx = view.getContext('2d');
  if (state.view === 'orig' && !state.highlight) {
    const s = Math.min(1, 1100 / Math.max(img.naturalWidth, img.naturalHeight));
    view.width = Math.round(img.naturalWidth * s); view.height = Math.round(img.naturalHeight * s);
    ctx.drawImage(img, 0, 0, view.width, view.height);
    return;
  }
  let id;
  if (state.view.startsWith('v')) id = valueMap(result, +state.view.slice(1));
  else {
    const colors = [];
    state.info.forEach(c => { colors[c.id] = state.view === 'orig' ? labToRgb(c.lab) : (c.best.rgb || labToRgb(c.lab)); });
    id = clusterMap(result, colors, state.highlight);
  }
  view.width = result.w; view.height = result.h;
  ctx.putImageData(id, 0, 0);
}
$('#viewSeg').onclick = e => {
  const v = e.target.dataset.view; if (!v) return;
  state.view = v; state.highlight = null;
  document.querySelectorAll('#viewSeg button').forEach(b => b.classList.toggle('on', b === e.target));
  document.querySelectorAll('.step, .color-card').forEach(el => el.classList.remove('on', 'hl'));
  renderView();
};

function setHighlight(ids) {
  state.highlight = ids && ids.length ? new Set(ids) : null;
  if (state.highlight && state.view.startsWith('v')) {
    state.view = 'blocks';
    document.querySelectorAll('#viewSeg button').forEach(b => b.classList.toggle('on', b.dataset.view === 'blocks'));
  }
  renderView();
}

// 点击取色 → 单点配方
view.onclick = e => {
  const rect = view.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width, y = (e.clientY - rect.top) / rect.height;
  const cv = document.createElement('canvas');
  cv.width = state.img.naturalWidth; cv.height = state.img.naturalHeight;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(state.img, 0, 0);
  const px = Math.floor(x * cv.width), py = Math.floor(y * cv.height), r = 2;
  const d = ctx.getImageData(Math.max(0, px - r), Math.max(0, py - r), 2 * r + 1, 2 * r + 1).data;
  const rgb = [0, 0, 0]; let n = 0;
  for (let i = 0; i < d.length; i += 4) { rgb[0] += d[i]; rgb[1] += d[i + 1]; rgb[2] += d[i + 2]; n++; }
  const col = rgb.map(v => v / n);
  const lab = rgbToLab(col);
  const best = solveRecipe(lab, currentPalette(), { maxResults: 1 })[0];
  const box = $('#pickInfo');
  box.hidden = false;
  box.innerHTML = `<button class="x" onclick="this.parentElement.hidden=true">✕</button>
    <div class="cc-head"><span class="chips"><i style="background:${rgbToHex(col)}"></i><i style="background:${rgbToHex(best.rgb)}"></i></span>
    <b>${rgbToHex(col)}</b><span class="tag">${colorFamily(lab)}</span></div>
    <div>${best.reserve ? '留白（纸白）' : `${recipeHtml(best)} · ${waterLabel(best.conc)}`}
    <span class="muted">${best.reserve ? '' : `（模型色差 ΔE ${best.dE.toFixed(1)}）`}</span></div>`;
};

// ---------- 概览 ----------
function renderOverview() {
  const { scene } = state.result;
  const bar = [...state.info].map(c => `<span title="${esc(c.recipeText)} ${(c.share * 100).toFixed(0)}%" data-id="${c.id}"
    style="width:${c.share * 100}%;background:${rgbToHex(labToRgb(c.lab))}"></span>`).join('');
  $('#overview').innerHTML = `<h3>画面概览</h3>
    <div class="bar" id="ovBar">${bar}</div>
    <p class="muted small" style="margin:0 0 8px">色块面积占比（按明度从浅到深）</p>
    <dl class="kv">
      <dt>明暗调子</dt><dd>${scene.key}</dd>
      <dt>冷暖倾向</dt><dd>${scene.tone}（暖 ${(scene.warm * 100).toFixed(0)}% / 冷 ${(scene.cool * 100).toFixed(0)}%）</dd>
      <dt>整体饱和</dt><dd>${scene.avgC > 35 ? '鲜艳' : scene.avgC > 18 ? '中等' : '柔和偏灰'}</dd>
      <dt>场景线索</dt><dd>${sceneTips(scene).map(t => t.name).join('、') || '未识别出典型题材'}</dd>
    </dl>`;
  $('#ovBar').onclick = e => { const id = e.target.dataset.id; if (id) focusCluster(+id); };
}

function focusCluster(id) {
  switchTab('colors');
  setHighlight([id]);
  document.querySelectorAll('.color-card').forEach(el => el.classList.toggle('hl', +el.dataset.id === id));
  document.querySelector(`.color-card[data-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ---------- 调色配方 ----------
function recipeHtml(r) {
  if (r.reserve) return '<b>留白</b>';
  const total = r.parts.reduce((s, p) => s + p.w, 0);
  const pig = p => `<span class="pig"><i class="dot" style="background:${pigHex(p.pig)}"></i>${p.pig.name}</span>`;
  const main = r.parts.filter(p => p.w / total > 0.15), trace = r.parts.filter(p => p.w / total <= 0.15);
  let s = main.map(pig).join(' + ');
  if (main.length === 2) {
    const [a, b] = main.map(p => p.w);
    s += ` <span class="tag">${a === b ? '1 : 1' : (a > b ? `${+(a / b).toFixed(1)} : 1` : `1 : ${+(b / a).toFixed(1)}`)}</span>`;
  }
  if (trace.length) s += ' + 微量 ' + trace.map(pig).join('、');
  return s;
}

function renderColors() {
  $('#tab-colors').innerHTML = state.info.map(c => {
    const hex = rgbToHex(labToRgb(c.lab));
    const b = c.best;
    const techs = c.techniques.map(t => TECHNIQUES[t]).filter(Boolean);
    const alts = c.recipes.slice(1).map(r => `${describeRecipe(r)}（ΔE ${r.dE.toFixed(1)}）`).join('；');
    return `<article class="color-card" data-id="${c.id}">
      <div class="sw"><div style="background:${hex}"></div><small>参考</small><div style="background:${rgbToHex(b.rgb)}"></div><small>调出</small></div>
      <div>
        <div class="cc-head"><b>${c.family === '纸白' ? '纸白 / 高光' : c.family + '色块'}</b>
          <span class="tag">占 ${(c.share * 100).toFixed(1)}%</span><span class="tag">明度 ${c.L.toFixed(0)}</span>
          <span class="tag">${c.edgeText}</span><span class="tag">${c.temp}</span></div>
        <div class="recipe">${recipeHtml(b)} ${b.reserve ? '' : `<span class="muted small">· ${c.water}</span>`}</div>
        ${b.reserve ? '' : `<div class="alt">模型色差 ΔE ${b.dE.toFixed(1)}${b.dE > 8 ? '（当前颜料盘较难调准，可尝试加入其他颜料）' : ''}${alts ? ' · 备选：' + esc(alts) : ''}</div>`}
        <div class="details"><ul>
          ${c.named ? `<li>${c.named.approx ? '以知识库配方' : '知识库配方：'}<b>${c.named.approx ? '「' + c.named.name + '」为底，加微量颜料调整' : c.named.name}</b> — 适用：${c.named.scenes}</li>` : ''}
          ${techs.map(t => `<li class="tech-card"><b>${t.icon} ${t.name}</b>：${t.how}</li>`).join('')}
          ${c.shadow ? `<li>这块的阴影：${c.shadow.formula}${c.complement ? `（补色：${c.complement}）` : ''}</li>` : ''}
          ${c.warnings.map(w => `<li><span class="tag warn">注意</span> ${w}</li>`).join('')}
        </ul></div>
      </div></article>`;
  }).join('');
  document.querySelectorAll('.color-card').forEach(el => {
    el.onclick = () => focusCluster(+el.dataset.id);
  });
}

// ---------- 作画顺序 ----------
function renderPlan() {
  const byId = Object.fromEntries(state.info.map(c => [c.id, c]));
  $('#tab-plan').innerHTML = state.plan.map((s, i) => `
    <article class="step" data-i="${i}">
      <span class="num">${i + 1}</span>
      <h3>${s.title}</h3>
      <p class="why">${s.why}</p>
      ${s.clusters.length ? `<div class="chips">${s.clusters.map(id => `<i style="background:${rgbToHex(labToRgb(byId[id].lab))}"></i>`).join('')}</div>` : ''}
      <ul>${s.actions.map(a => `<li>${a}</li>`).join('')}</ul>
      ${s.note ? `<p class="muted small" style="margin:6px 0 0">${s.note}</p>` : ''}
      <div class="tech">${s.technique.map(t => `<span class="tag" title="${esc(TECHNIQUES[t].how)}">${TECHNIQUES[t].icon} ${TECHNIQUES[t].name}</span>`).join('')}</div>
    </article>`).join('') + `<p class="muted small">点击步骤可在图上高亮这一步要画的区域。</p>`;
  document.querySelectorAll('.step').forEach(el => {
    el.onclick = () => {
      const on = !el.classList.contains('on');
      document.querySelectorAll('.step').forEach(x => x.classList.remove('on'));
      el.classList.toggle('on', on);
      setHighlight(on ? state.plan[+el.dataset.i].clusters : null);
    };
  });
}

// ---------- 题材与规则 ----------
function renderTips() {
  const tips = sceneTips(state.result.scene);
  $('#tab-tips').innerHTML = `
    ${tips.map(t => `<div class="card"><h3>${t.name}</h3><ul>${t.tips.map(x => `<li>${x}</li>`).join('')}</ul></div>`).join('')
      || '<div class="card"><h3>题材</h3><p class="muted">没有识别出典型题材（天空/树/水/雪/夜景/可爱风/大地）。下方通用规则依然适用。</p></div>'}
    <div class="card"><h3>实战规则</h3><ul>${RULES.map(r => `<li>${r}</li>`).join('')}</ul></div>
    <div class="card"><h3>记忆口诀</h3><p class="mnemonic">${MNEMONIC.split('；').join('；<br>')}</p></div>`;
}

// ---------- 标签页 ----------
function switchTab(name) {
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  ['colors', 'plan', 'tips'].forEach(t => { $('#tab-' + t).hidden = t !== name; });
}
$('#tabs').onclick = e => { if (e.target.dataset.tab) switchTab(e.target.dataset.tab); };

// ---------- 示例图（程序绘制的黄昏湖景） ----------
function makeDemo() {
  const w = 900, h = 600, cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, h * 0.55);
  sky.addColorStop(0, '#5D6BAE'); sky.addColorStop(0.5, '#B98AB0'); sky.addColorStop(1, '#F3C98B');
  g.fillStyle = sky; g.fillRect(0, 0, w, h * 0.55);
  g.fillStyle = '#FFF6DE'; g.beginPath(); g.arc(w * 0.68, h * 0.47, 34, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#7C7FA8'; g.beginPath(); g.moveTo(0, h * 0.55);
  [[0.1, 0.4], [0.22, 0.46], [0.35, 0.36], [0.5, 0.5], [0.62, 0.45], [0.8, 0.52], [1, 0.42]].forEach(([x, y]) => g.lineTo(w * x, h * y));
  g.lineTo(w, h * 0.55); g.fill();
  const water = g.createLinearGradient(0, h * 0.55, 0, h);
  water.addColorStop(0, '#D9B39A'); water.addColorStop(0.4, '#8A87AE'); water.addColorStop(1, '#3E4A7E');
  g.fillStyle = water; g.fillRect(0, h * 0.55, w, h * 0.45);
  g.strokeStyle = 'rgba(255,240,210,.7)'; g.lineWidth = 3;
  for (let i = 0; i < 14; i++) { const y = h * (0.6 + i * 0.022); g.beginPath(); g.moveTo(w * 0.62 + Math.sin(i) * 20, y); g.lineTo(w * 0.74 + Math.cos(i) * 20, y); g.stroke(); }
  g.fillStyle = '#2E2A2C'; g.beginPath(); g.moveTo(w * 0.78, h); g.lineTo(w * 0.86, h * 0.72); g.lineTo(w, h * 0.68); g.lineTo(w, h); g.fill();
  g.fillStyle = '#2F3B2C';
  for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(w * (0.86 + Math.random() * 0.14), h * (0.25 + Math.random() * 0.45), 18 + Math.random() * 26, 0, Math.PI * 2); g.fill(); }
  g.fillRect(w * 0.92, h * 0.5, 12, h * 0.25);
  return cv.toDataURL('image/png');
}
