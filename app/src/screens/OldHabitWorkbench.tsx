import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createProject, listProjects } from "../api/projects";
import {
  createReplacementHabitProject, deleteOldHabitBehavior, deleteOldHabitStrategy,
  focusOldHabitBehavior, getOldHabitProject, getOldHabitReplacement,
  listOldHabitBehaviors, listOldHabitObservations, listOldHabitStrategies,
  saveOldHabitBehavior, saveOldHabitBehaviorLayout, saveOldHabitObservation, saveOldHabitProject,
  saveOldHabitReplacement, saveOldHabitStrategy,
} from "../api/oldHabit";
import type { HabitProject, OldHabitBehavior, OldHabitObservation, OldHabitProject, OldHabitReplacement, OldHabitStage, OldHabitStrategy } from "../types";
import SupportDrawer from "../components/SupportDrawer";
import FoggNotePanel from "../components/FoggNotePanel";
import UiIcon from "../components/UiIcon";
import { OLD_HABIT_NOTES } from "../foggNotes";
import FloatingError from "../components/FloatingError";
import CharacterCue from "../components/CharacterCue";

const STAGES: Array<{id:OldHabitStage; label:string; icon:string}> = [
  {id:"prepare",label:"改变准备",icon:"◇"},{id:"clarify",label:"拆解旧习惯",icon:"✣"},
  {id:"strategies",label:"布置对策",icon:"⌁"},{id:"observe",label:"观察调整",icon:"◉"},{id:"replace",label:"替代行为",icon:"↝"},
];
const OLD_HABIT_CUES = {
  prepare: { character: "ikuyo" as const, line: "先确认你已有的改变经验；没有也可以直接开始。" },
  clarify: { character: "hitori" as const, line: "把概括的旧习惯拆成一个真实场景里的具体动作。" },
  strategies: { character: "ryo" as const, line: "先改提示，再增加难度，最后才考虑动机。" },
  observe: { character: "nijika" as const, line: "每次出现或没出现，都是下一轮排练的线索。" },
  replace: { character: "ikuyo" as const, line: "需要时，用一个更合适的新动作接住原来的位置。" },
};
const METHODS = [
  {factor:"P",method:"remove",label:"移除提示",hint:"删除、关闭、移走或永久取消"},
  {factor:"P",method:"avoid",label:"规避提示",hint:"改变地点、路线、时间或接触方式"},
  {factor:"P",method:"ignore",label:"忽略提示",hint:"无法移除或规避时再使用"},
  {factor:"A",method:"time",label:"增加时间",hint:"增加步骤或等待时间"},
  {factor:"A",method:"money",label:"增加资金",hint:"安全、合理地提高直接成本"},
  {factor:"A",method:"physical",label:"增加体力",hint:"让旧行为需要额外移动"},
  {factor:"A",method:"brain",label:"增加脑力",hint:"增加登录、寻找或选择步骤"},
  {factor:"A",method:"schedule",label:"调整日程",hint:"让它与更重要的日程冲突"},
  {factor:"M",method:"reduce",label:"削弱动机",hint:"减少刺激或先回应真实需要"},
  {factor:"M",method:"disincentive",label:"去激励因素",hint:"谨慎使用，避免羞耻和惩罚"},
] as const;
const GOALS:Record<string,string>={stop:"完全停止",count:"减少次数",duration:"缩短时长",intensity:"降低强度",period:"有限周期"};
const RESULTS:Record<string,string>={not_happened:"这次没有发生",reduced:"这次少了一些",happened:"还是发生了",no_context:"没有遇到相关情境",brief:"暂不记录细节"};

