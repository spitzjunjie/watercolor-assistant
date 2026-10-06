// 水彩知识库（结构化）
// 来源：作者 Obsidian 知识库《水彩色彩理论 · 颜料·混色·技法大全》。
// 颜料色值为知识库色卡里的“近似示意”值，建议在页面「颜料校准」里换成你手头颜料的真实色卡。

export const PIGMENTS = [
  { id: 'cobalt', name: '钴蓝', code: 'PB28', hex: '#4F6FA8', family: '蓝', desc: '中性柔和蓝 · 无紫无绿偏色',
    transparent: false, granulating: true, staining: false,
    scenes: '晴天浅天空、湖面浅水色、静物冷阴影、远景大气灰蓝、柔和冷调打底' },
  { id: 'ultramarine', name: '群青', code: 'PB29', hex: '#3F4EAA', family: '蓝', desc: '紫调深邃蓝 · 稀释为紫调浅蓝',
    transparent: false, granulating: true, staining: false,
    scenes: '黄昏/阴天天空、远山深色、暗部冷调、静物深阴影、氛围感暗调' },
  { id: 'phthalo', name: '酞青蓝', code: 'PB15', hex: '#1B74B4', family: '蓝', desc: '绿调通透蓝 · 饱和极高',
    transparent: true, granulating: false, staining: true,
    scenes: '湖水、深海、鲜亮绿植、多层罩染、通透冷暗部' },
  { id: 'alizarin', name: '茜素红', code: 'PR83', hex: '#9C2850', family: '红', desc: '冷调酒红 · 稀释玫瑰粉',
    transparent: true, granulating: false, staining: true,
    scenes: '玫瑰/粉色花卉、皮肤冷暗部、紫红色天空、红酒樱桃静物' },
  { id: 'rose', name: '永固玫红', code: '', hex: '#D0356E', family: '红', desc: '高透明玫红 · 强染色',
    transparent: true, granulating: false, staining: true,
    scenes: '多层罩染、通透红调、粉紫调花卉（可与茜素红互替）' },
  { id: 'cadred', name: '镉红', code: '', hex: '#E34A2B', family: '红', desc: '暖调亮红 · 稀释暖橘红',
    transparent: false, granulating: false, staining: false,
    scenes: '红花、红色静物、晚霞红光、高光水果、葡萄紫（+群青）' },
  { id: 'lemon', name: '柠檬黄', code: '', hex: '#E6DE45', family: '黄', desc: '冷调浅亮黄 · 偏绿无橙调',
    transparent: true, granulating: false, staining: false,
    scenes: '亮色水果、嫩叶、亮部绿植、高光暖调打底' },
  { id: 'yellow', name: '中黄', code: '', hex: '#F2B632', family: '黄', desc: '标准暖黄',
    transparent: false, granulating: false, staining: false,
    scenes: '橙子柿子、暖阳氛围、向阳嫩叶、成熟树叶、写实大地' },
  { id: 'ochre', name: '赭石', code: '', hex: '#B07C4A', family: '大地', desc: '暖调橙棕 · 沉淀低饱和',
    transparent: false, granulating: true, staining: false,
    scenes: '泥土、树干、石头、皮肤暖底色、秋景底色' },
  { id: 'bsienna', name: '熟褐', code: '', hex: '#5B4330', family: '大地', desc: '冷调深棕 · 偏蓝紫底',
    transparent: false, granulating: true, staining: false,
    scenes: '深色木纹、阴影棕、深色泥土、静物暗部压重' },
  { id: 'rumber', name: '生褐', code: '', hex: '#8E7046', family: '大地', desc: '绿调浅土棕 · 自然质朴',
    transparent: false, granulating: true, staining: false,
    scenes: '原生态土地、老树叶、复古风景底色' },
  { id: 'yochre', name: '土黄', code: '', hex: '#C5A25F', family: '大地', desc: '低饱和暖黄 · 矿物沉淀',
    transparent: false, granulating: true, staining: false,
    scenes: '沙地、枯草、复古底色、静物暖灰调' },
];

export const PALETTE_PRESETS = {
  landscape: { name: '风景盘（8 支）', ids: ['cobalt', 'ultramarine', 'phthalo', 'alizarin', 'lemon', 'yellow', 'ochre', 'bsienna'] },
  cute: { name: '可爱盘（7 支）', ids: ['lemon', 'yellow', 'alizarin', 'rose', 'phthalo', 'cobalt', 'ultramarine'] },
  core: { name: '6 支核心', ids: ['cobalt', 'ultramarine', 'phthalo', 'alizarin', 'lemon', 'ochre'] },
  all: { name: '全部 12 色', ids: PIGMENTS.map(p => p.id) },
};

