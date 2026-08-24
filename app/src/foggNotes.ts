export type FoggNote = {
  label: string;
  title: string;
  takeaway: string;
  question: string;
  points: string[];
  action: string;
};

const MINDSET: FoggNote = {
  label: "实验心态", title: "先检查设计，不批评自己",
  takeaway: "行为没有发生，说明动机、能力或提示至少有一项没有同时到位。",
  question: "这次现实结果告诉了我哪一个设计条件？",
  points: ["不要把一次中断解释成意志力问题。", "先找最容易验证的原因，再做一次小调整。"],
  action: "用一句中性的话记录事实，例如“我想起来了，但当时太累”。",
};

const ASPIRATION: FoggNote = {
  label: "第一步", title: "愿望负责指方向，行为负责发生",
  takeaway: "“更健康”可以是愿望，但它不是今天可以直接执行的动作。",
  question: "我真正想让生活朝哪个方向变化？",
  points: ["愿望可以宽，当前行为必须具体。", "不要因为愿望很大，就把第一步也设计得很大。"],
  action: "先写一句值得继续探索的方向；暂时不要加入频率和强度承诺。",
};

const MOTIVATION: FoggNote = {
  label: "动机", title: "不要把方案押在动机高峰上",
  takeaway: "动机会波动；能在普通甚至疲惫时完成的行为，才更适合长期设计。",
  question: "如果今天只有最低动机，我还愿意并能够做它吗？",
  points: ["高动机适合帮助开始，不适合承担长期稳定性。", "长期不想做时，可能需要重新匹配行为，而不是继续加压。"],
  action: "把方案放到一个普通工作日里想象一次，而不是只想象状态最好的自己。",
};

const EXPLORE: FoggNote = {
  label: "第二步", title: "先发散，暂时不要筛选",
  takeaway: "行为集群的目标是扩大选择空间，不是立刻找到唯一正确答案。",
  question: "这个描述能被别人看见或听见吗？",
  points: ["“自律一点”是评价，不是行为。", "从不同时间、地点和情境继续追问“还有呢？”。"],
  action: "连续写下 5 个动作；每个动作都以动词开头，并能在某个时刻完成。",
};

const FOCUS: FoggNote = {
  label: "第三步", title: "黄金行为必须匹配现在的你",
  takeaway: "右上象限只是候选区；最终选择还要同时满足有效、想做、能做。",
  question: "这是我真想做的，还是别人认为我应该做的？",
  points: ["影响高但做不到，不是当前黄金行为。", "容易但无助于愿望，也不必优先。", "可以保留多个候选，但一次只推进一个方案。"],
  action: "先按现实可行性摆放，再对右上候选逐一回答“我想做吗？”。",
};

const ABILITY: FoggNote = {
  label: "第四步", title: "能力链只看最薄弱的一环",
  takeaway: "时间、资金、体力、脑力、日程中，只要一项卡住，整个行为就会变难。",
  question: "具体是什么让它在那个时刻难以做到？",
  points: ["能力指当下是否容易，不是对人的综合评价。", "优先改变环境、工具或规模，而不是要求自己更用力。"],
  action: "只选最明显的一项阻力，并写出一个能让它容易一点的改法。",
};

const TINY: FoggNote = {
  label: "微小化", title: "基线是最低版本，不是新的上限",
  takeaway: "缩小规模和入门步骤都能越过行动线；多做始终是可选扩展。",
  question: "在疲惫、赶时间或心情不好时，我仍能做哪一个版本？",
  points: ["缩小规模：减少次数、时长或难度。", "入门步骤：只完成启动更大行为的第一个动作。"],
  action: "把原行为分别写成一个 30 秒版本和一个“只开始”的版本，再选更自然的那个。",
};

const PROMPT: FoggNote = {
  label: "第五步", title: "好锚点要精确到最后动作",
  takeaway: "“早上”不是锚点；稳定发生的既有动作结束时，才是可用的锚点时刻。",
  question: "哪一个动作一结束，我就能立刻开始新行为？",
  points: ["匹配地点、频率和主题。", "人物提示依赖记忆；行动提示通常更可靠。"],
  action: "把“在早上”改写成“在我把牙刷放回杯子之后”这一类句子。",
};

const CELEBRATION: FoggNote = {
  label: "第六步", title: "庆祝的任务是让成功被感受到",
  takeaway: "积极情绪必须紧跟行为；延迟奖励不能替代即时的成功感。",
  question: "这个动作会让我真实地感觉“我做到了”吗？",
  points: ["庆祝可以很小，也可以只在心里发生。", "感到尴尬或虚假，就换一种更自然的方式。"],
  action: "现在试演三次完整顺序：锚点、微行为、庆祝，并保留最自然的版本。",
};