export default function OldHabitWorkbench({projectId,onBack,onOpenHabit,mobile=false}:{projectId:number;onBack:()=>void;onOpenHabit:(id:number)=>void;mobile?:boolean}) {
  const [project,setProject]=useState<OldHabitProject|null>(null);
  const [behaviors,setBehaviors]=useState<OldHabitBehavior[]>([]);
  const [strategies,setStrategies]=useState<OldHabitStrategy[]>([]);
  const [observations,setObservations]=useState<OldHabitObservation[]>([]);
  const [replacement,setReplacement]=useState<OldHabitReplacement|null>(null);
  const [habits,setHabits]=useState<HabitProject[]>([]);
  const [leftOpen,setLeftOpen]=useState(!mobile); const [rightOpen,setRightOpen]=useState(false);
  const [error,setError]=useState("");
  const active=behaviors.find((b)=>b.status==="active"||b.status==="observing")||null;
  const stage=project?.currentStage||"prepare";

  async function refresh() {
    try {
      const [p,bs,hs]=await Promise.all([getOldHabitProject(projectId),listOldHabitBehaviors(projectId),listProjects()]);
      setProject(p);setBehaviors(bs);setHabits(hs);
      const focus=bs.find((b)=>b.status==="active"||b.status==="observing");
      if(focus){const [ss,os,r]=await Promise.all([listOldHabitStrategies(focus.id),listOldHabitObservations(focus.id),getOldHabitReplacement(focus.id)]);setStrategies(ss);setObservations(os);setReplacement(r);}
      else {setStrategies([]);setObservations([]);setReplacement(null);}
      setError("");
    } catch(e){setError(String(e));}
  }
  useEffect(()=>{refresh()},[projectId]);

  async function updateProject(patch:Partial<OldHabitProject>){if(!project)return;const saved=await saveOldHabitProject({id:project.id,title:patch.title??project.title,generalHabit:patch.generalHabit??project.generalHabit,preparationMode:patch.preparationMode??project.preparationMode,preparationNote:patch.preparationNote??project.preparationNote,linkedHabitProjectId:patch.linkedHabitProjectId??project.linkedHabitProjectId,currentStage:patch.currentStage??project.currentStage,status:patch.status??project.status});setProject(saved);}
  async function go(next:OldHabitStage){await updateProject({currentStage:next});}
  async function completeActiveBehavior(){if(!active)return;await saveOldHabitBehavior({...active,status:"achieved"});await updateProject({currentStage:"clarify",status:"active"});await refresh()}

  if(!project)return <div className="loading">正在打开本地项目…</div>;
  return <div className={`old-habit-workbench${mobile?" mobile-old-habit-workbench":""}`}>
    <header className="wb-top old-habit-top">
      <button className="icon-action" onClick={onBack} title="返回首页" aria-label="返回首页"><UiIcon name="back"/></button>
      <span className="wb-name">{project.title}</span>
      <nav className="old-stage-nav" aria-label="终止旧习惯流程">{STAGES.map((s,i)=><button key={s.id} className={stage===s.id?"active":STAGES.findIndex(x=>x.id===stage)>i?"done":""} onClick={()=>go(s.id)} title={s.label}><span>{i+1}</span>{s.label}</button>)}</nav>
      <button className="panel-toggle icon-action" onClick={()=>setLeftOpen(v=>!v)} title={leftOpen?"收起行为状态":"展开行为状态"} aria-label={leftOpen?"收起行为状态":"展开行为状态"}><UiIcon name="summary"/></button>
      <button className="panel-toggle icon-action" onClick={()=>setRightOpen(true)} title="福格模型笔记" aria-label="打开福格模型笔记"><UiIcon name="notes"/></button>
    </header>
    <div className={`old-habit-body${leftOpen?" status-open":""}`}>
      {leftOpen&&<OldHabitStatus project={project} behaviors={behaviors} active={active} strategies={strategies} observations={observations} replacement={replacement} onFocus={async(id)=>{await focusOldHabitBehavior(projectId,id);await refresh()}}/>}
      <main className="old-habit-main">
        <CharacterCue character={OLD_HABIT_CUES[stage].character} line={OLD_HABIT_CUES[stage].line} />
        <div className="step-heading old-habit-heading"><span className="step-icon" aria-hidden="true">{STAGES.find(s=>s.id===stage)?.icon}</span><div><small className="step-eyebrow">终止旧习惯</small><h2>{STAGES.find(s=>s.id===stage)?.label}</h2></div></div>
        <FloatingError message={error} onDismiss={()=>setError("")}/>
        {stage==="prepare"&&<Prepare project={project} habits={habits} onSave={updateProject} onCreate={async(name)=>{const h=await createProject(name);await updateProject({preparationMode:"linked",linkedHabitProjectId:h.id});onOpenHabit(h.id)}} onNext={()=>go("clarify")}/>}
        {stage==="clarify"&&<Clarify project={project} behaviors={behaviors} onProject={updateProject} onRefresh={refresh}/>}
        {stage==="strategies"&&<Strategies project={project} active={active} strategies={strategies} onRefresh={refresh} onObserve={()=>go("observe")}/>}
        {stage==="observe"&&<Observe project={project} active={active} observations={observations} onRefresh={refresh} onReplace={()=>go("replace")} onAchieved={completeActiveBehavior}/>}
        {stage==="replace"&&<Replace project={project} active={active} replacement={replacement} onRefresh={refresh} onOpenHabit={onOpenHabit}/>}
      </main>
      <SupportDrawer side="right" title="福格模型笔记" open={rightOpen} onClose={()=>setRightOpen(false)}><FoggNotePanel notes={OLD_HABIT_NOTES[stage]}/><details className="support-boundary"><summary>何时需要专业支持</summary><p>严重成瘾、进食障碍、自伤风险或其他自由落体型行为，通常需要医疗、心理或成瘾治疗等专业支持。本软件只能辅助记录和准备。</p></details></SupportDrawer>
    </div>
    <footer className="wb-bottom"><span>自动保存到本机 · 再次发生也是新的信息</span><div className="inline-actions"><button onClick={()=>updateProject({status:project.status==="paused"?"active":"paused"})}>{project.status==="paused"?"继续":"暂停"}</button>{stage==="observe"&&active&&<button className="primary" onClick={completeActiveBehavior}>达到当前目标，返回行为集群 →</button>}</div></footer>
  </div>
}

