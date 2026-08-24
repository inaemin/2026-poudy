import type { ExcludeCode, Filter } from "./filter";

/** 성분군 코드에 속한 성분 ID 목록. /api/exclude-codes 응답에서 만든다. */
export type ExcludeCodeIngredients = ReadonlyMap<ExcludeCode, readonly number[]>;

export type Conflict = {
  readonly code: ExcludeCode;
  readonly ingredientIds: readonly number[];
};

export type ExcludeCodePlan = {
  readonly next: Filter;
  readonly includedIngredientIds: readonly number[];
};

/**
 * 성분군을 통째로 제외해 두고 그 안의 성분을 포함 조건으로 고르면 결과가 반드시 비어 있다.
 * 서버도 CONFLICTING_INGREDIENT_FILTER 로 400 을 돌려주므로 화면에서 먼저 막는다.
 */
export const findConflicts = (filter: Filter, codeIngredients: ExcludeCodeIngredients): readonly Conflict[] =>
  filter.excludeCodes
    .map((code) => ({
      code,
      ingredientIds: (codeIngredients.get(code) ?? []).filter((id) => filter.includeIngredientIds.includes(id)),
    }))
    .filter((conflict) => conflict.ingredientIds.length > 0);

export const hasConflict = (filter: Filter, codeIngredients: ExcludeCodeIngredients): boolean =>
  findConflicts(filter, codeIngredients).length > 0 ||
  filter.includeIngredientIds.some((id) => filter.excludeIngredientIds.includes(id));

export const findDirectConflictIngredientIds = (filter: Filter): readonly number[] =>
  filter.includeIngredientIds.filter((id) => filter.excludeIngredientIds.includes(id));

export const restrictedIngredientIds = (filter: Filter, codeIngredients: ExcludeCodeIngredients): ReadonlySet<number> =>
  new Set(filter.excludeCodes.flatMap((code) => codeIngredients.get(code) ?? []));

export const restrictedExcludeCodes = (
  filter: Filter,
  codeIngredients: ExcludeCodeIngredients,
): ReadonlySet<ExcludeCode> =>
  new Set(
    [...codeIngredients]
      .filter(([, ingredientIds]) => ingredientIds.some((id) => filter.includeIngredientIds.includes(id)))
      .map(([code]) => code),
  );

export const planExcludeCode = (
  filter: Filter,
  code: ExcludeCode,
  codeIngredients: ExcludeCodeIngredients,
): ExcludeCodePlan => {
  const covered = new Set(codeIngredients.get(code) ?? []);
  const includedIngredientIds = filter.includeIngredientIds.filter((id) => covered.has(id));

  return {
    includedIngredientIds,
    next: {
      ...filter,
      includeIngredientIds: filter.includeIngredientIds.filter((id) => !covered.has(id)),
      excludeIngredientIds: filter.excludeIngredientIds.filter((id) => !covered.has(id)),
      excludeCodes: [...new Set([...filter.excludeCodes, code])],
    },
  };
};

export const releaseIngredientFromExcludeCodes = (
  filter: Filter,
  ingredientId: number,
  codeIngredients: ExcludeCodeIngredients,
): Filter => ({
  ...filter,
  excludeCodes: filter.excludeCodes.filter((code) => !(codeIngredients.get(code) ?? []).includes(ingredientId)),
});

export const resolveGroupConflict = (
  filter: Filter,
  conflict: Conflict,
  keep: "include" | "exclude" | "neither",
): Filter => {
  const includeIngredientIds = () => {
    if (keep === "include") return filter.includeIngredientIds;
    return filter.includeIngredientIds.filter((id) => !conflict.ingredientIds.includes(id));
  };
  const excludeCodes = () => {
    if (keep === "exclude") return filter.excludeCodes;
    return filter.excludeCodes.filter((code) => code !== conflict.code);
  };

  return { ...filter, includeIngredientIds: includeIngredientIds(), excludeCodes: excludeCodes() };
};

export const resolveDirectConflict = (
  filter: Filter,
  ingredientId: number,
  keep: "include" | "exclude" | "neither",
): Filter => {
  const includeIngredientIds = () => {
    if (keep === "include") return filter.includeIngredientIds;
    return filter.includeIngredientIds.filter((id) => id !== ingredientId);
  };
  const excludeIngredientIds = () => {
    if (keep === "exclude") return filter.excludeIngredientIds;
    return filter.excludeIngredientIds.filter((id) => id !== ingredientId);
  };

  return { ...filter, includeIngredientIds: includeIngredientIds(), excludeIngredientIds: excludeIngredientIds() };
};
