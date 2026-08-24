import UiIcon from "../components/UiIcon";

const LONG_TERM_STEPS = [
  {
    title: "明确愿望", question: "我真正想让生活朝哪个方向变化？",
    doNow: ["只写方向，不急着写每天做多少。", "如果写成了具体任务，向上追问：我想从它得到什么？"],
    example: "让工作日的身体多活动一点", ready: "这句话指明了方向，但没有提前承诺时长、次数或强度。",
  },
  {
    title: "探索行为选项", question: "哪些看得见的动作可能帮助这个愿望？",
    doNow: ["先发散，暂时不评价难度。", "从早晨、通勤、午间、下午和睡前继续追问“还有呢？”。"],
    example: "早上拉伸；午饭后走到楼梯口；下午接水；晚饭后散步", ready: "已经有一组以动词开头、可以被观察到的行为。",
  },
  {
    title: "匹配黄金行为", question: "哪个行为有效、我想做，而且现在做得到？",
    doNow: ["在焦点地图上先判断影响和现实可行性。", "对右上候选再问一次：这是我想做，还是别人觉得我应该做？"],
    example: "把午餐餐具放回去后，走到楼梯口", ready: "它既有帮助，也符合办公楼环境和真实意愿。",
  },
  {
    title: "让行为变小", question: "它为什么难？最低动机时还能做哪个版本？",
    doNow: ["检查时间、资金、体力、脑力和日程。", "选择缩小规模，或从一个入门步骤开始。"],
    example: "基线：走到楼梯口；可选扩展：愿意的话再多走一层", ready: "疲惫、忙碌或心情不好时，基线仍然可信。",
  },
  {
    title: "找到对的提示", question: "哪个可靠动作一结束，我就能立刻开始？",
    doNow: ["不要写“中午”“有空时”。", "精确到既有行为的最后动作，并检查地点和频率是否匹配。"],
    example: "在我把午餐餐具放回回收处之后", ready: "你能在脑中连续播放锚点结束和新行为开始的画面。",
  },
  {
    title: "庆祝成功", question: "怎样让我立刻、真实地感觉自己做到了？",
    doNow: ["当场试三种很小的庆祝。", "不自然就换，不必表演，也不要等待延迟奖励。"],
    example: "轻轻握拳，在心里说“这一拍接上了”", ready: "庆祝紧跟行为，而且确实能带来一点成功感。",
  },
  {
    title: "实践与迭代", question: "现实结果指向提示、能力还是动机？",
    doNow: ["完全忘记先查锚点；想起却没做先查难度。", "从最可能的原因开始尝试，并保留原来的小基线。"],
    example: "忘记了 → 把锚点从“午饭后”改成“放回餐具之后”", ready: "你在调整设计，而不是给自己打分。",
  },
] as const;

const TROUBLESHOOTING = [
  { signal: "我每次都能想起来，但到了那一刻还是开始不了", check: "先查能力。把时间、资金、体力、脑力和日程逐项过一遍，找出最薄弱的一环。", change: "把行为缩小一半，或先完成启动动作" },
  { signal: "锚点每天出现，行为却有时发生、有时消失", check: "检查锚点是否精确到最后动作，以及地点、频率和新行为能否紧接。", change: "重新写一遍锚点，行为暂时保持不变" },
  { signal: "微小版本已经很稳，我不知道什么时候可以加量", check: "看是否已经经常自然多做，而不是看连续天数。原来的基线继续保留。", change: "增加一个可选扩展，不抬高底线" },
  { signal: "一个愿望下有几个行为都很合适", check: "可以保留多个黄金行为，但每个行为应有独立的微小版本、锚点和庆祝。", change: "先推进一个方案，其余保留候选" },
  { signal: "出差、搬家或换班后，原来的配方突然失效", check: "环境变化通常先破坏提示或能力，并不表示之前的设计是假的。", change: "按新地点重新匹配提示和难度" },
  { signal: "旧行为涉及成瘾、进食、自伤或伤人风险", check: "这类情况超出普通行为练习的安全边界，软件记录不能替代评估和治疗。", change: "联系合格专业人员并优先保证安全" },
] as const;

