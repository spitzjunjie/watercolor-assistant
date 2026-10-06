// 参考图分析：色块聚类、明度结构、边缘与肌理、场景线索

import { rgbToLab, lch, colorFamily, temperature } from './color.js';

export const ANALYSIS_SIZE = 360;

export function imageToData(img, maxSide = ANALYSIS_SIZE) {
  const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * s));
  const h = Math.max(1, Math.round(img.naturalHeight * s));
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

function seededRandom(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Lab 空间 k-means++（明度略加权，让明暗层次更容易被分开）
function kmeans(labs, n, k, iters = 14) {
  const rnd = seededRandom(42);
  const WL = 1.3;
  const dist = (i, c) => {
    const dl = (labs[i * 3] - c[0]) * WL, da = labs[i * 3 + 1] - c[1], db = labs[i * 3 + 2] - c[2];
    return dl * dl + da * da + db * db;
  };
  const step = Math.max(1, Math.floor(n / 6000));
  const sample = [];
  for (let i = 0; i < n; i += step) sample.push(i);

  const centers = [];
  const first = sample[Math.floor(rnd() * sample.length)];
  centers.push([labs[first * 3], labs[first * 3 + 1], labs[first * 3 + 2]]);
  const d2 = new Float64Array(sample.length).fill(Infinity);
  while (centers.length < k) {
    let sum = 0;
    const c = centers[centers.length - 1];
    sample.forEach((idx, si) => { d2[si] = Math.min(d2[si], dist(idx, c)); sum += d2[si]; });
    let r = rnd() * sum, pick = sample[sample.length - 1];
    for (let si = 0; si < sample.length; si++) { r -= d2[si]; if (r <= 0) { pick = sample[si]; break; } }
    centers.push([labs[pick * 3], labs[pick * 3 + 1], labs[pick * 3 + 2]]);
  }

  const labels = new Uint8Array(n);
  for (let it = 0; it < iters; it++) {
    const acc = centers.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < n; i++) {
      let best = 0, bd = Infinity;
      for (let c = 0; c < k; c++) { const d = dist(i, centers[c]); if (d < bd) { bd = d; best = c; } }
      labels[i] = best;
      const a = acc[best];
      a[0] += labs[i * 3]; a[1] += labs[i * 3 + 1]; a[2] += labs[i * 3 + 2]; a[3]++;
    }
    acc.forEach((a, c) => { if (a[3]) centers[c] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; });
  }
  return { centers, labels };
}

function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    let s = 0, c = 0;
    for (let x = -r; x < w; x++) {
      if (x + r < w) { s += src[y * w + x + r]; c++; }
      if (x - r - 1 >= 0) { s -= src[y * w + x - r - 1]; c--; }
      if (x >= 0) tmp[y * w + x] = s / c;
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0, c = 0;
    for (let y = -r; y < h; y++) {
      if (y + r < h) { s += tmp[(y + r) * w + x]; c++; }
      if (y - r - 1 >= 0) { s -= tmp[(y - r - 1) * w + x]; c--; }
      if (y >= 0) out[y * w + x] = s / c;
    }
  }
  return out;
}

export function analyze(imageData, k = 8) {
  const { width: w, height: h, data } = imageData;
  const n = w * h;
  const labs = new Float32Array(n * 3);
  const Lc = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const lab = rgbToLab([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]);
    labs[i * 3] = lab[0]; labs[i * 3 + 1] = lab[1]; labs[i * 3 + 2] = lab[2];
    Lc[i] = lab[0];
  }
  const { centers, labels } = kmeans(labs, n, k);

  // 明度梯度（轻微模糊后取 Sobel）与高频细节
  const Ls = boxBlur(Lc, w, h, 1);
  const grad = new Float32Array(n);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    const gx = Ls[i - w + 1] + 2 * Ls[i + 1] + Ls[i + w + 1] - Ls[i - w - 1] - 2 * Ls[i - 1] - Ls[i + w - 1];
    const gy = Ls[i + w - 1] + 2 * Ls[i + w] + Ls[i + w + 1] - Ls[i - w - 1] - 2 * Ls[i - w] - Ls[i - w + 1];
    grad[i] = Math.hypot(gx, gy) / 8;
  }
  const Lb = boxBlur(Lc, w, h, 3);

  const stats = centers.map(() => ({
    count: 0, sx: 0, sy: 0, top: 0, bottom: 0, sL: 0, sL2: 0, hf: 0,
    edgeN: 0, edgeG: 0, sumLab: [0, 0, 0], minX: w, minY: h, maxX: 0, maxY: 0,
  }));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, c = labels[i], s = stats[c];
    s.count++; s.sx += x; s.sy += y;
    if (y < h / 3) s.top++; else if (y > (2 * h) / 3) s.bottom++;
    s.sL += Lc[i]; s.sL2 += Lc[i] * Lc[i]; s.hf += Math.abs(Lc[i] - Lb[i]);
    s.sumLab[0] += labs[i * 3]; s.sumLab[1] += labs[i * 3 + 1]; s.sumLab[2] += labs[i * 3 + 2];
    if (x < s.minX) s.minX = x; if (x > s.maxX) s.maxX = x;
    if (y < s.minY) s.minY = y; if (y > s.maxY) s.maxY = y;
    if (x > 0 && y > 0 && x < w - 1 && y < h - 1) {
      if (labels[i + 1] !== c || labels[i + w] !== c || labels[i - 1] !== c || labels[i - w] !== c) {
        s.edgeN++; s.edgeG += grad[i];
      }
    }
  }

  // 连通块数量（衡量色块是“整片”还是“碎点”）
  const comp = countComponents(labels, w, h, centers.length);

  const clusters = stats.map((s, idx) => {
    const lab = s.count ? s.sumLab.map(v => v / s.count) : centers[idx];
    const [L, C, hue] = lch(lab);
    const meanL = s.count ? s.sL / s.count : L;
    const stdL = s.count ? Math.sqrt(Math.max(0, s.sL2 / s.count - meanL * meanL)) : 0;
    const edge = s.edgeN ? s.edgeG / s.edgeN : 0;
    const share = s.count / n;
    return {
      id: idx, lab, L, C, hue, share,
      cx: s.count ? s.sx / s.count / w : 0.5,
      cy: s.count ? s.sy / s.count / h : 0.5,
      topShare: s.count ? s.top / s.count : 0,
      bottomShare: s.count ? s.bottom / s.count : 0,
      stdL, texture: s.count ? s.hf / s.count : 0,
      edge, // 边界处明度梯度：小=柔边，大=硬边
      edgeDensity: s.count ? s.edgeN / s.count : 0, // 边界像素占比：大=破碎/细节多
      pieces: comp.pieces[idx], smallPieces: comp.small[idx],
      family: colorFamily(lab), temp: temperature(lab),
    };
  }).filter(c => c.share > 0.002);

  return { w, h, labels, clusters, Lc, scene: detectScene(clusters) };
}

