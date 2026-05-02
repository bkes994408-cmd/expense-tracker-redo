const DEFAULT_RECENT_LIMIT = 8;

export type RecentUsageStat = {
  count: number;
  lastUsedAt: number;
};

type RecentNoteUsageState = {
  recentNotes: string[];
  recentNoteStats: Record<string, RecentUsageStat>;
  recentNoteCategoryStats: Record<string, Record<string, RecentUsageStat>>;
};

function getRecentScore(stat: RecentUsageStat, now: number) {
  const recencyWindowMs = 1000 * 60 * 60 * 24 * 14;
  const recency = Math.exp(-(now - stat.lastUsedAt) / recencyWindowMs);
  return stat.count + recency;
}

function getContextScore(stat: RecentUsageStat | undefined, now: number) {
  if (!stat) return 0;
  const recencyWindowMs = 1000 * 60 * 60 * 24 * 10;
  const recency = Math.exp(-(now - stat.lastUsedAt) / recencyWindowMs);
  return stat.count * 0.9 + recency * 1.2;
}

export function rankRecentByStats(
  stats: Record<string, RecentUsageStat>,
  now: number = Date.now(),
  limit: number = DEFAULT_RECENT_LIMIT,
) {
  return Object.entries(stats)
    .filter(([key]) => key.trim())
    .sort((a, b) => {
      const scoreDiff = getRecentScore(b[1], now) - getRecentScore(a[1], now);
      if (Math.abs(scoreDiff) > 0.000001) return scoreDiff;
      if (b[1].count !== a[1].count) return b[1].count - a[1].count;
      return b[1].lastUsedAt - a[1].lastUsedAt;
    })
    .slice(0, limit)
    .map(([key]) => key);
}

export function rankRecentNotesByCategoryContext(
  noteStats: Record<string, RecentUsageStat>,
  noteCategoryStats: Record<string, Record<string, RecentUsageStat>>,
  category?: string,
  now: number = Date.now(),
  limit: number = DEFAULT_RECENT_LIMIT,
) {
  return Object.entries(noteStats)
    .filter(([note]) => note.trim())
    .sort((a, b) => {
      const aBase = getRecentScore(a[1], now);
      const bBase = getRecentScore(b[1], now);

      const aContext = category ? noteCategoryStats[a[0]]?.[category] : undefined;
      const bContext = category ? noteCategoryStats[b[0]]?.[category] : undefined;

      const scoreDiff = (bBase + getContextScore(bContext, now)) - (aBase + getContextScore(aContext, now));
      if (Math.abs(scoreDiff) > 0.000001) return scoreDiff;

      const contextDiff = getContextScore(bContext, now) - getContextScore(aContext, now);
      if (Math.abs(contextDiff) > 0.000001) return contextDiff;

      return b[1].lastUsedAt - a[1].lastUsedAt;
    })
    .slice(0, limit)
    .map(([note]) => note);
}

export function pushRecentWithStats(
  items: string[],
  stats: Record<string, RecentUsageStat>,
  next: string,
  now: number = Date.now(),
  limit: number = DEFAULT_RECENT_LIMIT,
) {
  const value = next.trim();
  if (!value) return { items, stats };

  const current = stats[value];
  const nextStats = {
    ...stats,
    [value]: {
      count: (current?.count ?? 0) + 1,
      lastUsedAt: now,
    },
  };

  const rankedItems = rankRecentByStats(nextStats, now, limit);
  const rankedSet = new Set(rankedItems);
  const trimmedStats = Object.fromEntries(Object.entries(nextStats).filter(([key]) => rankedSet.has(key)));

  return { items: rankedItems, stats: trimmedStats };
}

export function migrateRecentListToStats(items: string[] | undefined) {
  if (!Array.isArray(items) || items.length === 0) return {} as Record<string, RecentUsageStat>;
  const baseTime = Date.now();
  return Object.fromEntries(
    items.map((item, index) => [item, { count: 1, lastUsedAt: baseTime - index * 1000 }]),
  );
}

export function applyRecentNoteUsage(
  state: RecentNoteUsageState,
  note: string,
  category?: string,
  now: number = Date.now(),
  limit: number = DEFAULT_RECENT_LIMIT,
) {
  const next = pushRecentWithStats(state.recentNotes, state.recentNoteStats, note, now, limit);
  const value = note.trim();
  const categoryValue = category?.trim();

  let nextNoteCategoryStats = state.recentNoteCategoryStats;
  if (value && categoryValue) {
    const current = state.recentNoteCategoryStats[value]?.[categoryValue];
    nextNoteCategoryStats = {
      ...state.recentNoteCategoryStats,
      [value]: {
        ...(state.recentNoteCategoryStats[value] ?? {}),
        [categoryValue]: {
          count: (current?.count ?? 0) + 1,
          lastUsedAt: now,
        },
      },
    };
  }

  const recentSet = new Set(next.items);
  const trimmedNoteCategoryStats = Object.fromEntries(
    Object.entries(nextNoteCategoryStats)
      .filter(([noteKey]) => recentSet.has(noteKey))
      .map(([noteKey, categoryMap]) => {
        const rankedCategoryKeys = rankRecentByStats(categoryMap, now, limit);
        return [noteKey, Object.fromEntries(rankedCategoryKeys.map((catKey) => [catKey, categoryMap[catKey]]))];
      }),
  );

  return {
    recentNotes: next.items,
    recentNoteStats: next.stats,
    recentNoteCategoryStats: trimmedNoteCategoryStats,
  };
}
