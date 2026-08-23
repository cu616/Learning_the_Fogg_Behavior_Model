import { useEffect, useMemo, useState } from "react";
import {
  convertOneTimeToHabit, getOneTimeTask, listOneTimeDiagnoses, listOneTimeEvents,
  recordOneTimeEvent, saveOneTimeDiagnosis, saveOneTimeTask,
} from "../api/oneTime";
import type {
  OneTimeDiagnosisRound, OneTimeStatus, OneTimeTask, OneTimeTaskEvent,
  SaveOneTimeDiagnosisInput, SaveOneTimeTaskInput,
} from "../types";
import FoggNotePanel from "../components/FoggNotePanel";
import SupportDrawer from "../components/SupportDrawer";
import UiIcon from "../components/UiIcon";
import FloatingError from "../components/FloatingError";
import { ONE_TIME_NOTES } from "../foggNotes";

type Page = "capture" | "diagnose" | "factor" | "action";
type Factor = "P" | "A" | "M";
type ViewSnapshot = { page: Page; factor: Factor; entryMode: string; symptom: string; pOkay?: boolean; aEasy?: boolean };

const STATUS_LABEL: Record<OneTimeStatus, string> = {
  draft: "草稿", prepared: "已准备", in_progress: "进行中", completed: "已完成",
  cancelled: "已取消", delegated: "已委托", deferred: "已延期",
};

const FACTOR_HELP: Record<Factor, { title: string; subtitle: string }> = {
  P: { title: "P · 设计开始信号", subtitle: "决定什么会提醒你开始；这里只保存方案，不会自动弹出提醒。" },
  A: { title: "A · 降低行动难度", subtitle: "先找到最薄弱的一环，再让任务容易开始或让干扰更难。" },
  M: { title: "M · 处理动机", subtitle: "只在提示适时、动作已足够容易后，检查任务价值与真实冲突。" },
};

