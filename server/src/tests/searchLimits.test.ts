import { describe, it, expect } from 'vitest';
import { checkSearchLimits, createSerialQueue, startOfLocalDay } from '../utils/searchLimits';

describe('Tarama maliyet limitleri (searchLimits)', () => {
  const base = { categoryCount: 5, searchesToday: 0, maxCategoriesPerSearch: 10, dailyMaxSearches: 100 };

  it('Limitler içindeyken izin vermelidir', () => {
    expect(checkSearchLimits(base)).toBeNull();
    expect(checkSearchLimits({ ...base, categoryCount: 10, searchesToday: 99 })).toBeNull();
  });

  it('Kategori limiti aşılınca 400 dönmelidir', () => {
    expect(checkSearchLimits({ ...base, categoryCount: 11 })?.status).toBe(400);
  });

  it('Günlük tarama limiti dolunca 429 dönmelidir', () => {
    expect(checkSearchLimits({ ...base, searchesToday: 100 })?.status).toBe(429);
  });

  it('startOfLocalDay yerel gece yarısını dönmelidir', () => {
    const d = startOfLocalDay(new Date(2026, 8, 30, 23, 59, 59));
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2026, 8, 30, 0, 0]);
  });

  it('createSerialQueue işleri sırayla çalıştırmalı, hata kuyruğu kilitlememelidir', async () => {
    const runExclusive = createSerialQueue();
    const events: string[] = [];
    const task = (name: string, fail = false) => async () => {
      events.push(`${name}:start`);
      await new Promise((resolve) => setTimeout(resolve, 5));
      events.push(`${name}:end`);
      if (fail) throw new Error(name);
      return name;
    };

    const results = await Promise.allSettled([
      runExclusive(task('a', true)),
      runExclusive(task('b')),
      runExclusive(task('c')),
    ]);

    expect(events).toEqual(['a:start', 'a:end', 'b:start', 'b:end', 'c:start', 'c:end']);
    expect(results.map((r) => r.status)).toEqual(['rejected', 'fulfilled', 'fulfilled']);
  });
});
