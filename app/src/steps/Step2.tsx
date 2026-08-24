import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { getAspiration } from "../api/steps";
import {
  addBehaviorOptionV2,
  deletePersonalReference,
  listBehaviorOptionsV2,
  listPersonalReferences,
  savePersonalReference,
  updateBehaviorOptionV2,
} from "../api/design";
import { RECIPE_CATEGORIES } from "../references";
import type { BehaviorOptionV2, PersonalReferenceItem } from "../types";
import UiIcon from "../components/UiIcon";

function defaultPosition(index: number, total: number) {
  const angle = (Math.PI * 2 * index) / Math.max(total, 8) - Math.PI / 2;
  return { x: 0.5 + Math.cos(angle) * 0.39, y: 0.5 + Math.sin(angle) * 0.39 };
}

function extractBehavior(recipe: string) {
  const normalized = recipe.replace(/^（[^）]+）/, "").trim();
  const match = normalized.match(/之后[，,]?\s*(?:我|我们)?(?:就)?会(.+?)[。！]?$/);
  return (match?.[1] || normalized).trim();
}

export default function Step2({ projectId, onChange }: { projectId: number; onChange?: () => void }) {
  const [aspiration, setAspiration] = useState("我的愿望");
  const [options, setOptions] = useState<BehaviorOptionV2[]>([]);
  const [text, setText] = useState("");
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [personal, setPersonal] = useState<PersonalReferenceItem[]>([]);
  const [recipeExample, setRecipeExample] = useState<string | null>(null);
  const [extracted, setExtracted] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ id: number; startX: number; startY: number; width: number; height: number } | null>(null);

  async function refresh() {
    const [items, refs, asp] = await Promise.all([
      listBehaviorOptionsV2(projectId),
      listPersonalReferences("behavior"),
      getAspiration(projectId),
    ]);
    setOptions(items);
    setPersonal(refs);
    setAspiration(asp?.finalAspiration || asp?.rawInput || "我的愿望");
  }

  useEffect(() => { refresh(); }, [projectId]);

  const active = useMemo(() => options.filter((item) => item.status === "活跃"), [options]);
  const positioned = useMemo(() => active.map((item, index) => {
    const fallback = defaultPosition(index, active.length);
    return { ...item, x: item.swarmPosX ?? fallback.x, y: item.swarmPosY ?? fallback.y };
  }), [active]);

  async function addBehavior(value: string, source = "用户", alsoSave = saveToLibrary) {
    const clean = value.trim();
    if (!clean) return;
    const pos = defaultPosition(active.length, active.length + 1);
    await addBehaviorOptionV2(projectId, clean, source, pos.x, pos.y);
    if (alsoSave) await savePersonalReference({ kind: "behavior", content: clean, title: clean });
    setText("");
    await refresh();
    onChange?.();
  }

  async function removePersonal(id: number) {
    if (!window.confirm("从我的行为灵感库删除这条内容？行为画布中已经添加的卡片不会受影响。")) return;
    await deletePersonalReference(id);
    await refresh();
  }

  function beginRecipe(recipe: string) {
    setRecipeExample(recipe);
    setExtracted(extractBehavior(recipe));
  }

  async function updatePosition(id: number, event: ReactPointerEvent<HTMLElement>, persist: boolean) {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = Math.max(0.1, Math.min(0.9, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0.1, Math.min(0.9, (event.clientY - bounds.top) / bounds.height));
    setOptions((current) => current.map((item) => item.id === id ? { ...item, swarmPosX: x, swarmPosY: y } : item));
    if (persist) await updateBehaviorOptionV2(id, { swarmPosX: x, swarmPosY: y, updatePosition: true });
  }

  function beginResize(item: BehaviorOptionV2, event: ReactPointerEvent<HTMLButtonElement>) {
    event.stopPropagation();
    resizeRef.current = { id: item.id, startX: event.clientX, startY: event.clientY, width: item.swarmWidth ?? 190, height: item.swarmHeight ?? 86 };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function resizeCard(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = resizeRef.current;
    if (!start || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const width = Math.max(140, Math.min(420, start.width + event.clientX - start.startX));
    const height = Math.max(72, Math.min(280, start.height + event.clientY - start.startY));
    setOptions((current) => current.map((item) => item.id === start.id ? { ...item, swarmWidth: width, swarmHeight: height } : item));
  }

  async function finishResize(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = resizeRef.current;
    if (!start) return;
    const width = Math.max(140, Math.min(420, start.width + event.clientX - start.startX));
    const height = Math.max(72, Math.min(280, start.height + event.clientY - start.startY));
    setOptions((current) => current.map((item) => item.id === start.id ? { ...item, swarmWidth: width, swarmHeight: height } : item));
    await updateBehaviorOptionV2(start.id, { swarmWidth: width, swarmHeight: height, updateSize: true });
    resizeRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  async function nudgePosition(item: BehaviorOptionV2, dx: number, dy: number) {
    const x = Math.max(0.1, Math.min(0.9, (item.swarmPosX ?? 0.5) + dx));
    const y = Math.max(0.1, Math.min(0.9, (item.swarmPosY ?? 0.5) + dy));
    setOptions((current) => current.map((value) => value.id === item.id ? { ...value, swarmPosX: x, swarmPosY: y } : value));
    await updateBehaviorOptionV2(item.id, { swarmPosX: x, swarmPosY: y, updatePosition: true });
  }

  async function nudgeSize(item: BehaviorOptionV2, dw: number, dh: number) {
    const width = Math.max(140, Math.min(420, (item.swarmWidth ?? 190) + dw));
    const height = Math.max(72, Math.min(280, (item.swarmHeight ?? 86) + dh));
    setOptions((current) => current.map((value) => value.id === item.id ? { ...value, swarmWidth: width, swarmHeight: height } : value));
    await updateBehaviorOptionV2(item.id, { swarmWidth: width, swarmHeight: height, updateSize: true });
  }

  return (
    <div className="step swarm-step">
      <p className="step-directive"><span aria-hidden="true"><UiIcon name="brainstorm" size={18} /></span>先发散，不筛选。想到一个行为后，再问：“还有呢？”</p>

      <div className="add-toolbar">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && addBehavior(text)}
          placeholder="输入一个具体、可观察的行为"
        />
        <button className="primary compact" onClick={() => addBehavior(text)}>添加</button>
        <label className="inline-check">
          <input type="checkbox" checked={saveToLibrary} onChange={(event) => setSaveToLibrary(event.target.checked)} />
          同时保存到我的库
        </label>
      </div>

      <div className="reference-grid inline-reference-grid">
        <details className="ref-panel">
          <summary>从书中配方获得行为灵感</summary>
          <div className="ref-list category-ref-list">
            {RECIPE_CATEGORIES.map((category) => (
              <details key={category.name} className="ref-cat">
                <summary>{category.name}<small>{category.items.length} 条</small></summary>
                {category.items.map((item) => (
                  <div key={`${category.name}-${item.id}`} className="ref-item">
                    <span>{item.recipe}</span>
                    <button onClick={() => beginRecipe(item.recipe)}>提取行为</button>
                  </div>
                ))}
              </details>
            ))}
          </div>
        </details>

        <details className="ref-panel">
          <summary>我的行为灵感库（{personal.length}）</summary>
          <div className="ref-list">
            {personal.map((item) => (
              <div key={item.id} className="ref-item">
                <span>{item.content}</span>
                <div className="inline-actions"><button onClick={() => addBehavior(item.content, "用户", false)}>加入画布</button><button className="danger-text" onClick={() => removePersonal(item.id)}>删除</button></div>
              </div>
            ))}
          </div>
        </details>
      </div>

      <div ref={canvasRef} className={`swarm-canvas${positioned.length === 0 ? " is-empty" : ""}`}>
        <svg className="swarm-lines" aria-hidden="true">
          <defs>
            <marker id="swarm-arrow" markerWidth="6" markerHeight="6" refX="5.4" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#769fba" />
            </marker>
          </defs>
          {positioned.map((item) => (
            <line key={item.id} x1={`${item.x * 100}%`} y1={`${item.y * 100}%`} x2={`${(0.5 + (item.x - 0.5) * 0.34) * 100}%`} y2={`${(0.5 + (item.y - 0.5) * 0.3) * 100}%`} markerEnd="url(#swarm-arrow)" />
          ))}
        </svg>
        <div className="aspiration-cloud" aria-label={`愿望：${aspiration}`}>
          <img className="aspiration-kessoku-logo" src="/themes/kessoku/bocchi-logo.svg" alt="" aria-hidden="true" />
          <small>本次设计的愿望</small>
          <strong>{aspiration}</strong>
          <span className="aspiration-member-track" aria-hidden="true"><i /><i /><i /><i /></span>
        </div>
        {positioned.length === 0 && <div className="swarm-empty-prompt"><strong>先写下第一个可以看见的动作</strong><p>例如“把运动鞋放到门口”，而不是“变得自律”。添加后，它会出现在愿望周围。</p></div>}
        {positioned.map((item) => (
          <article key={item.id} className="swarm-card" style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%`, width: item.swarmWidth ?? 190, height: item.swarmHeight ?? 86 }}>
            <button
              className="drag-handle"
              title="拖动卡片"
              aria-label="移动行为卡片；也可用方向键微调"
              onKeyDown={(event) => {
                const delta = event.shiftKey ? .08 : .03;
                const move = event.key === "ArrowLeft" ? [-delta, 0] : event.key === "ArrowRight" ? [delta, 0] : event.key === "ArrowUp" ? [0, -delta] : event.key === "ArrowDown" ? [0, delta] : null;
                if (move) { event.preventDefault(); nudgePosition(item, move[0], move[1]); }
              }}
              onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
              onPointerMove={(event) => event.currentTarget.hasPointerCapture(event.pointerId) && updatePosition(item.id, event, false)}
              onPointerUp={(event) => { updatePosition(item.id, event, true); event.currentTarget.releasePointerCapture(event.pointerId); }}
            >⠿</button>
            <textarea
              value={item.text}
              aria-label="候选行为"
              onChange={(event) => setOptions((current) => current.map((x) => x.id === item.id ? { ...x, text: event.target.value } : x))}
              onBlur={(event) => updateBehaviorOptionV2(item.id, { text: event.target.value })}
            />
            <button className="icon-button" title="删除" onClick={async () => { await updateBehaviorOptionV2(item.id, { status: "已删除" }); await refresh(); onChange?.(); }}>×</button>
            <button className="resize-handle" title="拖动调整卡片大小" aria-label="调整卡片大小；也可用方向键微调" onKeyDown={(event) => {
              const delta = event.shiftKey ? 32 : 12;
              const resize = event.key === "ArrowLeft" ? [-delta, 0] : event.key === "ArrowRight" ? [delta, 0] : event.key === "ArrowUp" ? [0, -delta] : event.key === "ArrowDown" ? [0, delta] : null;
              if (resize) { event.preventDefault(); nudgeSize(item, resize[0], resize[1]); }
            }} onPointerDown={(event) => beginResize(item, event)} onPointerMove={resizeCard} onPointerUp={finishResize}>⌟</button>
          </article>
        ))}
      </div>

      {recipeExample && (
        <div className="extract-card compact-extract">
          <strong>候选行为：</strong>
          <input aria-label="候选行为" value={extracted} onChange={(event) => setExtracted(event.target.value)} />
          <div className="dialog-actions inline-actions">
            <button onClick={() => { setRecipeExample(null); setExtracted(""); }}>取消</button>
            <button className="primary compact" onClick={async () => { await addBehavior(extracted, "内置库"); setRecipeExample(null); setExtracted(""); }}>加入行为集群</button>
          </div>
        </div>
      )}
    </div>
  );
}