export default function OneTimeWorkbench({ taskId, onBack, onOpenHabit, mobile = false }: { taskId: number; onBack: () => void; onOpenHabit: (id: number) => void; mobile?: boolean }) {
  const [task, setTask] = useState<OneTimeTask>();
  const [rounds, setRounds] = useState<OneTimeDiagnosisRound[]>([]);
  const [events, setEvents] = useState<OneTimeTaskEvent[]>([]);
  const [page, setPage] = useState<Page>("capture");
  const [factor, setFactor] = useState<Factor>("P");
  const [entryMode, setEntryMode] = useState("guided");
  const [symptom, setSymptom] = useState("");
  const [pOkay, setPOkay] = useState<boolean>();
  const [aEasy, setAEasy] = useState<boolean>();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(!mobile);
  const [notesOpen, setNotesOpen] = useState(false);
  const [viewHistory, setViewHistory] = useState<ViewSnapshot[]>([]);

  async function refresh(syncPage = true) {
    const [t, r, e] = await Promise.all([getOneTimeTask(taskId), listOneTimeDiagnoses(taskId), listOneTimeEvents(taskId)]);
    setTask(t); setRounds(r); setEvents(e);
    if (syncPage) setPage((t.currentRoute as Page) || "capture");
  }

  useEffect(() => { refresh().catch((e) => setError(String(e))); }, [taskId]);

  async function persist(patch: Partial<SaveOneTimeTaskInput>) {
    if (!task) return;
    setSaved(false);
    try {
      const next = await saveOneTimeTask({
        id: task.id, title: task.title, completionStandard: task.completionStandard,
        nextAction: task.nextAction, deadline: task.deadline, completionEvidence: task.completionEvidence,
        currentIntent: task.currentIntent, currentRoute: task.currentRoute, status: task.status,
        decisionNote: task.decisionNote, celebration: task.celebration, ...patch,
      });
      setTask(next); setError(""); setSaved(true);
      return next;
    } catch (e) { setError(String(e)); setSaved(true); }
  }

  function update<K extends keyof OneTimeTask>(key: K, value: OneTimeTask[K]) {
    setTask((t) => t ? { ...t, [key]: value } : t);
    setSaved(false);
  }

  function navigateTo(nextPage: Page, next?: Partial<Omit<ViewSnapshot, "page">>) {
    const snapshot = { page, factor, entryMode, symptom, pOkay, aEasy };
    const nextFactor = next?.factor ?? factor;
    const nextEntryMode = next?.entryMode ?? entryMode;
    const nextSymptom = next?.symptom ?? symptom;
    if (nextPage === page && nextFactor === factor && nextEntryMode === entryMode && nextSymptom === symptom) return;
    setViewHistory((history) => [...history, snapshot].slice(-20));
    setPage(nextPage); setFactor(nextFactor); setEntryMode(nextEntryMode); setSymptom(nextSymptom);
    if (next?.pOkay !== undefined) setPOkay(next.pOkay);
    if (next?.aEasy !== undefined) setAEasy(next.aEasy);
  }

  function returnToPreviousView() {
    const previous = viewHistory[viewHistory.length - 1];
    if (!previous) return;
    setViewHistory((history) => history.slice(0, -1));
    setPage(previous.page); setFactor(previous.factor); setEntryMode(previous.entryMode); setSymptom(previous.symptom); setPOkay(previous.pOkay); setAEasy(previous.aEasy);
    void persist({ currentRoute: previous.page });
  }

  async function chooseIntent(intent: "now" | "stuck" | "later") {
    if (!task?.nextAction.trim()) { setError("先写下一个可以直接开始的当前下一动作。 "); return; }
    if (intent === "now") {
      await persist({ currentIntent: intent, currentRoute: "action", status: "in_progress" });
      navigateTo("action");
    } else if (intent === "stuck") {
      await persist({ currentIntent: intent, currentRoute: "diagnose", status: "prepared" });
      resetGuide(); navigateTo("diagnose", { pOkay: undefined, aEasy: undefined, symptom: "", entryMode: "guided" });
    } else {
      await persist({ currentIntent: intent, currentRoute: "factor", status: "prepared" });
      openFactor("P", "direct", "打算稍后做，需要一个适时提示");
    }
  }

  function resetGuide() { setPOkay(undefined); setAEasy(undefined); setSymptom(""); setEntryMode("guided"); }
  function openFactor(next: Factor, mode: string, why = "") { navigateTo("factor", { factor: next, entryMode: mode, symptom: why }); }

  async function finishAction(status: OneTimeStatus, note?: string) {
    if (status === "completed" && !task?.completionStandard?.trim()) {
      setError("标记完成前，请先补充“怎样算完成”。"); navigateTo("capture"); return;
    }
    await persist({ status, currentRoute: "action", decisionNote: note ?? task?.decisionNote });
    if (task) await recordOneTimeEvent(task.id, `action:${status}`, note);
    await refresh();
  }

  async function convert() {
    if (!task) return;
    const id = await convertOneTimeToHabit(task.id);
    await refresh(); onOpenHabit(id);
  }

  if (!task) return <div className="app"><p>{error || "正在读取…"}</p></div>;
  const noteKey = page === "factor" ? factor : page;

  return (
    <div className={`one-time-workbench${mobile ? " mobile-one-time-workbench" : ""}`}>
      <header className="ot-topbar">
        <button className="icon-action" onClick={onBack} title="返回首页" aria-label="返回首页"><UiIcon name="back" /></button>
        <div><strong>{task.title}</strong><small>一次性行为 · {STATUS_LABEL[task.status]}</small></div>
        <div className="ot-top-actions"><span className={saved ? "save-state" : "save-state pending"}>{saved ? "已保存到本地" : "有未保存修改"}</span><button className="icon-action" disabled={!viewHistory.length} onClick={returnToPreviousView} title="返回上一个流程页面（保留已保存内容）" aria-label="返回上一个流程页面"><UiIcon name="previous" /></button><button className="icon-action" onClick={() => setSummaryOpen((value) => !value)} title={summaryOpen ? "收起行为状态" : "展开行为状态"} aria-label={summaryOpen ? "收起行为状态" : "展开行为状态"} aria-expanded={summaryOpen}><UiIcon name="summary" /></button><button className="icon-action" onClick={() => setNotesOpen(true)} title="福格模型笔记" aria-label="打开福格模型笔记" aria-expanded={notesOpen}><UiIcon name="notes" /></button></div>
      </header>

      <div className="ot-layout">
        {summaryOpen && <aside className="ot-statusbar" aria-label="行为状态"><div className="statusbar-heading"><div><small>一次性行为</small><strong>行为状态</strong></div><span>{page === "capture" ? "1/3" : page === "action" ? "3/3" : "2/3"}</span></div><div className="ot-summary">
          <small>当前唯一的下一动作</small>
          <p className="ot-next-summary">{task.nextAction || "尚未明确"}</p>
          {rounds[0] && <div className="ot-last-adjust"><small>最近一次调整</small><p>{rounds[0].adjustment || rounds[0].method || `${rounds[0].selectedFactor} 因素`}</p></div>}
          <p className="gentle-note">未执行是设计反馈。你也可以取消、委托、延期或重新协商。</p>
        </div></aside>}

        <main className="ot-main">
          <nav className="ot-route-strip" aria-label="一次性行为流程">
            <button className={page === "capture" ? "active" : ""} onClick={() => navigateTo("capture")}><span>1</span>明确动作</button>
            <button className={page === "diagnose" || page === "factor" ? "active" : ""} onClick={() => navigateTo("diagnose")}><span>2</span>按需诊断</button>
            <button className={page === "action" ? "active" : ""} onClick={() => navigateTo("action")}><span>3</span>采取行动</button>
          </nav>
          <FloatingError message={error} onDismiss={() => setError("")} />
          {page === "capture" && <Capture task={task} update={update} persist={persist} chooseIntent={chooseIntent} />}
          {page === "diagnose" && <DiagnosisRouter pOkay={pOkay} aEasy={aEasy} setPOkay={setPOkay} setAEasy={setAEasy} openFactor={openFactor} onAction={() => navigateTo("action")} />}
          {page === "factor" && <FactorEditor task={task} factor={factor} entryMode={entryMode} symptom={symptom} onSaved={() => refresh(false)} onAction={() => navigateTo("action")} />}
          {page === "action" && <ActionPage task={task} rounds={rounds} persist={persist} finishAction={finishAction} onStuck={() => { resetGuide(); navigateTo("diagnose", { pOkay: undefined, aEasy: undefined, symptom: "", entryMode: "guided" }); }} onLater={() => openFactor("P", "direct", "需要为稍后行动设置提示")} onConvert={convert} allowHabitConversion />}

          <details className="ot-history">
            <summary>查看诊断与行动历史（{rounds.length} 轮诊断，{events.length} 条事件）</summary>
            <div className="ot-history-grid">
              <section><h4>诊断轮次</h4>{rounds.map((r) => <article key={r.id}><strong>第 {r.roundNumber} 轮 · {r.selectedFactor}</strong><small>{new Date(r.createdAt).toLocaleString()}</small><p>{r.adjustment || r.details || "已完成一次调整"}</p>{r.updatedNextAction && <p>下一动作：{r.updatedNextAction}</p>}</article>)}</section>
              <section><h4>行动事件</h4>{events.map((e) => <article key={e.id}><strong>{eventLabel(e.eventType)}</strong><small>{new Date(e.createdAt).toLocaleString()}</small>{e.notes && <p>{e.notes}</p>}</article>)}</section>
            </div>
          </details>
        </main>
        <SupportDrawer side="right" title="福格模型笔记" open={notesOpen} onClose={() => setNotesOpen(false)}><div className="ot-notes"><FoggNotePanel notes={ONE_TIME_NOTES[noteKey] || ONE_TIME_NOTES.capture} /></div></SupportDrawer>
      </div>
    </div>
  );
}

