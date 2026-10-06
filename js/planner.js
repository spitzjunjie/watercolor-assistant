// 由分析结果 + 知识库 → 每个色块的配方/技法，以及整张画的作画顺序

import { RECIPES, SHADOWS, COMPLEMENT, TECHNIQUES, THEMES, PIGMENTS } from './kb.js';
import { solveRecipe, describeRecipe, waterLabel } from './mixer.js';

// 为色块挑选技法（依据边缘软硬、内部明度变化、肌理、碎片程度）
export function pickTechniques(c) {
  const t = [];
  if (c.family === '纸白') {
    return ['reserve'];
  }
  const soft = c.edge < 4.5, hard = c.edge > 9;
  const fragmented = c.edgeDensity > 0.35 || c.smallPieces > 25;
  if (c.share > 0.12 && soft) t.push('wetInWet');
  if (c.stdL > 9 && c.texture < 3.5) t.push('gradedWash');
  else if (c.share > 0.08 && c.stdL <= 9 && c.texture < 2.5) t.push('flatWash');
  if (c.texture > 4.5 || (fragmented && c.L > 55)) t.push('dryBrush');
  if (hard || (fragmented && c.L <= 55)) t.push('wetOnDry');
  if (!t.length) t.push(c.L > 65 ? 'flatWash' : 'glazing');
  if (soft && !t.includes('wetInWet') && c.share > 0.03) t.push('softenEdge');
  return t;
}

export function edgeLabel(c) {
  if (c.edge < 4.5) return '柔边';
  if (c.edge > 9) return '硬边';
  return '软硬结合';
}

function matchNamedRecipe(recipe) {
  if (!recipe || recipe.reserve) return null;
  const key = list => [...list].sort().join('+');
  const total = recipe.parts.reduce((s, p) => s + p.w, 0);
  const all = key(recipe.parts.map(p => p.pig.id));
  const main = key(recipe.parts.filter(p => p.w / total > 0.15).map(p => p.pig.id));
  const exact = RECIPES.find(r => key([...r.pigments, ...(r.trace || [])]) === all);
  if (exact) return { ...exact, approx: false };
  const base = RECIPES.find(r => !r.trace && key(r.pigments) === main);
  return base && all !== main ? { ...base, approx: true } : null;
}

function pigmentWarnings(recipe) {
  if (!recipe || recipe.reserve) return [];
  const w = [];
  for (const { pig } of recipe.parts) {
    if (pig.staining) w.push(`${pig.name}为强染色颜料：干透锁纸、几乎洗不掉，宁少勿多。`);
    if (pig.granulating && recipe.parts.length > 1) w.push(`${pig.name}为沉淀色：会出颗粒肌理，不宜反复厚叠。`);
  }
  return [...new Set(w)];
}

export function buildClusterInfo(clusters, palette) {
  return clusters.map(c => {
    const recipes = solveRecipe(c.lab, palette, { maxResults: 3 });
    const best = recipes[0];
    const shadowFamily = c.family === '纸白' ? null : (SHADOWS[c.family] ? c.family : '灰');
    return {
      ...c,
      recipes,
      best,
      recipeText: describeRecipe(best),
      water: best.reserve ? '不上色' : waterLabel(best.conc),
      named: matchNamedRecipe(best),
      techniques: pickTechniques(c),
      edgeText: edgeLabel(c),
      shadow: shadowFamily ? SHADOWS[shadowFamily] : null,
      complement: COMPLEMENT[c.family] || null,
      warnings: pigmentWarnings(best),
    };
  });
}

const posText = c => {
  const v = c.cy < 0.34 ? '上部' : c.cy > 0.66 ? '下部' : '中部';
  const h = c.cx < 0.34 ? '偏左' : c.cx > 0.66 ? '偏右' : '';
  return v + h;
};

