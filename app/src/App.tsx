import { useEffect, useMemo, useRef, useState } from "react";
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
import { getHomeSections, requiresDeleteNameConfirmation, setHomeSection, type HomeSectionKey } from "./uiPreferences";
import { createOldHabitProject, deleteOldHabitProject, listOldHabitProjects, setOldHabitArchived } from "./api/oldHabit";
import type { OldHabitProject } from "./types";
import UiIcon, { type UiIconName } from "./components/UiIcon";
import UserGuide from "./screens/UserGuide";
import "./App.css";
import "./kessokuTheme.css";

const FILTERS: Array<DisplayStatus | "全部"> = [
  "全部",
  "设计中",
  "实践中",
  "稳定",
  "暂停",
  "归档",
];

const FILTER_LABELS: Record<DisplayStatus | "全部", string> = {
  "全部": "全部（未归档）",
  "设计中": "设计中",
  "实践中": "实践中",
  "稳定": "已形成 / 已结束",
  "暂停": "暂停",
  "归档": "归档",
};

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg className="chevron-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d={expanded ? "M5 12.5 10 7.5l5 5" : "M5 7.5l5 5 5-5"} />
    </svg>
  );
}

type View = { name: "home" } | { name: "workbench"; projectId: number } | { name: "oneTime"; taskId: number } | { name: "oldHabit"; projectId: number } | { name: "data" } | { name: "guide" };

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
  if (view.name === "guide") {
    return <UserGuide onBack={() => setView({ name: "home" })} />;
  }
  return (
    <Home
      onOpen={(id) => setView({ name: "workbench", projectId: id })}
      onOpenOneTime={(id) => setView({ name: "oneTime", taskId: id })}
      onOpenOldHabit={(id) => setView({ name: "oldHabit", projectId: id })}
      onData={() => setView({ name: "data" })}
      onGuide={() => setView({ name: "guide" })}
    />
  );
}

