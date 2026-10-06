// 颜料混色模型 + 配方求解
//
// 光谱 Kubelka–Munk：先把每支颜料的 sRGB 色值还原成 38 个波段的反射率曲线
// （方法与基底数据来自 spectral.js），在每个波段上把吸收/散射比 K/S 按用量相加，
// 再换回反射率 → XYZ → Lab。这样“黄 + 蓝 = 绿”这类减色混合能被正确模拟。
// 加水稀释 = 降低单位面积颜料浓度（K/S 等比缩小），颜色自然趋向纸白，
// 对应水彩“明度靠水”的规律。
// 这是可解释的近似模型，颜料色值也只是近似——请以实际试色为准。

import { hexToRgb, srgbToLinear, linearToSrgb, xyzToLab, deltaE, lch } from './color.js';
import { RECIPES } from './kb.js';
import { SIZE, BASE, CMF, XYZ_RGB } from './spectral-data.js';

// 知识库里出现过的颜料组合，求解时优先（“经验配方”优先于数学上的偶然最优）
const KNOWN = new Set();
for (const r of RECIPES) {
  const ids = [...r.pigments, ...(r.trace || [])];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) KNOWN.add([ids[i], ids[j]].sort().join('+'));
}
const pairPenalty = (a, b) => (KNOWN.has([a.id, b.id].sort().join('+')) ? 0.6 : 2.6);

function linearRgbToReflectance([r0, g0, b0]) {
  const w = Math.min(r0, g0, b0);
  const r = r0 - w, g = g0 - w, b = b0 - w;
  const c = Math.min(g, b), m = Math.min(r, b), y = Math.min(r, g);
  const R = Math.max(0, Math.min(r - b, r - g));
  const G = Math.max(0, Math.min(g - b, g - r));
  const B = Math.max(0, Math.min(b - g, b - r));
  const out = new Float64Array(SIZE);
  for (let i = 0; i < SIZE; i++) {
    out[i] = Math.min(1, Math.max(1e-4, w * BASE.W[i] + c * BASE.C[i] + m * BASE.M[i] + y * BASE.Y[i]
      + R * BASE.R[i] + G * BASE.G[i] + B * BASE.B[i]));
  }
  return out;
}

const KS = R => ((1 - R) ** 2) / (2 * R);
const KM = k => 1 + k - Math.sqrt(k * k + 2 * k);

export function preparePigments(pigments) {
  return pigments.map(p => {
    const refl = linearRgbToReflectance(hexToRgb(p.hex).map(srgbToLinear));
    return { ...p, ks: Float64Array.from(refl, KS) };
  });
}

function mixXYZ(parts, conc) {
  const total = parts.reduce((s, p) => s + p.w, 0);
  const xyz = [0, 0, 0];
  for (let i = 0; i < SIZE; i++) {
    let k = 0;
    for (const { pig, w } of parts) k += pig.ks[i] * w;
    const R = KM((k / total) * conc);
    xyz[0] += CMF[0][i] * R; xyz[1] += CMF[1][i] * R; xyz[2] += CMF[2][i] * R;
  }
  return xyz;
}

const xyzToSrgb = xyz => XYZ_RGB.map(row => linearToSrgb(row[0] * xyz[0] + row[1] * xyz[1] + row[2] * xyz[2]));

// parts: [{pig, w}]，conc: 0~1 的浓度（1 = 管装原色，越小水越多）
export function mixRgb(parts, conc) {
  return xyzToSrgb(mixXYZ(parts, conc));
}

const CONCS = [2.2, 1.5, 1, 0.75, 0.55, 0.4, 0.28, 0.19, 0.12, 0.07, 0.035];
const RATIOS = [[1, 1], [2, 1], [3, 1], [5, 1], [8, 1], [1, 2], [1, 3], [1, 5], [1, 8]];
const TRACE = 1 / 8; // 知识库约定：微量 ≈ 1/8 用量

export function waterLabel(conc) {
  if (conc > 1.2) return '厚涂（干后再叠一层加深）';
  if (conc >= 0.75) return '浓（几乎不加水）';
  if (conc >= 0.5) return '中浓（少量水）';
  if (conc >= 0.3) return '中等（加水调开）';
  if (conc >= 0.17) return '淡（较多水）';
  if (conc >= 0.09) return '很淡（大量水）';
  return '极淡（一抹色水）';
}

export function ratioLabel(a, b) {
  if (b === 0) return '';
  if (a >= 8 * b) return '微量';
  const g = (x, y) => (y ? g(y, x % y) : x);
  const d = g(a, b);
  return `${a / d} : ${b / d}`;
}

/**
 * 在给定颜料盘里搜索最接近目标色的配方。
 * 规则来自知识库：优先单色/两色，三色只作“两色 + 微量补色”。复杂度带惩罚。
 */
export function solveRecipe(targetLab, palette, { maxResults = 3 } = {}) {
  const [L, C] = lch(targetLab);
  if (L > 93 && C < 6) return [{ reserve: true, dE: 0, parts: [], conc: 0, rgb: [255, 255, 255] }];

  const results = [];
  const consider = (parts, conc, penalty) => {
    const xyz = mixXYZ(parts, conc);
    const dE = deltaE(targetLab, xyzToLab(xyz));
    results.push({ parts, conc, dE, score: dE + penalty, xyz });
  };

  for (const conc of CONCS) {
    for (let i = 0; i < palette.length; i++) {
      consider([{ pig: palette[i], w: 1 }], conc, 0);
      for (let j = i + 1; j < palette.length; j++) {
        for (const [a, b] of RATIOS) {
          consider([{ pig: palette[i], w: a }, { pig: palette[j], w: b }], conc, pairPenalty(palette[i], palette[j]));
        }
      }
    }
  }
  results.sort((x, y) => x.score - y.score);

  // 对最好的若干两色方案，尝试再加“微量补色”降饱和
  const seeds = results.slice(0, 25).filter(r => r.parts.length <= 2);
  for (const s of seeds) {
    const used = new Set(s.parts.map(p => p.pig.id));
    const sum = s.parts.reduce((t, p) => t + p.w, 0);
    for (const pig of palette) {
      if (used.has(pig.id)) continue;
      for (const conc of [s.conc * 0.8, s.conc, s.conc * 1.25].filter(c => c <= 2.2)) {
        consider([...s.parts, { pig, w: sum * TRACE }], conc, s.score - s.dE + 2);
      }
    }
  }
  results.sort((x, y) => x.score - y.score);

  // 去重：同一组颜料只保留最佳
  const seen = new Set();
  const out = [];
  for (const r of results) {
    const key = r.parts.map(p => p.pig.id).sort().join('+');
    if (seen.has(key)) continue;
    seen.add(key);
    r.rgb = xyzToSrgb(r.xyz);
    out.push(r);
    if (out.length >= maxResults) break;
  }
  return out;
}

// 把配方描述成人话
export function describeRecipe(r) {
  if (r.reserve) return '留白（纸白）';
  const parts = r.parts;
  if (parts.length === 1) return `${parts[0].pig.name}`;
  const main = parts.filter(p => p.w > (parts.reduce((s, q) => s + q.w, 0) * 0.15));
  const trace = parts.filter(p => !main.includes(p));
  let txt = main.map(p => p.pig.name).join(' + ');
  if (main.length === 2) txt += `（${ratioLabel(main[0].w, main[1].w)}）`;
  if (trace.length) txt += ' + 微量' + trace.map(p => p.pig.name).join('、');
  return txt;
}