// 知识库里的命名混色公式。pigments 为参与的颜料 id；trace 为“微量”加入的颜料。
export const RECIPES = [
  // 橙色系
  { name: '暗砖橙', family: '橙', pigments: ['lemon', 'alizarin'], scenes: '复古水果、红砖、暗调暖静物' },
  { name: '标准暖橙', family: '橙', pigments: ['yellow', 'alizarin'], scenes: '橙子、柿子、暖阳氛围画面' },
  { name: '鲜亮亮橙', family: '橙', pigments: ['yellow'], trace: ['cadred'], scenes: '高光水果、鲜艳暖调装饰画' },
  // 红色系
  { name: '标准中正红', family: '红', pigments: ['alizarin'], trace: ['cadred'], scenes: '红花、红色静物、主体视觉中心' },
  { name: '玫瑰粉', family: '红', pigments: ['alizarin'], diluted: true, scenes: '粉色花卉、少女色调、皮肤冷调' },
  { name: '暖橘红', family: '红', pigments: ['cadred'], diluted: true, scenes: '暖阳红花、暖调静物、晚霞红光' },
  // 紫色系
  { name: '通透紫罗兰（黄金组合）', family: '紫', pigments: ['alizarin', 'ultramarine'], scenes: '紫藤、薰衣草、紫调晚霞、花卉主色' },
  { name: '高级灰紫 / 藕紫', family: '紫', pigments: ['alizarin', 'cobalt'], scenes: '皮肤冷暗部、静物灰调暗部、莫兰迪色系' },
  { name: '深邃暗紫', family: '紫', pigments: ['alizarin'], trace: ['phthalo'], scenes: '深紫花瓣、暗部压重、夜景紫调（严控酞青用量）' },
  { name: '浓郁葡萄紫', family: '紫', pigments: ['cadred', 'ultramarine'], scenes: '葡萄、深紫色果实、复古暗调花卉' },
  { name: '粉紫氛围', family: '紫', pigments: ['rose', 'ultramarine'], scenes: '可爱风粉紫氛围、蕾丝边' },
  // 绿色系
  { name: '鲜亮翠绿', family: '绿', pigments: ['lemon', 'phthalo'], scenes: '春夏新叶、鲜草、透亮湖水' },
  { name: '柔和橄榄绿', family: '绿', pigments: ['lemon', 'cobalt'], scenes: '远景树叶、草木虚化、莫兰迪绿调' },
  { name: '冷调闷灰绿', family: '绿', pigments: ['lemon', 'ultramarine'], scenes: '秋冬老树叶、远山绿植、萧瑟风景' },
  { name: '暖调黄绿', family: '绿', pigments: ['yellow', 'phthalo'], scenes: '向阳嫩叶、春日暖调绿植' },
  { name: '棕调橄榄绿', family: '绿', pigments: ['yellow', 'cobalt'], scenes: '成熟树叶、灌木、写实风景草木' },
  // 蓝色系
  { name: '干净天蓝', family: '蓝', pigments: ['cobalt'], diluted: true, scenes: '白日晴空、浅水面、亮部冷调打底' },
  { name: '紫调浅蓝', family: '蓝', pigments: ['ultramarine'], diluted: true, scenes: '清晨、黄昏天空、氛围感浅远景' },
  { name: '透亮青蓝', family: '蓝', pigments: ['phthalo'], diluted: true, scenes: '清水、浅湖、通透冷调底色' },
  { name: '深邃藏蓝', family: '蓝', pigments: ['ultramarine'], scenes: '夜空、深海、画面深色压重' },
  // 大地棕灰
  { name: '浅红棕', family: '大地', pigments: ['yochre'], trace: ['alizarin'], scenes: '浅木色、沙土、暖调复古静物底色' },
  { name: '自然土棕', family: '大地', pigments: ['yellow', 'alizarin'], trace: ['ultramarine'], scenes: '泥土、树干、石头、写实大地底色' },
  { name: '冷调深棕', family: '大地', pigments: ['ochre'], trace: ['ultramarine'], scenes: '深色木纹、石头暗部、土地阴影' },
  { name: '绿调暗棕', family: '大地', pigments: ['ochre'], trace: ['phthalo'], scenes: '潮湿泥土、老树干、阴处大地' },
  { name: '高级冷棕灰', family: '大地', pigments: ['bsienna'], diluted: true, scenes: '静物暗部、画面压重、复古暗调层次' },
  { name: '棕灰', family: '灰', pigments: ['ochre'], trace: ['cobalt'], scenes: '大地、木质物体阴影' },
  // 单色
  { name: '赭石原色', family: '大地', pigments: ['ochre'], scenes: '泥土、树干、皮肤暖底（大量稀释）' },
  { name: '土黄原色', family: '大地', pigments: ['yochre'], scenes: '沙地、枯草、复古底色' },
  { name: '生褐原色', family: '大地', pigments: ['rumber'], scenes: '原生态土地、老树叶' },
  { name: '奶油黄', family: '黄', pigments: ['lemon'], diluted: true, scenes: '毛绒玩偶、甜点、背景光晕' },
];

