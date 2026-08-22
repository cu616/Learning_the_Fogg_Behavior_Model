import { useEffect, useRef, useState } from "react";
import { getAspiration, saveAspiration } from "../api/steps";

function guessType(text: string): string {
  if (!text.trim()) return "不确定";
  if (/(公斤|千克|斤|本|次|小时|分钟|公里|%|\d)/.test(text)) return "成果";
  if (/(每天|每周|坚持|开始|跑步|写作|读书|健身|运动|喝水|睡觉|学习|练习|戒烟|吃)/.test(text)) return "行为";
  return "愿望";
}

export default function Step1({ projectId, onChange }: { projectId: number; onChange?: () => void }) {
  const [aspiration, setAspiration] = useState("");
  const [reflection, setReflection] = useState("");
  const [legacyWhy, setLegacyWhy] = useState<string | null>(null);
  const [legacyDifference, setLegacyDifference] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);
  const ref = useRef({ aspiration, reflection, legacyWhy, legacyDifference });
  ref.current = { aspiration, reflection, legacyWhy, legacyDifference };

  useEffect(() => {
    getAspiration(projectId).then((item) => {
      if (!item) return;
      setAspiration(item.finalAspiration || item.rawInput || "");
      const migratedReflection = item.notes || [
        item.whyImportant ? `为什么重要：${item.whyImportant}` : "",
        item.lifeDifference ? `生活会有什么不同：${item.lifeDifference}` : "",
      ].filter(Boolean).join("\n");
      setReflection(migratedReflection);
      setLegacyWhy(item.whyImportant);
      setLegacyDifference(item.lifeDifference);
    });
  }, [projectId]);

  async function save() {
    const value = ref.current;
    await saveAspiration(projectId, {
      rawInput: value.aspiration || null,
      inputType: guessType(value.aspiration),
      finalAspiration: value.aspiration || null,
      whyImportant: value.legacyWhy,
      lifeDifference: value.legacyDifference,
      notes: value.reflection || null,
    });
    setSaved(true);
    onChange?.();
  }

  const type = guessType(aspiration);

  return (
    <div className="step step-one">
      <div className="core-field">
        <label htmlFor="final-aspiration" className="label-with-icon"><span aria-hidden="true">✦</span>最终愿望</label>
        <textarea
          id="final-aspiration"
          className="aspiration-input"
          value={aspiration}
          onChange={(event) => { setAspiration(event.target.value); setSaved(false); }}
          onBlur={save}
          placeholder="例如：我希望身体更健康、更有活力"
          autoFocus
        />
        <div className="field-meta">
          <span>
            {type === "愿望" || type === "不确定"
              ? "愿望是你真正想改变的方向。"
              : `这句话更像“${type}”。如果愿意，可以把它改成背后真正想要的方向。`}
          </span>
          <span className={saved ? "save-state" : "save-state pending"}>{saved ? "已保存" : "等待保存"}</span>
        </div>
      </div>

      <details className="optional-panel">
        <summary>帮助我想一想 <span>（非必填）</span></summary>
        <div className="reflection-prompts">
          <p>• 这对你为什么重要？</p>
          <p>• 如果改变，生活会有什么不同？</p>
        </div>
        <label htmlFor="aspiration-reflection">随手记下想到的内容</label>
        <textarea
          id="aspiration-reflection"
          value={reflection}
          onChange={(event) => { setReflection(event.target.value); setSaved(false); }}
          onBlur={save}
          placeholder="可以留空；它只是帮助你想清楚愿望。"
        />
      </details>
    </div>
  );
}