function Capture({ task, update, persist, chooseIntent }: {
  task: OneTimeTask; update: <K extends keyof OneTimeTask>(key: K, value: OneTimeTask[K]) => void;
  persist: (p: Partial<SaveOneTimeTaskInput>) => Promise<OneTimeTask | undefined>;
  chooseIntent: (i: "now" | "stuck" | "later") => void;
}) {
  return <section className="ot-page">
    <header><span>1</span><div><h2>把事情变成可以开始的动作</h2><p>只突出一个当前下一动作，不需要先做完整项目规划。</p></div></header>
    <div className="form-card field-grid">
      <label><span className="field-title"><i aria-hidden="true">◎</i><strong>我要完成什么？</strong></span><input value={task.title} onChange={(e) => update("title", e.target.value)} onBlur={() => persist({ title: task.title })} /></label>
      <label><span className="field-title"><i aria-hidden="true">✓</i><strong>怎样算完成？</strong></span><input value={task.completionStandard ?? ""} onChange={(e) => update("completionStandard", e.target.value)} onBlur={() => persist({ completionStandard: task.completionStandard })} placeholder="例如：看到“提交成功”" /></label>
      <label className="field-span-2 ot-core-action"><span className="field-title"><i aria-hidden="true">→</i><strong>现在最先做什么？</strong></span><textarea value={task.nextAction} onChange={(e) => update("nextAction", e.target.value)} onBlur={() => persist({ nextAction: task.nextAction })} placeholder="一个旁观者能看见、可以直接开始的动作，如“打开老师发来的要求”" /></label>
    </div>
    <details className="optional-panel"><summary>时间与完成证据 <span>（按需填写）</span></summary><div className="field-grid compact-fields">
      <label>截止时间<input type="datetime-local" value={task.deadline ?? ""} onChange={(e) => update("deadline", e.target.value)} onBlur={() => persist({ deadline: task.deadline })} /></label>
      <label>完成证据<input value={task.completionEvidence ?? ""} onChange={(e) => update("completionEvidence", e.target.value)} onBlur={() => persist({ completionEvidence: task.completionEvidence })} placeholder="提交回执、发送记录等" /></label>
    </div></details>
    <div className="ot-intent"><h3>这次准备怎样行动？</h3><div className="ot-choice-three"><button onClick={() => chooseIntent("now")}><strong>现在就做</strong><span>直接进入行动，不强制诊断</span></button><button onClick={() => chooseIntent("stuck")}><strong>我卡住了</strong><span>从 P→A→M 开始排查</span></button><button onClick={() => chooseIntent("later")}><strong>安排稍后做</strong><span>直接设计一次性提示</span></button></div></div>
  </section>;
}

