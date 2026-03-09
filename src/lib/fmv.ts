export type FmvInput = {
  mealCount: number;
  fmvPerMeal?: number | null;
  fmvTotal?: number | null;
};

export function roundToCents(value: number) {
  return Math.round(value * 100) / 100;
}

export function normalizeFmv(input: FmvInput) {
  const mealCount = input.mealCount;
  if (!Number.isInteger(mealCount) || mealCount <= 0) {
    throw new Error('Meal count must be a positive integer');
  }

  const per = input.fmvPerMeal ?? null;
  const total = input.fmvTotal ?? null;

  if (per === null && total === null) {
    throw new Error('Either FMV per meal or total FMV is required');
  }

  if (per !== null && total !== null) {
    return {
      fmvPerMeal: roundToCents(per),
      fmvTotal: roundToCents(total)
    };
  }

  if (per !== null) {
    return {
      fmvPerMeal: roundToCents(per),
      fmvTotal: roundToCents(per * mealCount)
    };
  }

  return {
    fmvPerMeal: roundToCents((total as number) / mealCount),
    fmvTotal: roundToCents(total as number)
  };
}
