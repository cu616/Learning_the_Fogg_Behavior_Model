import { useEffect, useState } from "react";
import {
  listProjects,
  createProject,
  renameProject,
  setProjectArchived,
  duplicateProject,
  deleteProject,
} from "./api/projects";
import Workbench from "./screens/Workbench";
import DataSettings from "./screens/DataSettings";
import OneTimeWorkbench from "./screens/OneTimeWorkbench";
import OldHabitWorkbench from "./screens/OldHabitWorkbench";
import { createOneTimeTask, deleteOneTimeTask, listOneTimeTasks, setOneTimeArchived } from "./api/oneTime";
import { hasPasscode, verifyPasscode } from "./api/applock";
import { displayStatusOf, type DisplayStatus, type HabitProject, type OneTimeStatus, type OneTimeTask } from "./types";
import { requiresDeleteNameConfirmation } from "./uiPreferences";
import { createOldHabitProject, deleteOldHabitProject, listOldHabitProjects, setOldHabitArchived } from "./api/oldHabit";
import type { OldHabitProject } from "./types";
import "./App.css";

const FILTERS: Array<DisplayStatus | "全部"> = [
  "全部",
  "设计中",
  "实践中",
  "稳定",
  "暂停",
  "归档",
];

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg className="chevron-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d={expanded ? "M5 12.5 10 7.5l5 5" : "M5 7.5l5 5 5-5"} />
    </svg>
  );
}

type View = { name: "home" } | { name: "workbench"; projectId: number } | { name: "oneTime"; taskId: number } | { name: "oldHabit"; projectId: number } | { name: "data" };

function App() {
  const [view, setView] = useState<View>({ name: "home" });
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    hasPasscode()
      .then(setLocked)
      .finally(() => setChecking(false));
  }, []);

  if (checking) return null;
  if (locked) return <LockScreen onUnlock={() => setLocked(false)} />;

  if (view.name === "workbench") {
    return <Workbench projectId={view.projectId} onBack={() => setView({ name: "home" })} />;
  }
  if (view.name === "oneTime") {
    return <OneTimeWorkbench taskId={view.taskId} onBack={() => setView({ name: "home" })} onOpenHabit={(projectId) => setView({ name: "workbench", projectId })} />;
  }
  if (view.name === "oldHabit") {
    return <OldHabitWorkbench projectId={view.projectId} onBack={() => setView({ name: "home" })} onOpenHabit={(projectId) => setView({name:"workbench",projectId})} />;
  }
  if (view.name === "data") {
    return <DataSettings onBack={() => setView({ name: "home" })} />;
  }
  return (
    <Home
      onOpen={(id) => setView({ name: "workbench", projectId: id })}
      onOpenOneTime={(id) => setView({ name: "oneTime", taskId: id })}
      onOpenOldHabit={(id) => setView({ name: "oldHabit", projectId: id })}
      onData={() => setView({ name: "data" })}
    />
  );
}

