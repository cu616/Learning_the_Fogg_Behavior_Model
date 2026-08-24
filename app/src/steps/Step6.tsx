import { useEffect, useState } from "react";
import {
  addBranchCelebration,
  deleteBranchCelebration,
  deletePersonalReference,
  generateBranchRecipe,
  getActiveBranchRecipe,
  listBranchCelebrations,
  listPersonalReferences,
  savePersonalReference,
  selectBranchCelebration,
} from "../api/design";
import { AFFIRMATIONS, CELEBRATIONS } from "../references";
import type { BranchCelebration, BranchRecipeVersion, PersonalReferenceItem } from "../types";
import UiIcon from "../components/UiIcon";

export default function Step6({ branchId, onChange }: { projectId: number; branchId: number | null; onChange?: () => void }) {
  const [celebrations, setCelebrations] = useState<BranchCelebration[]>([]);
  const [personalCelebrations, setPersonalCelebrations] = useState<PersonalReferenceItem[]>([]);
  const [personalAffirmations, setPersonalAffirmations] = useState<PersonalReferenceItem[]>([]);
  const [text, setText] = useState("");
  const [affirmation, setAffirmation] = useState("");
  const [naturalness, setNaturalness] = useState<number | null>(null);
  const [successFeeling, setSuccessFeeling] = useState<number | null>(null);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [recipe, setRecipe] = useState<BranchRecipeVersion | null>(null);
  const [error, setError] = useState("");

  async function refresh() {
    if (!branchId) return;
    const [items, celebrationRefs, affirmationRefs, activeRecipe] = await Promise.all([
      listBranchCelebrations(branchId), listPersonalReferences("celebration"),
      listPersonalReferences("affirmation"), getActiveBranchRecipe(branchId),
    ]);
    setCelebrations(items); setPersonalCelebrations(celebrationRefs); setPersonalAffirmations(affirmationRefs); setRecipe(activeRecipe);
  }
  useEffect(() => { refresh(); }, [branchId]);

  if (!branchId) return <div className="empty-state">请先选择一个微习惯分支，再为它设计庆祝。</div>;
  const activeBranchId = branchId;

  async function addCelebration(value: string, source = "用户", save = saveToLibrary) {
    const clean = value.trim(); if (!clean) return;
    await addBranchCelebration(activeBranchId, { celebrationText: clean, naturalness, successFeeling, source });
    if (save) await savePersonalReference({ kind: "celebration", title: clean, content: clean });
    setText(""); setNaturalness(null); setSuccessFeeling(null); await refresh(); onChange?.();
  }

  async function choose(id: number) { await selectBranchCelebration(activeBranchId, id); await refresh(); onChange?.(); }

  async function makeRecipe() {
    try { setError(""); setRecipe(await generateBranchRecipe(activeBranchId)); await refresh(); onChange?.(); }
    catch (reason) { setError(String(reason)); }
  }

  async function saveAffirmation(value: string) {
    const clean = value.trim(); if (!clean) return;
    await savePersonalReference({ kind: "affirmation", title: clean, content: clean });
    setAffirmation(""); await refresh();
  }

  async function removeCelebration(item: BranchCelebration) {
    if (!window.confirm(`删除庆祝候选“${item.celebrationText}”吗？`)) return;
    await deleteBranchCelebration(activeBranchId, item.id);
    await refresh(); onChange?.();
  }

  async function removePersonal(id: number, label: string) {
    if (!window.confirm(`从${label}删除这条内容？当前项目中已经添加的内容不会受影响。`)) return;
    await deletePersonalReference(id); await refresh();
  }

  return (
    <div className="step celebration-step">
      <p className="step-directive"><span aria-hidden="true"><UiIcon name="celebrate" size={18} /></span>选择一种自然、及时，能立即带来成功感的庆祝。</p>

      <section className="form-card field-grid">
        <label className="field-span-2"><span className="field-title"><i aria-hidden="true"><UiIcon name="celebrate" size={15}/></i><strong>我的庆祝方式</strong></span><input value={text} onChange={(event) => setText(event.target.value)} placeholder="例如：轻轻握拳说“很好”" /></label>
        <div className="score-row field-span-2">
          <label className="inline-score"><span><i aria-hidden="true"><UiIcon name="check" size={15}/></i><strong>自然度</strong></span><select value={naturalness ?? ""} onChange={(event) => setNaturalness(event.target.value ? Number(event.target.value) : null)}><option value="">未评分</option>{[1,2,3,4,5].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="inline-score"><span><i aria-hidden="true"><UiIcon name="celebrate" size={15}/></i><strong>成功感</strong></span><select value={successFeeling ?? ""} onChange={(event) => setSuccessFeeling(event.target.value ? Number(event.target.value) : null)}><option value="">未评分</option>{[1,2,3,4,5].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="inline-check"><input type="checkbox" checked={saveToLibrary} onChange={(event) => setSaveToLibrary(event.target.checked)} />保存到我的庆祝库</label>
          <button className="primary compact" onClick={() => addCelebration(text)}>添加</button>
        </div>

        <div className="reference-grid embedded-reference field-span-2">
        <details className="ref-panel"><summary>内置庆祝方式（100 种）</summary><div className="ref-list">
          {CELEBRATIONS.map((item) => <div key={item.id} className="ref-item"><span>{item.text}</span><button onClick={() => addCelebration(item.text, "内置库", false)}>选用</button></div>)}
        </div></details>
        <details className="ref-panel"><summary>我的庆祝库（{personalCelebrations.length}）</summary><div className="ref-list">
          {personalCelebrations.map((item) => <div key={item.id} className="ref-item"><span>{item.content}</span><div className="inline-actions"><button onClick={() => addCelebration(item.content, "用户", false)}>选用</button><button className="danger-text" onClick={() => removePersonal(item.id, "我的庆祝库")}>删除</button></div></div>)}
          {!personalCelebrations.length && <p className="hint">把真正适合你的庆祝方式保存下来。</p>}
        </div></details>
        </div>

      <details className="ref-panel affirmation-panel field-span-2">
        <summary>肯定成功的语言：内置 32 种 + 我的库 {personalAffirmations.length} 种</summary>
        <div className="ref-popover-content">
        <div className="add-toolbar">
          <input value={affirmation} onChange={(event) => setAffirmation(event.target.value)} placeholder="添加一句属于自己的肯定语言" />
          <button onClick={() => saveAffirmation(affirmation)}>保存到我的库</button>
        </div>
        <div className="ref-list">
          {personalAffirmations.map((item) => <div key={`mine-${item.id}`} className="ref-item"><span>我的：{item.content}</span><div className="inline-actions"><button onClick={() => addCelebration(item.content, "用户", false)}>作为庆祝</button><button className="danger-text" onClick={() => removePersonal(item.id, "我的肯定语言库")}>删除</button></div></div>)}
          {AFFIRMATIONS.map((item) => <div key={`built-${item.id}`} className="ref-item"><span>{item.text}</span><div className="inline-actions"><button onClick={() => saveAffirmation(item.text)}>收藏</button><button onClick={() => addCelebration(item.text, "内置库", false)}>作为庆祝</button></div></div>)}
        </div>
        </div>
      </details>
      </section>

      <h4>当前分支的庆祝候选</h4>
      <div className="choice-grid">
        {celebrations.map((item) => <article key={item.id} className={item.isSelected ? "choice-card selected" : "choice-card"}>
          <strong>{item.celebrationText}</strong>
          <small>自然度 {item.naturalness ?? "-"} · 成功感 {item.successFeeling ?? "-"}</small>
          <div className="card-actions"><button onClick={() => choose(item.id)}>{item.isSelected ? "已选定" : "选定这个庆祝"}</button><button className="danger-text" onClick={() => removeCelebration(item)}>删除</button></div>
        </article>)}
      </div>

      <div className="recipe-actions">
        <button className="primary" onClick={makeRecipe}>生成配方并进入实践</button>
        {recipe && <button onClick={() => savePersonalReference({ kind: "recipe", title: `微习惯配方 v${recipe.versionNumber}`, content: recipe.fullRecipeText || "", structuredContent: JSON.stringify(recipe) })}>保存配方到我的库</button>}
      </div>
      {error && <p className="error">{error}</p>}
      {recipe && <div className="recipe-card"><div className="recipe-title">微习惯配方 v{recipe.versionNumber}</div><pre>{recipe.fullRecipeText}</pre></div>}
    </div>
  );
}