// 万能阴影调色公式：阴影 = 固有色 + 微量补色 + 适度叠色压暗
export const SHADOWS = {
  '黄': { formula: '固有色黄 + 微量紫（茜素红+群青）', comp: ['alizarin', 'ultramarine'], examples: '梨子、柠檬、枯草' },
  '橙': { formula: '固有色橙 + 微量蓝（钴蓝/群青）', comp: ['cobalt'], examples: '橙子、柿子、红砖' },
  '红': { formula: '固有色红 + 微量绿（柠檬黄+酞青蓝）', comp: ['lemon', 'phthalo'], examples: '玫瑰、苹果、红布' },
  '绿': { formula: '固有色绿 + 微量茜素红', comp: ['alizarin'], examples: '树叶、青草、绿植' },
  '蓝': { formula: '固有色蓝 + 微量橙（中黄+茜素红）', comp: ['yellow', 'alizarin'], examples: '天空、湖水、蓝罐' },
  '紫': { formula: '固有色紫 + 微量柠檬黄', comp: ['lemon'], examples: '葡萄、紫藤、紫布' },
  '大地': { formula: '固有色棕 + 微量冷蓝', comp: ['cobalt'], examples: '泥土、木头、石头' },
  '灰': { formula: '主色 + 微量补色（彩色灰，忌纯黑）', comp: [], examples: '任意物体暗部' },
};

export const COMPLEMENT = { '黄': '紫', '紫': '黄', '红': '绿', '绿': '红', '蓝': '橙', '橙': '蓝' };

// 技法卡片（摘自知识库第七部分）
export const TECHNIQUES = {
  reserve: { name: '留白', icon: '◻', how: '下笔前标出留白区，直接空出纸白；小而散的高光可先用留白胶保护，画完尽早撕除。',
    tip: '留白 = 高光，也是构图的一部分；水彩没有白颜料，白靠纸。' },
  wetInWet: { name: '湿画法（湿纸湿色）', icon: '〰', how: '先用板刷/大圆头在纸面铺清水，趁有水光但不流动时上色，让颜色在湿纸上晕开。',
    tip: '水量决定晕染范围；湿画中加色要轻，重笔会把水色顶开产生硬边。' },
  gradedWash: { name: '渐变（湿接）', icon: '▤', how: '先铺湿目标区域，两侧分别上两色，让它们在湿边缘自然晕接；纸面倾斜 15–30° 帮助流动。',
    tip: '接色要快，慢了会出水痕。' },
  flatWash: { name: '平涂', icon: '▭', how: '一次调够色，水量均匀，笔含色饱满，一笔接一笔横刷，边缘湿着衔接。',
    tip: '趁湿快速完成，避免来回反复蹭出深浅不均。' },
  glazing: { name: '干叠罩染', icon: '◫', how: '底层完全干透后，用更稀的颜色薄叠一层，透光混色，加深层次。',
    tip: '每层等干再叠；沉淀色（群青、钴蓝、赭石）别反复厚叠，层次交给透明色。' },
  wetOnDry: { name: '干画法（干纸硬边）', icon: '▮', how: '在干纸上直接下笔，边缘清晰利落，适合近景、细节、树冠分层。',
    tip: '下笔前想好要硬边还是柔边，硬边过多可用干净湿笔沿边轻扫柔化。' },
  dryBrush: { name: '飞白（干笔）', icon: '⋰', how: '笔上色少、含水少，快速扫过纸面，凸起纸纹不吃色留下断续白纹。',
    tip: '配合粗纹纸效果最好；适合树冠高光、草、毛发、波光。' },
  lifting: { name: '洗色 / 吸色', icon: '◌', how: '趁湿用纸巾角或干海绵点吸，或干后用湿笔刷湿再吸走，洗出云、月亮、高光。',
    tip: '强染色颜料（酞青蓝、茜素红、永固玫红）几乎洗不掉。' },
  salt: { name: '撒盐', icon: '✦', how: '纸面湿但不再流动时撒盐，干透后扫掉，留下星状浅斑。',
    tip: '适合雪景、星空、肌理背景；棉浆纸效果最好。' },
  softenEdge: { name: '柔化边缘', icon: '◐', how: '趁色未干，用干净湿笔沿边缘轻扫一遍，让颜色向外渗开一点。',
    tip: '远景、倒影、云朵边缘都应偏柔。' },
};