function Home({ onOpen, onOpenOneTime, onOpenOldHabit, onData, onGuide }: { onOpen: (id: number) => void; onOpenOneTime: (id: number) => void; onOpenOldHabit: (id: number) => void; onData: () => void; onGuide: () => void }) {
  const [projects, setProjects] = useState<HabitProject[]>([]);
  const [tasks, setTasks] = useState<OneTimeTask[]>([]);
  const [oldHabits, setOldHabits] = useState<OldHabitProject[]>([]);
  const [filter, setFilter] = useState<DisplayStatus | "全部">("全部");
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newOldHabit, setNewOldHabit] = useState("");
  const initialSections = useMemo(getHomeSections, []);
  const [habitOpen, setHabitOpen] = useState(initialSections.habit);
  const [taskOpen, setTaskOpen] = useState(initialSections.oneTime);
  const [oldHabitOpen, setOldHabitOpen] = useState(initialSections.oldHabit);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  async function refresh(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const [habitItems, oneTimeItems, oldHabitItems] = await Promise.all([listProjects(), listOneTimeTasks(true), listOldHabitProjects(true)]);
      setProjects(habitItems);
      setTasks(oneTimeItems);
      setOldHabits(oldHabitItems);
      setError("");
    } catch (e) {
      setError(humanizeError(e));
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    refresh(true);
  }, []);

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditing = target?.matches("input, textarea, select, [contenteditable='true']");
      if (event.key === "/" && !isEditing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && document.activeElement === searchRef.current && query) setQuery("");
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [query]);

  async function runAction(key: string, action: () => Promise<void>) {
    if (busyKey) return;
    setBusyKey(key);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(humanizeError(e));
    } finally {
      setBusyKey("");
    }
  }

  function toggleSection(key: HomeSectionKey, open: boolean) {
    setHomeSection(key, open);
    if (key === "habit") setHabitOpen(open);
    if (key === "oneTime") setTaskOpen(open);
    if (key === "oldHabit") setOldHabitOpen(open);
  }

  async function onCreate() {
    const name = newName.trim();
    if (!name) return;
    await runAction("create-habit", async () => {
      const project = await createProject(name);
      setNewName("");
      onOpen(project.id);
    });
  }

  async function onCreateTask() {
    const title = newTask.trim();
    if (!title) return;
    await runAction("create-task", async () => {
      const task = await createOneTimeTask(title);
      setNewTask("");
      onOpenOneTime(task.id);
    });
  }

  async function onCreateOldHabit() {
    const title = newOldHabit.trim();
    if (!title) return;
    await runAction("create-old-habit", async () => {
      const item = await createOldHabitProject(title);
      setNewOldHabit("");
      onOpenOldHabit(item.id);
    });
  }

  async function onRename(p: HabitProject) {
    const name = window.prompt("重命名习惯：", p.name);
    if (name && name.trim()) {
      await runAction(`rename-habit-${p.id}`, async () => {
        await renameProject(p.id, name.trim());
        await refresh();
      });
    }
  }

  async function onArchive(p: HabitProject) {
    await runAction(`archive-habit-${p.id}`, async () => {
      await setProjectArchived(p.id, !p.archivedAt);
      await refresh();
    });
  }

  async function onDuplicate(p: HabitProject) {
    await runAction(`copy-habit-${p.id}`, async () => {
      await duplicateProject(p.id);
      await refresh();
    });
  }

  async function onDeleteProject(p: HabitProject) {
    if (!window.confirm(`要永久删除行为设计“${p.name}”及其所有分支、配方和实践记录吗？\n\n删除前软件会自动创建可恢复的完整备份。`)) return;
    const confirmation = requiresDeleteNameConfirmation()
      ? window.prompt(`请输入完整名称以确认删除：\n${p.name}`, "")
      : p.name;
    if (confirmation === null) return;
    await runAction(`delete-habit-${p.id}`, async () => { await deleteProject(p.id, confirmation); await refresh(); });
  }

  async function onDeleteTask(t: OneTimeTask) {
    if (!window.confirm(`要永久删除一次性行为“${t.title}”及其诊断历史吗？\n\n删除前软件会自动创建可恢复的完整备份。`)) return;
    const confirmation = requiresDeleteNameConfirmation()
      ? window.prompt(`请输入完整名称以确认删除：\n${t.title}`, "")
      : t.title;
    if (confirmation === null) return;
    await runAction(`delete-task-${t.id}`, async () => { await deleteOneTimeTask(t.id, confirmation); await refresh(); });
  }

  async function onDeleteOldHabit(item:OldHabitProject){
    if(!window.confirm(`要永久删除终止旧习惯项目“${item.title}”及其全部对策和观察记录吗？\n\n删除前软件会自动创建可恢复的完整备份。`))return;
    const confirmation=requiresDeleteNameConfirmation()?window.prompt(`请输入完整名称以确认删除：\n${item.title}`,""):item.title;
    if (confirmation === null) return;
    await runAction(`delete-old-habit-${item.id}`, async () => { await deleteOldHabitProject(item.id, confirmation); await refresh(); });
  }

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matchesFilter = (status: DisplayStatus) => filter === "全部" ? status !== "归档" : status === filter;
  const visible = projects.filter((p) => {
    return matchesFilter(displayStatusOf(p)) && (!normalizedQuery || `${p.name} ${p.aspirationArea || ""}`.toLocaleLowerCase().includes(normalizedQuery));
  });
  const visibleTasks = tasks.filter((t) => {
    return matchesFilter(oneTimeDisplayStatus(t)) && (!normalizedQuery || `${t.title} ${t.nextAction || ""} ${t.completionStandard || ""}`.toLocaleLowerCase().includes(normalizedQuery));
  });
  const visibleOldHabits = oldHabits.filter((item) => {
    return matchesFilter(oldHabitDisplayStatus(item)) && (!normalizedQuery || `${item.title} ${item.generalHabit || ""}`.toLocaleLowerCase().includes(normalizedQuery));
  });

  const continueItems = useMemo<ContinueItem[]>(() => [
    ...projects.filter((item) => !item.archivedAt).map((item) => ({
      key: `habit-${item.id}`, kind: "habit" as const, title: item.name, updatedAt: item.updatedAt,
      typeLabel: "长期习惯", stageLabel: displayStatusOf(item),
      nextLabel: item.phase === "draft" || item.phase === "designing" ? `继续第 ${item.currentStep ?? 1} 步·${habitStepName(item.currentStep ?? 1)}` : "回到实践与迭代",
      onOpen: () => onOpen(item.id),
    })),
    ...tasks.filter((item) => !item.archivedAt && !["completed", "cancelled", "delegated"].includes(item.status)).map((item) => ({
      key: `task-${item.id}`, kind: "oneTime" as const, title: item.title, updatedAt: item.updatedAt,
      typeLabel: "一次性行为", stageLabel: oneTimeStatusLabel(item.status),
      nextLabel: item.nextAction ? `下一动作·${item.nextAction}` : "先明确唯一的下一动作",
      onOpen: () => onOpenOneTime(item.id),
    })),
    ...oldHabits.filter((item) => !item.archivedAt).map((item) => ({
      key: `old-${item.id}`, kind: "oldHabit" as const, title: item.title, updatedAt: item.updatedAt,
      typeLabel: "终止旧习惯", stageLabel: oldHabitStatusLabel(item.status),
      nextLabel: oldHabitStageLabel(item.currentStage), onOpen: () => onOpenOldHabit(item.id),
    })),
  ].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 3), [projects, tasks, oldHabits, onOpen, onOpenOneTime, onOpenOldHabit]);

  const practiceCount = projects.filter((item) => displayStatusOf(item) === "实践中").length
    + tasks.filter((item) => oneTimeDisplayStatus(item) === "实践中").length
    + oldHabits.filter((item) => oldHabitDisplayStatus(item) === "实践中").length;
  const pausedCount = projects.filter((item) => displayStatusOf(item) === "暂停").length
    + tasks.filter((item) => oneTimeDisplayStatus(item) === "暂停").length
    + oldHabits.filter((item) => oldHabitDisplayStatus(item) === "暂停").length;
  const hasAnyItem = projects.length + tasks.length + oldHabits.length > 0;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><h1>福格行为实验室</h1><p>把想做的事，变成今天做得到的小动作。</p></div>
        <div className="anime-masthead-art" aria-hidden="true">
          <img className="band-member member-hitori" src="/themes/kessoku/hitori.png" alt="" />
          <img className="band-member member-nijika" src="/themes/kessoku/nijika.png" alt="" />
          <img className="band-member member-ryo" src="/themes/kessoku/ryo.png" alt="" />
          <img className="band-member member-ikuyo" src="/themes/kessoku/ikuyo.png" alt="" />
        </div>
        <div className="topbar-tools"><button className="guide-button" onClick={onGuide} title="使用说明" aria-label="打开使用说明"><UiIcon name="notes" size={18} /><span>使用说明</span></button><button className="icon-action" onClick={onData} title="数据与隐私" aria-label="打开数据与隐私"><UiIcon name="settings" /></button></div>
      </header>

      {error && <div className="home-alert" role="alert"><div><strong>这次没有加载成功</strong><span>{error}</span></div><button onClick={() => refresh(true)} disabled={loading}><UiIcon name="refresh" size={17} />重试</button></div>}

      <section className="continue-panel" aria-labelledby="continue-title">
        <div className="continue-character" aria-hidden="true"><img src="/themes/kessoku/hitori.png" alt="" /></div>
        <div className="continue-heading"><div><h2 id="continue-title">继续上次的设计</h2><p>先回到离你最近的那一步。</p></div>{hasAnyItem && <div className="home-stats" aria-label="当前状态"><span><strong>{continueItems.length}</strong>最近项目</span><span><strong>{practiceCount}</strong>正在实践</span>{pausedCount > 0 && <span><strong>{pausedCount}</strong>已暂停</span>}</div>}</div>
        {loading ? <div className="continue-grid" aria-label="正在加载"><LoadingCard /><LoadingCard /><LoadingCard /></div> : continueItems.length > 0 ? <div className="continue-grid">{continueItems.map((item, index) => <ContinueCard key={item.key} item={item} featured={index === 0} />)}</div> : <div className="home-welcome"><span className="welcome-mark"><UiIcon name="habit" size={26} /></span><div><strong>{hasAnyItem ? "目前没有需要继续的项目" : "从一个真正想改变的方向开始"}</strong><p>{hasAnyItem ? "已完成或归档的内容仍可在下方管理。" : "选择一类工作流，软件会把大目标带回当下可做的小行为。"}</p></div>{!hasAnyItem && <button className="primary" onClick={() => toggleSection("habit", true)}>开始第一个设计<UiIcon name="arrow" size={17} /></button>}</div>}
      </section>

      <div className="manage-heading"><div><h2>选择一种改变方式</h2><p>从你现在面对的事情出发，不必先想好完整计划。</p></div><div className="filters compact-filters"><label className="filter-select"><span className="sr-only">状态筛选</span><select value={filter} onChange={(event) => setFilter(event.target.value as DisplayStatus | "全部")} aria-label="按状态筛选">{FILTERS.map((item) => <option key={item} value={item}>{FILTER_LABELS[item]}</option>)}</select></label><label className="search-field"><UiIcon name="search" size={17} /><span className="sr-only">搜索全部行为设计</span><input ref={searchRef} className="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="搜索名称、愿望或下一动作…" />{query && <button className="clear-search" onClick={() => { setQuery(""); searchRef.current?.focus(); }} title="清空搜索" aria-label="清空搜索"><UiIcon name="close" size={15} /></button>}<kbd>/</kbd></label></div></div>

      <div className="workflow-index">
      <div className="workflow-figure" aria-hidden="true"><img className="figure-nijika" src="/themes/kessoku/nijika.png" alt="" /><img className="figure-ryo" src="/themes/kessoku/ryo.png" alt="" /></div>

      <section className="home-section habit-section">
        <SectionHeading icon="habit" tone="habit" title="长期习惯设计" description="用七步把一个愿望设计成可以长期实践的微习惯" count={visible.length} total={projects.length} open={habitOpen} onToggle={() => toggleSection("habit", !habitOpen)} />
      {habitOpen && <div className="home-section-content">
      <div className="quick-task-create quick-habit-create"><input value={newName} onChange={(e) => setNewName(e.currentTarget.value)} onKeyDown={(e) => e.key === "Enter" && onCreate()} placeholder="我想……（例如：让身体更有活力）" aria-label="新的长期愿望" /><button className="primary create-button" onClick={onCreate} disabled={!newName.trim() || !!busyKey} aria-busy={busyKey === "create-habit"}><UiIcon name="plus" size={17} />新建设计</button></div>
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
              <button className="open-project-action" onClick={() => onOpen(p.id)}>继续<UiIcon name="arrow" size={16} /></button><span />
              <IconAction icon="edit" label={`重命名 ${p.name}`} onClick={() => onRename(p)} disabled={!!busyKey} />
              <IconAction icon="copy" label={`复制 ${p.name}`} onClick={() => onDuplicate(p)} disabled={!!busyKey} />
              <IconAction icon={p.archivedAt ? "restore" : "archive"} label={`${p.archivedAt ? "恢复" : "归档"} ${p.name}`} onClick={() => onArchive(p)} disabled={!!busyKey} />
              <IconAction icon="trash" label={`删除 ${p.name}`} onClick={() => onDeleteProject(p)} disabled={!!busyKey} danger />
            </div>
          </li>
        ))}
        {visible.length === 0 && <EmptyResult hasFilter={!!normalizedQuery || filter !== "全部"} onClear={() => { setQuery(""); setFilter("全部"); }} emptyText="还没有长期习惯设计。" />}
      </ul>
      </div>}
      </section>

      <section className="home-section one-time-section">
        <SectionHeading icon="task" tone="task" title="一次性行为" description="为一件明确的事找到当前唯一的下一动作" count={visibleTasks.length} total={tasks.length} open={taskOpen} onToggle={() => toggleSection("oneTime", !taskOpen)} />
        {taskOpen && <div className="home-section-content">
        <div className="quick-task-create"><input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onCreateTask()} placeholder="我需要……（例如：提交报销材料）" aria-label="新的一次性行为" /><button className="primary create-button" onClick={onCreateTask} disabled={!newTask.trim() || !!busyKey} aria-busy={busyKey === "create-task"}><UiIcon name="plus" size={17} />新建行为</button></div>
        <ul className="projects one-time-projects">
          {visibleTasks.map((t) => <li key={t.id} className="project one-time-card"><div className="project-main"><button className="open-btn" onClick={() => onOpenOneTime(t.id)}>{t.title}</button><span className={`badge badge-${oneTimeStatusClass(t.status)}`}>{oneTimeStatusLabel(t.status)}</span><p className="project-progress">{t.nextAction ? `下一动作：${t.nextAction}` : "等待明确当前下一动作"}</p></div><div className="project-actions"><button className="open-project-action" onClick={() => onOpenOneTime(t.id)}>继续<UiIcon name="arrow" size={16} /></button><span /><IconAction icon={t.archivedAt ? "restore" : "archive"} label={`${t.archivedAt ? "恢复" : "归档"} ${t.title}`} onClick={() => runAction(`archive-task-${t.id}`, async () => { await setOneTimeArchived(t.id, !t.archivedAt); await refresh(); })} disabled={!!busyKey} /><IconAction icon="trash" label={`删除 ${t.title}`} onClick={() => onDeleteTask(t)} disabled={!!busyKey} danger /></div></li>)}
          {visibleTasks.length === 0 && <EmptyResult hasFilter={!!normalizedQuery || filter !== "全部"} onClear={() => { setQuery(""); setFilter("全部"); }} emptyText="还没有一次性行为。" />}
        </ul>
        </div>}
      </section>

      <section className="home-section old-habit-section">
        <SectionHeading icon="oldHabit" tone="old-habit" title="终止旧习惯" description="拆解具体情境，逐步减少、停止或替代重复行为" count={visibleOldHabits.length} total={oldHabits.length} open={oldHabitOpen} onToggle={() => toggleSection("oldHabit", !oldHabitOpen)} />
        {oldHabitOpen && <div className="home-section-content"><div className="quick-task-create"><input value={newOldHabit} onChange={(event) => setNewOldHabit(event.target.value)} onKeyDown={(event) => event.key === "Enter" && onCreateOldHabit()} placeholder="我想减少……（例如：睡前长时间刷手机）" aria-label="想减少的旧习惯" /><button className="primary create-button" onClick={onCreateOldHabit} disabled={!newOldHabit.trim() || !!busyKey} aria-busy={busyKey === "create-old-habit"}><UiIcon name="plus" size={17} />新建实验</button></div><ul className="projects old-habit-projects">{visibleOldHabits.map((item) => <li key={item.id} className="project old-habit-card"><div className="project-main"><button className="open-btn" onClick={() => onOpenOldHabit(item.id)}>{item.title}</button><span className={`badge badge-${oldHabitStatusClass(item.status)}`}>{oldHabitStatusLabel(item.status)}</span><p className="project-progress">{oldHabitStageLabel(item.currentStage)}</p></div><div className="project-actions"><button className="open-project-action" onClick={() => onOpenOldHabit(item.id)}>继续<UiIcon name="arrow" size={16} /></button><span /><IconAction icon={item.archivedAt ? "restore" : "archive"} label={`${item.archivedAt ? "恢复" : "归档"} ${item.title}`} onClick={() => runAction(`archive-old-${item.id}`, async () => { await setOldHabitArchived(item.id, !item.archivedAt); await refresh(); })} disabled={!!busyKey} /><IconAction icon="trash" label={`删除 ${item.title}`} onClick={() => onDeleteOldHabit(item)} disabled={!!busyKey} danger /></div></li>)}{visibleOldHabits.length === 0 && <EmptyResult hasFilter={!!normalizedQuery || filter !== "全部"} onClear={() => { setQuery(""); setFilter("全部"); }} emptyText="还没有终止旧习惯项目。" />}</ul></div>}
      </section>
      </div>
    </div>
  );
}

