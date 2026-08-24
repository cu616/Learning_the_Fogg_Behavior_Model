import { useEffect, useState } from "react";
import { backup, deleteBackup, exportAll, importJson, listBackups, restoreBackup, saveExport } from "../api/backups";
import { hasPasscode, setPasscode } from "../api/applock";
import { deletePersonalReference, listPersonalReferences, savePersonalReference } from "../api/design";
import type { BackupRecord, PersonalReferenceItem, ReferenceKind } from "../types";
import { requiresDeleteNameConfirmation, setRequiresDeleteNameConfirmation } from "../uiPreferences";
import { clearBackgroundPreference, loadBackgroundPreference, saveBackgroundPreference } from "../backgroundPreference";
import { getVisualTheme, setVisualTheme, type VisualTheme } from "../themePreference";

const REFERENCE_LABELS: Record<ReferenceKind, string> = {
  behavior: "行为灵感",
  recipe: "完整配方",
  anchor: "锚点模板",
  celebration: "庆祝方式",
  affirmation: "肯定语言",
};

export default function DataSettings({ onBack }: { onBack: () => void }) {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [msg, setMsg] = useState("");
  const [lockSet, setLockSet] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [references, setReferences] = useState<PersonalReferenceItem[]>([]);
  const [referenceKind, setReferenceKind] = useState<ReferenceKind>("behavior");
  const [referenceText, setReferenceText] = useState("");
  const [editingReference, setEditingReference] = useState<number | null>(null);
  const [requireDeleteName, setRequireDeleteName] = useState(requiresDeleteNameConfirmation);
  const [customBackground, setCustomBackground] = useState(false);
  const [visualTheme, setCurrentVisualTheme] = useState<VisualTheme>(getVisualTheme);

  async function refresh() {
    setBackups(await listBackups());
    setLockSet(await hasPasscode());
    setReferences(await listPersonalReferences());
    setCustomBackground(await loadBackgroundPreference());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function doBackup() {
    await backup();
    setMsg("已创建备份。");
    await refresh();
  }

  async function doRestore(id: number) {
    if (!window.confirm("恢复将覆盖当前数据，确定吗？")) return;
    await restoreBackup(id);
    setMsg("已恢复，当前数据已替换为所选备份。");
    await refresh();
  }

  async function removeBackup(id: number) {
    if (!window.confirm("永久删除这份本地备份及其快照文件吗？删除后不能再用它恢复。")) return;
    await deleteBackup(id);
    setMsg("已删除所选备份。");
    await refresh();
  }

  async function doExportAll() {
    const json = await exportAll();
    const path = await saveExport(`fogg-lab-all-${Date.now()}.json`, json);
    setMsg("已导出到 " + path);
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setMsg(await importJson(text));
    } catch (err) {
      setMsg("导入失败：" + String(err));
    }
    e.target.value = "";
  }

  async function doSetPasscode() {
    const p = newPass.trim();
    if (!p) {
      setMsg("密码不能为空。");
      return;
    }
    await setPasscode(p);
    setNewPass("");
    setLockSet(true);
    setMsg("已设置应用锁密码。");
  }

  async function doClearPasscode() {
    if (!window.confirm("确定清除应用锁密码？")) return;
    await setPasscode("");
    setLockSet(false);
    setMsg("已清除应用锁密码。");
  }

  async function saveReference() {
    const content = referenceText.trim();
    if (!content) return;
    await savePersonalReference({ id: editingReference, kind: referenceKind, title: content, content });
    setReferenceText(""); setEditingReference(null); setReferences(await listPersonalReferences());
    setMsg("已保存到我的参考库。");
  }

  function editReference(item: PersonalReferenceItem) {
    setEditingReference(item.id); setReferenceKind(item.kind); setReferenceText(item.content);
  }

  async function removeReference(id: number) {
    if (!window.confirm("从我的参考库删除这条内容？已有项目记录不会受影响。")) return;
    await deletePersonalReference(id); setReferences(await listPersonalReferences());
  }

  async function onBackgroundFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await saveBackgroundPreference(file);
      setCustomBackground(true);
      setMsg("已应用新的本地背景图片。");
    } catch (err) {
      setMsg("背景导入失败：" + String(err));
    }
    event.target.value = "";
  }

  async function restoreDefaultBackground() {
    await clearBackgroundPreference();
    setCustomBackground(false);
    setMsg("已恢复默认森林背景。");
  }

  function chooseTheme(theme: VisualTheme) {
    setCurrentVisualTheme(theme);
    setVisualTheme(theme);
    setMsg(theme === "kessoku" ? "已切换到孤独摇滚模式。" : "已切换到专业模式。");
  }

  return (
    <div className="app">
      <header className="topbar settings-topbar">
        <h1>本地数据管理</h1>
        <button className="icon-action" onClick={onBack} title="返回首页" aria-label="返回首页">↩</button>
      </header>

      <p className="hint">
        所有数据只保存在本机。你可以随时备份、恢复、导入或导出为可读的 JSON 文件。
      </p>

      {msg && <p className="golden">{msg}</p>}

      <section className="dm-section compact-preferences">
        <h3>操作偏好</h3>
        <label className="settings-toggle">
          <input type="checkbox" checked={requireDeleteName} onChange={(event) => {
            const value = event.target.checked;
            setRequireDeleteName(value);
            setRequiresDeleteNameConfirmation(value);
          }} />
          删除项目时输入完整名称
        </label>
      </section>

      <section className="dm-section appearance-settings">
        <h3>界面主题</h3>
        <p className="hint">两种主题共享同一套行为设计、记录和本地数据，切换只改变界面外观。</p>
        <div className="theme-choice-grid" role="group" aria-label="界面主题">
          <button type="button" className={`theme-choice theme-professional${visualTheme === "professional" ? " active" : ""}`} aria-pressed={visualTheme === "professional"} onClick={() => chooseTheme("professional")}>
            <span className="theme-preview" aria-hidden="true"><i /><i /><i /></span>
            <strong>专业模式</strong><small>森林玻璃 · 安静聚焦</small>
          </button>
          <button type="button" className={`theme-choice theme-kessoku${visualTheme === "kessoku" ? " active" : ""}`} aria-pressed={visualTheme === "kessoku"} onClick={() => chooseTheme("kessoku")}>
            <span className="theme-preview" aria-hidden="true"><i /><i /><i /></span>
            <strong>孤独摇滚模式</strong><small>漫画纸张 · 乐队四色</small>
          </button>
        </div>
      </section>

      <section className="dm-section appearance-settings">
        <h3>专业模式背景</h3>
        <p className="hint">默认使用森林风景，也可以导入本机 JPG、PNG 或 WebP。孤独摇滚模式使用自己的漫画背景；切回专业模式后仍会恢复这里的选择。</p>
        <div className="background-actions">
          <label className="file-button">选择图片<input type="file" accept="image/jpeg,image/png,image/webp" onChange={onBackgroundFile} /></label>
          <button disabled={!customBackground} onClick={restoreDefaultBackground}>恢复默认</button>
          <span className="hint">{customBackground ? "正在使用自定义背景" : "正在使用默认背景"}</span>
        </div>
      </section>

      <section className="dm-section">
        <h3>备份（自动保留最近 7 份）</h3>
        <button onClick={doBackup}>立即备份</button>
        <ul className="option-list">
          {backups.map((b) => (
            <li key={b.id}>
              <span>
                {(b.createdAt ?? "").slice(0, 19)} · {b.contentSummary ?? "完整快照"}
              </span>
              <div className="inline-actions"><button onClick={() => doRestore(b.id)}>恢复</button><button className="danger-text" onClick={() => removeBackup(b.id)}>删除</button></div>
            </li>
          ))}
          {backups.length === 0 && <li className="empty">还没有备份。</li>}
        </ul>
      </section>

      <section className="dm-section">
        <h3>导出 / 导入</h3>
        <button onClick={doExportAll}>导出全部数据（JSON）</button>
        <div className="import-row">
          <input type="file" accept=".json,application/json" onChange={onImportFile} />
          <span className="hint">选择一个之前导出的 JSON 文件导入</span>
        </div>
      </section>

      <section className="dm-section">
        <h3>我的参考库</h3>
        <p className="hint">这里是你自己积累的行为、锚点、庆祝、肯定语言和成熟配方。内置书中资料不会被修改。</p>
        <div className="personal-library-editor field-grid">
          <label>类型<select value={referenceKind} onChange={(event) => setReferenceKind(event.target.value as ReferenceKind)}>{Object.entries(REFERENCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>内容<input value={referenceText} onChange={(event) => setReferenceText(event.target.value)} onKeyDown={(event) => event.key === "Enter" && saveReference()} placeholder="添加一条属于自己的参考内容" /></label>
          <div className="field-span-2 form-actions"><button onClick={() => { setEditingReference(null); setReferenceText(""); }}>清空</button><button className="primary compact" onClick={saveReference}>{editingReference ? "保存" : "添加"}</button></div>
        </div>
        <div className="library-grid">
          {references.map((item) => <article key={item.id} className="library-card"><small>{REFERENCE_LABELS[item.kind]}</small><p>{item.content}</p><div><button onClick={() => editReference(item)}>编辑</button><button onClick={() => removeReference(item.id)}>删除</button></div></article>)}
          {!references.length && <p className="hint">还没有个人条目。你也可以在七步流程填写时顺手保存。</p>}
        </div>
      </section>

      <section className="dm-section">
        <h3>应用锁</h3>
        {lockSet ? (
          <>
            <p className="hint">已设置应用锁。启动时需输入密码。</p>
            <button onClick={doClearPasscode}>清除密码</button>
          </>
        ) : (
          <div className="anchor-form">
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="设置一个密码"
            />
            <button onClick={doSetPasscode}>设置密码</button>
          </div>
        )}
      </section>
    </div>
  );
}
