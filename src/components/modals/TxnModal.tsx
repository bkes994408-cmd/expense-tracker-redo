import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, X, Delete } from 'lucide-react';
import { CATS, FREQ } from '../../domain/constants';
import type { Category, RecurringFrequency, ThemeFonts, ThemePalette, ThemeRadii, Transaction } from '../../domain/types';
import { CAT_ICON, Box, Ico } from '../common/icons';
import { Chip, Seg, Toggle } from '../common/ui';
import { evaluateExpression } from '../../utils/expression';
import { NOTE_PRESETS } from '../../rules/categoryRules';
import { parseQuickEntry, parseQuickEntryDetailed } from '../../utils/quickEntryParser';

type TxnDraft = Transaction & {
  isRec?: boolean;
  freq?: RecurringFrequency;
};

type TxnModalProps = {
  t: ThemePalette;
  r: ThemeRadii;
  f: ThemeFonts;
  initial: Transaction | null;
  month: number;
  onSave: (tx: TxnDraft) => void;
  onClose: () => void;
  recentCategories?: Category[];
  recentNotes?: string[];
  recentQuickEntries?: string[];
  recentNoteStats?: Record<string, { count: number; lastUsedAt: number }>;
  recentNoteCategoryStats?: Record<string, Record<string, { count: number; lastUsedAt: number }>>;
  rankRecentNotesByCategoryContext?: (
    noteStats: Record<string, { count: number; lastUsedAt: number }>,
    noteCategoryStats: Record<string, Record<string, { count: number; lastUsedAt: number }>>,
    category?: string,
    now?: number,
    limit?: number,
  ) => string[];
  onUseCategory?: (category: Category) => void;
  onUseNote?: (note: string, category: Category) => void;
  onUseQuickEntry?: (entry: string) => void;
  initialTab?: 'calc' | 'text' | 'quick';
  initialQuickInput?: string;
};

type CalcProps = {
  value: number;
  onChange: (value: number) => void;
  t: ThemePalette;
  r: ThemeRadii;
  f: ThemeFonts;
  color: string;
};

function evalExpr(expr: string): number | null {
  const value = evaluateExpression(expr);
  if (value === null || Number.isNaN(value)) return null;
  return Math.abs(Math.round(value * 100) / 100);
}

function Calc({ value, onChange, t, r, f, color }: CalcProps) {
  const [expr, setExpr] = useState(value ? String(Math.abs(value)) : '');
  const [hasOp, setHasOp] = useState(false);
  const [error, setError] = useState('');

  const clearError = () => {
    if (error) setError('');
  };

  const press = (key: string) => {
    if (key === '⌫') {
      clearError();
      const nextExpr = expr.slice(0, -1);
      setExpr(nextExpr);
      setHasOp(/[+\-×÷]/.test(nextExpr));
      return;
    }

    if (key === '=') {
      const next = evalExpr(expr);
      if (next !== null) {
        setExpr(String(next));
        setHasOp(false);
        clearError();
        onChange(next);
      } else {
        const sanitized = expr.replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/');
        setError(/\/0(?!\d)/.test(sanitized) ? '無法除以 0，請修改算式後再試。' : '算式格式不正確，請檢查運算符號與小數點。');
      }
      return;
    }

    const ops = ['+', '-', '×', '÷'];
    if (ops.includes(key)) {
      if (!expr) return;
      if (hasOp) {
        const next = evalExpr(expr);
        if (next !== null) {
          clearError();
          setExpr(`${next}${key}`);
        }
        return;
      }
      clearError();
      setExpr(`${expr}${key}`);
      setHasOp(true);
      return;
    }

    if (key === '.' && expr.split(/[+\-×÷]/).pop()?.includes('.')) return;

    const nextExpr = `${expr}${key}`;
    clearError();
    setExpr(nextExpr);
    if (!hasOp) {
      const next = Number.parseFloat(nextExpr);
      if (!Number.isNaN(next)) onChange(next);
    }
  };

  const keys: (string | null)[][] = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['.', '0', '⌫', '+'],
    [null, null, '=', '='],
  ];

  return (
    <div>
      <div style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: r.input, padding: '12px 14px', marginBottom: '8px', minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <span style={{ fontFamily: f.display, fontSize: '28px', fontWeight: '700', color, wordBreak: 'break-all', textAlign: 'right' }}>{expr || '0'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px' }}>
        {keys
          .flat()
          .filter((k, i, arr) => !(k === '=' && i !== arr.lastIndexOf('=')))
          .map((key, i) => {
            if (key === null) return <div key={i} />;
            const isOp = ['+', '-', '×', '÷'].includes(key);
            const isEq = key === '=';
            const isDel = key === '⌫';
            return (
              <button key={i} className="press" onClick={() => press(key)} style={{ gridColumn: isEq ? 'span 2' : 'span 1', background: isEq ? t.chipActive : isOp ? t.surfaceAlt : t.inputBg, color: isEq ? t.chipActiveText : isOp ? t.accent : t.primary, border: `1px solid ${t.border}`, borderRadius: r.chip, padding: '12px 0', fontSize: isDel ? '18px' : '16px', fontFamily: f.body, fontWeight: '600', cursor: 'pointer' }}>
                {isDel ? <Ico C={Delete} size={16} color={isEq ? t.chipActiveText : t.primary} sw={2} /> : key}
              </button>
            );
          })}
      </div>
      {error && (
        <div aria-label="計算機錯誤提示" style={{ marginTop: '8px', fontSize: '11px', color: t.negative, lineHeight: 1.45 }}>
          {error}
        </div>
      )}
    </div>
  );
}