// 题材专讲（第五部分）——按识别出的场景给出提示
export const THEMES = {
  sky: { name: '天空与云', tips: [
    '纸面先铺清水，趁湿上方用钴蓝稀释，靠近地平线接极淡暖调（变暖变灰）。',
    '云：留白法最稳；也可干后洗色或用海绵吸出蓬松感。',
    '云底暗部用群青/钴蓝 + 微量茜素红的灰紫蓝，亮部留白。'] },
  sunset: { name: '晚霞', tips: [
    '茜素红 + 群青（黄金组合）做紫调晚霞，太阳处留白或点淡黄。',
    '湿画法铺水后趁湿渐变，地平线处最亮最暖。'] },
  foliage: { name: '树与树冠', tips: [
    '先铺树冠整体浅绿底色，干后用小号笔/扇形笔点簇加深。',
    '亮部点 柠檬黄+酞青蓝，暗部点 绿+微量茜素红；最后点极淡柠檬黄高光。',
    '远树用钴蓝/群青灰蓝调、边缘模糊，一笔一个轮廓。'] },
  water: { name: '水面与倒影', tips: [
    '倒影在物体正下方，颜色 = 固有色更暗、更灰，边缘趁湿柔化。',
    '用水平短笔触压出波纹，水面亮部留白做波光。',
    '天空亮则水面比天空暗；倒影宽度与本体一致。'] },
  snow: { name: '雪景', tips: [
    '雪地 = 留白 + 冷调阴影，阴影用群青/钴蓝极淡 + 微量茜素红，宁淡勿深。',
    '阴影区趁湿撒盐出雪花肌理；暖色只做极小点缀（窗灯、炊烟）。'] },
  night: { name: '星空 / 夜景', tips: [
    '整片铺水，依次刷入群青 → 茜素红+群青 → 少量酞青蓝，让颜色自然晕接。',
    '控制水量：水太多会变成深灰而不是深蓝紫；星星可先点留白胶。',
    '前景山/树用纯剪影深色压住。'] },
  cute: { name: '可爱 / 治愈风', tips: [
    '所有颜色都稀释得比想象中淡一档，深色只出现在瞳孔、勾线等极少处。',
    '高光、眼白靠留白；阴影用对应彩色灰，忌纯黑勾边。',
    '画面太甜腻时掺入莫兰迪灰调平衡。'] },
  earth: { name: '泥土 / 石头 / 木质', tips: [
    '写实泥土：中黄 + 茜素红 + 微量群青（三色极淡）。',
    '石头暗部：赭石 + 微量群青；潮湿泥土：赭石 + 微量酞青蓝。',
    '大地色均为沉淀色，薄涂为主，可利用颗粒做肌理。'] },
};

export const RULES = [
  '由浅入深：水彩明度靠水不靠白，浅色永远盖不住深色。',
  '优先两色混合，三色仅极少量调大地灰，多色乱混必脏黑。',
  '阴影 ≠ 加黑，阴影 = 固有色 + 微量补色 + 适度叠色压暗。',
  '近暖远冷、近艳远灰：远景降饱和、偏冷蓝灰、边缘虚化。',
  '铺大色用湿混，细化层次用干叠罩染。',
  '强染色颜料（酞青蓝、茜素红、永固玫红）宁少勿多，干透无法修改。',
  '颜色干后会变浅，调色时比想要的略浓一档。',
];

export const MNEMONIC = '三原两两出间色，三色微调出大地；补色微量降饱和，加多发黑毁层次；酞青遇黄出艳绿，群青遇红出美紫；钴蓝混色最稳妥，茜素配紫是王牌；染色颜料下笔慎，沉淀颜料出肌理；阴影不加黑棕灰，对面微加最自然；近暖远冷近艳远虚，浅深叠色出通透。';