function countComponents(labels, w, h, k) {
  const seen = new Uint8Array(w * h);
  const pieces = new Array(k).fill(0), small = new Array(k).fill(0);
  const stack = new Int32Array(w * h);
  const minSize = Math.max(4, Math.round((w * h) / 4000));
  for (let start = 0; start < w * h; start++) {
    if (seen[start]) continue;
    const c = labels[start];
    let sp = 0, size = 0;
    stack[sp++] = start; seen[start] = 1;
    while (sp) {
      const i = stack[--sp]; size++;
      const x = i % w, y = (i - x) / w;
      if (x > 0 && !seen[i - 1] && labels[i - 1] === c) { seen[i - 1] = 1; stack[sp++] = i - 1; }
      if (x < w - 1 && !seen[i + 1] && labels[i + 1] === c) { seen[i + 1] = 1; stack[sp++] = i + 1; }
      if (y > 0 && !seen[i - w] && labels[i - w] === c) { seen[i - w] = 1; stack[sp++] = i - w; }
      if (y < h - 1 && !seen[i + w] && labels[i + w] === c) { seen[i + w] = 1; stack[sp++] = i + w; }
    }
    if (size >= minSize) pieces[c]++; else small[c]++;
  }
  return { pieces, small };
}

// 粗略场景线索（启发式，不是语义识别）
function detectScene(clusters) {
  const sum = f => clusters.filter(f).reduce((s, c) => s + c.share, 0);
  const avgL = clusters.reduce((s, c) => s + c.L * c.share, 0);
  const avgC = clusters.reduce((s, c) => s + c.C * c.share, 0);
  const warm = sum(c => c.temp === '暖'), cool = sum(c => c.temp === '冷');
  const tags = [];
  if (sum(c => c.family === '蓝' && c.topShare > 0.5 && c.L > 45) > 0.12) tags.push('sky');
  if (sum(c => (c.family === '橙' || c.family === '红' || c.family === '紫') && c.topShare > 0.45) > 0.12) tags.push('sunset');
  if (sum(c => c.family === '绿') > 0.15) tags.push('foliage');
  if (sum(c => c.family === '蓝' && c.bottomShare > 0.45) > 0.1) tags.push('water');
  if (sum(c => (c.family === '纸白' || (c.L > 85 && c.C < 12))) > 0.3 && cool > warm) tags.push('snow');
  if (avgL < 35 && sum(c => c.family === '蓝' || c.family === '紫') > 0.3) tags.push('night');
  if (avgL > 72 && avgC < 30) tags.push('cute');
  if (sum(c => c.family === '大地') > 0.2) tags.push('earth');
  return {
    tags, avgL, avgC,
    key: avgL > 68 ? '高调（整体偏亮）' : avgL < 42 ? '低调（整体偏暗）' : '中调',
    tone: warm > cool * 1.4 ? '暖调为主' : cool > warm * 1.4 ? '冷调为主' : '冷暖平衡',
    warm, cool,
  };
}

// 明度分级（notan）：levels = 2 / 3 / 5
export function valueMap(result, levels) {
  const { w, h, Lc } = result;
  const out = new ImageData(w, h);
  const sorted = Float32Array.from(Lc).sort();
  const cuts = [];
  for (let i = 1; i < levels; i++) cuts.push(sorted[Math.floor((sorted.length * i) / levels)]);
  for (let i = 0; i < w * h; i++) {
    let lv = 0;
    while (lv < cuts.length && Lc[i] > cuts[lv]) lv++;
    const v = Math.round(25 + (230 * lv) / (levels - 1));
    out.data[i * 4] = out.data[i * 4 + 1] = out.data[i * 4 + 2] = v;
    out.data[i * 4 + 3] = 255;
  }
  return out;
}

export function clusterMap(result, colors, highlight = null) {
  const { w, h, labels } = result;
  const out = new ImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const c = labels[i];
    const rgb = colors[c] || [200, 200, 200];
    const dim = highlight && !highlight.has(c);
    for (let k = 0; k < 3; k++) out.data[i * 4 + k] = dim ? 235 - (235 - rgb[k]) * 0.15 : rgb[k];
    out.data[i * 4 + 3] = 255;
  }
  return out;
}
