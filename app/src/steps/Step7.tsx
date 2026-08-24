import { useEffect, useState } from "react";
import {
  diagnoseBranchPractice,
  getActiveBranchRecipe,
  listBranchCelebrations,
  listBranchPracticeEvents,
  listBranchRecipeVersions,
  recordBranchPractice,
} from "../api/design";
import type {
  BranchCelebration,
  BranchObstacleDiagnosis,
  BranchPracticeEvent,
  BranchRecipeVersion,
} from "../types";
import UiIcon from "../components/UiIcon";

const RESULTS = ["自然完成", "完成且多做", "想起但没做", "完全忘记", "锚点没出现", "不方便记录"];
const SUCCESS = ["自然完成", "完成且多做"];

export default function Step7({ branchId, onChange }: { projectId: number; branchId: number | null; onChange?: () => void }) {
  const [recipe, setRecipe] = useState<BranchRecipeVersion | null>(null);
  const [celebrations, setCelebrations] = useState<BranchCelebration[]>([]);
  const [events, setEvents] = useState<BranchPracticeEvent[]>([]);
  const [versions, setVersions] = useState<BranchRecipeVersion[]>([]);
  const [result, setResult] = useState("");
  const [feeling, setFeeling] = useState("");
  const [context, setContext] = useState("");
  const [feedback, setFeedback] = useState("");
  const [diagnosis, setDiagnosis] = useState<BranchObstacleDiagnosis | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    if (!branchId) return;
    const [activeRecipe, celebrationList, eventList, versionList] = await Promise.all([
      getActiveBranchRecipe(branchId), listBranchCelebrations(branchId),
      listBranchPracticeEvents(branchId), listBranchRecipeVersions(branchId),
    ]);
    setRecipe(activeRecipe); setCelebrations(celebrationList); setEvents(eventList); setVersions(versionList);
  }
  useEffect(() => { refresh(); }, [branchId]);

  if (!branchId) return <div className="empty-state">请先选择一个微习惯分支。</div>;
  const activeBranchId = branchId;

  async function submit() {
    if (!result || saving) return;
    setSaving(true); setFeedback(""); setDiagnosis(null);
    try {
      const event = await recordBranchPractice(activeBranchId, result, feeling.trim() || null, context.trim() || null);
      if (SUCCESS.includes(result)) {
        const selected = celebrations.find((item) => item.isSelected);
        setFeedback(selected ? `很好！现在立即庆祝：${selected.celebrationText}` : "很好！停一下，感受这个成功时刻。");
      } else {
        setDiagnosis(await diagnoseBranchPractice(activeBranchId, event.id));
      }
      setResult(""); setFeeling(""); setContext("");
      await refresh(); onChange?.();
    } finally { setSaving(false); }
  }

  return (
    <div className="step practice-step">
      {recipe ? <div className="recipe-card"><div className="recipe-title">当前配方 v{recipe.versionNumber}</div><pre>{recipe.fullRecipeText}</pre></div>
        : <div className="empty-state">当前分支还没有配方，请返回第六步生成。</div>}

      <section className="practice-entry">
        <h3>记录这一次实践</h3>
        <label>这次发生了什么？</label>
        <div className="result-buttons">
          {RESULTS.map((item) => <button key={item} className={result === item ? "active" : ""} onClick={() => setResult(item)}>{item}</button>)}
        </div>
        <details className="optional-panel compact-panel">
          <summary>补充感受与情境 <span>（非必填）</span></summary>
          <div className="field-grid optional-practice-fields">
            <label><span className="field-title"><i aria-hidden="true"><UiIcon name="practice" size={15}/></i><strong>感受或发现</strong></span><textarea value={feeling} onChange={(event) => setFeeling(event.target.value)} placeholder="例如：只做基线并没有压力……" /></label>
            <label><span className="field-title"><i aria-hidden="true"><UiIcon name="location" size={15}/></i><strong>当时情境</strong></span><textarea value={context} onChange={(event) => setContext(event.target.value)} placeholder="时间、地点、正在发生的事情……" /></label>
          </div>
        </details>
        <button className="primary" disabled={!result || !recipe || saving} onClick={submit}>{saving ? "正在保存…" : "保存这次实践"}</button>
      </section>

      {feedback && <div className="success-feedback">{feedback}</div>}
      {diagnosis && <div className="diag-card"><div className="diag-title">诊断：{diagnosis.diagnosisPath} · {diagnosis.obstacleType}</div><p>{diagnosis.suggestion}</p>{diagnosis.returnStep ? <p>建议返回第 {diagnosis.returnStep} 步调整设计。</p> : null}</div>}

      <details className="history-panel">
        <summary>实践记录与配方版本 <span>{events.length} 条记录 · {versions.length} 个版本</span></summary>
      <div className="history-grid">
        <section>
          <h4>实践记录（{events.length}）</h4>
          <div className="event-list">
            {events.map((event) => <article key={event.id} className="event-card">
              <div><strong>{event.result}</strong><time>{(event.occurredAt || "").slice(0, 16).replace("T", " ")}</time></div>
              {event.feeling && <p>{event.feeling}</p>}
              {event.context && <details><summary>当时情境</summary><p>{event.context}</p></details>}
            </article>)}
            {!events.length && <p className="hint">还没有实践记录。每次只记一条即可。</p>}
          </div>
        </section>
        <section>
          <h4>配方版本</h4>
          <div className="version-list">
            {versions.map((version) => <article key={version.id} className="version-card"><strong>v{version.versionNumber}</strong><span>{version.status === "active" ? "当前" : "已替换"}</span><small>{(version.createdAt || "").slice(0, 10)}</small></article>)}
          </div>
        </section>
      </div>
      </details>
    </div>
  );
}
