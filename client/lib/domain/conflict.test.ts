import { describe, expect, it } from "vitest";

import {
  type ExcludeCodeIngredients,
  findConflicts,
  findDirectConflictIngredientIds,
  hasConflict,
  planExcludeCode,
  releaseIngredientFromExcludeCodes,
  resolveDirectConflict,
  resolveGroupConflict,
  restrictedExcludeCodes,
  restrictedIngredientIds,
} from "./conflict";
import { EMPTY_FILTER, type Filter } from "./filter";

// 리모넨(101)과 리날룰(102)은 향료 성분군에 속한다.
const codeIngredients: ExcludeCodeIngredients = new Map([
  ["FRAGRANCE_ALLERGENS", [101, 102]],
  ["SULFATES", [131]],
]);

const filterWith = (changed: Partial<Filter>): Filter => ({ ...EMPTY_FILTER, ...changed });

describe("findConflicts", () => {
  it("성분군을 제외하고 그 안의 성분을 포함하면 충돌이다", () => {
    const filter = filterWith({
      excludeCodes: ["FRAGRANCE_ALLERGENS"],
      includeIngredientIds: [101],
    });

    expect(findConflicts(filter, codeIngredients)).toEqual([{ code: "FRAGRANCE_ALLERGENS", ingredientIds: [101] }]);
  });

  it("성분군에 속하지 않은 성분은 충돌이 아니다", () => {
    const filter = filterWith({
      excludeCodes: ["FRAGRANCE_ALLERGENS"],
      includeIngredientIds: [6],
    });

    expect(findConflicts(filter, codeIngredients)).toEqual([]);
  });

  it("성분군만 제외하면 충돌이 아니다", () => {
    const filter = filterWith({ excludeCodes: ["FRAGRANCE_ALLERGENS"] });
    expect(hasConflict(filter, codeIngredients)).toBe(false);
  });

  it("모르는 성분군 코드는 충돌로 보지 않는다", () => {
    const filter = filterWith({
      excludeCodes: ["CYCLIC_SILICONES"],
      includeIngredientIds: [101],
    });

    expect(hasConflict(filter, codeIngredients)).toBe(false);
  });

  it("같은 성분을 포함과 제외에 함께 넣으면 충돌이다", () => {
    const filter = filterWith({ includeIngredientIds: [6], excludeIngredientIds: [6] });

    expect(hasConflict(filter, codeIngredients)).toBe(true);
  });
});

describe("충돌 선택 제한", () => {
  it("제외한 성분군에 속한 성분 ID를 제한한다", () => {
    const filter = filterWith({ excludeCodes: ["FRAGRANCE_ALLERGENS"] });

    expect(restrictedIngredientIds(filter, codeIngredients)).toEqual(new Set([101, 102]));
  });

  it("포함한 성분이 속한 성분군 코드를 제한한다", () => {
    const filter = filterWith({ includeIngredientIds: [102, 131] });

    expect(restrictedExcludeCodes(filter, codeIngredients)).toEqual(new Set(["FRAGRANCE_ALLERGENS", "SULFATES"]));
  });
});

describe("빠른 필터 적용", () => {
  it("포함 성분과 겹치면 확인 대상과 안전한 최종 조건을 만든다", () => {
    const filter = filterWith({ includeIngredientIds: [6, 101] });

    expect(planExcludeCode(filter, "FRAGRANCE_ALLERGENS", codeIngredients)).toEqual({
      includedIngredientIds: [101],
      next: { ...filter, includeIngredientIds: [6], excludeCodes: ["FRAGRANCE_ALLERGENS"] },
    });
  });

  it("개별 제외 성분이 성분군에 포함되면 빠른 필터에 흡수한다", () => {
    const filter = filterWith({ excludeIngredientIds: [6, 101] });

    expect(planExcludeCode(filter, "FRAGRANCE_ALLERGENS", codeIngredients)).toEqual({
      includedIngredientIds: [],
      next: { ...filter, excludeIngredientIds: [6], excludeCodes: ["FRAGRANCE_ALLERGENS"] },
    });
  });

  it("검색 결과에서 성분을 막는 빠른 필터만 해제한다", () => {
    const filter = filterWith({ excludeCodes: ["FRAGRANCE_ALLERGENS", "SULFATES"] });

    expect(releaseIngredientFromExcludeCodes(filter, 101, codeIngredients).excludeCodes).toEqual(["SULFATES"]);
  });
});

describe("URL 충돌 해결", () => {
  it("같은 성분의 포함·제외 충돌을 모두 찾는다", () => {
    const filter = filterWith({ includeIngredientIds: [6, 101], excludeIngredientIds: [101, 102] });

    expect(findDirectConflictIngredientIds(filter)).toEqual([101]);
  });

  it("성분군 충돌에서 포함 조건을 유지하면 성분군만 해제한다", () => {
    const filter = filterWith({ includeIngredientIds: [101], excludeCodes: ["FRAGRANCE_ALLERGENS", "SULFATES"] });
    const [conflict] = findConflicts(filter, codeIngredients);
    expect(conflict).toBeDefined();
    if (!conflict) return;

    expect(resolveGroupConflict(filter, conflict, "include")).toEqual({
      ...filter,
      excludeCodes: ["SULFATES"],
    });
  });

  it("성분군 충돌에서 제외 조건을 유지하면 충돌 성분만 포함에서 뺀다", () => {
    const filter = filterWith({ includeIngredientIds: [6, 101], excludeCodes: ["FRAGRANCE_ALLERGENS"] });
    const [conflict] = findConflicts(filter, codeIngredients);
    expect(conflict).toBeDefined();
    if (!conflict) return;

    expect(resolveGroupConflict(filter, conflict, "exclude")).toEqual({ ...filter, includeIngredientIds: [6] });
  });

  it("직접 충돌에서 둘 다 제거할 수 있다", () => {
    const filter = filterWith({ includeIngredientIds: [6, 101], excludeIngredientIds: [101, 102] });

    expect(resolveDirectConflict(filter, 101, "neither")).toEqual({
      ...filter,
      includeIngredientIds: [6],
      excludeIngredientIds: [102],
    });
  });
});
