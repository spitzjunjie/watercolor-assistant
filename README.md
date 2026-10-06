# 🎨 水彩调色助手 Watercolor Assistant

上传一张参考图，自动给出**水彩调色配方、配色、技法建议和作画先后顺序**。
配方与规则来自我的 Obsidian 水彩知识库（《水彩色彩理论 · 颜料·混色·技法大全》），混色用光谱 Kubelka–Munk 模型计算。

纯前端、零依赖、无需构建；图片只在浏览器本地分析，不上传任何服务器。

## 功能

| 模块 | 做什么 |
| --- | --- |
| **色块识别** | Lab 色彩空间 k-means 聚类，把参考图简化成 4–14 个“要调的颜色”，并统计面积、位置、冷暖 |
| **调色配方** | 在你勾选的颜料盘里搜索最接近的配方：单色 / 两色（比例）/ 两色 + 微量补色，并给出加水程度；优先选择知识库里的经验组合（如茜素红+群青“黄金组合”） |
| **技法建议** | 根据色块边缘软硬（明度梯度）、内部渐变、肌理强度、碎片程度，推荐湿画法 / 渐变 / 平涂 / 干叠罩染 / 干画硬边 / 飞白 / 留白 |
| **作画顺序** | 按“留白 → 浅色大面积湿画打底 → 中间调罩染塑造 → 暗部与细节 → 收尾”生成步骤；同阶段内大面积、靠上（天空/远景）的先画。点击步骤可在图上高亮要画的区域 |
| **明度研究** | 原图 / 色块 / 三阶 / 五阶明度 / 黑白 Notan 一键切换 |
| **单点取色** | 点击图上任意位置，单独查看那一点的调法 |
| **阴影与注意事项** | 每个色块附带知识库的“固有色 + 微量补色”阴影公式，以及强染色 / 沉淀色提醒 |
| **题材提示** | 粗略识别天空、晚霞、树木、水面、雪景、夜景、可爱风、大地，调出知识库对应题材的画法要点 |
| **我的颜料盘** | 风景盘 / 可爱盘 / 6 支核心 / 全部 12 色预设；可以把每支颜料的色值换成你自己色卡的实测值 |

## 运行

```bash
python3 -m http.server 8000   # 或 npm start
# 打开 http://localhost:8000
```

也可以直接开启 GitHub Pages（Settings → Pages → 从 `main` 分支根目录部署）。

测试（Node 18+）：`npm test`

## 目录

```
index.html            页面
css/style.css         样式（支持深色模式、手机）
js/kb.js              知识库结构化数据：12 支颜料、命名混色公式、阴影公式、技法、题材、规则
js/color.js           sRGB / Lab / CIEDE2000 / 色系归类
js/spectral-data.js   光谱基底与 CIE 配色函数（来自 spectral.js，MIT）
js/mixer.js           光谱 Kubelka–Munk 混色 + 配方搜索
js/analyze.js         聚类、边缘/肌理统计、明度分级、场景线索
js/planner.js         技法判定与作画顺序
js/app.js             界面交互
tests/                混色模型单元测试
```

## 调研：类似工具给的启发

| 工具 | 亮点 | 本项目借鉴 |
| --- | --- | --- |
| [Undertint](https://apps.apple.com/app/id6759327068) | 把照片简化成要画的颜色，每色给出用**自己颜料**调的配方，Kubelka–Munk 混色 | “我的颜料盘” + KM 混色 |
| [Mixable](https://apps.apple.com/app/id6769655280) | 任意目标色 → 只用你有的颜料算出比例 | 单点取色求配方 |
| [ThiColor](https://mwm.ai/apps/thicolor/6772541808) | AI 把参考图拆成分步作画指南，每步列出新颜色和调法 | 作画顺序分步 + 每步的颜色 |
| [True Color](https://apps.apple.com/us/app/id615904432) | 从相册取色给原色比例 | 比例显示 |
| [Color Study](https://mwm.ai/apps/color-study-simplify-painting/6755313672) / [Value Study](https://www.producthunt.com/products/value-study/launches/value-study) | 明度图、形状简化、冷暖图、Notan | 三阶/五阶明度、Notan、冷暖统计 |
| [Paint Mixer](https://github.com/Palette-Pickers/paint-mixer) · [Mixbox](https://scrtwpns.com/mixbox/docs/) · [spectral.js](https://github.com/rvanwijnen/spectral.js) | 开源颜料混色引擎 | 采用 spectral.js（MIT）的光谱重建方法；Mixbox 为非商用许可，未使用 |

**差异化**：现有工具大多只回答“这个颜色怎么调”，本工具把**水彩特有的规则**（由浅入深、留白、补色做阴影、强染色/沉淀色、近暖远冷、湿画/干画）接入分析，直接给出“先画哪里、用什么技法”。

## 局限

- 颜料色值是知识库色卡的近似值；用自己的颜料画色卡后在“我的颜料盘”里校准，配方会准很多。
- 混色模型是近似：没有考虑纸色、颜料透明度/着色力差异与干后变浅（界面已提示“调得略浓一档”）。
- 技法与场景是基于图像统计的启发式判断，不是语义识别。

## 路线图

- [ ] **AI 深度分析（可选）**：填入自己的 API Key，把参考图交给多模态大模型做语义分割（天空/树/人物…），把识别结果与本地配方引擎结合
- [ ] 色卡照片校准：拍一张自己的色卡，自动提取每支颜料的浓/淡色值
- [ ] 每支颜料的着色力、透明度参数进入混色模型
- [ ] 区域自定义：框选区域单独分析
- [ ] 导出作画计划（PDF / 图片 / Markdown 到 Obsidian）
- [ ] 更多题材：花卉、人像、建筑、静物

## 许可

MIT。第三方数据许可见 [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)。