type ContinueItem = {
  key: string;
  kind: "habit" | "oneTime" | "oldHabit";
  title: string;
  typeLabel: string;
  stageLabel: string;
  nextLabel: string;
  updatedAt: string;
  onOpen: () => void;
};

function ContinueCard({ item, featured = false }: { item: ContinueItem; featured?: boolean }) {
  const icon: UiIconName = item.kind === "habit" ? "habit" : item.kind === "oneTime" ? "task" : "oldHabit";
  return <button className={`continue-card continue-${item.kind}${featured ? " continue-featured" : ""}`} onClick={item.onOpen}>
    <span className="continue-card-icon"><UiIcon name={icon} size={20} /></span>
    <span className="continue-card-copy"><span className="continue-kind">{item.typeLabel}<i />{item.stageLabel}</span><strong>{item.title}</strong><span>{item.nextLabel}</span></span>
    <span className="continue-card-meta"><time dateTime={item.updatedAt}>{formatUpdatedAt(item.updatedAt)}</time><UiIcon name="arrow" size={18} /></span>
  </button>;
}

function LoadingCard() {
  return <div className="continue-card loading-card" aria-hidden="true"><span /><div><i /><i /><i /></div></div>;
}

function SectionHeading({ icon, tone, title, description, count, total, open, onToggle }: { icon: UiIconName; tone: string; title: string; description: string; count: number; total: number; open: boolean; onToggle: () => void }) {
  const countLabel = count === total ? `${total} 个` : `${count} / ${total} 个`;
  return <button className="home-section-heading" onClick={onToggle} aria-expanded={open}>
    <span className={`home-section-icon ${tone}-icon`} aria-hidden="true"><UiIcon name={icon} size={22} /></span>
    <span className="home-heading-copy"><strong>{title}</strong><span>{description}</span></span>
    <span className="home-section-count">{countLabel}</span>
    <span className="section-chevron"><ChevronIcon expanded={open} /></span>
  </button>;
}