function OldHabitStatus({project,behaviors,active,strategies,observations,replacement,onFocus}:{project:OldHabitProject;behaviors:OldHabitBehavior[];active:OldHabitBehavior|null;strategies:OldHabitStrategy[];observations:OldHabitObservation[];replacement:OldHabitReplacement|null;onFocus:(id:number)=>void}){
  return <aside className="old-habit-statusbar" aria-label="行为状态"><div className="statusbar-heading"><div><small>正在改变</small><strong>行为状态</strong></div><span>{project.status==="achieved"?"已达到目标":"进行中"}</span></div><div className="old-status-content">
    {project.generalHabit&&<section><label>概括型旧习惯</label><p>{project.generalHabit}</p></section>}
    <section><label>具体行为</label>{behaviors.length?behaviors.map(b=><button key={b.id} className={`old-status-behavior${active?.id===b.id?" active":""}`} onClick={()=>onFocus(b.id)}><span>{b.behaviorText}</span><small>{active?.id===b.id?"当前聚焦":GOALS[b.goalType]}</small></button>):<p className="muted">还没有拆出具体行为</p>}</section>
    {active&&<section className="status-pair"><div><label>当前目标</label><p>{GOALS[active.goalType]}{active.goalValue?` · ${active.goalValue}`:""}</p></div><div><label>观察</label><p>{observations.length} 条记录</p></div></section>}
    {active&&<section><label>已布置对策</label><div className="map-counts"><span>P {strategies.filter(s=>s.factor==="P").length}</span><span>A {strategies.filter(s=>s.factor==="A").length}</span><span>M {strategies.filter(s=>s.factor==="M").length}</span></div></section>}
    {replacement?.newBehavior&&<section><label>替代行为</label><p>{replacement.newBehavior}</p></section>}
  </div></aside>
}

