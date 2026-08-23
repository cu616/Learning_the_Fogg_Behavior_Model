import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { hasPasscode } from "./api/applock";
import { createOldHabitProject, deleteOldHabitProject, listOldHabitProjects, setOldHabitArchived } from "./api/oldHabit";
import { createOneTimeTask, deleteOneTimeTask, listOneTimeTasks, setOneTimeArchived } from "./api/oneTime";
import { createProject, deleteProject, duplicateProject, listProjects, setProjectArchived } from "./api/projects";
import { loadBackgroundPreference } from "./backgroundPreference";
import FloatingError from "./components/FloatingError";
import DataSettings from "./screens/DataSettings";
import OldHabitWorkbench from "./screens/OldHabitWorkbench";
import OneTimeWorkbench from "./screens/OneTimeWorkbench";
import Workbench from "./screens/Workbench";
import { displayStatusOf, type HabitProject, type OldHabitProject, type OneTimeStatus, type OneTimeTask } from "./types";
import { LockScreen } from "./App";

type MobileKind = "habit" | "task" | "oldHabit";
type MobileView =
  | { name: "home"; kind: MobileKind }
  | { name: "habit"; projectId: number }
  | { name: "task"; taskId: number }
  | { name: "oldHabit"; projectId: number }
  | { name: "data" };
type MobileFilter = "进行中" | "已结束" | "全部";

const STATUS_LABEL: Record<OneTimeStatus, string> = {
  draft: "草稿", prepared: "已准备", in_progress: "进行中", completed: "已完成",
  cancelled: "已取消", delegated: "已委托", deferred: "已延期",
};
const CLOSED_TASKS: OneTimeStatus[] = ["completed", "cancelled", "delegated"];
const OLD_STAGE_LABEL = { prepare: "改变准备", clarify: "拆解旧习惯", strategies: "布置对策", observe: "观察调整", replace: "替代行为" } as const;
const OLD_STATUS_LABEL = { draft: "草稿", active: "进行中", observing: "观察中", replacing: "替代中", paused: "已暂停", achieved: "已达到目标" } as const;

const KIND_COPY: Record<MobileKind, { label: string; eyebrow: string; title: string; description: string; field: string; placeholder: string }> = {
  habit: { label: "长期习惯", eyebrow: "从小事开始生长", title: "设计一个能在生活中扎根的行为", description: "用七步工作流找到愿望、黄金行为、微习惯、锚点与庆祝。", field: "我希望发生什么改变？", placeholder: "例如：身体更健康" },
  task: { label: "一次性行为", eyebrow: "当前只处理一件事", title: "从一个可以开始的动作出发", description: "先把事情说清楚；需要时，再用 P → A → M 找到这一次的阻力。", field: "我要完成什么？", placeholder: "例如：提交报销材料" },
  oldHabit: { label: "终止旧习惯", eyebrow: "改变环境，而不是责备自己", title: "拆开一种想减少或停止的行为", description: "识别具体情境，布置提示、能力与动机对策，再观察和调整。", field: "我想改变什么旧习惯？", placeholder: "例如：睡前长时间刷手机" },
};

function ArrowIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M14 7l5 5-5 5" /></svg>; }
function PlusIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>; }
function MoreIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>; }
function SettingsIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M19 13.5v-3l-2-.7-.7-1.7.9-1.9-2.1-2.1-1.9.9-1.7-.7-.7-2h-3l-.7 2-1.7.7-1.9-.9-2.1 2.1.9 1.9-.7 1.7-2 .7v3l2 .7.7 1.7-.9 1.9 2.1 2.1 1.9-.9 1.7.7.7 2h3l.7-2 1.7-.7 1.9.9 2.1-2.1-.9-1.9.7-1.7 2-.7Z" /></svg>; }
function KindIcon({ kind }: { kind: MobileKind }) {
  if (kind === "habit") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 14c0-5 4-9 9-9h5v5c0 5-4 9-9 9H5v-5Z" /><path d="m7 17 8-8" /></svg>;
  if (kind === "oldHabit") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h12M7 6l1 14h8l1-14M9 3h6" /><path d="m9.5 10 5 5m0-5-5 5" /></svg>;
  return <ArrowIcon />;
}

