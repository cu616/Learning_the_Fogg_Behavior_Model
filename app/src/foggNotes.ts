export type FoggNote = {
  title: string;
  chapter: string;
  points: string[];
};

const CHAPTER_1: FoggNote[] = [
  { title: "实践心态", chapter: "第一章", points: ["停止自我批评。", "把愿望拆分成微行为。", "把每次错误当作新发现，不断改进。"] },
  { title: "从小改变", chapter: "第一章", points: ["仅有信息无法保证有效改变行为。", "持久改变的三条路径：经历顿悟、改变环境、微习惯。", "微习惯专注于 30 秒内可以完成的事。"] },
  { title: "毛伊习惯", chapter: "第一章", points: ["每天起床时说：“今天又是美好的一天。”并感受它的美好。"] },
  { title: "ABC", chapter: "第一章", points: ["A：锚点。", "B：微行为。", "C：即时庆祝。"] },
  { title: "B = MAP", chapter: "第一章", points: ["行为需要动机、能力和提示同时具备。", "动机越强，越可能行动；行为越容易，越容易形成习惯。", "重复通常会让行为变得更容易。"] },
  { title: "行为诊断", chapter: "第一章", points: ["按提示 → 能力 → 动机的顺序检查。"] },
];

const CHAPTER_2: FoggNote[] = [
  { title: "动机的特点", chapter: "第二章", points: ["PAC：人物、行动和情境共同影响动机。", "动机很复杂，冲上顶峰后会迅速回落，并且频繁波动。", "动机无法让抽象愿望直接产生结果。", "仅凭动机无法实现长期改变。"] },
  { title: "探索行为", chapter: "第二章", points: ["行为类型：一次性行为、培养新习惯、终止旧习惯。", "三个误区：全靠猜、上网寻找、照搬他人。"] },
  { title: "匹配黄金行为", chapter: "第二章", points: ["能帮助实现愿望。", "自己想做。", "自己能做到。"] },
];

const CHAPTER_3: FoggNote[] = [
  { title: "能力链", chapter: "第三章", points: ["能力指某个行为在当下是否容易做到，而不是综合能力。", "五个能力因素：时间、资金、体力、脑力、日程。", "能力链的强度取决于最薄弱的一环。"] },
  { title: "两个问题", chapter: "第三章", points: ["探索型问题：是什么让这个行为难以做到？", "突破型问题：怎样才能让这个行为变得更容易做到？"] },
  { title: "提升能力", chapter: "第三章", points: ["P：提升技能。", "A：获取工具和资源。", "C：让行为变得微小——入门步骤或缩小规模。"] },
  { title: "核心", chapter: "第三章", points: ["大物始于小。"] },
];

const CHAPTER_4: FoggNote[] = [
  { title: "提示类型", chapter: "第四章", points: ["人物提示：依赖记忆。", "情境提示：数量太多会让人迟钝。", "行动提示，也叫锚点，最可靠。"] },
  { title: "锚点配方", chapter: "第四章", points: ["在我（锚点）之后，我会（新习惯）。", "锚点必须精确到可观察的最后动作。"] },
  { title: "确定提示", chapter: "第四章", points: ["确定锚点：匹配物理位置、频率和主题／目的。", "通过试验将锚点与黄金行为联系起来。", "用锚点行为的最后动作进行优化。"] },
  { title: "顺便习惯", chapter: "第四章", points: ["利用等待时间和碎片时间养成微小习惯。"] },
  { title: "珍珠习惯", chapter: "第四章", points: ["把令人烦恼的事情转化成提示，接上有益的行为。"] },
];

const CHAPTER_5: FoggNote[] = [
  { title: "奖励与激励", chapter: "第五章", points: ["奖励不等于激励。"] },
  { title: "强力庆祝", chapter: "第五章", points: ["最能激发成功感的庆祝。"] },
  { title: "核心", chapter: "第五章", points: ["情绪创造习惯。", "庆祝要即时、真实，核心是产生成功感。", "微小行为本身就值得庆祝。", "锚点 → 微行为 → 庆祝可反复演练 7～10 次。"] },
  { title: "庆祝的三个时机", chapter: "第五章", points: ["想起时。", "执行时。", "完成时。"] },
  { title: "挑选庆祝方式", chapter: "第五章", points: ["选择对自己有效的方式。", "不同场景使用不同方式。"] },
  { title: "提醒", chapter: "第五章", points: ["成效最佳的改变源于自我感觉良好。"] },
];

const CHAPTER_6: FoggNote[] = [
  { title: "习惯形成", chapter: "第六章", points: ["PAC：取决于执行习惯的人、习惯本身和情境。", "成功动能源于感受成功的频率，而不是成功的大小。", "习惯没有固定的形成期限。", "习惯可以生长，也可以繁殖出其他习惯。"] },
  { title: "五类改变技巧", chapter: "第六章", points: ["行为加工：感兴趣、多样性、灵活性。", "自我洞察。", "循序渐进：排除障碍、重复和扩展。", "情境设计。", "心态调整。"] },
];

const CHAPTER_7: FoggNote[] = [
  { title: "三类习惯", chapter: "第七章", points: ["上山型习惯：需要努力维持，容易中断。", "下山型习惯：容易维持，难以停止。", "自由落体型习惯：没有专家帮助很难停止。"] },
  { title: "创建新习惯", chapter: "第七章", points: ["掌握改变的技巧。", "实现身份转变。"] },
  { title: "终止旧习惯", chapter: "第七章", points: ["把旧习惯拆成具体行为，一次解决一个。", "提示：移除、规避或忽略。", "能力：让旧行为更难做到。", "动机：最后再调整。"] },
  { title: "替代旧习惯", chapter: "第七章", points: ["新习惯要更有吸引力、更容易做到，并接到原来的提示上。"] },
];

export const STEP_NOTES: Record<number, FoggNote[]> = {
  1: [...CHAPTER_1, ...CHAPTER_2],
  2: [...CHAPTER_2],
  3: [...CHAPTER_2],
  4: [...CHAPTER_3],
  5: [...CHAPTER_4],
  6: [...CHAPTER_5],
  7: [...CHAPTER_6, ...CHAPTER_7],
};

export const ONE_TIME_NOTES: Record<string, FoggNote[]> = {
  capture: [...CHAPTER_1, ...CHAPTER_2],
  diagnose: [...CHAPTER_1, ...CHAPTER_2],
  P: [...CHAPTER_4, ...CHAPTER_7],
  A: [...CHAPTER_3, ...CHAPTER_7],
  M: [...CHAPTER_2, ...CHAPTER_7],
  action: [...CHAPTER_1, ...CHAPTER_5, ...CHAPTER_6],
};

export const OLD_HABIT_NOTES: Record<string, FoggNote[]> = {
  prepare: [CHAPTER_7[0], CHAPTER_7[1], CHAPTER_6[0]],
  clarify: [CHAPTER_7[0], CHAPTER_7[2], CHAPTER_2[1]],
  strategies: [CHAPTER_7[2], CHAPTER_3[0], CHAPTER_2[0]],
  observe: [CHAPTER_1[0], CHAPTER_5[2], CHAPTER_7[2]],
  replace: [CHAPTER_7[3], CHAPTER_4[1], CHAPTER_5[2]],
};
