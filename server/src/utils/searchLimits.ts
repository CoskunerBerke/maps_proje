/**
 * Cost limits for real Google Places searches (every category = one billed request).
 * The values come from the Settings page (AppSettings).
 */
export interface SearchLimitInput {
  categoryCount: number;
  searchesToday: number;
  maxCategoriesPerSearch: number;
  dailyMaxSearches: number;
}

export interface SearchLimitError {
  status: number;
  error: string;
}

export function checkSearchLimits(input: SearchLimitInput): SearchLimitError | null {
  if (input.categoryCount > input.maxCategoriesPerSearch) {
    return {
      status: 400,
      error: `Bir taramada en fazla ${input.maxCategoriesPerSearch} kategori seçilebilir (seçilen: ${input.categoryCount}). Limiti Ayarlar sayfasından değiştirebilirsiniz.`,
    };
  }

  if (input.searchesToday >= input.dailyMaxSearches) {
    return {
      status: 429,
      error: `Günlük tarama limitine ulaşıldı (${input.dailyMaxSearches}). Limiti Ayarlar sayfasından değiştirebilirsiniz.`,
    };
  }

  return null;
}

/** Local midnight of the given day (the server runs on the user's own machine). */
export function startOfLocalDay(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}