export default function MobileApp() {
  const [view, setView] = useState<MobileView>({ name: "home", kind: "task" });
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    loadBackgroundPreference();
    hasPasscode().then(setLocked).finally(() => setChecking(false));
  }, []);

  const home = (kind: MobileKind = "task") => setView({ name: "home", kind });
  if (checking) return <div className="mobile-splash" aria-label="正在打开福格行为实验室"><span /></div>;
  if (locked) return <LockScreen onUnlock={() => setLocked(false)} />;
  if (view.name === "habit") return <Workbench mobile projectId={view.projectId} onBack={() => home("habit")} />;
  if (view.name === "task") return <OneTimeWorkbench mobile taskId={view.taskId} onBack={() => home("task")} onOpenHabit={(projectId) => setView({ name: "habit", projectId })} />;
  if (view.name === "oldHabit") return <OldHabitWorkbench mobile projectId={view.projectId} onBack={() => home("oldHabit")} onOpenHabit={(projectId) => setView({ name: "habit", projectId })} />;
  if (view.name === "data") return <div className="mobile-data-settings"><DataSettings onBack={() => home()} /></div>;
  return <MobileHome initialKind={view.kind} onOpenHabit={(projectId) => setView({ name: "habit", projectId })} onOpenTask={(taskId) => setView({ name: "task", taskId })} onOpenOldHabit={(projectId) => setView({ name: "oldHabit", projectId })} onData={() => setView({ name: "data" })} />;
}