const PRACTICE: FoggNote = {
  label: "第七步", title: "按提示 → 能力 → 动机诊断",
  takeaway: "完全忘记先看提示；想起来却没做先看能力；两者都没问题才检查动机。",
  question: "这次是没被提示、太难，还是根本不想做？",
  points: ["优先从最可能的原因开始尝试，结果会更容易理解。", "保留原来的小基线，避免扩展变成新的最低要求。"],
  action: "选择最符合事实的一种结果，然后只返回对应步骤改一处。",
};

const GROWTH: FoggNote = {
  label: "习惯生长", title: "稳定来自成功感，不来自固定天数",
  takeaway: "习惯没有统一的形成期限；自然多做可以发生，但不需要强迫升级。",
  question: "我是在自然生长，还是因为数字压力提高了最低标准？",
  points: ["中断后可以直接回到原基线。", "扩展、增加新习惯或保持不变都可以。"],
  action: "只有当你经常自然多做时，才考虑增加一个很小的可选扩展。",
};

const ONE_NEXT: FoggNote = {
  label: "一次性行为", title: "先明确当前唯一的下一动作",
  takeaway: "“完成报销”是成果；“打开报销系统并登录”才是可以立即开始的动作。",
  question: "如果现在开始，我的手和身体首先会做什么？",
  points: ["下一动作必须具体、可观察。", "完成标准、截止时间和行动步骤不是同一个字段。"],
  action: "把任务改写成一个动词开头、无需继续规划就能执行的动作。",
};

const STOP_SPECIFIC: FoggNote = {
  label: "终止旧习惯", title: "先把概括型旧习惯拆开",
  takeaway: "“玩手机太多”通常由多个具体行为组成，不能用一套对策同时解决。",
  question: "它通常在什么情境，以哪个可观察动作开始？",
  points: ["一次聚焦一个最容易改变的具体行为。", "目标可以是停止、减少、缩短、降低强度或有限实验。"],
  action: "写成“躺到床上后打开短视频”这样包含情境和动作的句子。",
};

const STOP_ORDER: FoggNote = {
  label: "反向设计", title: "先处理提示，再让旧行为变难",
  takeaway: "终止旧行为按提示、能力、动机的顺序反向设计，动机最后处理。",
  question: "我能否移除、规避或忽略原来的启动信号？",
  points: ["提示：移除、规避或忽略。", "能力：增加时间、资金、体力、脑力或日程阻力。", "再次发生只说明仍有情境没有被覆盖。"],
  action: "先选择一个成本低、可恢复的环境调整，观察下一次真实结果。",
};

const REPLACE: FoggNote = {
  label: "替代行为", title: "新行为要占住原来的时机",
  takeaway: "替代行为需要更有吸引力、更容易，并能在原提示出现时立即开始。",
  question: "原来的行为满足了什么需要，新行为能否更轻地满足它？",
  points: ["替代不是惩罚，也不是简单禁止。", "必要时把替代行为升级为完整的七步习惯设计。"],
  action: "保留原提示，写下一个 30 秒内可以开始的新动作。",
};

export const STEP_NOTES: Record<number, FoggNote[]> = {
  1: [ASPIRATION, MOTIVATION, MINDSET],
  2: [EXPLORE, MOTIVATION, MINDSET],
  3: [FOCUS, MOTIVATION, MINDSET],
  4: [ABILITY, TINY, MINDSET],
  5: [PROMPT, PRACTICE, MINDSET],
  6: [CELEBRATION, MINDSET],
  7: [PRACTICE, GROWTH, MINDSET],
};

export const ONE_TIME_NOTES: Record<string, FoggNote[]> = {
  capture: [ONE_NEXT, ASPIRATION, MINDSET],
  diagnose: [PRACTICE, MINDSET],
  P: [PROMPT, PRACTICE],
  A: [ABILITY, TINY],
  M: [MOTIVATION, FOCUS],
  action: [ONE_NEXT, CELEBRATION, PRACTICE],
};

export const OLD_HABIT_NOTES: Record<string, FoggNote[]> = {
  prepare: [MINDSET, GROWTH],
  clarify: [STOP_SPECIFIC, FOCUS],
  strategies: [STOP_ORDER, ABILITY, MOTIVATION],
  observe: [PRACTICE, MINDSET],
  replace: [REPLACE, PROMPT, CELEBRATION],
};