export default function UserGuide({ onBack }: { onBack: () => void }) {
  return <div className="guide-shell">
    <header className="guide-topbar"><button className="icon-action" onClick={onBack} title="返回首页" aria-label="返回首页"><UiIcon name="back" /></button><div><strong>使用说明</strong></div><span>跟着案例完成第一次设计</span></header>
    <div className="guide-layout">
      <aside className="guide-nav" aria-label="说明书导航"><strong>第一次使用</strong><a href="#start">行为为什么会发生</a><a href="#choose">判断该走哪条路</a><a href="#seven-steps">跟做完整七步</a><a href="#task-lab">一次性行为演练</a><a href="#diagnose">现实诊断</a><a href="#old-habit">终止旧习惯</a><a href="#templates">可照抄模板</a><a href="#troubleshooting">卡住时怎么判断</a></aside>

      <main className="guide-main">
        <section className="guide-hero">
          <div className="guide-hero-copy"><h1>从一件真实的小事开始</h1><p>这份说明会陪你完成一次设计：先看行为为什么发生，再把一个日常愿望写成能在现实中试用的配方。</p><div className="guide-formula"><strong>Motivation · Ability · Prompt</strong><span>想做、做得到，又在恰当的时刻得到提示，行为才有机会发生。</span></div></div>
          <div className="guide-hero-band" aria-hidden="true"><img src="/themes/kessoku/hitori.png" alt="" /><img src="/themes/kessoku/nijika.png" alt="" /><p>先把第一步弹准，<br />不用一次完成整首歌。</p></div>
        </section>

        <section id="start" className="guide-section">
          <div className="guide-section-title"><small>第一章</small><h2>先看行为发生时，哪三个条件碰到了一起</h2><p>行为不是单靠“想不想”发生。动机、能力和提示会在同一个具体时刻共同影响结果。</p></div>
          <div className="map-explainer">
            <article><h3>Motivation <small>动机</small></h3><p>此刻有多想做。它很重要，但会上下波动，不能独自承担长期稳定性。</p><span>比如：今天很想活动一下</span></article>
            <article><h3>Ability <small>能力</small></h3><p>此刻是否容易做到。时间、资金、体力、脑力和日程都会影响难度。</p><span>比如：只走到楼梯口</span></article>
            <article><h3>Prompt <small>提示</small></h3><p>此刻有没有出现一个清楚、及时的启动信号。提示不能弥补过难的行为。</p><span>比如：放回餐具之后</span></article>
          </div>
          <div className="guide-principle"><strong>没有发生时，从哪里开始看</strong><p>先回想当时有没有被提醒；想起来却没做，再看看动作是不是太难。两者都顺畅时，才需要重新考虑动机。</p></div>
        </section>

        <section id="choose" className="guide-section">
          <div className="guide-section-title"><small>第二章</small><h2>先看这件事要不要重复发生</h2><p>不要按“难不难”选择工作流，只看你想让什么在未来发生变化。</p></div>
          <div className="guide-route-board">
            <div className="route-question"><span>先问一句</span><strong>这是想新增一次、反复发生，还是让已经重复的行为减少？</strong></div>
            <article className="route-line path-habit"><span className="route-index">A</span><UiIcon name="habit" /><div><small>希望以后继续发生</small><h3>长期习惯设计</h3><p>使用完整七步，为一个可以重复的小行为设计提示、难度和成功感。</p></div><strong>办公室久坐 → 午饭后走到楼梯口</strong></article>
            <article className="route-line path-task"><span className="route-index">B</span><UiIcon name="task" /><div><small>完成一次就结束</small><h3>一次性行为</h3><p>明确完成标准与眼前的下一动作；卡住时先看有没有被提醒，再看是不是太难。</p></div><strong>预约年度体检 → 找到常用医院的预约入口</strong></article>
            <article className="route-line path-old"><span className="route-index">C</span><UiIcon name="oldHabit" /><div><small>它已经在重复，我想让它减少</small><h3>终止旧习惯</h3><p>先拆出具体情境和动作，再反向处理提示、能力和动机。</p></div><strong>躺到床上就刷短视频 → 先移开床边的提示</strong></article>
          </div>
        </section>

        <section id="seven-steps" className="guide-section">
          <div className="guide-section-title"><small>第三章</small><h2>跟着一个真实工作日走完七步</h2><p>情境：小林在办公室工作，下午经常久坐，但没有稳定时间去健身。她想让身体多活动一点，又不想制定靠意志力硬撑的计划。</p></div>
          <div className="guide-before-after"><div><small>还不能直接执行</small><p>“我要每天运动三十分钟，变得自律。”</p></div><span>改写为</span><div><small>可以带进现实测试</small><p>“把午餐餐具放回去后，走到楼梯口。”</p></div></div>
          <ol className="guide-steps guide-steps-detailed">
            {LONG_TERM_STEPS.map((item, index) => <li key={item.title}>
              <span>{index + 1}</span>
              <div className="guide-step-copy"><h3>{item.title}</h3><strong>{item.question}</strong><ul>{item.doNow.map((line) => <li key={line}>{line}</li>)}</ul></div>
              <div className="guide-step-result"><small>示例结果</small><blockquote>{item.example}</blockquote><p><UiIcon name="check" size={16} />可以继续的判断：{item.ready}</p></div>
            </li>)}
          </ol>
          <div className="guide-recipe"><small>七步后形成的第一版配方</small><p>在我把午餐餐具放回回收处之后，我会走到楼梯口，然后轻轻握拳，在心里说“这一拍接上了”。</p><span>愿意时可以多走一层；原来的小基线不会因此失效。</span></div>
        </section>

        <section id="task-lab" className="guide-section">
          <div className="guide-section-title"><small>第四章</small><h2>一次性行为：从“该去体检了”到成功预约</h2><p>情境：这件事没有固定时间，医院和检查项目也还没有完全确定，所以它一直停留在待办清单里。</p></div>
          <div className="task-walkthrough">
            <article><span>01</span><div><h3>先写完成标准</h3><p>不要写“处理体检”。完成标准是：<strong>收到医院确认，预约日期已经进入日历。</strong></p></div></article>
            <article><span>02</span><div><h3>找到眼前的下一动作</h3><p>当前不需要规划整次体检。现在可以从这里开始：<strong>找到常用医院的预约入口。</strong></p></div></article>
            <article><span>03</span><div><h3>想起却没做，就查能力</h3><p>把阻力写具体：不知道挂哪个科、医保卡不在手边、开放日期不合适，或需要先询问家人时间。</p></div></article>
            <article><span>04</span><div><h3>为阻力选择去向</h3><p>能做就现在打开；需要资料就安排到拿到医保卡之后；仍不确定就保存这一轮诊断，而不是继续写大计划。</p></div></article>
          </div>
          <div className="guide-callout"><UiIcon name="check" /><p><strong>一次性行为不要求走完整七步。</strong>只有当它确实需要长期重复时，再转换成长期习惯设计。</p></div>
        </section>

        <section id="diagnose" className="guide-section">
          <div className="guide-section-title"><small>第五章</small><h2>事情没有照预想发生时，先还原现场</h2><p>找到最像当时情况的一行，只调整一个最可能的原因，再去现实里看下一次结果。</p></div>
          <div className="diagnosis-table" role="table" aria-label="行为诊断表">
            <div role="row"><strong role="columnheader">现实信号</strong><strong role="columnheader">先检查</strong><strong role="columnheader">可能调整</strong></div>
            <div role="row"><span>完全忘记了</span><b>提示</b><p>换成更稳定、精确的锚点；确认锚点当天真的出现。</p></div>
            <div role="row"><span>锚点没有出现</span><b>提示</b><p>检查频率和日程是否匹配，或选择另一个既有动作。</p></div>
            <div role="row"><span>想起来了，但没做</span><b>能力</b><p>检查最薄弱环节，把行为缩小或从入门步骤开始。</p></div>
            <div role="row"><span>容易、清楚，却长期不想做</span><b>动机</b><p>回到焦点地图，重新判断是否真正想做、是否选对愿望。</p></div>
            <div role="row"><span>做了，但庆祝很别扭</span><b>情绪</b><p>换一种更自然、更私密或更简短的庆祝。</p></div>
          </div>
          <p className="diagnosis-rule">诊断不用一次解决所有问题。从最像真实原因的地方开始，下一次结果会更容易读懂。</p>
        </section>

        <section id="old-habit" className="guide-section">
          <div className="guide-section-title"><small>第六章</small><h2>终止旧习惯：把设计方向反过来</h2><p>例子从“少玩手机”拆成“躺到床上后打开短视频”。</p></div>
          <div className="old-habit-sequence"><div><span>1</span><strong>先拆成具体行为</strong><p>写出典型情境、启动动作和有限目标。一次只选一个最容易处理的行为。</p></div><div><span>2</span><strong>先动提示</strong><p>手机放到卧室外；移除快捷入口；规避最容易触发的情境。</p></div><div><span>3</span><strong>再增加难度</strong><p>退出账号、关闭自动播放，让原行为多出几个明确步骤。</p></div><div><span>4</span><strong>必要时设计替代</strong><p>让更容易的新行为占住原来的时机，例如拿起床头纸书读一页。</p></div></div>
          <div className="old-habit-observe"><strong>观察时怎么记录</strong><span>没有发生</span><span>减少了</span><span>再次发生</span><span>没有遇到情境</span><p>“再次发生”只说明还有提示或情境没有被覆盖，不会被记为失败。</p></div>
          <p className="safety-note">严重成瘾、进食障碍、自伤风险或可能伤害他人的情况，请寻求合格专业支持。本软件只能帮助记录和准备，不能替代治疗。</p>
        </section>

        <section id="templates" className="guide-section">
          <div className="guide-section-title"><small>第七章</small><h2>第一次设计时，可以直接照抄这些句式</h2></div>
          <div className="copy-templates">
            <article><small>愿望</small><p>我希望生活朝着 ______ 的方向变化。</p></article>
            <article><small>具体行为</small><p>在 ______ 情境下，我会做出 ______ 这个可观察动作。</p></article>
            <article><small>微小化</small><p>最低动机时，我仍然可以从 ______ 开始。</p></article>
            <article><small>锚点</small><p>在我完成 ______ 的最后动作之后，我会 ______。</p></article>
            <article><small>庆祝</small><p>完成后，我会立刻 ______，让自己感觉做到了。</p></article>
            <article><small>诊断记录</small><p>这次没有发生，可能是因为 ______；接下来我准备试试 ______。</p></article>
          </div>
        </section>

        <section id="troubleshooting" className="guide-section">
          <div className="guide-section-title"><small>第八章</small><h2>卡住以后，先还原刚才发生了什么</h2><p>下面不是六条规定，而是六种常见现场。哪一段像你的处境，就从那里的建议开始试。</p></div>
          <div className="guide-troubleshooting">{TROUBLESHOOTING.map((item, index) => <article key={item.signal}><span aria-hidden="true">{["难", "提", "长", "选", "变", "安"][index]}</span><div><h3>{item.signal}</h3><p>{item.check}</p><p className="trouble-suggestion"><em>可以这样试</em>{item.change}</p></div></article>)}</div>
        </section>

        <section className="guide-section guide-ending"><div className="guide-section-title"><small>现在开始</small><h2>第一次，做出一个足够小的版本</h2></div><ol><li>选一条适合当前问题的工作流。</li><li>先回答当前页面的问题。</li><li>把第一版带回现实，而不是继续在软件里追求完美。</li></ol><button className="primary" onClick={onBack}>回到首页，开始第一次设计<UiIcon name="arrow" size={18} /></button><p>所有核心流程和这份说明都可以离线使用；个人行为数据默认只保存在本机。</p></section>
      </main>
    </div>
  </div>;
}
