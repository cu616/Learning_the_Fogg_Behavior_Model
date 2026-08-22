import { useEffect, useState } from "react";
import {
  addBranchAnchor,
  deleteBranchAnchor,
  deletePersonalReference,
  listBranchAnchors,
  listPersonalReferences,
  savePersonalReference,
  selectBranchAnchor,
} from "../api/design";
import { ANCHOR_TEMPLATES } from "../references";
import type { BranchAnchor, PersonalReferenceItem } from "../types";

export default function Step5({ branchId, onChange }: { projectId: number; branchId: number | null; onChange?: () => void }) {
  const [anchors, setAnchors] = useState<BranchAnchor[]>([]);
  const [personal, setPersonal] = useState<PersonalReferenceItem[]>([]);
  const [anchorText, setAnchorText] = useState("");
  const [lastAction, setLastAction] = useState("");
  const [location, setLocation] = useState("");
  const [frequency, setFrequency] = useState("每日");
  const [saveToLibrary, setSaveToLibrary] = useState(false);

  async function refresh() {
    if (!branchId) return;
    const [items, refs] = await Promise.all([listBranchAnchors(branchId), listPersonalReferences("anchor")]);
    setAnchors(items);
    setPersonal(refs);
  }
  useEffect(() => { refresh(); }, [branchId]);

  if (!branchId) return <div className="empty-state">请先选择一个微习惯分支，再为它寻找提示。</div>;
  const activeBranchId = branchId;

  async function add(text: string, source = "用户", details?: Partial<{ lastAction: string; location: string; frequency: string }>) {
    const clean = text.trim();
    if (!clean) return;
    const payload = {
      anchorText: clean,
      lastAction: details?.lastAction || lastAction.trim() || null,
      location: details?.location || location.trim() || null,
      frequency: details?.frequency || frequency,
      source,
    };
    await addBranchAnchor(activeBranchId, payload);
    if (saveToLibrary && source === "用户") {
      await savePersonalReference({
        kind: "anchor",
        title: clean,
        content: clean,
        structuredContent: JSON.stringify(payload),
      });
    }
    setAnchorText(""); setLastAction(""); setLocation("");
    await refresh(); onChange?.();
  }

  async function select(id: number) {
    await selectBranchAnchor(activeBranchId, id);
    await refresh(); onChange?.();
  }

  async function removeAnchor(item: BranchAnchor) {
    if (!window.confirm(`删除锚点候选“${item.anchorText}”吗？`)) return;
    await deleteBranchAnchor(activeBranchId, item.id);
    await refresh(); onChange?.();
  }

  async function removePersonal(id: number) {
    if (!window.confirm("从我的锚点库删除这条内容？当前项目中已经添加的锚点不会受影响。")) return;
    await deletePersonalReference(id); await refresh();
  }

  return (
    <div className="step anchor-step">
      <p className="step-directive"><span aria-hidden="true">◉</span>把锚点精确到可靠事件的最后动作。</p>

      <section className="form-card field-grid">
        <label className="field-span-2"><span className="field-title"><i aria-hidden="true">◉</i><strong>锚点事件</strong></span><input value={anchorText} onChange={(event) => setAnchorText(event.target.value)} placeholder="例如：刷完牙" /></label>
        <label><span className="field-title"><i aria-hidden="true">→</i><strong>最后动作</strong></span><input value={lastAction} onChange={(event) => setLastAction(event.target.value)} placeholder="例如：把牙刷放回杯子" /></label>
        <label><span className="field-title"><i aria-hidden="true">⌂</i><strong>地点</strong></span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="例如：浴室" /></label>
        <label><span className="field-title"><i aria-hidden="true">↻</i><strong>频率</strong></span><select value={frequency} onChange={(event) => setFrequency(event.target.value)}>{["每日", "每周", "每月", "不定"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="inline-check save-library-check"><input type="checkbox" checked={saveToLibrary} onChange={(event) => setSaveToLibrary(event.target.checked)} />同时保存到我的锚点库</label>
        <div className="field-span-2 form-actions"><button className="primary compact" onClick={() => add(anchorText)}>添加</button></div>
        <div className="reference-grid embedded-reference field-span-2">
        <details className="ref-panel"><summary>内置锚点模板</summary><div className="ref-list">
          {ANCHOR_TEMPLATES.map((item) => <div key={item} className="ref-item"><span>{item}</span><button onClick={() => add(item, "模板")}>选用</button></div>)}
        </div></details>
        <details className="ref-panel"><summary>我的锚点库（{personal.length}）</summary><div className="ref-list">
          {personal.map((item) => <div key={item.id} className="ref-item"><span>{item.content}</span><div className="inline-actions"><button onClick={() => {
            let data: { lastAction?: string; location?: string; frequency?: string } = {};
            try { data = JSON.parse(item.structuredContent || "{}"); } catch { /* 使用纯文本 */ }
            add(item.content, "用户", { lastAction: data.lastAction || "", location: data.location || "", frequency: data.frequency || "每日" });
          }}>选用</button><button className="danger-text" onClick={() => removePersonal(item.id)}>删除</button></div></div>)}
          {!personal.length && <p className="hint">添加锚点时勾选保存，就会积累在这里。</p>}
        </div></details>
        </div>
      </section>

      <h4>当前分支的锚点候选</h4>
      <div className="choice-grid">
        {anchors.map((item) => (
          <article key={item.id} className={item.isSelected ? "choice-card selected" : "choice-card"}>
            <strong>{item.anchorText}</strong>
            <p>{item.lastAction ? `最后动作：${item.lastAction}` : "还可以把最后动作写得更精确"}</p>
            <small>{[item.location, item.frequency].filter(Boolean).join(" · ")}</small>
            <div className="card-actions"><button onClick={() => select(item.id)}>{item.isSelected ? "✓ 已选定" : "选定这个锚点"}</button><button className="danger-text" onClick={() => removeAnchor(item)}>删除</button></div>
          </article>
        ))}
      </div>
    </div>
  );
}
