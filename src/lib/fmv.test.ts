import { describe, expect, it } from 'vitest';
import { normalizeFmv } from './fmv';

describe('normalizeFmv', () => {
  it('computes total from per-meal input', () => {
    const result = normalizeFmv({ mealCount: 10, fmvPerMeal: 8.5 });
    expect(result.fmvPerMeal).toBe(8.5);
    expect(result.fmvTotal).toBe(85);
  });

  it('computes per-meal from total input', () => {
    const result = normalizeFmv({ mealCount: 8, fmvTotal: 100 });
    expect(result.fmvPerMeal).toBe(12.5);
    expect(result.fmvTotal).toBe(100);
  });

  it('throws if no FMV values are provided', () => {
    expect(() => normalizeFmv({ mealCount: 8 })).toThrow();
  });
});
