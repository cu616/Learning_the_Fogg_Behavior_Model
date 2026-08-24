import { mockIPC } from "@tauri-apps/api/mocks";
import type {
  Aspiration,
  BehaviorOptionV2,
  BranchAbility,
  BranchAnchor,
  BranchCelebration,
  BranchRecipeVersion,
  BranchTinyBehavior,
  FocusPlacementV2,
  GoldenBehaviorV2,
  HabitBranch,
  HabitProject,
  BackupRecord,
  OneTimeDiagnosisRound,
  OneTimeTask,
  OneTimeTaskEvent,
  OldHabitBehavior,
  OldHabitObservation,
  OldHabitProject,
  OldHabitReplacement,
  OldHabitStrategy,
  PersonalReferenceItem,
  SaveOneTimeDiagnosisInput,
  SaveOneTimeTaskInput,
  SaveOldHabitBehaviorInput,
  SaveOldHabitObservationInput,
  SaveOldHabitProjectInput,
  SaveOldHabitReplacementInput,
  SaveOldHabitStrategyInput,
} from "./types";

const now = new Date();
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

export function installDevMock() {
  const projects: HabitProject[] = [
    { id: 1, uuid: "demo-habit-1", name: "让白天更有精神", aspirationArea: "健康", phase: "designing", pausedAt: null, archivedAt: null, currentStep: 4, createdAt: ago(2600), updatedAt: ago(18) },
    { id: 2, uuid: "demo-habit-2", name: "睡前读一小段", aspirationArea: "阅读", phase: "experimenting", pausedAt: null, archivedAt: null, currentStep: 7, createdAt: ago(5800), updatedAt: ago(95) },
    { id: 3, uuid: "demo-habit-3", name: "下班后更快回到放松状态", aspirationArea: "休息", phase: "stable", pausedAt: null, archivedAt: null, currentStep: 7, createdAt: ago(9000), updatedAt: ago(510) },
  ];
  let aspiration: Aspiration = {
    id: 31,
    uuid: "demo-aspiration-1",
    projectId: 1,
    rawInput: "白天更有精神",
    inputType: "愿望",
    finalAspiration: "让白天更有精神",
    whyImportant: "希望工作结束后仍有精力留给自己",
    lifeDifference: "下午不再完全被疲惫拖走",
    notes: null,
    createdAt: ago(2500),
  };
  const behaviorOptions: BehaviorOptionV2[] = [
    { id: 101, uuid: "demo-behavior-1", projectId: 1, text: "午饭后走到窗边伸展一下", source: "用户", status: "活跃", notes: null, sortOrder: 1, swarmPosX: .2, swarmPosY: .3, swarmWidth: 210, swarmHeight: 94, createdAt: ago(2200) },
    { id: 102, uuid: "demo-behavior-2", projectId: 1, text: "打开电脑前喝一口水", source: "用户", status: "活跃", notes: null, sortOrder: 2, swarmPosX: .76, swarmPosY: .28, swarmWidth: 200, swarmHeight: 90, createdAt: ago(2180) },
    { id: 103, uuid: "demo-behavior-3", projectId: 1, text: "下午会议后站起来走十步", source: "用户", status: "活跃", notes: null, sortOrder: 3, swarmPosX: .72, swarmPosY: .72, swarmWidth: 220, swarmHeight: 94, createdAt: ago(2160) },
    { id: 104, uuid: "demo-behavior-4", projectId: 1, text: "把坚果放在桌面看得见的位置", source: "用户", status: "活跃", notes: null, sortOrder: 4, swarmPosX: .22, swarmPosY: .74, swarmWidth: 230, swarmHeight: 94, createdAt: ago(2140) },
  ];
  const focusPlacements: FocusPlacementV2[] = behaviorOptions.map((item, index) => ({
    behaviorOptionId: item.id,
    impact: [3, 2, 3, 1][index],
    feasibility: [3, 4, 2, 4][index],
    posX: [.72, .84, .58, .88][index],
    posY: [.74, .6, .78, .42][index],
    updatedAt: ago(2000 - index * 10),
  }));
  const goldenBehaviors: GoldenBehaviorV2[] = [
    { id: 201, uuid: "demo-golden-1", projectId: 1, behaviorOptionId: 101, behaviorText: "午饭后走到窗边伸展一下", reason: "想做，也容易做到", isActive: true, createdAt: ago(1900) },
  ];
  const branches: HabitBranch[] = [
    { id: 301, uuid: "demo-branch-1", projectId: 1, goldenBehaviorId: 201, behaviorOptionId: 101, behaviorText: "午饭后走到窗边伸展一下", name: "午后伸展方案", status: "designing", createdAt: ago(1800), updatedAt: ago(16) },
  ];
  let branchAbility: BranchAbility = {
    id: 401, uuid: "demo-ability-1", projectId: 1, branchId: 301,
    weakestLink: "体力", weakestDetails: "午后会觉得站起来都麻烦", simplificationMethods: "scale,entry",
    skillTarget: null, skillPlan: null, toolsNeeded: null, resourcesAvailable: null,
    createdAt: ago(1700), updatedAt: ago(60),
  };
  let branchTiny: BranchTinyBehavior = {
    id: 501, uuid: "demo-tiny-1", projectId: 1, branchId: 301,
    originalBehavior: "午饭后做一组完整伸展", tinyBehavior: "走到窗边，伸一次手臂", entryStep: "从椅子上站起来",
    baseline: "站起来并伸一次手臂", optionalExtension: "愿意的话再伸展一分钟",
    createdAt: ago(1600), updatedAt: ago(55),
  };
  const branchAnchors: BranchAnchor[] = [
    { id: 601, uuid: "demo-anchor-1", projectId: 1, branchId: 301, anchorText: "午饭结束后", lastAction: "把餐具放回去", location: "办公室", frequency: "工作日", source: "用户", isSelected: true, createdAt: ago(1500) },
  ];
  const branchCelebrations: BranchCelebration[] = [
    { id: 701, uuid: "demo-celebration-1", projectId: 1, branchId: 301, celebrationText: "轻轻握拳说：这一拍接上了", naturalness: 4, successFeeling: 4, source: "用户", isSelected: true, createdAt: ago(1400) },
  ];
  const branchRecipe: BranchRecipeVersion = {
    id: 801, uuid: "demo-recipe-1", projectId: 1, branchId: 301, versionNumber: 1,
    anchorLastAction: "把餐具放回去", behaviorText: "站起来并伸一次手臂", celebrationText: "轻轻握拳说：这一拍接上了",
    fullRecipeText: "在我把餐具放回去之后，我会站起来并伸一次手臂，然后轻轻握拳说：这一拍接上了。",
    rehearsalCount: 3, rehearsalFeeling: "自然", status: "active", createdAt: ago(1300),
  };
  const oneTimeTasks: OneTimeTask[] = [
    { id: 11, uuid: "demo-task-1", title: "提交报销材料", completionStandard: "系统显示已提交", nextAction: "打开报销系统并登录", currentIntent: "now", currentRoute: "capture", status: "in_progress", createdAt: ago(1400), updatedAt: ago(7) },
    { id: 12, uuid: "demo-task-2", title: "预约年度检查", completionStandard: "", nextAction: "找到医院预约入口", currentRoute: "capture", status: "draft", createdAt: ago(1600), updatedAt: ago(180) },
  ];
  const diagnoses: OneTimeDiagnosisRound[] = [];
  const events: OneTimeTaskEvent[] = [
    { id: 1, uuid: "demo-event-1", taskId: 11, eventType: "created", notes: "浏览器演示数据", createdAt: ago(1400) },
  ];
  const oldHabitProjects: OldHabitProject[] = [
    { id: 21, uuid: "demo-old-1", title: "减少睡前刷手机", generalHabit: "睡前长时间刷手机", preparationMode: "skip", preparationNote: "先处理最常出现、最容易辨认的一种刷手机行为。", currentStage: "observe", status: "observing", createdAt: ago(7200), updatedAt: ago(42) },
  ];
  const oldHabitBehaviors: OldHabitBehavior[] = [
    { id: 2101, uuid: "demo-old-behavior-1", projectId: 21, behaviorText: "躺到床上后打开短视频", typicalTime: "准备睡觉时", typicalPlace: "卧室", people: "独处", context: "手机还放在枕边", selectionReason: "提示清楚，也最容易先调整环境", goalType: "duration", goalValue: "每次不超过 10 分钟", status: "observing", sortOrder: 1, posX: .72, posY: .36, cardWidth: 230, cardHeight: 94, createdAt: ago(7000), updatedAt: ago(36) },
    { id: 2102, uuid: "demo-old-behavior-2", projectId: 21, behaviorText: "半夜醒来后查看消息", typicalTime: "半夜醒来", typicalPlace: "卧室", context: "手机亮屏", goalType: "stop", goalValue: "夜间不打开消息", status: "queued", sortOrder: 2, posX: .25, posY: .68, cardWidth: 220, cardHeight: 90, createdAt: ago(6900), updatedAt: ago(120) },
  ];
  const oldHabitStrategies: OldHabitStrategy[] = [
    { id: 2201, uuid: "demo-old-strategy-1", projectId: 21, behaviorId: 2101, factor: "P", method: "remove", content: "睡前把手机放到卧室门外充电", situation: "躺到床上时", status: "observing", createdAt: ago(500), updatedAt: ago(35) },
    { id: 2202, uuid: "demo-old-strategy-2", projectId: 21, behaviorId: 2101, factor: "A", method: "brain", content: "退出短视频账号并关闭自动登录", status: "set", createdAt: ago(450), updatedAt: ago(34) },
  ];
  const oldHabitObservations: OldHabitObservation[] = [
    { id: 2301, uuid: "demo-old-observation-1", projectId: 21, behaviorId: 2101, result: "reduced", prompt: "躺下后下意识摸手机", isNewPrompt: false, adjustment: "充电线固定留在门外", feeling: "拿不到手机后更容易直接休息", observedAt: ago(60), createdAt: ago(58) },
  ];
  let oldHabitReplacement: OldHabitReplacement | null = null;
  const backups: BackupRecord[] = [];
  const personalReferences: PersonalReferenceItem[] = [];
  let devPasscode = "";

  mockIPC((cmd, rawArgs) => {
    const args = (rawArgs || {}) as Record<string, unknown>;
    if (cmd === "has_passcode") return Boolean(devPasscode);
    if (cmd === "set_passcode") { devPasscode = String(args.passcode || ""); return null; }
    if (cmd === "list_projects") return projects.map((item) => ({ ...item }));
    if (cmd === "get_project") {
      const project = projects.find((item) => item.id === Number(args.id));
      if (!project) throw new Error("没有找到这个长期习惯项目");
      return { ...project };
    }
    if (cmd === "set_project_step") {
      const project = projects.find((item) => item.id === Number(args.id));
      if (!project) throw new Error("没有找到这个长期习惯项目");
      project.currentStep = Number(args.step);
      project.updatedAt = new Date().toISOString();
      return { ...project };
    }
    if (cmd === "get_aspiration") return Number(args.projectId) === 1 ? { ...aspiration } : null;
    if (cmd === "save_aspiration") {
      aspiration = { ...aspiration, ...args, projectId: Number(args.projectId) };
      return { ...aspiration };
    }
    if (cmd === "list_behavior_options_v2") return Number(args.projectId) === 1 ? behaviorOptions.map((item) => ({ ...item })) : [];
    if (cmd === "list_focus_placements_v2") return Number(args.projectId) === 1 ? focusPlacements.map((item) => ({ ...item })) : [];
    if (cmd === "list_golden_behaviors") return Number(args.projectId) === 1 ? goldenBehaviors.map((item) => ({ ...item })) : [];
    if (cmd === "list_habit_branches") return Number(args.projectId) === 1 ? branches.map((item) => ({ ...item })) : [];
    if (cmd === "create_habit_branch") {
      const goldenBehavior = goldenBehaviors.find((item) => item.id === Number(args.goldenBehaviorId));
      const createdAt = new Date().toISOString();
      const id = Math.max(300, ...branches.map((item) => item.id)) + 1;
      const branch: HabitBranch = {
        id,
        uuid: `demo-branch-${id}`,
        projectId: Number(args.projectId),
        goldenBehaviorId: goldenBehavior?.id ?? null,
        behaviorOptionId: goldenBehavior?.behaviorOptionId ?? null,
        behaviorText: goldenBehavior?.behaviorText ?? "尚未选择黄金行为",
        name: String(args.name || `微习惯方案 ${branches.length + 1}`),
        status: "designing",
        createdAt,
        updatedAt: createdAt,
      };
      branches.push(branch);
      return { ...branch };
    }
    if (cmd === "update_habit_branch") {
      const branch = branches.find((item) => item.id === Number(args.branchId));
      if (!branch) throw new Error("没有找到这个微习惯方案");
      if (typeof args.name === "string" && args.name.trim()) branch.name = args.name.trim();
      if (typeof args.status === "string" && args.status) branch.status = args.status as HabitBranch["status"];
      branch.updatedAt = new Date().toISOString();
      return { ...branch };
    }
    if (cmd === "delete_habit_branch") {
      const index = branches.findIndex((item) => item.id === Number(args.branchId));
      if (index < 0) throw new Error("没有找到这个微习惯方案");
      branches.splice(index, 1);
      return "浏览器演示方案已删除";
    }
    if (cmd === "get_branch_ability") return Number(args.branchId) === 301 ? { ...branchAbility } : null;
    if (cmd === "get_branch_tiny") return Number(args.branchId) === 301 ? { ...branchTiny } : null;
    if (cmd === "list_branch_anchors") return Number(args.branchId) === 301 ? branchAnchors.map((item) => ({ ...item })) : [];
    if (cmd === "list_branch_celebrations") return Number(args.branchId) === 301 ? branchCelebrations.map((item) => ({ ...item })) : [];
    if (cmd === "get_active_branch_recipe") return Number(args.branchId) === 301 ? { ...branchRecipe } : null;
    if (cmd === "list_branch_recipe_versions") return Number(args.branchId) === 301 ? [{ ...branchRecipe }] : [];
    if (cmd === "list_branch_practice_events") return [];
    if (cmd === "list_personal_references") return personalReferences.filter((item) => !args.kind || item.kind === args.kind).map((item) => ({ ...item }));
    if (cmd === "save_personal_reference") {
      const nowIso = new Date().toISOString();
      const id = Number(args.id) || Math.max(0, ...personalReferences.map((item) => item.id)) + 1;
      const item: PersonalReferenceItem = {
        id, uuid: `demo-reference-${id}`, kind: args.kind as PersonalReferenceItem["kind"],
        title: args.title ? String(args.title) : null, content: String(args.content || ""),
        structuredContent: args.structuredContent ? String(args.structuredContent) : null,
        category: args.category ? String(args.category) : null, tags: args.tags ? String(args.tags) : null,
        source: String(args.source || "用户"), createdAt: nowIso, updatedAt: nowIso,
      };
      const index = personalReferences.findIndex((entry) => entry.id === id);
      if (index >= 0) personalReferences[index] = { ...personalReferences[index], ...item, createdAt: personalReferences[index].createdAt };
      else personalReferences.unshift(item);
      return { ...(index >= 0 ? personalReferences[index] : item) };
    }
    if (cmd === "delete_personal_reference") {
      const index = personalReferences.findIndex((item) => item.id === Number(args.id));
      if (index >= 0) personalReferences.splice(index, 1);
      return null;
    }
    if (cmd === "list_one_time_tasks") return oneTimeTasks.filter((item) => args.includeArchived || !item.archivedAt).map((item) => ({ ...item }));
    if (cmd === "get_one_time_task") {
      const task = oneTimeTasks.find((item) => item.id === Number(args.taskId));
      if (!task) throw new Error("没有找到这条一次性行为");
      return { ...task };
    }
    if (cmd === "create_one_time_task") {
      const title = String(args.title || "").trim();
      const id = Math.max(0, ...oneTimeTasks.map((item) => item.id)) + 1;
      const task: OneTimeTask = { id, uuid: `demo-task-${id}`, title, nextAction: "", currentRoute: "capture", status: "draft", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      oneTimeTasks.unshift(task);
      return { ...task };
    }
    if (cmd === "save_one_time_task") {
      const input = args.input as SaveOneTimeTaskInput;
      const index = oneTimeTasks.findIndex((item) => item.id === input.id);
      if (index < 0) throw new Error("没有找到这条一次性行为");
      oneTimeTasks[index] = { ...oneTimeTasks[index], ...input, updatedAt: new Date().toISOString() };
      return { ...oneTimeTasks[index] };
    }
    if (cmd === "set_one_time_archived") {
      const task = oneTimeTasks.find((item) => item.id === Number(args.taskId));
      if (task) task.archivedAt = args.archived ? new Date().toISOString() : undefined;
      return null;
    }
    if (cmd === "list_one_time_diagnoses") return diagnoses.filter((item) => item.taskId === Number(args.taskId)).map((item) => ({ ...item }));
    if (cmd === "save_one_time_diagnosis") {
      const input = args.input as SaveOneTimeDiagnosisInput;
      const nowIso = new Date().toISOString();
      const round: OneTimeDiagnosisRound = {
        ...input,
        id: Math.max(0, ...diagnoses.map((item) => item.id)) + 1,
        uuid: `demo-diagnosis-${diagnoses.length + 1}`,
        roundNumber: diagnoses.filter((item) => item.taskId === input.taskId).length + 1,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      diagnoses.unshift(round);
      const task = oneTimeTasks.find((item) => item.id === input.taskId);
      if (task) {
        task.nextAction = input.updatedNextAction || task.nextAction;
        task.currentRoute = "action";
        task.updatedAt = nowIso;
      }
      return { ...round };
    }
    if (cmd === "list_one_time_events") return events.filter((item) => item.taskId === Number(args.taskId)).map((item) => ({ ...item }));
    if (cmd === "record_one_time_event") {
      events.unshift({ id: Math.max(0, ...events.map((item) => item.id)) + 1, uuid: `demo-event-${events.length + 1}`, taskId: Number(args.taskId), eventType: String(args.eventType || "event"), notes: args.notes ? String(args.notes) : undefined, createdAt: new Date().toISOString() });
      return null;
    }
    if (cmd === "convert_one_time_to_habit") return 1;
    if (cmd === "delete_one_time_task") {
      const index = oneTimeTasks.findIndex((item) => item.id === Number(args.taskId));
      if (index >= 0) oneTimeTasks.splice(index, 1);
      return "浏览器演示数据已删除";
    }
    if (cmd === "list_old_habit_projects") return oldHabitProjects.filter((item) => args.includeArchived || !item.archivedAt).map((item) => ({ ...item }));
    if (cmd === "get_old_habit_project") {
      const project = oldHabitProjects.find((item) => item.id === Number(args.projectId));
      if (!project) throw new Error("没有找到这个终止旧习惯项目");
      return { ...project };
    }
    if (cmd === "create_old_habit_project") {
      const id = Math.max(0, ...oldHabitProjects.map((item) => item.id)) + 1;
      const nowIso = new Date().toISOString();
      const project: OldHabitProject = { id, uuid: `demo-old-${id}`, title: String(args.title || "新的旧习惯项目"), generalHabit: "", preparationMode: "skip", currentStage: "prepare", status: "draft", createdAt: nowIso, updatedAt: nowIso };
      oldHabitProjects.unshift(project);
      return { ...project };
    }
    if (cmd === "save_old_habit_project") {
      const input = args.input as SaveOldHabitProjectInput;
      const index = oldHabitProjects.findIndex((item) => item.id === input.id);
      if (index < 0) throw new Error("没有找到这个终止旧习惯项目");
      oldHabitProjects[index] = { ...oldHabitProjects[index], ...input, updatedAt: new Date().toISOString() };
      return { ...oldHabitProjects[index] };
    }
    if (cmd === "set_old_habit_archived") {
      const project = oldHabitProjects.find((item) => item.id === Number(args.projectId));
      if (project) project.archivedAt = args.archived ? new Date().toISOString() : undefined;
      return null;
    }
    if (cmd === "delete_old_habit_project") {
      const index = oldHabitProjects.findIndex((item) => item.id === Number(args.projectId));
      if (index >= 0) oldHabitProjects.splice(index, 1);
      return "浏览器演示数据已删除";
    }
    if (cmd === "list_old_habit_behaviors") return oldHabitBehaviors.filter((item) => item.projectId === Number(args.projectId)).map((item) => ({ ...item }));
    if (cmd === "save_old_habit_behavior") {
      const input = args.input as SaveOldHabitBehaviorInput;
      const nowIso = new Date().toISOString();
      const id = Number(input.id) || Math.max(0, ...oldHabitBehaviors.map((item) => item.id)) + 1;
      const previous = oldHabitBehaviors.find((item) => item.id === id);
      const item: OldHabitBehavior = { ...input, id, uuid: previous?.uuid || `demo-old-behavior-${id}`, sortOrder: previous?.sortOrder || oldHabitBehaviors.filter((entry) => entry.projectId === input.projectId).length + 1, createdAt: previous?.createdAt || nowIso, updatedAt: nowIso };
      const index = oldHabitBehaviors.findIndex((entry) => entry.id === id);
      if (index >= 0) oldHabitBehaviors[index] = item; else oldHabitBehaviors.push(item);
      return { ...item };
    }
    if (cmd === "save_old_habit_behavior_layout") {
      const item = oldHabitBehaviors.find((entry) => entry.id === Number(args.behaviorId));
      if (item) Object.assign(item, { posX: Number(args.posX), posY: Number(args.posY), cardWidth: Number(args.cardWidth), cardHeight: Number(args.cardHeight), updatedAt: new Date().toISOString() });
      return null;
    }
    if (cmd === "focus_old_habit_behavior") {
      const projectId = Number(args.projectId); const behaviorId = Number(args.behaviorId);
      oldHabitBehaviors.filter((item) => item.projectId === projectId).forEach((item) => { if (item.status !== "achieved") item.status = item.id === behaviorId ? "observing" : "queued"; });
      const project = oldHabitProjects.find((item) => item.id === projectId);
      if (project) { project.currentStage = "strategies"; project.status = "active"; project.updatedAt = new Date().toISOString(); }
      return null;
    }
    if (cmd === "delete_old_habit_behavior") {
      const index = oldHabitBehaviors.findIndex((item) => item.id === Number(args.behaviorId));
      if (index >= 0) oldHabitBehaviors.splice(index, 1);
      return null;
    }
    if (cmd === "list_old_habit_strategies") return oldHabitStrategies.filter((item) => item.behaviorId === Number(args.behaviorId)).map((item) => ({ ...item }));
    if (cmd === "save_old_habit_strategy") {
      const input = args.input as SaveOldHabitStrategyInput; const nowIso = new Date().toISOString();
      const id = Number(input.id) || Math.max(0, ...oldHabitStrategies.map((item) => item.id)) + 1;
      const previous = oldHabitStrategies.find((item) => item.id === id);
      const item: OldHabitStrategy = { ...input, id, uuid: previous?.uuid || `demo-old-strategy-${id}`, createdAt: previous?.createdAt || nowIso, updatedAt: nowIso };
      const index = oldHabitStrategies.findIndex((entry) => entry.id === id);
      if (index >= 0) oldHabitStrategies[index] = item; else oldHabitStrategies.unshift(item);
      return { ...item };
    }
    if (cmd === "delete_old_habit_strategy") {
      const index = oldHabitStrategies.findIndex((item) => item.id === Number(args.strategyId));
      if (index >= 0) oldHabitStrategies.splice(index, 1);
      return null;
    }
    if (cmd === "list_old_habit_observations") return oldHabitObservations.filter((item) => item.behaviorId === Number(args.behaviorId)).map((item) => ({ ...item }));
    if (cmd === "save_old_habit_observation") {
      const input = args.input as SaveOldHabitObservationInput; const nowIso = new Date().toISOString();
      const id = Math.max(0, ...oldHabitObservations.map((item) => item.id)) + 1;
      const item: OldHabitObservation = { ...input, id, uuid: `demo-old-observation-${id}`, observedAt: input.observedAt || nowIso, createdAt: nowIso };
      oldHabitObservations.unshift(item);
      return { ...item };
    }
    if (cmd === "get_old_habit_replacement") return Number(args.behaviorId) === oldHabitReplacement?.behaviorId ? { ...oldHabitReplacement } : null;
    if (cmd === "save_old_habit_replacement") {
      const input = args.input as SaveOldHabitReplacementInput; const nowIso = new Date().toISOString();
      oldHabitReplacement = { ...input, id: oldHabitReplacement?.id || 2401, uuid: oldHabitReplacement?.uuid || "demo-old-replacement-1", linkedHabitProjectId: oldHabitReplacement?.linkedHabitProjectId, createdAt: oldHabitReplacement?.createdAt || nowIso, updatedAt: nowIso };
      return { ...oldHabitReplacement };
    }
    if (cmd === "create_replacement_habit_project") return 1;
    if (cmd === "list_backups") return backups.map((item) => ({ ...item }));
    if (cmd === "backup") {
      const record: BackupRecord = { id: Math.max(0, ...backups.map((item) => item.id)) + 1, projectId: null, backupType: "manual", filePath: "浏览器演示快照", contentSummary: "全部项目与实践记录", schemaVersion: 1, createdAt: new Date().toISOString() };
      backups.unshift(record); backups.splice(7);
      return { ...record };
    }
    if (cmd === "restore_backup") return null;
    if (cmd === "delete_backup") {
      const index = backups.findIndex((item) => item.id === Number(args.backupId));
      if (index >= 0) backups.splice(index, 1);
      return null;
    }
    if (cmd === "export_all") return JSON.stringify({ projects, oneTimeTasks, oldHabitProjects }, null, 2);
    if (cmd === "save_export") return `浏览器下载/${String(args.filename || "fogg-data.json")}`;
    if (cmd === "import_json") return "浏览器演示模式已读取文件；正式应用中会在确认后导入。";
    throw new Error(`Dev mock does not implement ${cmd}`);
  });
}
