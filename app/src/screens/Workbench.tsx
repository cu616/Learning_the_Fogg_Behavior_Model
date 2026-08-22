import { useEffect, useMemo, useState } from "react";
import { getProject, setProjectStep } from "../api/projects";
import { getAspiration } from "../api/steps";
import {
  createHabitBranch,
  deleteHabitBranch,
  getActiveBranchRecipe,
  getBranchTiny,
  listBranchAnchors,
  listBranchCelebrations,
  listGoldenBehaviors,
  listHabitBranches,
  updateHabitBranch,
} from "../api/design";
import type {
  Aspiration,
  BranchAnchor,
  BranchCelebration,
  BranchRecipeVersion,
  BranchTinyBehavior,
  GoldenBehaviorV2,
  HabitBranch,
  HabitProject,
} from "../types";
import Step1 from "../steps/Step1";
import Step2 from "../steps/Step2";
import Step3 from "../steps/Step3";
import Step4 from "../steps/Step4";
import Step5 from "../steps/Step5";
import Step6 from "../steps/Step6";
import Step7 from "../steps/Step7";
import FoggNotePanel from "../components/FoggNotePanel";
import SupportDrawer from "../components/SupportDrawer";
import UiIcon from "../components/UiIcon";
import { STEP_NOTES } from "../foggNotes";

const STEP_NAMES = ["明确愿望", "探索行为选项", "匹配黄金行为", "从微习惯开始", "找到对的提示", "庆祝成功", "实践与迭代"];
const STEP_ICONS = ["✦", "☁", "⌖", "⛓", "◉", "★", "↻"];

type Summary = {
  aspiration: Aspiration | null;
  golden: GoldenBehaviorV2[];
  branches: HabitBranch[];
  tiny: BranchTinyBehavior | null;
  anchors: BranchAnchor[];
  celebrations: BranchCelebration[];
  recipe: BranchRecipeVersion | null;
};

const EMPTY_SUMMARY: Summary = { aspiration: null, golden: [], branches: [], tiny: null, anchors: [], celebrations: [], recipe: null };

