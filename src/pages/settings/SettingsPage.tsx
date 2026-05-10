import { useMemo, useState, type ReactNode } from 'react';
import { Bell, Calendar, ChevronRight, Cloud, Database, Download, FileText, Info, LayoutGrid, RefreshCw, RotateCcw, ShieldCheck, Star, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Ico } from '../../components/common/icons';
import { RiskNotice, Seg, Toggle } from '../../components/common/ui';
import type { SettingsPageProps } from '../pageTypes';
import { getCsvFilename } from '../../utils/csv';
import { CURRENCY_SYMBOL } from '../../utils/format';
import { createCurrencyDisplayContext, getDisplayCurrencySemanticHint } from '../../utils/currencyDisplay';
import { createExchangeRateReadinessSummary } from '../../utils/exchangeRatePolicy';
import { getRuleStatusSummary } from '../../rules/categoryRules';
import { FINANCE_STORAGE_KEY } from '../../store/financeStore';
import { getMigrationBackupStatus } from '../../store/migrationBackupStorage';
import { RELEASE_NOTES, createLocalBackupSummary, createRequiredUpdateProtectionSummary, createUpdateReminderBadge, createUpdateReminderPreference, createStoreLinks, createUpdateDiagnosticsText, createUpdateManifestSource, createVersionInfo, fetchRemoteUpdateManifest, getPrimaryReadyStoreLink, getStoreAvailabilitySummary, getUpdateManifestAvailabilitySummary, getUpdatePolicy, getUpdateReminderPreferenceSummary, getUpdateStatus, isUpdateReminderDue } from '../../utils/updateInfo';
import type { UpdateManifestFetchResult, UpdateReminderPreference } from '../../utils/updateInfo';
import { createSyncStatusSummary } from '../../utils/syncStatus';

type RowProps = {
  C: LucideIcon;
  label: string;
  right: ReactNode;
  noBorder?: boolean;
  onClick?: () => void;
  t: SettingsPageProps['t'];
  r: SettingsPageProps['r'];
  f: SettingsPageProps['f'];
};

type ManifestCheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | UpdateManifestFetchResult;

const UPDATE_REMINDER_STORAGE_KEY = 'expense-tracker-redo-update-reminder';

function Row({ C, label, right, noBorder = false, onClick, t, r, f }: RowProps) {
  return (
    <div className="hov" onClick={onClick} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderBottom: noBorder ? 'none' : `1px solid ${t.divider}`, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: r.icon, background: t.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Ico C={C} size={16} color={t.accent} sw={1.75} />
      </div>
      <span style={{ flex: 1, fontSize: '13px', color: t.primary, fontFamily: f.body }}>{label}</span>
      {right}
    </div>
  );
}