function DiagnosisRouter({ pOkay, aEasy, setPOkay, setAEasy, openFactor, onAction }: {
  pOkay?: boolean; aEasy?: boolean; setPOkay: (v: boolean) => void; setAEasy: (v: boolean) => void;
  openFactor: (f: Factor, mode: string, symptom?: string) => void; onAction: () => void;
}) {
  return <section className="ot-page">
    <header><span>2</span><div><h2>只找这一次的主要阻力</h2><p>推荐按提示 → 能力 → 动机检查；确认一个因素后立即调整并返回行动。</p></div></header>
    <div className="diagnosis-router">
      <DiagnosticQuestion mark="P" title="在你打算开始的时刻，有信号提醒你开始吗？" detail="例如闹钟、日历、材料出现在眼前，或一个刚完成的动作。" value={pOkay} yesLabel="有，而且时机合适" noLabel="没有或时机不对" onYes={() => setPOkay(true)} onNo={() => openFactor("P", "guided", "提示缺失、不明确或时机不合适")} />
      {pOkay === true && <DiagnosticQuestion mark="A" title="当时完成最小下一动作容易吗？" detail="即使很累、很忙或心情不好，这一步仍容易吗？" value={aEasy} yesLabel="容易" noLabel="不容易" onYes={() => setAEasy(true)} onNo={() => openFactor("A", "guided", "想到了，但下一动作仍然太难或不清楚")} />}
      {pOkay === true && aEasy === true && <div className="diagnostic-question active"><b>M</b><div><strong>即使容易，你仍然不愿意做吗？</strong><p>现在才检查任务价值或真实的动机冲突。</p><div><button onClick={() => openFactor("M", "guided", "提示适时且行为容易，但仍有抵触")}>是，处理动机</button><button onClick={onAction}>不是，现在行动</button></div></div></div>}
    </div>
    <details className="optional-panel"><summary>我已经知道问题 <span>（快捷入口）</span></summary><div className="factor-shortcuts"><button onClick={() => openFactor("P", "direct", "我确认是提示问题")}>P 提示</button><button onClick={() => openFactor("A", "direct", "我确认是能力问题")}>A 能力</button><button onClick={() => openFactor("M", "direct", "我确认是动机问题")}>M 动机</button></div></details>
  </section>;
}