// 作画顺序：留白 → 大面积浅色湿画打底 → 中间调罩染塑造 → 暗部与细节 → 收尾
export function buildPlan(info, scene) {
  const whites = info.filter(c => c.family === '纸白');
  const rest = info.filter(c => c.family !== '纸白');
  const light = rest.filter(c => c.L >= 68);
  const mid = rest.filter(c => c.L >= 42 && c.L < 68);
  const dark = rest.filter(c => c.L < 42);

  // 同一阶段内：面积大的先画，画面靠上的（天空/远景）先画
  const order = arr => [...arr].sort((a, b) => (b.share - a.share) * 2 + (a.cy - b.cy));

  const steps = [];
  steps.push({
    title: '准备与留白规划',
    why: '水彩没有白颜料，白只能靠纸。先确定哪里永远不上色。',
    clusters: whites.map(c => c.id),
    actions: [
      whites.length
        ? `标出留白区：${whites.map(c => `${posText(c)}的亮白（约 ${(c.share * 100).toFixed(0)}%）`).join('、')}。`
        : '画面没有大面积纯白，但仍建议留出最亮的高光点。',
      ...(whites.some(c => c.pieces + c.smallPieces > 12 || c.share < 0.03)
        ? ['高光细碎分散，建议先用旧笔点留白胶保护，画完尽早撕除。'] : []),
      '铅笔轻稿只画大形，确定光源方向（决定亮部留白和阴影位置）。',
      scene.tags.includes('snow') ? '雪景：雪地亮部整片留白，只画阴影。' : null,
    ].filter(Boolean),
    technique: ['reserve'],
  });

  if (light.length) {
    steps.push({
      title: '第一遍：大面积浅色打底',
      why: '由浅入深。最浅、面积最大的色块先铺，湿画法让过渡自然。',
      clusters: order(light).map(c => c.id),
      actions: order(light).map(c => `${posText(c)} · ${c.recipeText}，${c.water}；${c.edgeText} → ${c.techniques.map(t => TECHNIQUES[t]?.name).filter(Boolean).join(' / ')}`),
      technique: ['wetInWet', 'gradedWash', 'flatWash'],
      note: '这一遍等完全干透再进入下一步，别急着叠。',
    });
  }
  if (mid.length) {
    steps.push({
      title: '第二遍：中间调塑造',
      why: '在干透的底色上叠中间调，建立体积和空间层次。',
      clusters: order(mid).map(c => c.id),
      actions: order(mid).map(c => `${posText(c)} · ${c.recipeText}，${c.water}；${c.edgeText} → ${c.techniques.map(t => TECHNIQUES[t]?.name).filter(Boolean).join(' / ')}`),
      technique: ['glazing', 'wetOnDry'],
      note: '远处的色块降饱和、偏冷、边缘柔（近暖远冷、近艳远灰）。',
    });
  }
  if (dark.length) {
    steps.push({
      title: '第三遍：暗部与细节',
      why: '深色最后画、一次到位；暗部用彩色灰而不是黑。',
      clusters: order(dark).map(c => c.id),
      actions: order(dark).map(c => `${posText(c)} · ${c.recipeText}，${c.water}；${c.edgeText}${c.shadow ? `（阴影思路：${c.shadow.formula}）` : ''}`),
      technique: ['wetOnDry', 'glazing', 'dryBrush'],
      note: '前景压几笔深色增加层次；强染色颜料下笔前想清楚。',
    });
  }
  steps.push({
    title: '收尾',
    why: '退远看整体：主次、冷暖、虚实是否成立。',
    clusters: [],
    actions: [
      '撕留白胶、轻擦铅笔线。',
      '边缘太硬处用干净湿笔轻扫柔化；需要提亮处洗色/吸色。',
      scene.tags.includes('night') || scene.tags.includes('snow') ? '星点 / 雪花：撒盐或弹白点（疏密有致）。' : '点缀高光、波光等小亮点。',
      '颜色干后会变浅，不够就干叠一层同色加深。',
    ],
    technique: ['softenEdge', 'lifting'],
  });
  return steps;
}

export function sceneTips(scene) {
  return scene.tags.map(t => THEMES[t]).filter(Boolean);
}

export function pigmentById(id) {
  return PIGMENTS.find(p => p.id === id);
}
