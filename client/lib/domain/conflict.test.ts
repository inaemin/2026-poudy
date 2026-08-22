import { describe, expect, it } from "vitest";

import {
  type ExcludeCodeIngredients,
  findConflicts,
  hasConflict,
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