function Sec({ title, children, delay = 0, t, r }: { title: string; children: ReactNode; delay?: number; t: SettingsPageProps['t']; r: SettingsPageProps['r'] }) {
  return (
    <div style={{ marginBottom: '16px', opacity: 0, animation: `slideInL 0.3s ease ${delay}ms both` }}>
      <div style={{ fontSize: '10px', fontWeight: '600', color: t.secondary, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 14px', marginBottom: '5px' }}>{title}</div>
      <div style={{ background: t.surface, borderRadius: r.card, border: `1px solid ${t.border}`, margin: '0 14px', overflow: 'hidden', boxShadow: t.cardShadow }}>{children}</div>
    </div>
  );
}

const CURRENCY_LABEL: Record<SettingsPageProps['currency'], string> = CURRENCY_SYMBOL;

export function SettingsPage({ t, r, f, style, setStyle, mode, setMode, currency, setCurrency, monthStartDay, setMonthStartDay, billReminder, setBillReminder, iCloudBackup, setICloudBackup, exportCategories, getCsvExportCount, onExportCsv, lastCsvExport, onClearAllData, onRateApp, requiredUpdateProtectionActive = false, onRequiredUpdateProtectionChange, updateManifestSourceOverride }: SettingsPageProps) {
  const [exportScope, setExportScope] = useState<'month' | 'all' | 'category'>('month');
  const [selectedCategory, setSelectedCategory] = useState<SettingsPageProps['exportCategories'][number] | ''>('');
  const [picker, setPicker] = useState<'currency' | 'monthStart' | null>(null);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearArmed, setClearArmed] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);
  const [updateCheckOpen, setUpdateCheckOpen] = useState(false);
  const [manifestCheck, setManifestCheck] = useState<ManifestCheckState>({ status: 'idle' });
  const [updateReminderPreference, setUpdateReminderPreference] = useState<UpdateReminderPreference | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage?.getItem(UPDATE_REMINDER_STORAGE_KEY);
      return raw ? JSON.parse(raw) as UpdateReminderPreference : null;
    } catch {
      return null;
    }
  });
  const clearKeyword = 'CLEAR';
  const isClearKeywordMatched = clearConfirmText.trim().toUpperCase() === clearKeyword;
  const currencyContext = useMemo(() => createCurrencyDisplayContext(currency), [currency]);
  const currencySemanticHint = getDisplayCurrencySemanticHint(currencyContext);
  const exchangeRateSummary = useMemo(() => createExchangeRateReadinessSummary(currencyContext), [currencyContext]);
  const versionInfo = useMemo(() => createVersionInfo(), []);
  const localUpdateStatus = useMemo(() => getUpdateStatus(versionInfo), [versionInfo]);
  const storeLinks = useMemo(() => createStoreLinks(), []);
  const primaryReadyStoreLink = useMemo(() => getPrimaryReadyStoreLink(storeLinks), [storeLinks]);
  const storeSummary = useMemo(() => getStoreAvailabilitySummary(storeLinks), [storeLinks]);
  const updateManifestSource = useMemo(() => updateManifestSourceOverride ?? createUpdateManifestSource(), [updateManifestSourceOverride]);
  const updateManifestSummary = useMemo(() => getUpdateManifestAvailabilitySummary(updateManifestSource), [updateManifestSource]);
  const activeUpdateStatus = manifestCheck.status === 'success' ? manifestCheck.updateStatus : localUpdateStatus;
  const activeUpdateVersion = manifestCheck.status === 'success'
    ? manifestCheck.manifest?.latestVersion ?? RELEASE_NOTES[0]?.version ?? versionInfo.appVersion
    : RELEASE_NOTES[0]?.version ?? versionInfo.appVersion;
  const activeUpdatePolicy = useMemo(() => getUpdatePolicy(activeUpdateStatus.level), [activeUpdateStatus.level]);
  const requiredUpdateProtection = useMemo(() => createRequiredUpdateProtectionSummary(requiredUpdateProtectionActive ? getUpdatePolicy('required') : activeUpdatePolicy), [activeUpdatePolicy, requiredUpdateProtectionActive]);
  const manifestCheckSummary = manifestCheck.status === 'success' || manifestCheck.status === 'error' || manifestCheck.status === 'not-configured'
    ? manifestCheck.summary
    : updateManifestSummary;
  const updateReminderSummary = useMemo(() => getUpdateReminderPreferenceSummary(updateReminderPreference), [updateReminderPreference]);
  const updateReminderBadgeVersion = manifestCheck.status === 'success' ? activeUpdateVersion : updateReminderPreference?.version;
  const updateReminderBadge = useMemo(() => createUpdateReminderBadge(updateReminderPreference, updateReminderBadgeVersion), [updateReminderBadgeVersion, updateReminderPreference]);
  const ruleStatus = useMemo(() => getRuleStatusSummary(), []);
  const backupSummary = useMemo(() => createLocalBackupSummary(versionInfo), [versionInfo]);
  const backupStatus = useMemo(() => getMigrationBackupStatus({
    getItem: (key) => {
      if (typeof window === 'undefined' || typeof window.localStorage?.getItem !== 'function') return null;
      return window.localStorage.getItem(key);
    },
  }, FINANCE_STORAGE_KEY), []);
  const updateDiagnosticsText = useMemo(() => createUpdateDiagnosticsText({
    versionInfo,
    updateStatus: activeUpdateStatus,
    updatePolicy: activeUpdatePolicy,
    storeSummary,
    updateManifestSummary: manifestCheckSummary,
    backupStatusLabel: backupStatus.label,
    backupStatusDetail: backupStatus.detail,
    categoryRuleVersion: ruleStatus.categoryRuleVersion,
    noteSuggestionRuleVersion: ruleStatus.noteSuggestionRuleVersion,
  }), [activeUpdatePolicy, activeUpdateStatus, backupStatus.detail, backupStatus.label, manifestCheckSummary, ruleStatus.categoryRuleVersion, ruleStatus.noteSuggestionRuleVersion, storeSummary, versionInfo]);
  const allTransactionCount = useMemo(() => getCsvExportCount({ scope: 'all' }), [getCsvExportCount]);
  const syncStatus = useMemo(() => createSyncStatusSummary({
    localTransactionCount: allTransactionCount,
    lastCsvExport,
    iCloudBackup,
    backupStatus,
  }), [allTransactionCount, backupStatus, iCloudBackup, lastCsvExport]);

  const previewCount = useMemo(() => {
    if (exportScope === 'category' && !selectedCategory) return null;
    return getCsvExportCount({ scope: exportScope, category: exportScope === 'category' ? selectedCategory || undefined : undefined });
  }, [exportScope, selectedCategory, getCsvExportCount]);
  const canExport = previewCount !== null && previewCount > 0;
  const categoryOptions = useMemo(() => (selectedCategory && !exportCategories.includes(selectedCategory) ? [selectedCategory, ...exportCategories] : exportCategories), [exportCategories, selectedCategory]);
  const previewText = previewCount === null
    ? '請先選擇分類，系統會顯示可匯出筆數。'
    : previewCount === 0
      ? '目前範圍沒有可匯出的資料，請切換範圍後再試。'
      : `預計匯出 ${previewCount} 筆記錄。`;
  const scopeSummary = previewCount === null
    ? '尚未指定匯出範圍，請先選擇分類。'
    : exportScope === 'all'
      ? `目前會匯出全部交易，共 ${previewCount} 筆。`
      : exportScope === 'month'
        ? `目前會匯出當月全部交易，共 ${previewCount} 筆。`
        : `目前會匯出當月「${selectedCategory || '未選分類'}」交易，共 ${previewCount} 筆。`;
  const previewColor = previewCount === 0 ? t.negative : t.secondary;
  const selectedOptions = { scope: exportScope, category: exportScope === 'category' ? selectedCategory || undefined : undefined } as const;
  const filenamePreview = exportScope === 'category' && !selectedCategory
    ? null
    : getCsvFilename(selectedOptions);
  const lastScopeLabel = lastCsvExport
    ? lastCsvExport.options.scope === 'all'
      ? '全部交易'
      : lastCsvExport.options.scope === 'month'
        ? '當月交易'
        : '當月分類交易'
    : null;
  const lastCategoryLabel = lastCsvExport?.options.scope === 'category'
    ? lastCsvExport.options.category ?? '未指定'
    : '不限定';
  const lastConditionText = lastCsvExport
    ? `範圍 ${lastScopeLabel}｜分類 ${lastCategoryLabel}｜筆數 ${lastCsvExport.count}`
    : '';
  const updatePrimaryActionLabel = primaryReadyStoreLink && activeUpdatePolicy.level !== 'current'
    ? `開啟 ${primaryReadyStoreLink.label}`
    : activeUpdatePolicy.primaryAction;
  const updateCheckNoticeTitle = manifestCheck.status === 'checking'
    ? '正在查詢遠端 manifest'
    : manifestCheck.status === 'success'
      ? '已使用遠端 manifest'
      : manifestCheck.status === 'error'
        ? '遠端查詢失敗'
        : '目前是本機檢查';
  const remoteManifestStatusText = manifestCheck.status === 'checking'
    ? '查詢中'
    : manifestCheck.status === 'success'
      ? `遠端成功（latest ${manifestCheck.manifest?.latestVersion ?? '未知'}）`
      : manifestCheck.status === 'error'
        ? '遠端失敗，已回落本機'
        : updateManifestSource.status === 'ready'
          ? `已設定（${updateManifestSource.envKey}）`
          : `未設定（${updateManifestSource.envKey}）`;

  async function copyText(label: string, text: string) {
    if (!text) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement('textarea');
        input.value = text;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopyFeedback(`已複製${label}`);
      setTimeout(() => setCopyFeedback(''), 1800);
    } catch {
      setCopyFeedback(`複製${label}失敗，請手動複製`);
      setTimeout(() => setCopyFeedback(''), 2400);
    }
  }

  function handleOpenUpdateCheck() {
    setUpdateCheckOpen(true);

    if (updateManifestSource.status !== 'ready') {
      setManifestCheck({
        status: 'not-configured',
        source: updateManifestSource,
        updateStatus: localUpdateStatus,
        summary: updateManifestSummary,
      });
      return;
    }

    setManifestCheck({ status: 'checking' });
    void fetchRemoteUpdateManifest(updateManifestSource, versionInfo).then((result) => {
      setManifestCheck(result);
      const policy = getUpdatePolicy(result.updateStatus.level);
      if (policy.level === 'required' && !policy.canUseCoreApp) {
        onRequiredUpdateProtectionChange?.(true);
      }
    });
  }

  function persistUpdateReminderPreference(preference: UpdateReminderPreference) {
    setUpdateReminderPreference(preference);
    try {
      if (typeof window !== 'undefined') window.localStorage?.setItem(UPDATE_REMINDER_STORAGE_KEY, JSON.stringify(preference));
    } catch {
      // localStorage may be unavailable in private contexts; UI state still reflects this session.
    }
  }

  function snoozeUpdateReminderPreference() {
    const version = updateReminderPreference?.version ?? activeUpdateVersion;
    const preference = createUpdateReminderPreference(getUpdatePolicy('recommended'), version);
    if (!preference) return;
    persistUpdateReminderPreference(preference);
    setCopyFeedback('已再延後 24 小時提醒');
    setTimeout(() => setCopyFeedback(''), 1800);
  }

  function clearUpdateReminderPreference() {
    setUpdateReminderPreference(null);
    try {
      if (typeof window !== 'undefined') window.localStorage?.removeItem(UPDATE_REMINDER_STORAGE_KEY);
    } catch {
      // localStorage may be unavailable in private contexts; UI state still reflects this session.
    }
    setCopyFeedback('已清除更新提醒偏好');
    setTimeout(() => setCopyFeedback(''), 1800);
  }

  function handleUpdateSecondaryAction() {
    if (activeUpdatePolicy.level === 'required') {
      setUpdateCheckOpen(false);
      return;
    }

    const preference = createUpdateReminderPreference(activeUpdatePolicy, activeUpdateVersion);
    if (preference) {
      persistUpdateReminderPreference(preference);
      setCopyFeedback(preference.action === 'remind-later' ? '已設定稍後提醒' : '已略過此版本');
      setTimeout(() => setCopyFeedback(''), 1800);
    }
    setUpdateCheckOpen(false);
  }

  function handleUpdatePrimaryAction() {
    if (primaryReadyStoreLink?.url && activeUpdatePolicy.level !== 'current' && typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(primaryReadyStoreLink.url, '_blank', 'noopener,noreferrer');
      setUpdateCheckOpen(false);
      return;
    }

    setUpdateCheckOpen(false);
    if (activeUpdatePolicy.level === 'optional') setReleaseNotesOpen(true);
  }

  return (
    <div style={{ padding: '12px 0 80px' }}>
      {requiredUpdateProtection.active && (
        <Sec title="必要更新保護" t={t} r={r}>
          <div aria-label="必要更新保護狀態" style={{ padding: '12px 14px' }}>
            <RiskNotice
              ariaLabel="必要更新保護提醒"
              title={requiredUpdateProtection.title}
              body={requiredUpdateProtection.message}
              tone="warn"
              t={t}
              r={r}
            />
            <div style={{ display: 'grid', gap: '6px', marginTop: '10px', fontSize: '11px', color: t.secondary, lineHeight: 1.5 }}>
              <div><strong style={{ color: t.primary }}>保留：</strong>{requiredUpdateProtection.allowedActions.join('、')}</div>
              <div><strong style={{ color: t.primary }}>暫停：</strong>{requiredUpdateProtection.blockedActions.join('、')}</div>
            </div>
            <button
              className="press"
              aria-label="複製必要更新保護狀態"
              onClick={() => copyText('必要更新保護狀態', requiredUpdateProtection.copyText)}
              style={{ marginTop: '8px', border: `1px solid ${t.border}`, borderRadius: r.chip, padding: '6px 10px', background: t.surfaceAlt, color: t.primary, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              複製保護狀態
            </button>
          </div>
        </Sec>
      )}
      <Sec title="外觀" t={t} r={r}>
        <Row
          C={LayoutGrid}
          label="設計風格"
          t={t}
          r={r}
          f={f}
          right={
            <div style={{ display: 'flex', background: t.surfaceAlt, borderRadius: '8px', padding: '2px', gap: '2px' }}>
              {([
                ['minimal', '極簡白'],
                ['material', '質感設計'],
              ] as const).map(([id, lbl]) => (
                <button key={id} className="press" onClick={() => setStyle(id)} style={{ background: style === id ? t.chipActive : 'transparent', color: style === id ? t.chipActiveText : t.secondary, border: 'none', borderRadius: '6px', padding: '4px 9px', fontSize: '11px', cursor: 'pointer' }}>
                  {lbl}
                </button>
              ))}
            </div>
          }
        />
        <Row
          C={Star}
          label="暗黑模式"
          t={t}
          r={r}
          f={f}
          noBorder
          right={<Toggle on={mode === 'dark'} onToggle={() => setMode(mode === 'dark' ? 'light' : 'dark')} t={t} />}
        />
      </Sec>

      <Sec title="偏好設定" delay={60} t={t} r={r}>
        <Row C={Wallet} label="預設幣別" t={t} r={r} f={f} onClick={() => setPicker('currency')} right={<span style={{ fontSize: '12px', color: t.secondary }}>{CURRENCY_LABEL[currency]} <Ico C={ChevronRight} size={14} color={t.tertiary} sw={2} /></span>} />
        <div style={{ padding: '0 14px 10px', fontSize: '10px', color: t.secondary }}>{currencySemanticHint}</div>
        <div style={{ padding: '0 14px 10px' }}>
          <RiskNotice
            ariaLabel="匯率資料狀態"
            title={exchangeRateSummary.headline}
            body={exchangeRateSummary.detail}
            tone={exchangeRateSummary.conversionActive ? 'neutral' : 'warn'}
            t={t}
            r={r}
          />
        </div>
        <Row C={Calendar} label="每月起始日" t={t} r={r} f={f} onClick={() => setPicker('monthStart')} right={<span style={{ fontSize: '12px', color: t.secondary }}>{monthStartDay} 日 <Ico C={ChevronRight} size={14} color={t.tertiary} sw={2} /></span>} />
        <Row C={Bell} label="帳單提醒" t={t} r={r} f={f} noBorder right={<Toggle on={billReminder} onToggle={() => setBillReminder(!billReminder)} t={t} />} />
      </Sec>

      <Sec title="資料" delay={120} t={t} r={r}>
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${t.divider}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: r.icon, background: t.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico C={Download} size={16} color={t.accent} sw={1.75} />
            </div>
            <span style={{ flex: 1, fontSize: '13px', color: t.primary, fontFamily: f.body }}>匯出 CSV</span>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <Seg options={[['month', '當月'], ['all', '全部'], ['category', '分類']]} value={exportScope} onChange={(value) => setExportScope(value as 'month' | 'all' | 'category')} t={t} r={r} f={f} />
          </div>

          {exportScope === 'category' && (
            <select aria-label="CSV分類匯出分類" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as SettingsPageProps['exportCategories'][number] | '')} style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: r.input, padding: '8px 10px', fontSize: '12px', color: t.primary, marginBottom: '10px' }}>
              <option value="">請選擇分類</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

          <div aria-label="CSV匯出預覽" style={{ fontSize: '11px', color: previewColor, marginBottom: '10px', lineHeight: 1.45 }}>
            {previewText}
          </div>

          <div aria-label="CSV匯出範圍摘要" style={{ fontSize: '11px', color: t.primary, marginBottom: '10px', lineHeight: 1.45 }}>
            {scopeSummary}
          </div>

          <div aria-label="CSV匯出檔名預覽" style={{ fontSize: '11px', color: t.secondary, marginBottom: '10px', lineHeight: 1.45 }}>
            {filenamePreview ? `下載檔名：${filenamePreview}` : '下載檔名：請先選擇分類後產生檔名。'}
          </div>

          <div style={{ marginBottom: '10px' }}>
            <RiskNotice
              ariaLabel="CSV匯出提醒"
              title="匯出提醒"
              body="按下「匯出 CSV」後會立即產生下載檔案。匯出內容可能包含敏感資料，建議僅存放在可信任的位置。"
              t={t}
              r={r}
            />
          </div>

          <button
            className="press"
            disabled={!canExport}
            onClick={() => {
              if (!canExport) return;
              onExportCsv(selectedOptions);
            }}
            style={{
              width: '100%',
              border: 'none',
              borderRadius: r.input,
              padding: '9px 10px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: canExport ? 'pointer' : 'not-allowed',
              background: canExport ? t.chipActive : t.surfaceAlt,
              color: canExport ? t.chipActiveText : t.secondary,
              opacity: canExport ? 1 : 0.9,
            }}
          >
            匯出 CSV
          </button>

          {!canExport && (
            <div aria-label="CSV匯出引導" style={{ marginTop: '9px', border: `1px dashed ${t.divider}`, borderRadius: r.input, padding: '8px 10px', fontSize: '11px', color: t.secondary, lineHeight: 1.5 }}>
              {previewCount === null
                ? '請先選擇一個分類，或切到「當月 / 全部」快速匯出。'
                : exportScope === 'category'
                  ? '這個分類本月沒有資料，建議改選其他分類，或切到「當月」確認有哪些交易可匯出。'
                  : '目前沒有可匯出的交易，請先新增記錄再匯出。'}
            </div>
          )}

          {lastCsvExport && (
            <div aria-label="CSV匯出成功摘要" style={{ marginTop: '9px', border: `1px solid ${t.chipActive}`, borderRadius: r.input, padding: '9px 10px', background: t.accentSoft, fontSize: '11px', lineHeight: 1.5, color: t.primary }}>
              <div style={{ fontWeight: '700', marginBottom: '2px' }}>已完成匯出：{lastCsvExport.summary}</div>
              <div>條件：{lastConditionText}</div>
              <div>檔名：{lastCsvExport.filename}</div>
              <div>時間：{lastCsvExport.exportedAt}</div>
              <div style={{ marginTop: '7px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  className="press"
                  aria-label="複製CSV檔名"
                  onClick={() => copyText('檔名', lastCsvExport.filename)}
                  style={{ border: `1px solid ${t.border}`, borderRadius: r.chip, padding: '5px 9px', background: t.surface, color: t.primary, fontSize: '11px', cursor: 'pointer' }}
                >
                  複製檔名
                </button>
                <button
                  className="press"
                  aria-label="複製CSV匯出條件"
                  onClick={() => copyText('匯出條件', lastConditionText)}
                  style={{ border: `1px solid ${t.border}`, borderRadius: r.chip, padding: '5px 9px', background: t.surface, color: t.primary, fontSize: '11px', cursor: 'pointer' }}
                >
                  複製匯出條件
                </button>
              </div>
              {copyFeedback && (
                <div aria-label="CSV複製回饋" style={{ marginTop: '6px', color: t.secondary }}>
                  {copyFeedback}
                </div>
              )}
              <div style={{ marginTop: '4px', color: t.secondary }}>可直接使用下方按鈕，快速重跑上一筆匯出條件。</div>
              <button
                className="press"
                aria-label="再次匯出相同條件"
                onClick={() => onExportCsv(lastCsvExport.options)}
                style={{ marginTop: '8px', border: 'none', borderRadius: r.chip, padding: '6px 10px', background: t.chipActive, color: t.chipActiveText, fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
              >
                再次匯出相同條件
              </button>
            </div>
          )}
        </div>
        <Row C={Cloud} label="iCloud 備份（僅本機狀態）" t={t} r={r} f={f} right={<Toggle on={iCloudBackup} onToggle={() => setICloudBackup(!iCloudBackup)} t={t} />} />
        <div style={{ padding: '0 14px 10px 58px', borderBottom: `1px solid ${t.divider}` }}>
          <RiskNotice
            ariaLabel="iCloud備份提醒"
            title="備份狀態提醒"
            body="目前僅記錄「備份開關狀態」，尚未上傳任何資料到 iCloud。請勿視為已完成雲端備份。"
            t={t}
            r={r}
          />
        </div>
        <Row C={RotateCcw} label="清除所有資料" t={t} r={r} f={f} noBorder onClick={() => { setClearConfirmOpen(true); setClearArmed(false); setClearConfirmText(''); }} right={<Ico C={ChevronRight} size={14} color={t.tertiary} sw={2} />} />
      </Sec>


      <Sec title="同步狀態" delay={180} t={t} r={r}>
        <div aria-label="同步狀態中心" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: r.icon, background: t.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ico C={Database} size={16} color={t.accent} sw={1.75} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: t.primary, fontFamily: f.body, marginBottom: '4px' }}>{syncStatus.headline}</div>
              <div style={{ fontSize: '11px', color: t.secondary, lineHeight: 1.5 }}>{syncStatus.detail}</div>
            </div>
          </div>

          <div aria-label="同步狀態項目" style={{ display: 'grid', gap: '7px', marginTop: '10px' }}>
            {syncStatus.items.map((item) => {
              const toneColor = item.tone === 'ok' ? t.positive : item.tone === 'warn' ? t.warn : t.secondary;
              return (
                <div key={item.id} style={{ borderTop: `1px solid ${t.divider}`, paddingTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'baseline', marginBottom: '3px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: t.primary }}>{item.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: toneColor, textAlign: 'right' }}>{item.value}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: t.secondary, lineHeight: 1.45 }}>{item.detail}</div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '10px' }}>
            <RiskNotice
              ariaLabel="同步狀態提醒"
              title="同步限制"
              body="目前沒有真正的雲端同步；若要換機或送審前備份，請優先使用 CSV 匯出與本機復原點資訊。"
              tone="warn"
              t={t}
              r={r}
            />
          </div>

          <button
            className="press"
            aria-label="複製同步狀態"
            onClick={() => copyText('同步狀態', syncStatus.copyText)}
            style={{ marginTop: '8px', border: `1px solid ${t.border}`, borderRadius: r.chip, padding: '6px 10px', background: t.surfaceAlt, color: t.primary, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
          >
            複製同步狀態
          </button>
          {copyFeedback && (
            <div aria-label="同步狀態複製回饋" style={{ marginTop: '6px', fontSize: '11px', color: t.secondary }}>
              {copyFeedback}
            </div>
          )}
        </div>
      </Sec>

      <Sec title="關於" delay={240} t={t} r={r}>
        <Row C={Star} label="評分 App" t={t} r={r} f={f} onClick={onRateApp} right={<Ico C={ChevronRight} size={14} color={t.tertiary} sw={2} />} />
        <Row C={Info} label="版本資訊" t={t} r={r} f={f} right={<span style={{ fontSize: '12px', color: t.secondary }}>v{versionInfo.appVersion} · build {versionInfo.buildNumber}</span>} />
        <div style={{ padding: '0 14px 10px 58px', borderBottom: `1px solid ${t.divider}` }}>
          <div aria-label="App版本資訊摘要" style={{ display: 'grid', gap: '5px', fontSize: '11px', color: t.secondary, lineHeight: 1.45 }}>
            <div>資料 schema：v{versionInfo.schemaVersion}</div>
            <div>發佈通道：{versionInfo.releaseChannel}</div>
            <div>資料狀態：{versionInfo.lastDataUpdateLabel}</div>
          </div>
        </div>
        <Row C={FileText} label="更新內容" t={t} r={r} f={f} onClick={() => setReleaseNotesOpen(true)} right={<span style={{ fontSize: '12px', color: t.secondary }}>最近 {RELEASE_NOTES.length} 筆 <Ico C={ChevronRight} size={14} color={t.tertiary} sw={2} /></span>} />
        <Row
          C={RefreshCw}
          label="檢查更新"
          t={t}
          r={r}
          f={f}
          onClick={handleOpenUpdateCheck}
          right={
            <span aria-label="更新入口狀態" style={{ display: 'grid', gap: '2px', justifyItems: 'end', textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: activeUpdateStatus.level === 'current' ? t.secondary : t.accent }}>{activeUpdateStatus.label} <Ico C={ChevronRight} size={14} color={t.tertiary} sw={2} /></span>
              <span style={{ fontSize: '10px', color: updateReminderBadge.tone === 'accent' ? t.accent : updateReminderBadge.tone === 'warn' ? t.negative : t.secondary }}>{updateReminderBadge.label}</span>
            </span>
          }
        />
        <div style={{ padding: '0 14px 10px 58px', borderBottom: `1px solid ${t.divider}` }}>
          <RiskNotice ariaLabel="更新安全提醒" title="安全更新策略" body={backupSummary} t={t} r={r} />
        </div>
        <Row C={ShieldCheck} label="規則版本" t={t} r={r} f={f} right={<span style={{ fontSize: '12px', color: t.secondary }}>分類 {ruleStatus.categoryRuleVersion}</span>} />
        <div style={{ padding: '0 14px 10px 58px', borderBottom: `1px solid ${t.divider}` }}>
          <RiskNotice
            ariaLabel="分類規則版本狀態"
            title="分類與備註規則"
            body={`分類規則 ${ruleStatus.categoryRuleVersion}｜備註建議 ${ruleStatus.noteSuggestionRuleVersion}。${ruleStatus.protection}`}
            t={t}
            r={r}
          />
        </div>
        <Row C={ShieldCheck} label="更新保護" t={t} r={r} f={f} right={<span style={{ fontSize: '12px', color: backupStatus.exists ? t.accent : t.secondary }}>{backupStatus.label}</span>} />
        <div style={{ padding: '0 14px 10px 58px' }}>
          <RiskNotice
            ariaLabel="本機復原點狀態"
            title={backupStatus.label}
            body={`${backupStatus.detail} 使用者仍可隨時匯出 CSV 作為額外安全出口。`}
            tone={backupStatus.snapshot?.reason === 'corrupted-json' ? 'warn' : 'neutral'}
            t={t}
            r={r}
          />
          <button
            className="press"
            aria-label="複製更新診斷"
            onClick={() => copyText('更新診斷', updateDiagnosticsText)}
            style={{ marginTop: '8px', border: `1px solid ${t.border}`, borderRadius: r.chip, padding: '6px 10px', background: t.surfaceAlt, color: t.primary, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
          >
            複製更新診斷
          </button>
          {copyFeedback && (
            <div aria-label="更新診斷複製回饋" style={{ marginTop: '6px', fontSize: '11px', color: t.secondary }}>
              {copyFeedback}
            </div>
          )}
        </div>
      </Sec>

      {picker && (
        <div
          role="dialog"
          aria-label={picker === 'currency' ? '預設幣別選單' : '每月起始日選單'}
          style={{ position: 'fixed', inset: 0, background: t.modalOverlay, zIndex: 80, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setPicker(null)}
        >
          <div
            style={{ width: '100%', background: t.surface, borderTopLeftRadius: r.modal, borderTopRightRadius: r.modal, padding: '12px 14px 18px', maxHeight: '68vh', overflowY: 'auto', boxShadow: t.shadow }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '12px', fontWeight: '700', color: t.primary, marginBottom: '10px' }}>
              {picker === 'currency' ? '選擇預設幣別' : '選擇每月起始日'}
            </div>

            {picker === 'currency' ? (
              ([
                ['NTD', '新台幣 NT$'],
                ['USD', '美元 US$'],
                ['JPY', '日圓 JP¥'],
                ['EUR', '歐元 €'],
                ['HKD', '港幣 HK$'],
                ['CNY', '人民幣 CN¥'],
                ['GBP', '英鎊 £'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  className="press"
                  aria-label={`選擇幣別${value}`}
                  onClick={() => {
                    setCurrency(value);
                    setPicker(null);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: `1px solid ${currency === value ? t.accent : t.border}`,
                    background: currency === value ? t.accentSoft : t.inputBg,
                    color: t.primary,
                    borderRadius: r.input,
                    padding: '10px 12px',
                    fontSize: '13px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <button
                    key={day}
                    className="press"
                    aria-label={`選擇每月起始日${day}`}
                    onClick={() => {
                      setMonthStartDay(day);
                      setPicker(null);
                    }}
                    style={{
                      border: `1px solid ${monthStartDay === day ? t.accent : t.border}`,
                      background: monthStartDay === day ? t.accentSoft : t.inputBg,
                      color: t.primary,
                      borderRadius: r.chip,
                      padding: '8px 0',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {day} 日
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {clearConfirmOpen && (
        <div
          role="dialog"
          aria-label="清除所有資料確認"
          style={{ position: 'fixed', inset: 0, background: t.modalOverlay, zIndex: 90, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => { setClearConfirmOpen(false); setClearArmed(false); setClearConfirmText(''); }}
        >
          <div
            style={{ width: '100%', background: t.surface, borderTopLeftRadius: r.modal, borderTopRightRadius: r.modal, padding: '14px', boxShadow: t.shadow }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '14px', fontWeight: '700', color: t.primary, marginBottom: '6px' }}>確認清除所有資料？</div>
            <div style={{ marginBottom: '12px' }}>
              <RiskNotice
                ariaLabel="清除資料風險提醒"
                title="高風險操作"
                body="此操作會刪除交易、預算、目標、定期帳目與最近使用紀錄，且無法復原。"
                tone="warn"
                t={t}
                r={r}
              />
            </div>
            {clearArmed && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: t.primary, marginBottom: '6px' }}>
                  請輸入確認字串 <strong>{clearKeyword}</strong> 後才能執行清除。
                </div>
                <input
                  aria-label="清除資料確認字串"
                  value={clearConfirmText}
                  onChange={(e) => setClearConfirmText(e.target.value)}
                  placeholder={`請輸入 ${clearKeyword}`}
                  style={{ width: '100%', background: t.inputBg, border: `1px solid ${isClearKeywordMatched ? t.accent : t.inputBorder}`, borderRadius: r.input, padding: '8px 10px', fontSize: '12px', color: t.primary }}
                />
                {!isClearKeywordMatched && (
                  <div aria-label="清除資料確認字串提示" style={{ marginTop: '6px', fontSize: '11px', color: t.secondary }}>
                    字串不符合，請輸入 {clearKeyword}。
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="press" onClick={() => { setClearConfirmOpen(false); setClearArmed(false); setClearConfirmText(''); }} style={{ flex: 1, border: `1px solid ${t.border}`, borderRadius: r.input, padding: '9px 10px', background: t.surfaceAlt, color: t.primary, fontSize: '12px', cursor: 'pointer' }}>取消</button>
              <button
                className="press"
                aria-label="確認清除所有資料"
                disabled={clearArmed && !isClearKeywordMatched}
                onClick={() => {
                  if (!clearArmed) {
                    setClearArmed(true);
                    return;
                  }
                  if (!isClearKeywordMatched) return;
                  onClearAllData();
                  setClearConfirmOpen(false);
                  setClearArmed(false);
                  setClearConfirmText('');
                }}
                style={{ flex: 1, border: 'none', borderRadius: r.input, padding: '9px 10px', background: clearArmed && !isClearKeywordMatched ? t.surfaceAlt : t.negative, color: clearArmed && !isClearKeywordMatched ? t.secondary : '#fff', fontSize: '12px', fontWeight: 700, cursor: clearArmed && !isClearKeywordMatched ? 'not-allowed' : 'pointer' }}
              >
                {clearArmed ? `輸入 ${clearKeyword} 後確認清除` : '我了解風險，下一步確認'}
              </button>
            </div>
          </div>
        </div>
      )}

      {releaseNotesOpen && (
        <div role="dialog" aria-label="更新內容" style={{ position: 'fixed', inset: 0, background: t.modalOverlay, zIndex: 90, display: 'flex', alignItems: 'flex-end' }} onClick={() => setReleaseNotesOpen(false)}>
          <div style={{ width: '100%', background: t.surface, borderTopLeftRadius: r.modal, borderTopRightRadius: r.modal, padding: '14px', maxHeight: '76vh', overflowY: 'auto', boxShadow: t.shadow }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: r.icon, background: t.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico C={FileText} size={16} color={t.accent} sw={1.9} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: '14px', fontWeight: 800, color: t.primary }}>更新內容</div><div style={{ fontSize: '11px', color: t.secondary }}>最近版本重點與資料 migration 說明</div></div>
              <button className="press" onClick={() => setReleaseNotesOpen(false)} style={{ border: `1px solid ${t.border}`, borderRadius: r.chip, padding: '6px 10px', background: t.surfaceAlt, color: t.primary, fontSize: '11px', cursor: 'pointer' }}>關閉</button>
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {RELEASE_NOTES.map((note) => (
                <section key={note.version} style={{ borderTop: `1px solid ${t.divider}`, paddingTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: t.primary }}>v{note.version}</div>
                    <div style={{ fontSize: '11px', color: t.secondary }}>{note.date}</div>
                    <div style={{ marginLeft: 'auto', fontSize: '10px', color: note.level === 'recommended' ? t.accent : t.secondary, border: `1px solid ${t.divider}`, borderRadius: r.chip, padding: '2px 7px' }}>{note.level}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: t.primary, lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>重點</div>
                    <ul style={{ margin: '0 0 6px 18px', padding: 0 }}>{note.highlights.map((item) => <li key={item}>{item}</li>)}</ul>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>修正</div>
                    <ul style={{ margin: '0 0 0 18px', padding: 0 }}>{note.fixes.map((item) => <li key={item}>{item}</li>)}</ul>
                    {note.migrationNote && <div style={{ marginTop: '7px', color: t.secondary }}>Migration：{note.migrationNote}</div>}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      {updateCheckOpen && (
        <div role="dialog" aria-label="檢查更新結果" style={{ position: 'fixed', inset: 0, background: t.modalOverlay, zIndex: 90, display: 'flex', alignItems: 'flex-end' }} onClick={() => setUpdateCheckOpen(false)}>
          <div style={{ width: '100%', background: t.surface, borderTopLeftRadius: r.modal, borderTopRightRadius: r.modal, padding: '14px', boxShadow: t.shadow }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: t.primary, marginBottom: '5px' }}>{activeUpdateStatus.label}</div>
            <div style={{ fontSize: '12px', color: t.secondary, lineHeight: 1.5, marginBottom: '12px' }}>{activeUpdateStatus.detail}</div>
            <div style={{ marginBottom: '12px' }}><RiskNotice ariaLabel="檢查更新限制說明" title={updateCheckNoticeTitle} body={`${storeSummary} ${manifestCheckSummary} 現在先提供版本資訊、更新內容與更新前本機保護策略。`} tone={manifestCheck.status === 'error' ? 'warn' : 'neutral'} t={t} r={r} /></div>
            <div aria-label="更新行為策略" style={{ border: `1px solid ${t.divider}`, borderRadius: r.input, padding: '10px', marginBottom: '12px', background: t.surfaceAlt, fontSize: '11px', lineHeight: 1.5, color: t.secondary }}>
              <div style={{ color: t.primary, fontWeight: 800, marginBottom: '4px' }}>{activeUpdatePolicy.title}</div>
              <div>{activeUpdatePolicy.message}</div>
              <div style={{ marginTop: '6px' }}>主要操作：{activeUpdatePolicy.primaryAction}</div>
              <div>可稍後處理：{activeUpdatePolicy.canPostpone ? '可以' : '不可以'}</div>
              <div>核心功能可用：{activeUpdatePolicy.canUseCoreApp ? '可以' : '限制主要操作'}</div>
              <div>資料匯出：{activeUpdatePolicy.mustKeepExportAvailable ? '永遠保留' : '依狀態決定'}</div>
              {requiredUpdateProtection.active && (
                <div style={{ marginTop: '6px', color: t.primary }}>保護狀態：已限制主要操作，保留 {requiredUpdateProtection.allowedActions.join('、')}。</div>
              )}
            </div>
            <div aria-label="遠端更新來源狀態" style={{ border: `1px solid ${t.divider}`, borderRadius: r.input, padding: '8px 10px', marginBottom: '8px', fontSize: '11px', color: t.secondary, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <span>遠端版本 manifest</span>
              <span>{remoteManifestStatusText}</span>
            </div>
            {manifestCheck.status === 'error' && (
              <div aria-label="遠端更新錯誤" style={{ margin: '-2px 0 8px', fontSize: '11px', color: t.secondary }}>
                錯誤：{manifestCheck.errorMessage}
              </div>
            )}
            <div aria-label="商店更新連結狀態" style={{ display: 'grid', gap: '6px', marginBottom: '12px' }}>
              {storeLinks.map((link) => (
                <div key={link.target} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${t.divider}`, borderRadius: r.input, padding: '8px 10px', fontSize: '11px', color: t.secondary }}>
                  <span>{link.label}</span>
                  <span>{link.status === 'ready' ? `已啟用（${link.envKey}）` : `上架後啟用（${link.envKey}）`}</span>
                </div>
              ))}
            </div>
            <div aria-label="更新提醒狀態" style={{ border: `1px solid ${t.divider}`, borderRadius: r.input, padding: '8px 10px', marginBottom: '12px', fontSize: '11px', color: t.secondary, lineHeight: 1.5 }}>
              {updateReminderSummary}
              <div style={{ marginTop: '4px', color: updateReminderBadge.tone === 'accent' ? t.accent : updateReminderBadge.tone === 'warn' ? t.negative : t.secondary }}>入口狀態：{updateReminderBadge.label}｜{updateReminderBadge.detail}</div>
              {activeUpdatePolicy.level === 'required' && <div style={{ marginTop: '4px', color: t.primary }}>必要更新不可略過，也不提供稍後提醒。</div>}
              {updateReminderPreference && activeUpdatePolicy.level !== 'required' && (
                <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {isUpdateReminderDue(updateReminderPreference) && (
                    <button
                      className="press"
                      aria-label="再提醒24小時"
                      onClick={snoozeUpdateReminderPreference}
                      style={{ border: 'none', borderRadius: r.chip, padding: '6px 10px', background: t.chipActive, color: t.chipActiveText, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      再提醒 24 小時
                    </button>
                  )}
                  <button
                    className="press"
                    aria-label="清除更新提醒偏好"
                    onClick={clearUpdateReminderPreference}
                    style={{ border: `1px solid ${t.border}`, borderRadius: r.chip, padding: '6px 10px', background: t.surfaceAlt, color: t.primary, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    清除提醒偏好
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gap: '7px', fontSize: '11px', color: t.secondary, marginBottom: '12px' }}>
              <div>目前版本：v{versionInfo.appVersion}</div>
              <div>Build：{versionInfo.buildNumber}</div>
              <div>資料 schema：v{versionInfo.schemaVersion}</div>
              <div>{backupSummary}</div>
              <div>復原點狀態：{backupStatus.label}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {activeUpdatePolicy.secondaryAction && (
                <button className="press" onClick={handleUpdateSecondaryAction} style={{ flex: 1, border: `1px solid ${t.border}`, borderRadius: r.input, padding: '10px', background: t.surfaceAlt, color: t.primary, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{activeUpdatePolicy.secondaryAction}</button>
              )}
              <button
                className="press"
                onClick={handleUpdatePrimaryAction}
                disabled={manifestCheck.status === 'checking'}
                style={{ flex: 1, border: 'none', borderRadius: r.input, padding: '10px', background: manifestCheck.status === 'checking' ? t.surfaceAlt : t.chipActive, color: manifestCheck.status === 'checking' ? t.secondary : t.chipActiveText, fontSize: '12px', fontWeight: 700, cursor: manifestCheck.status === 'checking' ? 'wait' : 'pointer' }}
              >
                {manifestCheck.status === 'checking' ? '查詢中…' : updatePrimaryActionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