function MobileHome({ initialKind, onOpenHabit, onOpenTask, onOpenOldHabit, onData }: { initialKind: MobileKind; onOpenHabit: (id: number) => void; onOpenTask: (id: number) => void; onOpenOldHabit: (id: number) => void; onData: () => void }) {
  const [kind, setKind] = useState<MobileKind>(initialKind);
  const [projects, setProjects] = useState<HabitProject[]>([]);
  const [tasks, setTasks] = useState<OneTimeTask[]>([]);
  const [oldHabits, setOldHabits] = useState<OldHabitProject[]>([]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<MobileFilter>("进行中");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const [habitItems, taskItems, oldItems] = await Promise.all([listProjects(), listOneTimeTasks(true), listOldHabitProjects(true)]);
      setProjects(habitItems); setTasks(taskItems); setOldHabits(oldItems); setError("");
    } catch (reason) { setError(String(reason)); }
  }
  useEffect(() => { void refresh(); }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    const name = title.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      if (kind === "habit") { const item = await createProject(name); setTitle(""); onOpenHabit(item.id); }
      else if (kind === "oldHabit") { const item = await createOldHabitProject(name); setTitle(""); onOpenOldHabit(item.id); }
      else { const item = await createOneTimeTask(name); setTitle(""); onOpenTask(item.id); }
    } catch (reason) { setError(String(reason)); }
    finally { setBusy(false); }
  }

  async function removeHabit(item: HabitProject) {
    if (!window.confirm(`删除“${item.name}”及其分支、配方和实践记录？\n\n删除前仍会创建本地保护备份。`)) return;
    try { await deleteProject(item.id, item.name); await refresh(); } catch (reason) { setError(String(reason)); }
  }
  async function removeTask(item: OneTimeTask) {
    if (!window.confirm(`删除“${item.title}”及其诊断记录？\n\n删除前仍会创建本地保护备份。`)) return;
    try { await deleteOneTimeTask(item.id, item.title); await refresh(); } catch (reason) { setError(String(reason)); }
  }
  async function removeOldHabit(item: OldHabitProject) {
    if (!window.confirm(`删除“${item.title}”及其对策和观察记录？\n\n删除前仍会创建本地保护备份。`)) return;
    try { await deleteOldHabitProject(item.id, item.title); await refresh(); } catch (reason) { setError(String(reason)); }
  }

  function isVisible(closed: boolean) { return filter === "全部" || (filter === "已结束" ? closed : !closed); }
  const visibleProjects = useMemo(() => projects.filter((item) => isVisible(Boolean(item.archivedAt) || item.phase === "stable")), [projects, filter]);
  const visibleTasks = useMemo(() => tasks.filter((item) => isVisible(Boolean(item.archivedAt) || CLOSED_TASKS.includes(item.status))), [tasks, filter]);
  const visibleOldHabits = useMemo(() => oldHabits.filter((item) => isVisible(Boolean(item.archivedAt) || item.status === "achieved")), [oldHabits, filter]);
  const visibleCount = kind === "habit" ? visibleProjects.length : kind === "oldHabit" ? visibleOldHabits.length : visibleTasks.length;
  const copy = KIND_COPY[kind];

  return <div className={`mobile-home mobile-kind-${kind}`}>
    <header className="mobile-appbar">
      <div className="mobile-brand-mark" aria-hidden="true"><KindIcon kind={kind} /></div>
      <div><strong>福格行为实验室</strong><small>{copy.label}</small></div>
      <button className="mobile-settings" type="button" onClick={onData} aria-label="数据与外观设置"><SettingsIcon /></button>
    </header>
    <main className="mobile-home-content">
      <nav className="mobile-kind-switch" aria-label="选择行为类型">
        {(["habit", "task", "oldHabit"] as MobileKind[]).map((item) => <button key={item} className={kind === item ? "active" : ""} onClick={() => { setKind(item); setTitle(""); setFilter("进行中"); }} aria-current={kind === item ? "page" : undefined}><KindIcon kind={item} /><span>{KIND_COPY[item].label}</span></button>)}
      </nav>
      <section className="mobile-hero">
        <small>{copy.eyebrow}</small><h1>{copy.title}</h1><p>{copy.description}</p>
        <form className="mobile-create" onSubmit={create}>
          <label htmlFor="mobile-project-title">{copy.field}</label>
          <div><input id="mobile-project-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={copy.placeholder} autoComplete="off" /><button className="primary" type="submit" disabled={!title.trim() || busy} aria-label={`创建${copy.label}`}><PlusIcon /></button></div>
        </form>
      </section>
      <section className="mobile-task-section" aria-labelledby="mobile-list-heading">
        <div className="mobile-section-head"><div><small>{visibleCount} 个当前结果</small><h2 id="mobile-list-heading">我的{copy.label}</h2></div></div>
        <div className="mobile-filter" role="group" aria-label={`筛选${copy.label}`}>{(["进行中", "已结束", "全部"] as MobileFilter[]).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)} aria-pressed={filter === item}>{item}</button>)}</div>
        <FloatingError message={error} onDismiss={() => setError("")} />
        <ul className="mobile-task-list">
          {kind === "habit" && visibleProjects.map((item) => <MobileCard key={item.id} title={item.name} status={displayStatusOf(item)} detail={item.phase === "draft" || item.phase === "designing" ? `下一步 · 第 ${item.currentStep ?? 1} 步` : item.phase === "stable" ? "当前 · 稳定生长" : "当前 · 现实实践"} onOpen={() => onOpenHabit(item.id)} actions={<><button onClick={async () => { await duplicateProject(item.id); await refresh(); }}>复制</button><button onClick={async () => { await setProjectArchived(item.id, !item.archivedAt); await refresh(); }}>{item.archivedAt ? "恢复" : "归档"}</button><button className="danger-text" onClick={() => removeHabit(item)}>删除</button></>} />)}
          {kind === "task" && visibleTasks.map((item) => <MobileCard key={item.id} title={item.title} status={STATUS_LABEL[item.status]} detail={item.nextAction ? `下一动作 · ${item.nextAction}` : "下一步 · 明确一个可以直接开始的动作"} onOpen={() => onOpenTask(item.id)} actions={<><button onClick={async () => { await setOneTimeArchived(item.id, !item.archivedAt); await refresh(); }}>{item.archivedAt ? "恢复" : "归档"}</button><button className="danger-text" onClick={() => removeTask(item)}>删除</button></>} />)}
          {kind === "oldHabit" && visibleOldHabits.map((item) => <MobileCard key={item.id} title={item.title} status={OLD_STATUS_LABEL[item.status]} detail={`当前 · ${OLD_STAGE_LABEL[item.currentStage]}`} onOpen={() => onOpenOldHabit(item.id)} actions={<><button onClick={async () => { await setOldHabitArchived(item.id, !item.archivedAt); await refresh(); }}>{item.archivedAt ? "恢复" : "归档"}</button><button className="danger-text" onClick={() => removeOldHabit(item)}>删除</button></>} />)}
          {visibleCount === 0 && <li className="mobile-empty"><strong>{filter === "进行中" ? `现在没有进行中的${copy.label}` : "这里还没有记录"}</strong><span>在上方写下一项，就可以开始。</span></li>}
        </ul>
      </section>
    </main>
  </div>;
}

function MobileCard({ title, status, detail, onOpen, actions }: { title: string; status: string; detail: string; onOpen: () => void; actions: ReactNode }) {
  return <li className="mobile-task-card">
    <button className="mobile-task-open" onClick={onOpen}><span className="mobile-status">{status}</span><strong>{title}</strong><small>{detail}</small><i><ArrowIcon /></i></button>
    <details className="mobile-task-menu"><summary aria-label={`管理 ${title}`}><MoreIcon /></summary><div>{actions}</div></details>
  </li>;
}