export function TxnModal({ t, r, f, initial, month, onSave, onClose, recentCategories = [], recentNotes = [], recentQuickEntries = [], recentNoteStats = {}, recentNoteCategoryStats = {}, rankRecentNotesByCategoryContext, onUseCategory, onUseNote, onUseQuickEntry, initialTab = 'calc', initialQuickInput = '' }: TxnModalProps) {
  const isEdit = !!initial;
  const currentYear = new Date().getFullYear();
  const defaultDate = `${currentYear}-${String(month + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const [type, setType] = useState<'income' | 'expense'>(initial ? (initial.amount > 0 ? 'income' : 'expense') : 'expense');
  const [amount, setAmount] = useState(initial ? Math.abs(initial.amount) : 0);
  const [name, setName] = useState(initial?.name ?? '');
  const [cat, setCat] = useState<Category>(initial?.cat ?? '餐飲');
  const [isRec, setIsRec] = useState(false);
  const [freq, setFreq] = useState<RecurringFrequency>('monthly');
  const [shake, setShake] = useState(false);
  const [tab, setTab] = useState<'calc' | 'text' | 'quick'>(initialTab);
  const [quickInput, setQuickInput] = useState(initialQuickInput);
  const [quickHint, setQuickHint] = useState('');
  const [vis, setVis] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVis(true));
  }, []);

  const close = () => {
    setVis(false);
    setTimeout(onClose, 280);
  };

  const quickParsed = useMemo(() => parseQuickEntry(quickInput), [quickInput]);

  const applyQuickInput = () => {
    const result = parseQuickEntryDetailed(quickInput);
    if (!result.ok) {
      setQuickHint(result.message);
      return null;
    }

    const parsed = result.value;
    setType(parsed.type);
    setAmount(parsed.amount);
    setName(parsed.name);
    setCat(parsed.cat);
    onUseQuickEntry?.(quickInput);
    setQuickHint(`已帶入：${parsed.name} / ${parsed.type === 'income' ? '收入' : '支出'} / ${parsed.cat} / ${parsed.amount}`);
    return parsed;
  };

  const submit = () => {
    let nextType = type;
    let nextAmount = amount;
    let nextName = name;
    let nextCat = cat;
    let nextOriginalCurrency = initial?.originalCurrency;
    let nextCategorySource = initial?.categorySource ?? 'user';
    let nextCategoryRuleVersion = initial?.categoryRuleVersion;

    if (tab === 'quick' && quickInput.trim()) {
      const parsed = applyQuickInput();
      if (parsed) {
        nextType = parsed.type;
        nextAmount = parsed.amount;
        nextName = parsed.name;
        nextCat = parsed.cat;
        nextOriginalCurrency = parsed.originalCurrency;
        nextCategorySource = parsed.categorySource;
        nextCategoryRuleVersion = parsed.categoryRuleVersion;
      }
    } else if (!initial || nextCat !== initial.cat) {
      nextCategorySource = 'user';
      nextCategoryRuleVersion = undefined;
    }

    if (!nextAmount || !nextName) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    onSave({
      ...(initial ?? {}),
      id: initial?.id ?? Date.now(),
      name: nextName,
      cat: nextCat,
      amount: nextType === 'income' ? nextAmount : -nextAmount,
      date: initial?.date ?? defaultDate,
      time: initial?.time ?? new Date().toTimeString().slice(0, 5),
      originalCurrency: nextOriginalCurrency,
      categorySource: nextCategorySource,
      categoryRuleVersion: nextCategoryRuleVersion,
      isRec,
      freq,
    });

    close();
  };

  const availCats: Category[] = type === 'income' ? ['收入'] : CATS;
  const notePresets = NOTE_PRESETS[cat] ?? NOTE_PRESETS.其他;
  const recentCatOptions = recentCategories.filter((c): c is Category => availCats.includes(c as Category) && c !== cat).slice(0, 6);
  const baseRecentNotes = rankRecentNotesByCategoryContext
    ? rankRecentNotesByCategoryContext(recentNoteStats, recentNoteCategoryStats, cat)
    : recentNotes;
  const recentNoteOptions = baseRecentNotes.filter((note) => note.trim() && note !== name).slice(0, 6);
  const recentQuickEntryOptions = recentQuickEntries.filter((entry) => entry.trim() && entry !== quickInput).slice(0, 6);
  const selectCategory = (value: Category) => {
    setCat(value);
    onUseCategory?.(value);
  };
  const selectNote = (value: string) => {
    setName(value);
    onUseNote?.(value, cat);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={close} style={{ position: 'absolute', inset: 0, background: t.modalOverlay, animation: 'overlayIn 0.25s ease both' }} />
      <div style={{ position: 'relative', background: t.surface, borderRadius: `${r.modal} ${r.modal} 0 0`, padding: '16px 16px 32px', boxShadow: t.shadow, animation: vis ? 'slideUp 0.32s cubic-bezier(.32,.72,0,1) both' : 'slideDown 0.26s ease both', maxHeight: '92%', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <button className="press" onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
            <Ico C={X} size={18} color={t.secondary} sw={2} />
          </button>
          <span style={{ fontFamily: f.display, fontSize: '16px', fontWeight: '700', color: t.primary }}>{isEdit ? '編輯記錄' : '新增記錄'}</span>
          <button className="press" onClick={submit} style={{ background: t.chipActive, color: t.chipActiveText, border: 'none', borderRadius: r.chip, padding: '6px 14px', fontSize: '12px', fontFamily: f.body, fontWeight: '600', cursor: 'pointer' }}>
            {isEdit ? '更新' : '儲存'}
          </button>
        </div>

        <Seg options={[['expense', '支出'], ['income', '收入']]} value={type} onChange={(v) => { setType(v); setCat(v === 'income' ? '收入' : '餐飲'); }} t={t} r={r} f={f} />

        <div style={{ display: 'flex', gap: '6px', margin: '10px 0 8px' }}>
          {([
            ['calc', '計算機'],
            ['text', '手動輸入'],
            ['quick', '快速輸入'],
          ] as const).map(([id, lbl]) => (
            <button key={id} className="press" onClick={() => setTab(id)} style={{ flex: 1, background: tab === id ? t.surfaceAlt : t.inputBg, color: tab === id ? t.primary : t.secondary, border: `1px solid ${t.border}`, borderRadius: r.chip, padding: '7px', fontSize: '12px' }}>
              {lbl}
            </button>
          ))}
        </div>

        <div style={{ animation: shake ? 'shake 0.4s ease' : 'none', marginBottom: '10px' }}>
          {tab === 'calc' ? (
            <Calc value={amount} onChange={setAmount} t={t} r={r} f={f} color={type === 'income' ? t.positive : t.negative} />
          ) : tab === 'text' ? (
            <input type="number" value={amount || ''} onChange={(e) => setAmount(Number.parseFloat(e.target.value) || 0)} style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: r.input, padding: '12px 14px', fontSize: '26px', fontFamily: f.display, color: type === 'income' ? t.positive : t.negative, outline: 'none' }} />
          ) : (
            <div>
              <textarea
                aria-label="快速輸入記帳"
                value={quickInput}
                onChange={(e) => {
                  setQuickInput(e.target.value);
                  if (quickHint) setQuickHint('');
                }}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="例：今天午餐 120、收入 300、-50、USD 20 lunch"
                style={{ width: '100%', minHeight: '88px', resize: 'vertical', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: r.input, padding: '12px 14px', fontSize: '13px', fontFamily: f.body, color: t.primary, outline: 'none', lineHeight: 1.5 }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {['今天午餐 120', '買咖啡 90', '收入 300', '-50', 'USD 20 lunch'].map((example) => (
                  <button
                    key={example}
                    className="press"
                    type="button"
                    onClick={() => {
                      setQuickInput(example);
                      setQuickHint('');
                    }}
                    style={{ border: `1px solid ${t.border}`, background: t.surfaceAlt, color: t.primary, borderRadius: r.chip, padding: '6px 8px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    {example}
                  </button>
                ))}
              </div>
              {quickParsed && (
                <div aria-label="快速輸入預覽" style={{ marginTop: '8px', padding: '10px 12px', borderRadius: r.input, background: t.surfaceAlt, border: `1px solid ${t.border}` }}>
                  <div style={{ fontSize: '10px', color: t.secondary, marginBottom: '4px' }}>將建立</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: t.primary }}>
                    {quickParsed.type === 'income' ? '收入' : '支出'} · {quickParsed.cat} · {quickParsed.name} · {quickParsed.amount}{quickParsed.originalCurrency ? ` · ${quickParsed.originalCurrency}` : ''}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <div style={{ fontSize: '11px', color: quickHint ? (quickHint.startsWith('已帶入') ? t.positive : t.negative) : t.secondary }}>
                  {quickHint || '支援更自由語句、負數與幣別；例如：今天午餐 120、收入 300、-50、USD 20 lunch；按 Ctrl/⌘ + Enter 可直接儲存'}
                </div>
                <button
                  className="press"
                  aria-label="解析快速輸入"
                  onClick={() => applyQuickInput()}
                  style={{ border: `1px solid ${t.accent}`, background: t.accentSoft, color: t.accent, borderRadius: r.chip, padding: '7px 10px', fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}
                >
                  解析帶入
                </button>
              </div>
              {recentQuickEntryOptions.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '10px', color: t.secondary, marginBottom: '6px' }}>最近快速輸入</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {recentQuickEntryOptions.map((entry) => (
                      <button
                        key={entry}
                        className="press"
                        type="button"
                        aria-label={`最近快速輸入${entry}`}
                        onClick={() => {
                          setQuickInput(entry);
                          setQuickHint('');
                        }}
                        style={{ border: `1px solid ${t.border}`, background: t.surfaceAlt, color: t.primary, borderRadius: r.chip, padding: '6px 8px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        {entry}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="備註說明…" style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: r.input, padding: '11px 14px', fontSize: '13px', color: t.primary, outline: 'none', marginBottom: '10px' }} />

        {recentNoteOptions.length > 0 && (
          <>
            <div style={{ fontSize: '10px', color: t.secondary, marginBottom: '6px' }}>最近使用備註</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
              {recentNoteOptions.map((option) => (
                <button
                  key={option}
                  className="press"
                  aria-label={`最近備註${option}`}
                  onClick={() => selectNote(option)}
                  style={{ border: `1px solid ${t.border}`, background: t.surfaceAlt, color: t.primary, borderRadius: r.chip, padding: '6px 8px', fontSize: '11px', cursor: 'pointer' }}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px', marginBottom: '10px' }}>
          {notePresets.map((option) => (
            <button
              key={option}
              className="press"
              aria-label={`備註預設${cat}${option}`}
              onClick={() => selectNote(option)}
              style={{
                border: `1px solid ${name === option ? t.accent : t.border}`,
                background: name === option ? t.accentSoft : t.surfaceAlt,
                color: name === option ? t.accent : t.secondary,
                borderRadius: r.chip,
                padding: '6px 4px',
                fontSize: '11px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {option}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '10px', color: t.secondary, marginBottom: '6px' }}>分類</div>
        {recentCatOptions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
            {recentCatOptions.map((c) => (
              <button
                key={`recent-${c}`}
                className="press"
                aria-label={`最近分類${c}`}
                onClick={() => selectCategory(c)}
                style={{ border: `1px solid ${t.accent}`, background: t.accentSoft, color: t.accent, borderRadius: r.chip, padding: '5px 8px', fontSize: '10px', cursor: 'pointer' }}
              >
                最近：{c}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
          {availCats.map((c) => (
            <Chip key={c} label={c} active={cat === c} onClick={() => selectCategory(c)} t={t} r={r} C={CAT_ICON[c] || Box} isz={12} />
          ))}
        </div>

        {!isEdit && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: t.surfaceAlt, borderRadius: r.input, padding: '10px 12px', marginBottom: isRec ? '8px' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ico C={RefreshCw} size={15} color={t.secondary} sw={1.75} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: t.primary }}>設為定期帳目</div>
                  <div style={{ fontSize: '10px', color: t.secondary }}>自動週期記錄</div>
                </div>
              </div>
              <Toggle on={isRec} onToggle={() => setIsRec((p) => !p)} t={t} />
            </div>

            {isRec && (
              <div style={{ display: 'flex', gap: '5px', animation: 'fadeIn 0.2s ease' }}>
                {Object.entries(FREQ).map(([id, lbl]) => (
                  <Chip key={id} label={lbl} active={freq === id} onClick={() => setFreq(id as RecurringFrequency)} t={t} r={r} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