function Prepare({project,habits,onSave,onCreate,onNext}:{project:OldHabitProject;habits:HabitProject[];onSave:(p:Partial<OldHabitProject>)=>Promise<void>;onCreate:(name:string)=>Promise<void>;onNext:()=>void}){
  const [note,setNote]=useState(project.preparationNote||"");const [newName,setNewName]=useState("");
  return <div className="old-stage-content"><p className="lead">先确认你希望怎样开始。准备能帮助你积累改变技巧，但不是门槛。</p><div className="preparation-options">
    <button className={project.preparationMode==="skip"?"selected":""} onClick={()=>onSave({preparationMode:"skip",linkedHabitProjectId:undefined})}><strong>暂时跳过</strong><span>直接拆解旧习惯</span></button>
    <button className={project.preparationMode==="linked"?"selected":""} onClick={()=>onSave({preparationMode:"linked"})}><strong>关联已有习惯</strong><span>把改变经验连到这里</span></button>
    <button className={project.preparationMode==="custom"?"selected":""} onClick={()=>onSave({preparationMode:"custom"})}><strong>自定义填写</strong><span>记下已有经验或准备</span></button>
  </div>
  {project.preparationMode==="linked"&&<div className="conditional-card compact-grid"><label>已有长期习惯<select value={project.linkedHabitProjectId||""} onChange={e=>onSave({linkedHabitProjectId:Number(e.target.value)||undefined})}><option value="">选择一个项目</option>{habits.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label><label>或新建长期习惯<div className="inline-input"><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="想培养的新行为"/><button onClick={()=>newName.trim()&&onCreate(newName.trim())}>＋</button></div></label></div>}
  {project.preparationMode==="custom"&&<div className="conditional-card"><label>我的改变经验或准备（非必填）<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="例如：我已经用小步骤建立过一个习惯"/></label><button onClick={()=>onSave({preparationNote:note})}>保存</button></div>}
  <div className="primary-action-row"><button className="primary" onClick={onNext}>开始拆解旧习惯 →</button></div></div>
}

function oldCardPosition(index:number,total:number){const angle=(Math.PI*2*index)/Math.max(total,8)-Math.PI/2;return{x:.5+Math.cos(angle)*.39,y:.5+Math.sin(angle)*.39}}

function Clarify({project,behaviors,onProject,onRefresh}:{project:OldHabitProject;behaviors:OldHabitBehavior[];onProject:(p:Partial<OldHabitProject>)=>Promise<void>;onRefresh:()=>Promise<void>}){
  const [general,setGeneral]=useState(project.generalHabit);const [text,setText]=useState("");const [editing,setEditing]=useState<number|null>(null);
  const [layout,setLayout]=useState<Record<number,{x:number;y:number;width:number;height:number}>>({});
  const canvasRef=useRef<HTMLDivElement>(null);
  const dragRef=useRef<{id:number;pointerId:number;startClientX:number;startClientY:number;startX:number;startY:number;moved:boolean}|null>(null);
  const suppressClickRef=useRef(false);
  const resizeRef=useRef<{id:number;startX:number;startY:number;width:number;height:number}|null>(null);
  const cards=useMemo(()=>behaviors.map((behavior,index)=>{const fallback=oldCardPosition(index,behaviors.length);return{behavior,...(layout[behavior.id]||{x:behavior.posX??fallback.x,y:behavior.posY??fallback.y,width:behavior.cardWidth??190,height:behavior.cardHeight??86})}}),[behaviors,layout]);
  async function add(){if(!text.trim())return;const pos=oldCardPosition(behaviors.length,behaviors.length+1);await saveOldHabitBehavior({projectId:project.id,behaviorText:text.trim(),goalType:"stop",status:"queued",posX:pos.x,posY:pos.y,cardWidth:190,cardHeight:86});setText("");await onRefresh()}
  async function persist(id:number,next:{x:number;y:number;width:number;height:number}){await saveOldHabitBehaviorLayout(id,next.x,next.y,next.width,next.height)}
  function beginCardDrag(card:typeof cards[number],event:ReactPointerEvent<HTMLElement>){const target=event.target as HTMLElement;if(target.closest(".cloud-actions,.resize-handle,.behavior-editor")||(event.pointerType==="mouse"&&!target.closest(".drag-handle")))return;dragRef.current={id:card.behavior.id,pointerId:event.pointerId,startClientX:event.clientX,startClientY:event.clientY,startX:card.x,startY:card.y,moved:false}}
  function cardDragPosition(event:ReactPointerEvent<HTMLElement>){const start=dragRef.current;const bounds=canvasRef.current?.getBoundingClientRect();const current=cards.find(c=>c.behavior.id===start?.id);if(!start||start.pointerId!==event.pointerId||!bounds||!current)return null;const distance=Math.hypot(event.clientX-start.startClientX,event.clientY-start.startClientY);if(!start.moved&&distance<5)return null;if(!start.moved){start.moved=true;event.currentTarget.setPointerCapture(event.pointerId)}return{start,next:{...current,x:Math.max(.1,Math.min(.9,start.startX+(event.clientX-start.startClientX)/bounds.width)),y:Math.max(.1,Math.min(.9,start.startY+(event.clientY-start.startClientY)/bounds.height))}}}
  function dragCard(event:ReactPointerEvent<HTMLElement>){const value=cardDragPosition(event);if(!value)return;event.preventDefault();setLayout(v=>({...v,[value.start.id]:value.next}))}
  function finishCardDrag(event:ReactPointerEvent<HTMLElement>){const value=cardDragPosition(event);const moved=dragRef.current?.moved;if(value){setLayout(v=>({...v,[value.start.id]:value.next}));void persist(value.start.id,value.next)}dragRef.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);if(moved){suppressClickRef.current=true;window.setTimeout(()=>{suppressClickRef.current=false},0)}}
  function startResize(card:typeof cards[number],event:ReactPointerEvent<HTMLButtonElement>){event.stopPropagation();resizeRef.current={id:card.behavior.id,startX:event.clientX,startY:event.clientY,width:card.width,height:card.height};event.currentTarget.setPointerCapture(event.pointerId)}
  function resize(event:ReactPointerEvent<HTMLButtonElement>,save:boolean){const start=resizeRef.current;const current=cards.find(c=>c.behavior.id===start?.id);if(!start||!current)return;const next={...current,width:Math.max(140,Math.min(420,start.width+event.clientX-start.startX)),height:Math.max(72,Math.min(280,start.height+event.clientY-start.startY))};setLayout(v=>({...v,[start.id]:next}));if(save){void persist(start.id,next);resizeRef.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}}
  function nudge(card:typeof cards[number],dx:number,dy:number,dw=0,dh=0){const next={...card,x:Math.max(.1,Math.min(.9,card.x+dx)),y:Math.max(.1,Math.min(.9,card.y+dy)),width:Math.max(140,Math.min(420,card.width+dw)),height:Math.max(72,Math.min(280,card.height+dh))};setLayout(v=>({...v,[card.behavior.id]:next}));void persist(card.behavior.id,next)}
  return <div className="old-stage-content"><p className="lead">把一个概括标签拆成能被看见的具体行为，再从最容易的一个开始。</p>
    <div className="general-habit-input"><label>概括型旧习惯<input value={general} onChange={e=>setGeneral(e.target.value)} onBlur={()=>onProject({generalHabit:general})}/></label></div>
    <div className="inline-input old-add"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="添加一个具体旧行为"/><button className="primary" onClick={add} aria-label="添加具体旧行为">＋</button></div>
    <div ref={canvasRef} className="old-habit-cloud"><svg className="old-cloud-lines" aria-hidden="true">{cards.map(c=><line key={c.behavior.id} x1={`${c.x*100}%`} y1={`${c.y*100}%`} x2={`${(0.5+(c.x-.5)*.34)*100}%`} y2={`${(0.5+(c.y-.5)*.3)*100}%`}/>)}</svg><div className="old-cloud-core"><small>概括型旧习惯</small><strong>{general||"尚未填写"}</strong></div>
      {cards.map(card=>{const b=card.behavior;return <article
        key={b.id}
        className={`old-cloud-card${b.status==="active"||b.status==="observing"?" active":""}${b.status==="achieved"?" achieved":""}`}
        style={{left:`${card.x*100}%`,top:`${card.y*100}%`,width:card.width,height:card.height}}
        onClickCapture={e=>{if(suppressClickRef.current){e.preventDefault();e.stopPropagation();suppressClickRef.current=false}}}
        onPointerDown={e=>beginCardDrag(card,e)}
        onPointerMove={dragCard}
        onPointerUp={finishCardDrag}
        onPointerCancel={e=>{dragRef.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}}
      >
        <button className="drag-handle" title="拖动卡片" aria-label="移动具体行为卡片；也可用方向键微调" onKeyDown={e=>{const d=e.shiftKey?.08:.03;const m=e.key==="ArrowLeft"?[-d,0]:e.key==="ArrowRight"?[d,0]:e.key==="ArrowUp"?[0,-d]:e.key==="ArrowDown"?[0,d]:null;if(m){e.preventDefault();nudge(card,m[0],m[1])}}}>⠿</button>
        <button className="cloud-behavior-title" onClick={()=>setEditing(editing===b.id?null:b.id)}>{b.behaviorText}</button>
        <div className="cloud-actions"><button onClick={async()=>{await focusOldHabitBehavior(project.id,b.id);await onRefresh()}}>选择并进入对策 →</button><button className="danger-icon" title="删除" aria-label={`删除${b.behaviorText}`} onClick={async()=>{if(window.confirm(`删除具体行为“${b.behaviorText}”及其记录吗？`)){await deleteOldHabitBehavior(b.id);await onRefresh()}}}>⌫</button></div>
        <button className="resize-handle" title="拖动调整卡片大小" aria-label="调整具体行为卡片大小；也可用方向键微调" onKeyDown={e=>{const d=e.shiftKey?32:12;const s=e.key==="ArrowLeft"?[-d,0]:e.key==="ArrowRight"?[d,0]:e.key==="ArrowUp"?[0,-d]:e.key==="ArrowDown"?[0,d]:null;if(s){e.preventDefault();nudge(card,0,0,s[0],s[1])}}} onPointerDown={e=>startResize(card,e)} onPointerMove={e=>resize(e,false)} onPointerUp={e=>resize(e,true)}>⌟</button>
        {editing===b.id&&<BehaviorEditor behavior={b} onDone={async()=>{setEditing(null);await onRefresh()}}/>}
      </article>})}
    </div>
  </div>
}

