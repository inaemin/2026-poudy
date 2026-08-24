import { describe, expect, it } from "vitest";

import { fetchProductCount } from "@/lib/api/products";
import { EMPTY_FILTER } from "@/lib/domain/filter";

describe("제품 mock 성분 필터", () => {
  it("포함 성분이 든 제품만 센다", async () => {
    await expect(fetchProductCount({ ...EMPTY_FILTER, includeIngredientIds: [101] })).resolves.toEqual({ count: 2 });
  });

  it("빠른 필터에 속한 성분이 든 제품은 제외한다", async () => {
    await expect(fetchProductCount({ ...EMPTY_FILTER, excludeCodes: ["DRYING_ALCOHOLS"] })).resolves.toEqual({
      count: 3,
    });
  });

  it("개별 제외 성분이 든 제품은 제외한다", async () => {
    await expect(fetchProductCount({ ...EMPTY_FILTER, excludeIngredientIds: [6] })).resolves.toEqual({ count: 2 });
  });
});