function Home({ onOpen, onOpenOneTime, onOpenOldHabit, onData }: { onOpen: (id: number) => void; onOpenOneTime: (id: number) => void; onOpenOldHabit: (id: number) => void; onData: () => void }) {
  const [projects, setProjects] = useState<HabitProject[]>([]);
  const [tasks, setTasks] = useState<OneTimeTask[]>([]);
  const [oldHabits, setOldHabits] = useState<OldHabitProject[]>([]);
  const [filter, setFilter] = useState<DisplayStatus | "全部">("全部");
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newOldHabit, setNewOldHabit] = useState("");
  const [habitOpen, setHabitOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [oldHabitOpen, setOldHabitOpen] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const [habitItems, oneTimeItems, oldHabitItems] = await Promise.all([listProjects(), listOneTimeTasks(false), listOldHabitProjects(true)]);
      setProjects(habitItems);
      setTasks(oneTimeItems);
      setOldHabits(oldHabitItems);
      setError("");
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate() {
    const name = newName.trim();
    if (!name) return;
    await createProject(name);
    setNewName("");
    await refresh();
  }

  async function onCreateTask() {
    const title = newTask.trim();
    if (!title) return;
    const task = await createOneTimeTask(title);
    setNewTask("");
    onOpenOneTime(task.id);
  }

  async function onCreateOldHabit() {
    const title=newOldHabit.trim(); if(!title)return;
    const item=await createOldHabitProject(title);setNewOldHabit("");onOpenOldHabit(item.id);
  }

  async function onRename(p: HabitProject) {
    const name = window.prompt("重命名习惯：", p.name);
    if (name && name.trim()) {
      await renameProject(p.id, name.trim());
      await refresh();
    }
  }

  async function onArchive(p: HabitProject) {
    await setProjectArchived(p.id, !p.archivedAt);
    await refresh();
  }

  async function onDuplicate(p: HabitProject) {
    await duplicateProject(p.id);
    await refresh();
  }

  async function onDeleteProject(p: HabitProject) {
    if (!window.confirm(`要永久删除行为设计“${p.name}”及其所有分支、配方和实践记录吗？\n\n删除前软件会自动创建可恢复的完整备份。`)) return;
    const confirmation = requiresDeleteNameConfirmation()
      ? window.prompt(`请输入完整名称以确认删除：\n${p.name}`, "")
      : p.name;
    if (confirmation === null) return;
    try { await deleteProject(p.id, confirmation); await refresh(); }
    catch (e) { setError(String(e)); }
  }

  async function onDeleteTask(t: OneTimeTask) {
    if (!window.confirm(`要永久删除一次性行为“${t.title}”及其诊断历史吗？\n\n删除前软件会自动创建可恢复的完整备份。`)) return;
    const confirmation = requiresDeleteNameConfirmation()
      ? window.prompt(`请输入完整名称以确认删除：\n${t.title}`, "")
      : t.title;
    if (confirmation === null) return;
    try { await deleteOneTimeTask(t.id, confirmation); await refresh(); }
    catch (e) { setError(String(e)); }
  }

  async function onDeleteOldHabit(item:OldHabitProject){
    if(!window.confirm(`要永久删除终止旧习惯项目“${item.title}”及其全部对策和观察记录吗？\n\n删除前软件会自动创建可恢复的完整备份。`))return;
    const confirmation=requiresDeleteNameConfirmation()?window.prompt(`请输入完整名称以确认删除：\n${item.title}`,""):item.title;
    if(confirmation===null)return;try{await deleteOldHabitProject(item.id,confirmation);await refresh()}catch(e){setError(String(e))}
  }

  const visible = projects.filter((p) => {
    if (filter !== "全部" && displayStatusOf(p) !== filter) return false;
    if (query && !p.name.includes(query)) return false;
    return true;
  });
  const visibleTasks = tasks.filter((t) => !query || t.title.includes(query) || t.nextAction.includes(query));
  const visibleOldHabits=oldHabits.filter(item=>{
    if(filter==="归档"&&!item.archivedAt)return false;
    if(filter!=="归档"&&item.archivedAt)return false;
    if(filter==="设计中"&&!(["draft","active"].includes(item.status)))return false;
    if(filter==="实践中"&&!(["observing","replacing"].includes(item.status)))return false;
    if(filter==="稳定"&&item.status!=="achieved")return false;
    if(filter==="暂停"&&item.status!=="paused")return false;
    return !query||item.title.includes(query)||item.generalHabit.includes(query);
  });

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><h1>福格行为实验室</h1></div>
        <button className="icon-action" onClick={onData} title="数据管理" aria-label="数据管理">⚙</button>
      </header>

      <div className="filters compact-filters">
        <label className="filter-select"><span>筛选</span><select value={filter} onChange={(event) => setFilter(event.target.value as DisplayStatus | "全部")}>
          {FILTERS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select></label>
        <input
          className="search"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder="搜索习惯…"
        />
      </div>

      {error && <p className="error">{error}</p>}

      <section className="home-section habit-section">
        <div className="home-section-heading"><span className="home-section-icon habit-icon" aria-hidden="true">↻</span><div className="home-heading-copy"><h2>长期习惯设计</h2><small>{visible.length} 个</small></div><button className="section-toggle icon-action" onClick={() => setHabitOpen((value) => !value)} title={habitOpen ? "收起" : "展开"} aria-label={habitOpen ? "收起长期习惯设计" : "展开长期习惯设计"} aria-expanded={habitOpen}><ChevronIcon expanded={habitOpen} /></button></div>
      {habitOpen && <div className="home-section-content">
      <div className="quick-task-create quick-habit-create"><input value={newName} onChange={(e) => setNewName(e.currentTarget.value)} onKeyDown={(e) => e.key === "Enter" && onCreate()} placeholder="例如：更健康" /><button className="primary icon-action" onClick={onCreate} title="新建长期设计" aria-label="新建长期设计">＋</button></div>
      <ul className="projects">
        {visible.map((p) => (
          <li key={p.id} className="project">
            <div className="project-main">
              <button className="open-btn" onClick={() => onOpen(p.id)}>
                {p.name}
              </button>
              <span className={`badge badge-${statusClass(displayStatusOf(p))}`}>
                {displayStatusOf(p)}
              </span>
              <p className="project-progress">
                {p.phase === "draft" || p.phase === "designing" ? `当前第 ${p.currentStep ?? 1} 步` : p.phase === "stable" ? "习惯正在稳定生长" : "已有配方，正在现实中试验"}
              </p>
            </div>
            <div className="project-actions">
              <button className="icon-action" onClick={() => onRename(p)} title="重命名" aria-label={`重命名 ${p.name}`}>✎</button>
              <button className="icon-action" onClick={() => onDuplicate(p)} title="复制" aria-label={`复制 ${p.name}`}>⧉</button>
              <button className="icon-action" onClick={() => onArchive(p)} title={p.archivedAt ? "恢复" : "归档"} aria-label={`${p.archivedAt ? "恢复" : "归档"} ${p.name}`}>{p.archivedAt ? "↥" : "↧"}</button>
              <button className="danger-button icon-action" onClick={() => onDeleteProject(p)} title="删除" aria-label={`删除 ${p.name}`}>⌫</button>
            </div>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="empty">还没有长期习惯设计。</li>
        )}
      </ul>
      </div>}
      </section>

      <section className="home-section one-time-section">
        <div className="home-section-heading"><span className="home-section-icon task-icon" aria-hidden="true">→</span><div className="home-heading-copy"><h2>一次性行为</h2><small>{visibleTasks.length} 个</small></div><button className="section-toggle icon-action" onClick={() => setTaskOpen((value) => !value)} title={taskOpen ? "收起" : "展开"} aria-label={taskOpen ? "收起一次性行为" : "展开一次性行为"} aria-expanded={taskOpen}><ChevronIcon expanded={taskOpen} /></button></div>
        {taskOpen && <div className="home-section-content">
        <div className="quick-task-create"><input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onCreateTask()} placeholder="例如：提交报销材料" /><button className="primary icon-action" onClick={onCreateTask} title="新建一次性行为" aria-label="新建一次性行为">＋</button></div>
        <ul className="projects one-time-projects">
          {visibleTasks.map((t) => <li key={t.id} className="project one-time-card"><div className="project-main"><button className="open-btn" onClick={() => onOpenOneTime(t.id)}>{t.title}</button><span className={`badge badge-${oneTimeStatusClass(t.status)}`}>{oneTimeStatusLabel(t.status)}</span><p className="project-progress">{t.nextAction ? `下一动作：${t.nextAction}` : "等待明确当前下一动作"}</p></div><div className="project-actions"><button className="icon-action" onClick={() => onOpenOneTime(t.id)} title="打开" aria-label={`打开 ${t.title}`}>→</button><button className="icon-action" onClick={async () => { await setOneTimeArchived(t.id, true); await refresh(); }} title="归档" aria-label={`归档 ${t.title}`}>↧</button><button className="danger-button icon-action" onClick={() => onDeleteTask(t)} title="删除" aria-label={`删除 ${t.title}`}>⌫</button></div></li>)}
          {visibleTasks.length === 0 && <li className="empty">还没有一次性行为。</li>}
        </ul>
        </div>}
      </section>

      <section className="home-section old-habit-section">
        <div className="home-section-heading"><span className="home-section-icon old-habit-icon" aria-hidden="true">↘</span><div className="home-heading-copy"><h2>终止旧习惯</h2><small>{visibleOldHabits.length} 个 · 减少、停止或替代重复行为</small></div><button className="section-toggle icon-action" onClick={()=>setOldHabitOpen(v=>!v)} title={oldHabitOpen?"收起":"展开"} aria-label={oldHabitOpen?"收起终止旧习惯":"展开终止旧习惯"} aria-expanded={oldHabitOpen}><ChevronIcon expanded={oldHabitOpen}/></button></div>
        {oldHabitOpen&&<div className="home-section-content"><div className="quick-task-create"><input value={newOldHabit} onChange={e=>setNewOldHabit(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onCreateOldHabit()} placeholder="例如：睡前长时间刷手机"/><button className="primary icon-action" onClick={onCreateOldHabit} title="新建终止旧习惯项目" aria-label="新建终止旧习惯项目">＋</button></div><ul className="projects old-habit-projects">{visibleOldHabits.map(item=><li key={item.id} className="project old-habit-card"><div className="project-main"><button className="open-btn" onClick={()=>onOpenOldHabit(item.id)}>{item.title}</button><span className={`badge badge-${oldHabitStatusClass(item.status)}`}>{oldHabitStatusLabel(item.status)}</span><p className="project-progress">{oldHabitStageLabel(item.currentStage)}</p></div><div className="project-actions"><button className="icon-action" onClick={()=>onOpenOldHabit(item.id)} title="打开" aria-label={`打开 ${item.title}`}>→</button><button className="icon-action" onClick={async()=>{await setOldHabitArchived(item.id,!item.archivedAt);await refresh()}} title={item.archivedAt?"恢复":"归档"} aria-label={`${item.archivedAt?"恢复":"归档"} ${item.title}`}>{item.archivedAt?"↥":"↧"}</button><button className="danger-button icon-action" onClick={()=>onDeleteOldHabit(item)} title="删除" aria-label={`删除 ${item.title}`}>⌫</button></div></li>)}{visibleOldHabits.length===0&&<li className="empty">还没有终止旧习惯项目。</li>}</ul></div>}
      </section>
    </div>
  );
}

function oldHabitStageLabel(stage:string){return ({prepare:"改变准备",clarify:"拆解具体旧行为",strategies:"布置 P/A/M 对策",observe:"持续观察与调整",replace:"设计替代行为"} as Record<string,string>)[stage]||"改变准备"}
function oldHabitStatusLabel(status:string){return ({draft:"草稿",active:"布置中",observing:"观察中",replacing:"替换中",paused:"暂停",achieved:"已达到目标"} as Record<string,string>)[status]||status}
function oldHabitStatusClass(status:string){if(status==="achieved")return "stable";if(status==="observing"||status==="replacing")return "active";if(status==="paused")return "paused";return "designing"}

function oneTimeStatusLabel(s: OneTimeStatus) {
  return ({ draft: "草稿", prepared: "已准备", in_progress: "进行中", completed: "已完成", cancelled: "已取消", delegated: "已委托", deferred: "已延期" } as Record<OneTimeStatus,string>)[s];
}

function oneTimeStatusClass(s: OneTimeStatus) {
  if (s === "completed") return "stable";
  if (s === "in_progress") return "active";
  if (["cancelled","delegated"].includes(s)) return "archived";
  if (s === "deferred") return "paused";
  return "designing";
}

function statusClass(s: DisplayStatus): string {
  switch (s) {
    case "设计中":
      return "designing";
    case "实践中":
      return "active";
    case "稳定":
      return "stable";
    case "暂停":
      return "paused";
    case "归档":
      return "archived";
  }
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);

  async function submit() {
    if (await verifyPasscode(code)) {
      onUnlock();
    } else {
      setErr(true);
      setCode("");
    }
  }

  return (
    <div className="lock-screen">
      <h1>福格行为实验室</h1>
      <p>输入密码解锁</p>
      <input
        type="password"
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      {err && <p className="error">密码不正确</p>}
      <button onClick={submit}>解锁</button>
    </div>
  );
}

export default App;