const GOAL_DETAILS:Record<string,{label:string;placeholder:string}>={stop:{label:"停止范围",placeholder:"例如：睡前不再打开短视频"},count:{label:"次数目标",placeholder:"例如：每天不超过 2 次"},duration:{label:"时长目标",placeholder:"例如：每次不超过 15 分钟"},intensity:{label:"强度目标",placeholder:"例如：只浏览，不再下单"},period:{label:"实验周期",placeholder:"例如：先停止 3 天"}};
function BehaviorEditor({behavior,onDone}:{behavior:OldHabitBehavior;onDone:()=>Promise<void>}){const [v,setV]=useState({...behavior});const detail=GOAL_DETAILS[v.goalType]||GOAL_DETAILS.stop;return <div className="behavior-editor" onPointerDown={e=>e.stopPropagation()}><div className="goal-grid"><label>改变目标<select value={v.goalType} onChange={e=>setV({...v,goalType:e.target.value})}>{Object.entries(GOALS).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label><label>{detail.label}<input value={v.goalValue||""} onChange={e=>setV({...v,goalValue:e.target.value})} placeholder={detail.placeholder}/></label>{v.goalType==="period"&&<label>复盘日期<input type="date" value={v.reviewAt?.slice(0,10)||""} onChange={e=>setV({...v,reviewAt:e.target.value})}/></label>}</div><details className="optional-panel"><summary>补充典型情境（非必填）</summary><div className="compact-grid"><label>典型时间<input value={v.typicalTime||""} onChange={e=>setV({...v,typicalTime:e.target.value})}/></label><label>典型地点<input value={v.typicalPlace||""} onChange={e=>setV({...v,typicalPlace:e.target.value})}/></label><label>人物<input value={v.people||""} onChange={e=>setV({...v,people:e.target.value})}/></label><label>情境<input value={v.context||""} onChange={e=>setV({...v,context:e.target.value})}/></label><label className="span-2">为什么先处理它<input value={v.selectionReason||""} onChange={e=>setV({...v,selectionReason:e.target.value})}/></label></div></details><div className="editor-actions"><button onClick={onDone}>取消</button><button className="primary" onClick={async()=>{await saveOldHabitBehavior({...v});await onDone()}}>保存</button></div></div>}

function Strategies({project,active,strategies,onRefresh,onObserve}:{project:OldHabitProject;active:OldHabitBehavior|null;strategies:OldHabitStrategy[];onRefresh:()=>Promise<void>;onObserve:()=>void}){
  const [open,setOpen]=useState<string|null>(null);const [content,setContent]=useState("");const [situation,setSituation]=useState("");
  if(!active)return <EmptyFocus/>;
  const groups=[{key:"P",title:"P · 提示",note:"优先移除，其次规避，最后忽略"},{key:"A",title:"A · 能力",note:"反向使用能力链，让旧行为更难"},{key:"M",title:"M · 动机",note:"提示与能力不足时再处理"}];
  async function add(factor:string,method:string){if(!content.trim())return;await saveOldHabitStrategy({projectId:project.id,behaviorId:active!.id,factor:factor as "P"|"A"|"M",method,content:content.trim(),situation,status:"idea"});setContent("");setSituation("");setOpen(null);await onRefresh()}
  return <div className="old-stage-content"><div className="strategy-map">{groups.map(g=><section key={g.key} className={`strategy-group factor-${g.key.toLowerCase()}`}><header><div><h3>{g.title}</h3><p>{g.note}</p></div><span>{strategies.filter(s=>s.factor===g.key).length} 项</span></header><div className="strategy-methods">{METHODS.filter(m=>m.factor===g.key).map(m=>{const key=`${m.factor}-${m.method}`;const items=strategies.filter(s=>s.factor===m.factor&&s.method===m.method);return <article key={key} className={open===key?"open":""}><button className="strategy-method-head" onClick={()=>setOpen(open===key?null:key)}><span><strong>{m.label}</strong><small>{m.hint}</small></span><b>＋</b></button>{items.map(s=><div className="strategy-row" key={s.id}><span>{s.content}</span><select value={s.status} onChange={async e=>{await saveOldHabitStrategy({id:s.id,projectId:s.projectId,behaviorId:s.behaviorId,factor:s.factor,method:s.method,content:s.content,situation:s.situation,status:e.target.value,notes:s.notes});await onRefresh()}}><option value="idea">想到</option><option value="ready">准备实施</option><option value="set">已经设置</option><option value="observing">待观察</option><option value="effective">有效</option><option value="adjust">需调整</option><option value="retired">不再使用</option></select><button className="danger-icon" title="删除对策" onClick={async()=>{await deleteOldHabitStrategy(s.id);await onRefresh()}}>⌫</button></div>)}{open===key&&<div className="strategy-editor"><textarea autoFocus value={content} onChange={e=>setContent(e.target.value)} placeholder="写下一个具体、可执行的改造"/><input value={situation} onChange={e=>setSituation(e.target.value)} placeholder="针对的提示或情境（非必填）"/><button className="primary" onClick={()=>add(m.factor,m.method)}>添加</button></div>}</article>})}</div></section>)}</div>{strategies.length>0&&<section className="first-setup-summary"><div><h3>首次布置清单</h3><p>优先完成可以立即改变环境的事项；设置完成后再到现实情境中观察。</p></div><div className="setup-status-counts"><span>准备实施 {strategies.filter(s=>s.status==="ready").length}</span><span>已经设置 {strategies.filter(s=>s.status==="set").length}</span><span>待观察 {strategies.filter(s=>s.status==="observing").length}</span></div></section>}<div className="primary-action-row"><button className="primary" onClick={onObserve}>完成当前布置，开始观察 →</button></div></div>
}

function Observe({project,active,observations,onRefresh,onReplace,onAchieved}:{project:OldHabitProject;active:OldHabitBehavior|null;observations:OldHabitObservation[];onRefresh:()=>Promise<void>;onReplace:()=>void;onAchieved:()=>Promise<void>}){
  const [result,setResult]=useState("");const [prompt,setPrompt]=useState("");const [isNew,setIsNew]=useState<boolean|undefined>();const [gap,setGap]=useState("");const [adjustment,setAdjustment]=useState("");const [adjustmentMethod,setAdjustmentMethod]=useState("remove");const [feeling,setFeeling]=useState("");
  if(!active)return <EmptyFocus/>;
  async function save(){if(!result)return;await saveOldHabitObservation({projectId:project.id,behaviorId:active!.id,result,prompt,isNewPrompt:isNew,uncoveredSituation:gap,adjustment,feeling});if(adjustment.trim()){await saveOldHabitStrategy({projectId:project.id,behaviorId:active!.id,factor:"P",method:adjustmentMethod,content:adjustment.trim(),situation:prompt||gap,status:"idea"})}setResult("");setPrompt("");setIsNew(undefined);setGap("");setAdjustment("");setFeeling("");await onRefresh()}
  return <div className="old-stage-content"><p className="lead">记录这一次发生了什么。无需连续打卡，也没有“失败”。</p><div className="observation-choices">{Object.entries(RESULTS).map(([k,l])=><button key={k} className={result===k?"selected":""} onClick={()=>setResult(k)}>{l}</button>)}</div>
    {result==="happened"&&<div className="conditional-card"><div className="compact-grid"><label>当时出现了什么提示？<input value={prompt} onChange={e=>setPrompt(e.target.value)}/></label><label>这个提示<select value={isNew===undefined?"":isNew?"new":"known"} onChange={e=>setIsNew(e.target.value?e.target.value==="new":undefined)}><option value="">暂不判断</option><option value="known">已经知道</option><option value="new">新发现</option></select></label><label>哪个情境还没覆盖？<input value={gap} onChange={e=>setGap(e.target.value)}/></label><label>补充到哪个提示对策？<select value={adjustmentMethod} onChange={e=>setAdjustmentMethod(e.target.value)}><option value="remove">移除提示</option><option value="avoid">规避提示</option><option value="ignore">忽略提示</option></select></label><label className="span-2">准备补充哪项对策？<input value={adjustment} onChange={e=>setAdjustment(e.target.value)}/></label></div></div>}
    {result&&<details className="optional-panel"><summary>补充感受或发现（非必填）</summary><textarea value={feeling} onChange={e=>setFeeling(e.target.value)} placeholder="当时的感受、阻力或新发现"/></details>}
    {result&&<div className="primary-action-row"><button className="primary" onClick={save}>保存这次观察</button></div>}
    <details className="history-panel"><summary>观察历史 · {observations.length}</summary><div className="observation-history">{observations.map(o=><article key={o.id}><strong>{RESULTS[o.result]}</strong><time>{new Date(o.observedAt).toLocaleString()}</time>{o.prompt&&<p>提示：{o.prompt}{o.isNewPrompt?" · 新发现":""}</p>}{o.adjustment&&<p>调整：{o.adjustment}</p>}{o.feeling&&<p>{o.feeling}</p>}</article>)}</div></details>
    <div className="secondary-actions"><button onClick={onAchieved}>当前具体行为已达到目标</button><button onClick={onReplace}>需要时设计替代行为 →</button></div></div>
}

function Replace({project,active,replacement,onRefresh,onOpenHabit}:{project:OldHabitProject;active:OldHabitBehavior|null;replacement:OldHabitReplacement|null;onRefresh:()=>Promise<void>;onOpenHabit:(id:number)=>void}){
  const [oldPrompt,setOldPrompt]=useState(replacement?.oldPrompt||"");const [newBehavior,setNewBehavior]=useState(replacement?.newBehavior||"");const [celebration,setCelebration]=useState(replacement?.celebration||"");const [notes,setNotes]=useState(replacement?.notes||"");const [lowerOld,setLowerOld]=useState(replacement?.lowerOldMotivation||"");const [harderOld,setHarderOld]=useState(replacement?.harderOldBehavior||"");const [raiseNew,setRaiseNew]=useState(replacement?.raiseNewMotivation||"");const [easierNew,setEasierNew]=useState(replacement?.easierNewBehavior||"");
  useEffect(()=>{setOldPrompt(replacement?.oldPrompt||"");setNewBehavior(replacement?.newBehavior||"");setCelebration(replacement?.celebration||"");setNotes(replacement?.notes||"");setLowerOld(replacement?.lowerOldMotivation||"");setHarderOld(replacement?.harderOldBehavior||"");setRaiseNew(replacement?.raiseNewMotivation||"");setEasierNew(replacement?.easierNewBehavior||"")},[replacement?.id]);
  if(!active)return <EmptyFocus/>;
  const payload=()=>({projectId:project.id,behaviorId:active!.id,oldPrompt,newBehavior,celebration,rehearsalCount:replacement?.rehearsalCount||0,notes,lowerOldMotivation:lowerOld,harderOldBehavior:harderOld,raiseNewMotivation:raiseNew,easierNewBehavior:easierNew,status:"designing"});
  async function save(){await saveOldHabitReplacement(payload());await onRefresh()}
  async function rehearse(){const saved=await saveOldHabitReplacement({...payload(),rehearsalCount:(replacement?.rehearsalCount||0)+1,status:"rehearsing"});await onRefresh();return saved}
  return <div className="old-stage-content"><p className="lead">只有需要时才替代。新行为应回应同一提示下的真实需要，并且足够有吸引力、足够容易。</p><div className="replacement-flow"><label><span>旧提示</span><input value={oldPrompt} onChange={e=>setOldPrompt(e.target.value)} placeholder="什么时候会触发旧行为"/></label><b>→</b><label><span>新行为</span><input value={newBehavior} onChange={e=>setNewBehavior(e.target.value)} placeholder="改做一个具体的新行为"/></label><b>→</b><label><span>庆祝</span><input value={celebration} onChange={e=>setCelebration(e.target.value)} placeholder="立即创造成功感"/></label></div><details className="optional-panel"><summary>旧、新行为的四方向调整（按需）</summary><div className="compact-grid"><label>降低旧行为动机<input value={lowerOld} onChange={e=>setLowerOld(e.target.value)}/></label><label>让旧行为更难<input value={harderOld} onChange={e=>setHarderOld(e.target.value)}/></label><label>提高新行为动机<input value={raiseNew} onChange={e=>setRaiseNew(e.target.value)}/></label><label>让新行为更容易<input value={easierNew} onChange={e=>setEasierNew(e.target.value)}/></label></div></details><details className="optional-panel"><summary>替代实验笔记（非必填）</summary><textarea value={notes} onChange={e=>setNotes(e.target.value)}/></details><div className="primary-action-row"><button onClick={save}>保存替代方案</button><button onClick={rehearse}>演练一次 · {replacement?.rehearsalCount||0}</button></div>
    <section className="linked-habit-choice"><h3>需要完整培养这个新行为？</h3><p>可以把替代行为创建成正常的七步长期习惯，当前替代方案仍会保留。</p>{replacement?.linkedHabitProjectId?<button className="primary" onClick={()=>onOpenHabit(replacement.linkedHabitProjectId!)}>打开长期习惯 →</button>:<button className="primary" disabled={!newBehavior.trim()} onClick={async()=>{await save();const id=await createReplacementHabitProject(active.id);onOpenHabit(id)}}>创建长期习惯 →</button>}</section></div>
}

function EmptyFocus(){return <div className="empty-focus"><strong>先选择一个具体旧行为</strong><p>回到“拆解旧习惯”，从最容易、最有把握的一项开始。</p></div>}
