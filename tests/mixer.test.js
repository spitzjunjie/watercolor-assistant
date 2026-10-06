import test from 'node:test';
import assert from 'node:assert/strict';
import { PIGMENTS, PALETTE_PRESETS } from '../js/kb.js';
import { preparePigments, solveRecipe, mixRgb, describeRecipe } from '../js/mixer.js';
import { hexToRgb, rgbToLab, colorFamily } from '../js/color.js';

const palette = preparePigments(PIGMENTS);
const pig = id => palette.find(p => p.id === id);

test('单支颜料原色能被自己匹配', () => {
  for (const p of palette) {
    const r = solveRecipe(rgbToLab(hexToRgb(p.hex)), palette)[0];
    assert.ok(r.dE < 2, `${p.name} dE=${r.dE}`);
  }
});

test('柠檬黄 + 酞青蓝 混出绿色（知识库：鲜亮翠绿）', () => {
  const rgb = mixRgb([{ pig: pig('lemon'), w: 1 }, { pig: pig('phthalo'), w: 1 }], 1);
  assert.equal(colorFamily(rgbToLab(rgb)), '绿');
});

test('茜素红 + 群青 混出紫色（黄金组合）', () => {
  const rgb = mixRgb([{ pig: pig('alizarin'), w: 1 }, { pig: pig('ultramarine'), w: 1 }], 1);
  assert.equal(colorFamily(rgbToLab(rgb)), '紫');
});

test('加水稀释后明度升高并趋向纸白', () => {
  const thick = rgbToLab(mixRgb([{ pig: pig('cobalt'), w: 1 }], 1));
  const thin = rgbToLab(mixRgb([{ pig: pig('cobalt'), w: 1 }], 0.02));
  assert.ok(thin[0] > thick[0] + 25);
  assert.ok(thin[0] > 85);
});

test('近白色给出留白', () => {
  const r = solveRecipe(rgbToLab([252, 251, 248]), palette)[0];
  assert.ok(r.reserve);
});

test('天蓝色用风景盘能调得较准', () => {
  const land = preparePigments(PIGMENTS.filter(p => PALETTE_PRESETS.landscape.ids.includes(p.id)));
  const r = solveRecipe(rgbToLab([150, 180, 220]), land)[0];
  assert.ok(r.dE < 6, `dE=${r.dE} ${describeRecipe(r)}`);
});

test('颜料色系归类与知识库一致', () => {
  const fam = id => colorFamily(rgbToLab(hexToRgb(PIGMENTS.find(p => p.id === id).hex)));
  assert.equal(fam('cobalt'), '蓝');
  assert.equal(fam('lemon'), '黄');
  assert.equal(fam('cadred'), '红');
  assert.equal(fam('ochre'), '大地');
});
