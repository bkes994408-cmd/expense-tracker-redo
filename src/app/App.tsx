import { useEffect, useState } from 'react';
import { useAppStore } from "../store/appStore";
import type { AppTab } from '../store/appStore';
import { rankRecentNotesByCategoryContext } from '../store/appStore';
import { useFinanceStore } from "../store/financeStore";
import { APP_CSS, FONTS, RADII, THEME_TOKENS } from "../theme/theme";
import { HomePage } from "../pages/home/HomePage";
import { TransactionsPage } from "../pages/transactions/TransactionsPage";
import { ReportsPage } from "../pages/reports/ReportsPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { BottomNav } from "../components/navigation/BottomNav";
import { ToastStack } from "../components/common/ToastStack";
import { TxnModal } from "../components/modals/TxnModal";
import { useCsvExportActions } from '../hooks/useCsvExportActions';
import { useIsMobileViewport } from '../hooks/useIsMobileViewport';
import { useRecurringActions } from '../hooks/useRecurringActions';
import { useToastQueue } from '../hooks/useToastQueue';
import { buildRecurringItemFromTransaction, normalizeSavedTransaction } from './appActions';
import { reapplyCategoryRulesToTransactions } from '../rules/categoryRules';

import type { Category, Transaction } from '../domain/types';

const TITLES: [string, string, null, string, string] = ['總覽', '收支記錄', null, '財務報表', '設定'];