export default function Workbench({ projectId, onBack }: { projectId: number; onBack: () => void }) {
  const [project, setProject] = useState<HabitProject | null>(null);
  const [step, setStep] = useState(1);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);

  async function refreshSummary(preferredBranchId?: number | null) {
    const [aspiration, golden, branches] = await Promise.all([
      getAspiration(projectId), listGoldenBehaviors(projectId), listHabitBranches(projectId),
    ]);
    const desired = preferredBranchId ?? branchId;
    const nextBranchId = branches.some((item) => item.id === desired) ? desired : branches[0]?.id ?? null;
    setBranchId(nextBranchId);
    if (nextBranchId) {
      const [tiny, anchors, celebrations, recipe] = await Promise.all([
        getBranchTiny(nextBranchId), listBranchAnchors(nextBranchId), listBranchCelebrations(nextBranchId), getActiveBranchRecipe(nextBranchId),
      ]);
      setSummary({ aspiration, golden, branches, tiny, anchors, celebrations, recipe });
    } else setSummary({ aspiration, golden, branches, tiny: null, anchors: [], celebrations: [], recipe: null });
  }

  useEffect(() => {
    getProject(projectId).then((item) => {
      setProject(item);
      setStep(["ready", "experimenting", "stable"].includes(item.phase) ? 7 : item.currentStep ?? 1);
    });
    refreshSummary(null);
  }, [projectId]);

  useEffect(() => {
    if (branchId) refreshSummary(branchId);
  }, [branchId]);

  async function ensureBranchesForDesign() {
    const [goldenItems, branchItems] = await Promise.all([listGoldenBehaviors(projectId), listHabitBranches(projectId)]);
    let preferred = branchId;
    for (const goldenItem of goldenItems) {
      if (!branchItems.some((branch) => branch.goldenBehaviorId === goldenItem.id)) {
        const created = await createHabitBranch(projectId, goldenItem.id, null);
        if (!preferred) preferred = created.id;
      }
    }
    await refreshSummary(preferred);
  }

  async function go(value: number) {
    const next = Math.max(1, Math.min(7, value));
    if (next >= 4) await ensureBranchesForDesign();
    setStep(next); await setProjectStep(projectId, next);
  }

  async function addBranch(goldenItem: GoldenBehaviorV2) {
    const siblingCount = summary.branches.filter((item) => item.goldenBehaviorId === goldenItem.id).length;
    const suggested = `微习惯方案 ${siblingCount + 1}`;
    const name = window.prompt("为这个微习惯分支命名：", suggested);
    if (name === null) return;
    const branch = await createHabitBranch(projectId, goldenItem.id, name.trim() || suggested);
    await refreshSummary(branch.id); setBranchId(branch.id); if (step < 4) await go(4);
  }

  async function renameBranch(branch: HabitBranch) {
    const name = window.prompt("重命名这个微习惯方案：", branch.name);
    if (!name?.trim() || name.trim() === branch.name) return;
    await updateHabitBranch(branch.id, name.trim(), null);
    await refreshSummary(branch.id);
  }

  async function removeBranch(branch: HabitBranch) {
    if (!window.confirm(`永久删除微习惯方案“${branch.name}”吗？\n\n该方案下的能力分析、锚点、庆祝、配方和实践记录都会删除。软件会先创建完整保护备份。`)) return;
    await deleteHabitBranch(branch.id);
    await refreshSummary(null);
  }

  async function changeBranchStatus(status: string) {
    if (!branchId) return;
    await updateHabitBranch(branchId, null, status); await refreshSummary(branchId);
  }

  const activeBranch = summary.branches.find((item) => item.id === branchId) || null;
  const selectedAnchor = summary.anchors.find((item) => item.isSelected);
  const selectedCelebration = summary.celebrations.find((item) => item.isSelected);

  const stepContent = useMemo(() => {
    const common = { projectId, onChange: () => refreshSummary(branchId) };
    switch (step) {
      case 1: return <Step1 {...common} />;
      case 2: return <Step2 {...common} />;
      case 3: return <Step3 {...common} />;
      case 4: return <Step4 {...common} branchId={branchId} />;
      case 5: return <Step5 {...common} branchId={branchId} />;
      case 6: return <Step6 {...common} branchId={branchId} />;
      case 7: return <Step7 {...common} branchId={branchId} />;
    }
  }, [step, projectId, branchId]);

  return (
    <div className={`workbench step-theme-${step}`}>
      <header className="wb-top">
        <button className="icon-action" onClick={onBack} title="返回首页" aria-label="返回首页"><UiIcon name="back" /></button>
        <span className="wb-name">{project?.name}</span>
        <nav className="step-nav" aria-label="七步工作流">
          {STEP_NAMES.map((name, index) => <button key={name} className={index + 1 === step ? "active" : index + 1 < step ? "done" : ""} onClick={() => go(index + 1)} title={name}>{index + 1}</button>)}
        </nav>
        <button className="panel-toggle icon-action" onClick={() => setLeftOpen((value) => !value)} title={leftOpen ? "收起设计状态" : "展开设计状态"} aria-label={leftOpen ? "收起设计状态" : "展开设计状态"} aria-expanded={leftOpen}><UiIcon name="summary" /></button>
        <button className="panel-toggle icon-action" onClick={() => setRightOpen((value) => !value)} title="福格模型笔记" aria-label="打开福格模型笔记" aria-expanded={rightOpen}><UiIcon name="notes" /></button>
      </header>

      <div className={`wb-body${leftOpen ? " status-open" : ""}`}>
        {leftOpen && <aside className="wb-statusbar" aria-label="设计状态">
          <div className="statusbar-heading"><div><small>行为设计</small><strong>设计状态</strong></div><span>{step}/7</span></div>
          <div className="wb-summary">
          <section className="summary-section aspiration-summary">
            <label><i aria-hidden="true">✦</i>最终愿望</label>
            <p>{summary.aspiration?.finalAspiration || "还没有确认最终愿望"}</p>
          </section>

          {summary.golden.length > 0 && <section className="summary-section golden-summary">
            <label><i aria-hidden="true">⌖</i>黄金行为</label>
            {summary.golden.map((item) => {
              const branches = summary.branches.filter((branch) => branch.goldenBehaviorId === item.id);
              return <div className="golden-tree" key={item.id}>
                <strong className="golden-title"><i aria-hidden="true">◆</i>{item.behaviorText}</strong>
                {branches.map((branch) => <button key={branch.id} className={branch.id === branchId ? "branch-row active" : "branch-row"} onClick={() => setBranchId(branch.id)}>
                  <span><i aria-hidden="true">↳</i>{branch.name}</span><small>{branch.status === "practicing" ? "实践中" : branch.status === "stable" ? "稳定" : branch.status === "paused" ? "暂停" : "设计中"}</small>
                </button>)}
                {step >= 4 && <button className="add-branch" onClick={() => addBranch(item)}>＋ 方案</button>}
              </div>;
            })}
          </section>}

          {activeBranch && <section className="summary-section branch-summary">
            <label><i aria-hidden="true">⛓</i>当前微习惯方案</label>
            <div className="branch-name-row"><strong>{activeBranch.name}</strong><div className="inline-actions"><button title="重命名方案" onClick={() => renameBranch(activeBranch)}>✎</button><button className="danger-icon" title="删除方案" onClick={() => removeBranch(activeBranch)}>⌫</button></div></div>
            <div className="summary-result-grid">
              {summary.tiny?.baseline && <div className="status-tiny"><small><i aria-hidden="true">·</i>基线</small><p>{summary.tiny.baseline}</p></div>}
              {summary.tiny?.optionalExtension && <div className="status-tiny"><small><i aria-hidden="true">↗</i>可选扩展</small><p>{summary.tiny.optionalExtension}</p></div>}
              {selectedAnchor && <div className="status-anchor"><small><i aria-hidden="true">◉</i>锚点</small><p>{selectedAnchor.lastAction || selectedAnchor.anchorText}</p></div>}
              {selectedCelebration && <div className="status-celebration"><small><i aria-hidden="true">★</i>庆祝</small><p>{selectedCelebration.celebrationText}</p></div>}
            </div>
            {summary.recipe && <div className="mini-recipe"><small>当前配方 v{summary.recipe.versionNumber}</small><p>{summary.recipe.fullRecipeText}</p></div>}
            <div className="branch-status-actions">
              {activeBranch.status !== "stable" && <button onClick={() => changeBranchStatus("stable")}>标记稳定</button>}
              {activeBranch.status !== "paused" ? <button onClick={() => changeBranchStatus("paused")}>暂停</button> : <button onClick={() => changeBranchStatus("practicing")}>继续实践</button>}
            </div>
          </section>}
          </div>
        </aside>}

        <main className="wb-main">
          <div className="step-heading"><span className="step-icon" aria-hidden="true">{STEP_ICONS[step - 1]}</span><div><small className="step-eyebrow">第 {step} 步</small><h2>{STEP_NAMES[step - 1]}</h2>{activeBranch && step >= 4 && <p>正在设计：{activeBranch.name}</p>}</div></div>
          {stepContent}
        </main>

        <SupportDrawer side="right" title="福格模型笔记" open={rightOpen} onClose={() => setRightOpen(false)}><div className="wb-side"><FoggNotePanel notes={STEP_NOTES[step]} /></div></SupportDrawer>
      </div>

      <footer className="wb-bottom">
        <button disabled={step <= 1} onClick={() => go(step - 1)}>← 上一步</button>
        <span>第 {step} / 7 步 · 自动保存到本机</span>
        {step >= 7 ? <button className="primary" onClick={onBack}>结束本次记录，回到首页 →</button> : <button className="primary" onClick={() => go(step + 1)}>下一步 →</button>}
      </footer>
    </div>
  );
}
