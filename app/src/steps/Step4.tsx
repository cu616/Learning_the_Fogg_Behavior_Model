import { useEffect, useRef, useState } from "react";
import { getBranchAbility, getBranchTiny, saveBranchAbility, saveBranchTiny } from "../api/design";

const LINKS = [
  { name: "时间", question: "它是否需要太多时间？" },
  { name: "资金", question: "它是否需要现在没有的资金？" },
  { name: "体力", question: "它是否超出目前的体力？" },
  { name: "脑力", question: "它是否太复杂或需要太多思考？" },
  { name: "日程", question: "它是否难以融入现在的日程？" },
];

type Method = "skill" | "tools" | "entry" | "scale";

export default function Step4({ branchId, onChange }: { projectId: number; branchId: number | null; onChange?: () => void }) {
  const [weakest, setWeakest] = useState("");
  const [details, setDetails] = useState("");
  const [methods, setMethods] = useState<Method[]>([]);
  const [skillTarget, setSkillTarget] = useState("");
  const [skillPlan, setSkillPlan] = useState("");
  const [toolsNeeded, setToolsNeeded] = useState("");
  const [resources, setResources] = useState("");
  const [original, setOriginal] = useState("");
  const [tiny, setTiny] = useState("");
  const [entry, setEntry] = useState("");
  const [baseline, setBaseline] = useState("");
  const [extension, setExtension] = useState("");
  const stateRef = useRef({ weakest, details, methods, skillTarget, skillPlan, toolsNeeded, resources, original, tiny, entry, baseline, extension });
  stateRef.current = { weakest, details, methods, skillTarget, skillPlan, toolsNeeded, resources, original, tiny, entry, baseline, extension };

  useEffect(() => {
    if (!branchId) return;
    Promise.all([getBranchAbility(branchId), getBranchTiny(branchId)]).then(([ability, tinyBehavior]) => {
      setWeakest(ability?.weakestLink || "");
      setDetails(ability?.weakestDetails || "");
      try { setMethods(JSON.parse(ability?.simplificationMethods || "[]")); } catch { setMethods([]); }
      setSkillTarget(ability?.skillTarget || "");
      setSkillPlan(ability?.skillPlan || "");
      setToolsNeeded(ability?.toolsNeeded || "");
      setResources(ability?.resourcesAvailable || "");
      setOriginal(tinyBehavior?.originalBehavior || "");
      setTiny(tinyBehavior?.tinyBehavior || "");
      setEntry(tinyBehavior?.entryStep || "");
      setBaseline(tinyBehavior?.baseline || "");
      setExtension(tinyBehavior?.optionalExtension || "");
    });
  }, [branchId]);

  if (!branchId) return <div className="empty-state">请先在第三步选择黄金行为。进入本步骤后，软件才会建立可编辑的“微习惯方案 1”。</div>;

  async function save() {
    if (!branchId) return;
    const value = stateRef.current;
    await Promise.all([
      saveBranchAbility(branchId, {
        weakestLink: value.weakest || null,
        weakestDetails: value.details || null,
        simplificationMethods: JSON.stringify(value.methods),
        skillTarget: value.skillTarget || null,
        skillPlan: value.skillPlan || null,
        toolsNeeded: value.toolsNeeded || null,
        resourcesAvailable: value.resources || null,
      }),
      saveBranchTiny(branchId, {
        originalBehavior: value.original || null,
        tinyBehavior: value.tiny || null,
        entryStep: value.entry || null,
        baseline: value.baseline || null,
        optionalExtension: value.extension || null,
      }),
    ]);
    onChange?.();
  }

  async function chooseWeakest(name: string) {
    setWeakest(name);
    stateRef.current.weakest = name;
    await save();
  }

  async function toggle(method: Method) {
    const next = methods.includes(method) ? methods.filter((value) => value !== method) : [...methods, method];
    setMethods(next);
    stateRef.current.methods = next;
    await save();
  }

  return (
    <div className="step ability-step">
      <p className="step-directive"><span aria-hidden="true">⛓</span>点击能力链中最薄弱的一环。</p>

      <div className="ability-chain" role="group" aria-label="能力链">
        {LINKS.map((link, index) => (
          <div className="chain-part" key={link.name}>
            <button
              className={weakest === link.name ? "chain-link weakest" : "chain-link"}
              onClick={() => chooseWeakest(link.name)}
              title={link.question}
            >
              <span>{link.name}</span>
            </button>
            {index < LINKS.length - 1 && <span className="chain-connector" aria-hidden="true">—</span>}
          </div>
        ))}
      </div>

      {weakest && (
        <div className="field-span-2">
          <label>具体是什么让“{weakest}”成为阻碍？</label>
          <textarea value={details} onChange={(event) => setDetails(event.target.value)} onBlur={save} placeholder="描述真实障碍，不评价自己。" />
        </div>
      )}

      <h4>怎样让它更容易？</h4>
      <div className="method-cards">
        <button className={methods.includes("skill") ? "method-card active" : "method-card"} onClick={() => toggle("skill")}>
          <strong>提升技能</strong><span>学习、练习或请教</span>
        </button>
        <button className={methods.includes("tools") ? "method-card active" : "method-card"} onClick={() => toggle("tools")}>
          <strong>工具和资源</strong><span>准备工具、环境或帮助</span>
        </button>
        <div className={`method-card tiny-method${methods.includes("entry") || methods.includes("scale") ? " active" : ""}`}>
          <strong>让行为变得微小</strong><span>选择一种或两种方法</span>
          <div className="tiny-method-buttons">
            <button className={methods.includes("entry") ? "active" : ""} onClick={() => toggle("entry")}>入门步骤</button>
            <button className={methods.includes("scale") ? "active" : ""} onClick={() => toggle("scale")}>缩小规模</button>
          </div>
        </div>
      </div>

      {methods.includes("skill") && (
        <section className="conditional-card field-grid">
          <h4 className="field-span-2">提升技能</h4>
          <label>需要提升什么技能？<input value={skillTarget} onChange={(event) => setSkillTarget(event.target.value)} onBlur={save} /></label>
          <label>准备怎样学习或练习？<input value={skillPlan} onChange={(event) => setSkillPlan(event.target.value)} onBlur={save} /></label>
        </section>
      )}

      {methods.includes("tools") && (
        <section className="conditional-card field-grid">
          <h4 className="field-span-2">工具和资源</h4>
          <label>需要什么工具？<input value={toolsNeeded} onChange={(event) => setToolsNeeded(event.target.value)} onBlur={save} /></label>
          <label>能获得哪些资源或帮助？<input value={resources} onChange={(event) => setResources(event.target.value)} onBlur={save} /></label>
        </section>
      )}

      {(methods.includes("entry") || methods.includes("scale")) && (
        <section className="conditional-card">
          <h4>让行为变得微小</h4>
          <div className="behavior-transform">
            <label className="original-behavior">原行为<input value={original} onChange={(event) => setOriginal(event.target.value)} onBlur={save} /></label>
            <span className="transform-arrow">→</span>
            <div className="transform-results">
              {methods.includes("entry") && <label>第一个入门步骤<input value={entry} onChange={(event) => setEntry(event.target.value)} onBlur={save} /></label>}
              {methods.includes("scale") && <label>缩小后的微行为<input value={tiny} onChange={(event) => setTiny(event.target.value)} onBlur={save} /></label>}
            </div>
          </div>
        </section>
      )}

      <section className="baseline-card field-grid">
        <label className="result-field baseline-field">
          <span className="field-title"><i aria-hidden="true">·</i><strong>基线行为</strong></span>
          <input value={baseline} onChange={(event) => setBaseline(event.target.value)} onBlur={save} placeholder="状态不好时也一定做得到" />
        </label>
        <label className="result-field extension-field">
          <span className="field-title"><i aria-hidden="true">↗</i><strong>可选扩展</strong></span>
          <input value={extension} onChange={(event) => setExtension(event.target.value)} onBlur={save} placeholder="有余力时自愿多做" />
        </label>
      </section>
    </div>
  );
}