function IconAction({ icon, label, onClick, disabled, danger = false }: { icon: UiIconName; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return <button className={`icon-action${danger ? " danger-button" : ""}`} onClick={onClick} title={label} aria-label={label} disabled={disabled}><UiIcon name={icon} size={16} /></button>;
}

function EmptyResult({ hasFilter, onClear, emptyText }: { hasFilter: boolean; onClear: () => void; emptyText: string }) {
  return <li className="empty"><strong>{hasFilter ? "没有匹配的结果" : emptyText}</strong>{hasFilter && <button onClick={onClear}>清除筛选</button>}</li>;
}

function oneTimeDisplayStatus(task: OneTimeTask): DisplayStatus {
  if (task.archivedAt) return "归档";
  if (task.status === "deferred") return "暂停";
  if (["prepared", "in_progress"].includes(task.status)) return "实践中";
  if (["completed", "cancelled", "delegated"].includes(task.status)) return "稳定";
  return "设计中";
}

function oldHabitDisplayStatus(project: OldHabitProject): DisplayStatus {
  if (project.archivedAt) return "归档";
  if (project.status === "paused") return "暂停";
  if (["observing", "replacing"].includes(project.status)) return "实践中";
  if (project.status === "achieved") return "稳定";
  return "设计中";
}

function habitStepName(step: number) {
  return ["明确愿望", "探索行为", "匹配黄金行为", "让行为变小", "找到对的提示", "庆祝成功", "实践与迭代"][Math.max(1, Math.min(7, step)) - 1];
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "最近更新";
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(date);
}

function humanizeError(error: unknown) {
  const raw = String(error instanceof Error ? error.message : error).replace(/^Error:\s*/i, "").trim();
  return raw || "请稍后重试；已有数据不会丢失。";
}

function oldHabitStageLabel(stage:string){return ({prepare:"改变准备",clarify:"拆解具体旧行为",strategies:"布置提示、能力与动机对策",observe:"持续观察与调整",replace:"设计替代行为"} as Record<string,string>)[stage]||"改变准备"}
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
