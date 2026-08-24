import { useEffect, useState } from "react";
import { backup, deleteBackup, exportAll, importJson, listBackups, restoreBackup, saveExport } from "../api/backups";
import { hasPasscode, setPasscode } from "../api/applock";
import { deletePersonalReference, listPersonalReferences, savePersonalReference } from "../api/design";
import type { BackupRecord, PersonalReferenceItem, ReferenceKind } from "../types";
import { requiresDeleteNameConfirmation, setRequiresDeleteNameConfirmation } from "../uiPreferences";
import UiIcon from "../components/UiIcon";

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

  async function refresh() {
    setBackups(await listBackups());
    setLockSet(await hasPasscode());
    setReferences(await listPersonalReferences());
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

  return (
    <div className="data-shell">
      <header className="data-topbar">
        <button className="icon-action" onClick={onBack} title="返回首页" aria-label="返回首页"><UiIcon name="back" /></button>
        <div><strong>数据与隐私</strong><span>备份、迁移和应用锁</span></div>
      </header>

      <main className="data-main">
        <section className="data-intro">
          <div><h1>你的行为记录，由你自己保管</h1><p>这里处理备份、迁移与访问保护。导出的 JSON 可以直接阅读，也可以在另一台设备重新导入。</p></div>
          <blockquote><strong>山田凉</strong><p>备份就是给下一次排练留底稿。真的要换设备时，再把整份记录带走。</p></blockquote>
          <img src="/themes/kessoku/ryo.png" alt="山田凉" />
        </section>

        {msg && <p className="data-message" role="status">{msg}</p>}

        <div className="data-dashboard">
          <section className="data-panel data-backup">
            <div className="data-panel-heading"><div><small>01</small><h2>留下可恢复的版本</h2></div><button className="primary compact" onClick={doBackup}>立即备份</button></div>
            <p>每次备份都保存完整快照，系统只保留最近 7 份。</p>
            <ul className="data-backup-list">
              {backups.map((b) => (
                <li key={b.id}>
                  <span><strong>{(b.createdAt ?? "").slice(0, 10)}</strong>{(b.createdAt ?? "").slice(11, 19)} · {b.contentSummary ?? "完整快照"}</span>
                  <div className="inline-actions"><button onClick={() => doRestore(b.id)}>恢复</button><button className="danger-text" onClick={() => removeBackup(b.id)}>删除</button></div>
                </li>
              ))}
              {backups.length === 0 && <li className="data-empty">还没有备份。完成第一轮设计后，可以在这里留下一份恢复点。</li>}
            </ul>
          </section>

          <section className="data-panel data-transfer">
            <div className="data-panel-heading"><div><small>02</small><h2>迁移整份记录</h2></div></div>
            <p>导出会生成一份 JSON 文件；导入前不会自动覆盖现有内容。</p>
            <button onClick={doExportAll}>导出全部数据</button>
            <label className="data-file-input"><span>选择 JSON 文件</span><input type="file" accept=".json,application/json" onChange={onImportFile} /></label>
          </section>

          <section className="data-panel data-preferences">
            <div className="data-panel-heading"><div><small>03</small><h2>操作保护</h2></div></div>
            <label className="settings-toggle">
              <input type="checkbox" checked={requireDeleteName} onChange={(event) => {
                const value = event.target.checked;
                setRequireDeleteName(value);
                setRequiresDeleteNameConfirmation(value);
              }} />
              <span><strong>删除项目前核对名称</strong><small>避免在项目列表中误删长期记录</small></span>
            </label>
            <div className="data-lock">
              <strong>应用锁</strong>
              {lockSet ? (
                <><p>已经设置密码，启动应用时需要验证。</p><button onClick={doClearPasscode}>清除密码</button></>
              ) : (
                <form className="anchor-form" onSubmit={(event) => { event.preventDefault(); void doSetPasscode(); }}><input type="password" autoComplete="new-password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="输入新密码" /><button type="submit">设置密码</button></form>
              )}
            </div>
          </section>

          <section className="data-panel data-library">
            <div className="data-panel-heading"><div><small>04</small><h2>我的参考库</h2></div></div>
            <p>保存你亲自验证过的行为、锚点、庆祝方式和成熟配方。它们不会改动内置资料。</p>
            <div className="personal-library-editor field-grid">
              <label>类型<select value={referenceKind} onChange={(event) => setReferenceKind(event.target.value as ReferenceKind)}>{Object.entries(REFERENCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>内容<input value={referenceText} onChange={(event) => setReferenceText(event.target.value)} onKeyDown={(event) => event.key === "Enter" && saveReference()} placeholder="例如：放回餐具后走到楼梯口" /></label>
              <div className="field-span-2 form-actions"><button onClick={() => { setEditingReference(null); setReferenceText(""); }}>清空</button><button className="primary compact" onClick={saveReference}>{editingReference ? "保存修改" : "加入参考库"}</button></div>
            </div>
            <div className="library-grid">
              {references.map((item) => <article key={item.id} className="library-card"><small>{REFERENCE_LABELS[item.kind]}</small><p>{item.content}</p><div><button onClick={() => editReference(item)}>编辑</button><button onClick={() => removeReference(item.id)}>删除</button></div></article>)}
              {!references.length && <p className="data-empty">还没有个人条目。先完成一次设计，再把真正好用的句子带回来。</p>}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
