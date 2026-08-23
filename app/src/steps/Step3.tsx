import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  listBehaviorOptionsV2,
  listFocusPlacementsV2,
  listGoldenBehaviors,
  saveFocusPlacementV2,
  setGoldenBehavior,
} from "../api/design";
import type { BehaviorOptionV2, FocusPlacementV2, GoldenBehaviorV2 } from "../types";

function fallbackPosition(index: number) {
  return { x: 0.16 + (index % 4) * 0.2, y: 0.18 + (Math.floor(index / 4) % 4) * 0.2 };
}

function scores(x: number, y: number) {
  return {
    feasibility: Math.max(-4, Math.min(4, Math.round(x * 8) - 4)),
    impact: Math.max(-4, Math.min(4, 4 - Math.round(y * 8))),
  };
}

export default function Step3({ projectId, onChange }: { projectId: number; onChange?: () => void }) {
  const [options, setOptions] = useState<BehaviorOptionV2[]>([]);
  const [placements, setPlacements] = useState<Record<number, FocusPlacementV2>>({});
  const [golden, setGolden] = useState<GoldenBehaviorV2[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; pointerId: number; startClientX: number; startClientY: number; startX: number; startY: number; moved: boolean } | null>(null);

  async function refresh() {
    const [all, fps, selected] = await Promise.all([
      listBehaviorOptionsV2(projectId),
      listFocusPlacementsV2(projectId),
      listGoldenBehaviors(projectId),
    ]);
    setOptions(all.filter((item) => item.status === "活跃"));
    setPlacements(Object.fromEntries(fps.map((item) => [item.behaviorOptionId, item])));
    setGolden(selected);
  }

  useEffect(() => { refresh(); }, [projectId]);

  const cards = useMemo(() => options.map((item, index) => {
    const placement = placements[item.id];
    const fallback = fallbackPosition(index);
    const x = placement?.posX ?? fallback.x;
    const y = placement?.posY ?? fallback.y;
    const value = scores(x, y);
    return {
      item,
      x,
      y,
      impact: placement?.impact ?? value.impact,
      feasibility: placement?.feasibility ?? value.feasibility,
    };
  }), [options, placements]);

  const selectedCard = cards.find((card) => card.item.id === selectedId) || null;

  function beginCardDrag(id: number, x: number, y: number, event: ReactPointerEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest(".golden-toggle") || (event.pointerType === "mouse" && !target.closest(".drag-handle"))) return;
    dragRef.current = { id, pointerId: event.pointerId, startClientX: event.clientX, startClientY: event.clientY, startX: x, startY: y, moved: false };
  }

  function cardDragPosition(event: ReactPointerEvent<HTMLElement>) {
    const start = dragRef.current;
    const bounds = mapRef.current?.getBoundingClientRect();
    if (!start || start.pointerId !== event.pointerId || !bounds) return null;
    const distance = Math.hypot(event.clientX - start.startClientX, event.clientY - start.startClientY);
    if (!start.moved && distance < 5) return null;
    if (!start.moved) { start.moved = true; event.currentTarget.setPointerCapture(event.pointerId); }
    const x = Math.max(0.04, Math.min(0.96, start.startX + (event.clientX - start.startClientX) / bounds.width));
    const y = Math.max(0.04, Math.min(0.96, start.startY + (event.clientY - start.startClientY) / bounds.height));
    return { start, x, y };
  }

  function dragCard(event: ReactPointerEvent<HTMLElement>) {
    const next = cardDragPosition(event);
    if (!next) return;
    event.preventDefault();
    const value = scores(next.x, next.y);
    setPlacements((current) => ({ ...current, [next.start.id]: {
      behaviorOptionId: next.start.id, impact: value.impact, feasibility: value.feasibility,
      posX: next.x, posY: next.y, updatedAt: current[next.start.id]?.updatedAt ?? null,
    } }));
    setSelectedId(next.start.id);
  }

  async function finishCardDrag(event: ReactPointerEvent<HTMLElement>) {
    const next = cardDragPosition(event);
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (next) {
      const value = scores(next.x, next.y);
      const saved = await saveFocusPlacementV2(next.start.id, value.impact, value.feasibility, next.x, next.y);
      setPlacements((current) => ({ ...current, [next.start.id]: saved }));
      setSelectedId(next.start.id);
    }
  }

  async function setScores(id: number, impact: number, feasibility: number) {
    const x = (feasibility + 4) / 8;
    const y = (4 - impact) / 8;
    const saved = await saveFocusPlacementV2(id, impact, feasibility, x, y);
    setPlacements((current) => ({ ...current, [id]: saved }));
  }

  async function nudge(id: number, dx: number, dy: number) {
    const card = cards.find((value) => value.item.id === id);
    if (!card) return;
    const x = Math.max(0.04, Math.min(0.96, card.x + dx));
    const y = Math.max(0.04, Math.min(0.96, card.y + dy));
    const value = scores(x, y);
    const saved = await saveFocusPlacementV2(id, value.impact, value.feasibility, x, y);
    setPlacements((current) => ({ ...current, [id]: saved }));
    setSelectedId(id);
  }

  async function toggle(item: BehaviorOptionV2, selected: boolean) {
    setGolden(await setGoldenBehavior(projectId, item.id, selected));
    onChange?.();
  }

  return (
    <div className="step focus-step">
      <div className="focus-instruction"><span><i aria-hidden="true">↕</i><strong>先上下：</strong>判断影响</span><span><i aria-hidden="true">↔</i><strong>再左右：</strong>判断现实可行性</span></div>

      <div className="focus-shell">
        <div ref={mapRef} className="focus-map-nine">
          <div className="golden-zone"><span>第一象限 · 黄金行为候选区</span></div>
          {Array.from({ length: 7 }, (_, index) => <span key={`v-${index}`} className="grid-v" style={{ left: `${((index + 1) / 8) * 100}%` }} />)}
          {Array.from({ length: 7 }, (_, index) => <span key={`h-${index}`} className="grid-h" style={{ top: `${((index + 1) / 8) * 100}%` }} />)}
          <span className="zero-axis zero-axis-v" aria-hidden="true" />
          <span className="zero-axis zero-axis-h" aria-hidden="true" />
          <span className="axis-direction dir-impact-high">影响高</span>
          <span className="axis-direction dir-impact-low">影响低</span>
          <span className="axis-direction dir-feasibility-low">难以做到</span>
          <span className="axis-direction dir-feasibility-high">容易做到</span>
          {Array.from({ length: 9 }, (_, index) => <span key={`tx-${index}`} className="map-tick tick-x" style={{ left: `${(index / 8) * 100}%` }}>{index - 4}</span>)}
          {Array.from({ length: 9 }, (_, index) => <span key={`ty-${index}`} className="map-tick tick-y" style={{ top: `${(index / 8) * 100}%` }}>{4 - index}</span>)}
          {cards.map(({ item, x, y, impact, feasibility }) => {
            const candidate = impact > 0 && feasibility > 0;
            const isGolden = golden.some((value) => value.behaviorOptionId === item.id);
            return (
              <article
                key={item.id}
                className={`focus-card${candidate ? " candidate" : ""}${isGolden ? " chosen" : ""}${selectedId === item.id ? " focused" : ""}`}
                style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                onClick={() => setSelectedId(item.id)}
                onPointerDown={(event) => beginCardDrag(item.id, x, y, event)}
                onPointerMove={dragCard}
                onPointerUp={finishCardDrag}
                onPointerCancel={(event) => { dragRef.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
              >
                <button
                  className="drag-handle"
                  title="拖动行为卡片"
                  aria-label="移动行为卡片；也可用方向键微调"
                  onKeyDown={(event) => {
                    const delta = event.shiftKey ? .08 : .03;
                    const moveBy = event.key === "ArrowLeft" ? [-delta, 0] : event.key === "ArrowRight" ? [delta, 0] : event.key === "ArrowUp" ? [0, -delta] : event.key === "ArrowDown" ? [0, delta] : null;
                    if (moveBy) { event.preventDefault(); nudge(item.id, moveBy[0], moveBy[1]); }
                  }}
                >⠿</button>
                <span>{item.text}</span>
                <small>影响 {impact >= 0 ? `+${impact}` : impact} · 可行 {feasibility >= 0 ? `+${feasibility}` : feasibility}</small>
                {(candidate || isGolden) && (
                  <button className="golden-toggle" onClick={(event) => { event.stopPropagation(); toggle(item, !isGolden); }}>
                    {isGolden ? "✓ 已选" : "选为黄金行为"}
                  </button>
                )}
              </article>
            );
          })}
          {cards.length === 0 && <div className="canvas-empty">请先在第二步添加候选行为。</div>}
        </div>
      </div>

      {selectedCard && (
        <div className="precision-panel field-grid">
          <label>
            影响程度：{selectedCard.impact >= 0 ? `+${selectedCard.impact}` : selectedCard.impact}
            <input type="range" min="-4" max="4" value={selectedCard.impact} onChange={(event) => setScores(selectedCard.item.id, Number(event.target.value), selectedCard.feasibility)} />
          </label>
          <label>
            现实可行性：{selectedCard.feasibility >= 0 ? `+${selectedCard.feasibility}` : selectedCard.feasibility}
            <input type="range" min="-4" max="4" value={selectedCard.feasibility} onChange={(event) => setScores(selectedCard.item.id, selectedCard.impact, Number(event.target.value))} />
          </label>
        </div>
      )}

      <div className="selected-golden-summary">
        <h4>已选择的黄金行为（{golden.length}）</h4>
        {golden.length ? (
          <div className="golden-chip-list">{golden.map((item) => <span key={item.id}>{item.behaviorText}<button title="移出黄金行为" onClick={() => {
            const option = options.find((value) => value.id === item.behaviorOptionId);
            if (option) toggle(option, false);
          }}>×</button></span>)}</div>
        ) : <p className="hint">把有影响、现实可行的行为移动到右上区域，再主动选择一个或多个。</p>}
      </div>
    </div>
  );
}