function DiagnosticQuestion({ mark, title, detail, value, yesLabel = "是", noLabel = "否", onYes, onNo }: { mark: string; title: string; detail: string; value?: boolean; yesLabel?: string; noLabel?: string; onYes: () => void; onNo: () => void }) {
  return <div className={`diagnostic-question ${value === true ? "passed" : "active"}`}><b>{mark}</b><div><strong>{title}</strong><p>{detail}</p><div><button onClick={onYes}>{yesLabel}</button><button onClick={onNo}>{noLabel}</button></div></div></div>;
}

function FactorEditor({ task, factor, entryMode, symptom, onSaved, onAction }: { task: OneTimeTask; factor: Factor; entryMode: string; symptom: string; onSaved: () => Promise<void>; onAction: () => void }) {
  const isLaterPrompt = factor === "P" && symptom.includes("稍后");
  const [targetSide, setTargetSide] = useState(factor === "M" || isLaterPrompt ? "task" : ""); const [problemType, setProblemType] = useState(isLaterPrompt ? "缺失" : "");
  const [method, setMethod] = useState(""); const [customMethod, setCustomMethod] = useState(""); const [weakestLink, setWeakestLink] = useState("");
  const [details, setDetails] = useState(""); const [adjustment, setAdjustment] = useState("");
  const [updatedNextAction, setUpdatedNextAction] = useState(task.nextAction); const [promptTime, setPromptTime] = useState("");
  const [promptPlace, setPromptPlace] = useState(""); const [minimumEasy, setMinimumEasy] = useState<boolean>();
  const [taskDecision, setTaskDecision] = useState(""); const [motivationConflict, setMotivationConflict] = useState("");
  const [adjustmentConfirmed, setAdjustmentConfirmed] = useState(false);
  const [outcome, setOutcome] = useState("act_now"); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const methods = useMemo(() => {
    const presets = factor === "P"
      ? (targetSide === "task" ? ["立即提示","定时提示","环境提示","行动提示","修复错位"] : ["移除","规避","忽略","重新映射"])
      : factor === "A"
        ? (targetSide === "task" ? ["提升技能","获取工具或资源","缩小规模","只做入门步骤","明确唯一下一动作","调整时间或地点"] : ["增加步骤","移开设备","退出账号","改变时段","移除快捷入口"])
        : ["说明与成果的关系","减少恐惧或厌恶","更换行为路径","利用动机波浪","返回 A 再简化"];
    return [...presets, "其他方法"];
  }, [factor, targetSide]);
  const links = ["时间","资金","体力","脑力","日程"];
  const resolvedMethod = method === "其他方法" ? customMethod.trim() : method;
  const targetReady = factor === "M" ? Boolean(taskDecision) : Boolean(targetSide);
  const diagnosisReady = factor === "P" ? Boolean(problemType) : factor === "A" ? targetSide === "distraction" || Boolean(weakestLink) : Boolean(taskDecision);
  const methodReady = factor === "M" && taskDecision !== "continue" ? Boolean(taskDecision) : Boolean(resolvedMethod);
  const promptNeedsTime = factor === "P" && targetSide === "task" && ["定时提示","修复错位"].includes(method);
  const promptNeedsPlace = factor === "P" && targetSide === "task" && ["环境提示","行动提示","修复错位"].includes(method);
  const closesTask = factor === "M" && ["cancelled","delegated","deferred"].includes(taskDecision);
  const methodStep = isLaterPrompt ? 1 : factor === "M" || targetSide === "distraction" ? 2 : 3;
  const adjustmentStep = factor === "M" && taskDecision !== "continue" ? 2 : methodStep + 1;

  function chooseTarget(side: string) {
    setTargetSide(side); setProblemType(side === "distraction" && factor === "P" ? "干扰提示" : "");
    setMethod(""); setCustomMethod(""); setWeakestLink(""); setMinimumEasy(undefined); setAdjustment(""); setAdjustmentConfirmed(false); setError("");
  }

  function chooseDecision(value: string, label: string) {
    setTaskDecision(value); setMethod(""); setCustomMethod(""); setMotivationConflict(""); setAdjustmentConfirmed(false); setError("");
    if (value === "continue") setAdjustment("");
    else setAdjustment(`决定${label}这件事`);
    setOutcome(value === "deferred" ? "later" : "act_now");
  }

  function confirmAdjustment() {
    if (!methodReady) { setError("先选择这轮采用的一个方法。"); return; }
    if (method === "其他方法" && !customMethod.trim()) { setError("请写明你准备采用的其他方法。"); return; }
    if (!adjustment.trim()) { setError("请用一句话写下这轮具体怎样调整。"); return; }
    if (factor === "A" && targetSide === "task" && minimumEasy !== true) {
      setError(minimumEasy === false ? "这一步还不够容易，请继续缩小后再确认。" : "请先完成最低动机测试。"); return;
    }
    setError(""); setAdjustmentConfirmed(true);
  }

  async function submit() {
    if (!adjustmentConfirmed) { setError("请先完成并确认这轮的一个具体调整。"); return; }
    if (factor !== "M" && !resolvedMethod) { setError("请选择这轮只采用的一个主要方法。 "); return; }
    if (factor === "M" && !taskDecision) { setError("请选择如何处理这件事。 "); return; }
    if (factor === "M" && taskDecision === "continue" && !resolvedMethod) { setError("继续完成时，请选择一个处理动机冲突的方法。 "); return; }
    if (factor === "A" && targetSide === "task" && !weakestLink) { setError("请先在能力链中选择当前最薄弱的环节。 "); return; }
    setBusy(true);
    const input: SaveOneTimeDiagnosisInput = { taskId: task.id, entryMode, symptom, recommendedFactor: factor, selectedFactor: factor, targetSide, problemType, method: resolvedMethod, weakestLink, details, adjustment, updatedNextAction, promptTime, promptPlace, minimumMotivationEasy: minimumEasy, taskDecision, motivationConflict, outcome };
    try { await saveOneTimeDiagnosis(input); await onSaved(); onAction(); } catch (e) { setError(String(e)); } finally { setBusy(false); }
  }

  return <section className="ot-page factor-page">
    <header><span>{factor}</span><div><h2>{FACTOR_HELP[factor].title}</h2><p>{FACTOR_HELP[factor].subtitle}</p></div></header>
    {symptom && <p className="route-reason">本轮线索：{symptom}</p>}

    {!isLaterPrompt && <div className={`factor-stage${targetReady ? " completed" : " current"}`}>
      <div className="factor-stage-heading"><span>1</span><strong>{factor === "M" ? "这件事现在怎样处理？" : "先选择要调整哪一边"}</strong></div>
      {factor !== "M" ? <div className="segmented"><button className={targetSide === "task" ? "active" : ""} onClick={() => chooseTarget("task")}>{factor === "P" ? "让任务提示出现" : "让任务更容易"}</button><button className={targetSide === "distraction" ? "active" : ""} onClick={() => chooseTarget("distraction")}>{factor === "P" ? "处理干扰提示" : "让干扰更难"}</button></div>
        : <div className="decision-grid">{[["continue","继续"],["cancelled","取消"],["delegated","委托"],["deferred","延期"],["renegotiate","重新协商"]].map(([v,l]) => <button key={v} className={taskDecision === v ? "active" : ""} onClick={() => chooseDecision(v, l)}>{l}</button>)}</div>}
    </div>}

    {targetReady && factor === "P" && targetSide === "task" && !isLaterPrompt && <div className={`factor-stage${diagnosisReady ? " completed" : " current"}`} aria-live="polite">
      <div className="factor-stage-heading"><span>2</span><strong>提示哪里出了问题？</strong></div>
      <label className="compact-select">提示问题<select value={problemType} onChange={(e) => { setProblemType(e.target.value); setMethod(""); setAdjustmentConfirmed(false); }}><option value="">请选择最接近的一项</option>{["缺失","不明确","时机错位","情境不匹配"].map((v) => <option key={v}>{v}</option>)}</select></label>
    </div>}

    {targetReady && factor === "A" && targetSide === "task" && <div className={`factor-stage${diagnosisReady ? " completed" : " current"}`} aria-live="polite">
      <div className="factor-stage-heading"><span>2</span><strong>哪一环让开始最困难？</strong></div>
      <div className="ability-chain compact-chain">{links.map((v, i) => <div className="chain-part" key={v}><button className={`chain-link ${weakestLink === v ? "weakest" : ""}`} onClick={() => { setWeakestLink(v); setMethod(""); setAdjustmentConfirmed(false); }}><span>{v}</span></button>{i < links.length - 1 && <i>—</i>}</div>)}</div>
    </div>}

    {diagnosisReady && (factor !== "M" || taskDecision === "continue") && <div className={`factor-stage${methodReady ? " completed" : " current"}`} aria-live="polite">
      <div className="factor-stage-heading"><span>{methodStep}</span><strong>{isLaterPrompt ? "选择一个开始信号" : "这轮只选一个方法"}</strong></div>
      {factor === "M" && <label>主要动机冲突 <span className="optional-text">（非必填）</span><textarea value={motivationConflict} onChange={(e) => setMotivationConflict(e.target.value)} placeholder="害怕、厌恶、含糊，或其他真实阻力" /></label>}
      <div className="method-pills">{methods.map((v) => <button key={v} className={method === v ? "active" : ""} onClick={() => { setMethod(v); setCustomMethod(""); setMinimumEasy(undefined); setAdjustment(""); setAdjustmentConfirmed(false); setError(""); }}>{v}</button>)}</div>
      {method === "其他方法" && <label className="custom-method">写下你的方法<input value={customMethod} onChange={(e) => { setCustomMethod(e.target.value); setAdjustmentConfirmed(false); }} placeholder="一个安全、具体、这次能执行的方法" /></label>}
    </div>}

    {methodReady && <div className={`factor-stage${adjustmentConfirmed ? " completed" : " current"}`} aria-live="polite">
      <div className="factor-stage-heading"><span>{adjustmentStep}</span><strong>{factor === "M" && taskDecision !== "continue" ? "把决定写成这次的具体处理" : "把方法写成这次的具体调整"}</strong></div>
      <div className="field-grid compact-fields">
        <label className="field-span-2">我准备这样调整<textarea value={adjustment} onChange={(e) => { setAdjustment(e.target.value); setAdjustmentConfirmed(false); }} placeholder={factor === "P" ? "例如：明早 9 点在日历响起时打开申请页面" : targetSide === "distraction" ? "例如：把手机放到需要起身才能拿到的地方" : "例如：只打开文件并阅读第一条要求"} /></label>
        {promptNeedsTime && <label>计划时间 <span className="optional-text">（只记录，不会自动提醒）</span><input type="datetime-local" value={promptTime} onChange={(e) => { setPromptTime(e.target.value); setAdjustmentConfirmed(false); }} /></label>}
        {promptNeedsPlace && <label>地点 / 情境 <span className="optional-text">（非必填）</span><input value={promptPlace} onChange={(e) => { setPromptPlace(e.target.value); setAdjustmentConfirmed(false); }} placeholder="在哪里、材料处于什么状态" /></label>}
        {factor === "A" && targetSide === "task" && <label className="field-span-2">调整后的当前下一动作<textarea value={updatedNextAction} onChange={(e) => { setUpdatedNextAction(e.target.value); setAdjustmentConfirmed(false); }} /></label>}
      </div>
      {factor === "P" && <p className="offline-note"><strong>不会自动弹出提醒。</strong>软件只保存这份提示方案；需要闹钟或日历时，请在系统工具中设置。</p>}
      {factor === "A" && targetSide === "task" && <label className="minimum-test">很累、很忙或心情不好时，这一步仍容易吗？ <span><button className={minimumEasy === true ? "active" : ""} onClick={() => { setMinimumEasy(true); setAdjustmentConfirmed(false); }}>仍然容易</button><button className={minimumEasy === false ? "active" : ""} onClick={() => { setMinimumEasy(false); setAdjustmentConfirmed(false); }}>还要再缩小</button></span></label>}
      <button className="primary stage-confirm" onClick={confirmAdjustment}>完成这项调整</button>
    </div>}

    {adjustmentConfirmed && <div className="factor-stage final-stage" aria-live="polite">
      <div className="factor-stage-heading"><span>✓</span><strong>{closesTask ? "最后：保存这次处理决定" : "最后：这次调整后怎么走？"}</strong></div>
      {!closesTask && <div className="field-grid"><label>接下来要做的动作<input value={updatedNextAction} onChange={(e) => setUpdatedNextAction(e.target.value)} /></label><label>下一步<select value={outcome} onChange={(e) => setOutcome(e.target.value)}><option value="act_now">现在行动</option><option value="later">安排稍后</option><option value="rediagnose">仍卡住时再诊断</option></select></label></div>}
      <details className="optional-panel"><summary>补充当时情境 <span>（非必填）</span></summary><textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="记录判断依据或当时情境" /></details>
      <button className="primary" onClick={submit} disabled={busy}>{busy ? "保存中…" : closesTask ? "保存处理决定" : "保存调整并继续"}</button>
    </div>}
    <FloatingError message={error} onDismiss={() => setError("")} />
  </section>;
}