export function App(){
  const isMobileViewport = useIsMobileViewport();
  const style=useAppStore(s=>s.style), mode=useAppStore(s=>s.mode), setStyle=useAppStore(s=>s.setStyle), setMode=useAppStore(s=>s.setMode);
  const displayCurrency=useAppStore(s=>s.currency), setDisplayCurrency=useAppStore(s=>s.setCurrency);
  const monthStartDay=useAppStore(s=>s.monthStartDay), setMonthStartDay=useAppStore(s=>s.setMonthStartDay);
  const billReminder=useAppStore(s=>s.billReminder), setBillReminder=useAppStore(s=>s.setBillReminder);
  const iCloudBackup=useAppStore(s=>s.iCloudBackup), setICloudBackup=useAppStore(s=>s.setICloudBackup);
  const recentCategories = useAppStore((s) => s.recentCategories);
  const recentNotes = useAppStore((s) => s.recentNotes);
  const recentQuickEntries = useAppStore((s) => s.recentQuickEntries);
  const recentNoteStats = useAppStore((s) => s.recentNoteStats);
  const recentNoteCategoryStats = useAppStore((s) => s.recentNoteCategoryStats);
  const pushRecentCategory = useAppStore((s) => s.pushRecentCategory);
  const pushRecentNote = useAppStore((s) => s.pushRecentNote);
  const pushRecentQuickEntry = useAppStore((s) => s.pushRecentQuickEntry);
  const resetRecentUsage = useAppStore((s) => s.resetRecentUsage);
  const screen=useAppStore(s=>s.tab), setScreen_=useAppStore(s=>s.setTab), month=useAppStore(s=>s.month), setMonth=useAppStore(s=>s.setMonth);
  const txns=useFinanceStore(s=>s.transactions), budgets=useFinanceStore(s=>s.budgets), recurring=useFinanceStore(s=>s.recurring), goals=useFinanceStore(s=>s.goals);
  const setTxns=useFinanceStore(s=>s.setTransactions), setBudgets=useFinanceStore(s=>s.setBudgets), setRec=useFinanceStore(s=>s.setRecurring), setGoals=useFinanceStore(s=>s.setGoals), resetAllData=useFinanceStore(s=>s.resetAllData);
  const [showAdd,setShowAdd]=useState(false), [editTx,setEditTx]=useState<Transaction | null>(null), [loading,setLoading]=useState(true), [prevScr,setPrev]=useState(screen), [txnModalTab, setTxnModalTab] = useState<'calc' | 'text' | 'quick'>('calc'), [txnModalQuickInput, setTxnModalQuickInput] = useState('');
  const { toasts, toast } = useToastQueue();
  useEffect(()=>{setTimeout(()=>setLoading(false),1600);},[]);
  const t=THEME_TOKENS[style][mode], r=RADII[style], f=FONTS[style];
  const setScreen = (n: AppTab) => { setPrev(screen); setScreen_(n); };
  const dir = screen > prevScr ? 'right' : screen < prevScr ? 'left' : 'none';
  const dirAnim = dir === 'right' ? 'slideInR' : dir === 'left' ? 'slideInL' : 'fadeIn';

  const {
    exportCategories,
    getCsvExportCount,
    exportCsv,
    lastCsvExport,
    clearAllData,
  } = useCsvExportActions({
    transactions: txns,
    month,
    resetAllData,
    resetRecentUsage,
    toast,
  });

  const {
    toggleRecurring,
    handleRecurringBatchResult,
    confirmRecurringPendingCycle,
    skipRecurringPendingCycle,
    saveRecurring,
    deleteRecurring,
  } = useRecurringActions({
    recurring,
    transactions: txns,
    setRecurring: setRec,
    setTransactions: setTxns,
    displayCurrency,
    screen,
    toast,
  });

  const selectedTxns = txns.filter((x) => new Date(x.date).getMonth() === month);

  function saveTxn(tx: Transaction & { isRec?: boolean; freq?: 'daily' | 'weekly' | 'monthly' | 'yearly' }) {
    const nextTxn = normalizeSavedTransaction(tx, editTx, displayCurrency);
    const nextRecurring = !editTx ? buildRecurringItemFromTransaction(tx, month) : null;
    if (nextRecurring) {
      setRec((p) => [nextRecurring, ...p]);
    }
    if (editTx) {
      setTxns((p) => p.map((x) => (x.id === nextTxn.id ? nextTxn : x)));
      toast('已更新 ✓');
    } else {
      setTxns((p) => [nextTxn, ...p]);
      toast('已新增 ✓');
    }
    pushRecentCategory(nextTxn.cat);
    pushRecentNote(nextTxn.name, nextTxn.cat);
    setEditTx(null);
    setShowAdd(false);
  }

  function deleteTxn(id: number) { setTxns((p) => p.filter((x) => x.id !== id)); toast('已刪除', 'warn'); }
  function reapplyCategoryRules(ids: number[]) {
    const result = reapplyCategoryRulesToTransactions(txns, ids);
    if (result.changed > 0) setTxns(result.transactions);

    if (result.eligible === 0) {
      toast('沒有可重新套用分類規則的交易', 'warn');
    } else if (result.changed === 0) {
      toast(`分類規則已是最新（0/${result.eligible} 筆變更）`);
    } else {
      const names = result.changedNames.length > 0 ? `：${result.changedNames.slice(0, 3).join('、')}${result.changedNames.length > 3 ? '…' : ''}` : '';
      toast(`已重新套用分類規則（${result.changed}/${result.eligible} 筆）${names}`);
    }

    return result;
  }
  function openEdit(tx: Transaction) { setEditTx(tx); setTxnModalTab('calc'); setTxnModalQuickInput(''); setShowAdd(true); }

  const openQuickEntry = (initialInput: string = '') => { setEditTx(null); setTxnModalTab('quick'); setTxnModalQuickInput(initialInput); setShowAdd(true); };
  const openDefaultAdd = () => { setEditTx(null); setTxnModalTab('calc'); setTxnModalQuickInput(''); setShowAdd(true); };

  const screens=[
    <HomePage txns={selectedTxns} budgets={budgets} recurring={recurring} goals={goals} loading={loading} currency={displayCurrency} recentQuickEntries={recentQuickEntries} onQuickEntryOpen={openQuickEntry} t={t} r={r} f={f}/>,
    <TransactionsPage txns={selectedTxns} recurring={recurring} currency={displayCurrency} t={t} r={r} f={f} onEdit={openEdit} onDelete={deleteTxn} onReapplyCategoryRules={reapplyCategoryRules} onRecChange={toggleRecurring} onRecBatchResult={handleRecurringBatchResult} onRecSave={saveRecurring} onRecDelete={deleteRecurring} onRecConfirmPending={confirmRecurringPendingCycle} onRecSkipPending={skipRecurringPendingCycle} month={month} setMonth={setMonth}/>,
    null,
    <ReportsPage txns={selectedTxns} reportTxns={txns} currency={displayCurrency} budgets={budgets} setBudgets={setBudgets} goals={goals} setGoals={setGoals} t={t} r={r} f={f}/>,
    <SettingsPage t={t} r={r} f={f} style={style} setStyle={setStyle} mode={mode} setMode={setMode} currency={displayCurrency} setCurrency={setDisplayCurrency} monthStartDay={monthStartDay} setMonthStartDay={setMonthStartDay} billReminder={billReminder} setBillReminder={setBillReminder} iCloudBackup={iCloudBackup} setICloudBackup={setICloudBackup} exportCategories={exportCategories} getCsvExportCount={getCsvExportCount} onExportCsv={exportCsv} lastCsvExport={lastCsvExport} onClearAllData={clearAllData} onRateApp={()=>toast('App 評分功能即將推出')} />,
  ];

  return <><style>{APP_CSS}</style><div style={{minHeight:"100dvh",background:isMobileViewport?t.bg:(mode==="dark"?"#080808":"#CCC9C2"),display:"flex",alignItems:isMobileViewport?"stretch":"center",justifyContent:"center",fontFamily:f.body,padding:isMobileViewport?0:"32px 16px",transition:"background 0.4s"}}><div style={{width:isMobileViewport?"100%":"375px",maxWidth:isMobileViewport?"100%":"375px",height:isMobileViewport?"100dvh":"812px",borderRadius:isMobileViewport?0:"52px",overflow:"hidden",position:"relative",background:t.bg,display:"flex",flexDirection:"column",boxShadow:isMobileViewport?"none":(mode==="dark"?"0 0 0 10px #1A1A1A,0 0 0 12px #2A2A2A,0 60px 120px rgba(0,0,0,0.95)":"0 0 0 10px #C4C0B8,0 0 0 12px #AAAA8A0,0 60px 120px rgba(0,0,0,0.28)"),transition:"all 0.4s ease"}}>
    <div style={{background:t.bg,padding:isMobileViewport?"calc(env(safe-area-inset-top, 0px) + 16px) 20px 10px":"0 20px 10px",borderBottom:`1px solid ${t.border}`,flexShrink:0}}><div style={{fontFamily:f.display,fontSize:"22px",fontWeight:"bold",color:t.primary}}>{TITLES[screen]}</div></div>
    <div style={{flex:1,overflowY:"auto",scrollbarWidth:"none",position:"relative"}}><div key={screen} style={{height:"100%",animation:`${dirAnim} 0.3s cubic-bezier(.32,.72,0,1) both`}}>{screens[screen]}</div></div>
    <BottomNav t={t} r={r} f={f} screen={screen} onScreenChange={setScreen} onAdd={openDefaultAdd}/>
    {showAdd&&<TxnModal t={t} r={r} f={f} initial={editTx} month={month} onSave={saveTxn} onClose={()=>{setShowAdd(false);setEditTx(null);setTxnModalTab('calc');setTxnModalQuickInput('');}} recentCategories={recentCategories as Category[]} recentNotes={recentNotes} recentQuickEntries={recentQuickEntries} recentNoteStats={recentNoteStats} recentNoteCategoryStats={recentNoteCategoryStats} rankRecentNotesByCategoryContext={rankRecentNotesByCategoryContext} onUseCategory={pushRecentCategory as (cat: Category) => void} onUseNote={(note, category) => pushRecentNote(note, category)} onUseQuickEntry={pushRecentQuickEntry} initialTab={txnModalTab} initialQuickInput={txnModalQuickInput} />}
    <ToastStack toasts={toasts} t={t} f={f}/>
  </div></div></>;
}