function ActionPage({ task, rounds, persist, finishAction, onStuck, onLater, onConvert, allowHabitConversion }: { task: OneTimeTask; rounds: OneTimeDiagnosisRound[]; persist: (p: Partial<SaveOneTimeTaskInput>) => Promise<OneTimeTask | undefined>; finishAction: (s: OneTimeStatus, n?: string) => Promise<void>; onStuck: () => void; onLater: () => void; onConvert: () => void; allowHabitConversion: boolean }) {
  const [celebration, setCelebration] = useState(task.celebration ?? "");
  const closed = ["completed","cancelled","delegated"].includes(task.status);
  return <section className="ot-page action-page"><header><span>3</span><div><h2>{closed ? "这次行为已经有了处理结果" : "现在采取行动"}</h2><p>这里只执行当前下一动作；仍然卡住时再开启新一轮诊断。</p></div></header>
    <div className="current-action-card"><small>现在只做这一件事</small><strong>{task.nextAction || "请返回上一步明确下一动作"}</strong>{rounds[0]?.adjustment && <p>本轮调整：{rounds[0].adjustment}</p>}</div>
    {!closed && <div className="action-buttons"><button className="primary" onClick={() => finishAction("in_progress", "已开始当前下一动作")}>开始行动</button><button onClick={() => finishAction("completed", "已确认完成标准")}>任务已完成</button><button onClick={onLater}>安排稍后</button><button onClick={onStuck}>仍然卡住，再诊断</button></div>}
    {task.status === "completed" && <div className="celebrate-once"><h3>为这次进展创造一点积极情绪</h3><div><input value={celebration} onChange={(e) => setCelebration(e.target.value)} placeholder="例如：轻轻握拳说“完成了”" /><button onClick={() => persist({ celebration })}>保存庆祝</button></div><p>庆祝不要求形成长期配方，也不要求重复演练。</p></div>}
    {task.status === "delegated" && <p className="outcome-note">任务已委托。这是有效的处理决定，不是失败。</p>}{task.status === "cancelled" && <p className="outcome-note">任务已取消。软件保留当时的判断与历史。</p>}{task.status === "deferred" && <p className="outcome-note">任务已延期；准备好时可以重新明确下一动作。</p>}
    <details className="optional-panel"><summary>其他有效处理与后续</summary><div className="secondary-actions"><button onClick={() => finishAction("cancelled")}>取消</button><button onClick={() => finishAction("delegated")}>委托</button><button onClick={() => finishAction("deferred")}>延期</button>{allowHabitConversion && <button onClick={onConvert}>{task.convertedProjectId ? "打开已转换的长期习惯" : "这其实需要重复：转为长期习惯"}</button>}</div></details>
  </section>;
}

function eventLabel(value: string) {
  const labels: Record<string,string> = { created: "已捕获", diagnosis: "完成诊断", archived: "已归档", restored: "已恢复", converted_to_habit: "转为长期习惯" };
  if (labels[value]) return labels[value];
  if (value.startsWith("status:")) return `状态：${STATUS_LABEL[value.slice(7) as OneTimeStatus] ?? value.slice(7)}`;
  if (value.startsWith("action:")) return "行动记录";
  return value;
}
