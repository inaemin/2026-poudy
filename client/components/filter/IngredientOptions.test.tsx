/**
 * @vitest-environment jsdom
 */
import type { ExcludeCodeResponse } from "@poudy/api/api.zod";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { IngredientOptions } from "./IngredientOptions";

import { EMPTY_FILTER } from "@/lib/domain/filter";

const fragranceCode: readonly ExcludeCodeResponse[] = [
  {
    code: "FRAGRANCE_ALLERGENS",
    name: "향료/알레르기 성분 제외",
    description: "착향 목적의 성분입니다.",
    ingredients: [{ id: 6, koreanName: "판테놀", englishName: "Panthenol" }],
  },
];

describe("IngredientOptions", () => {
  it("제외한 성분군에 속한 성분은 포함 조건으로 고를 수 없다", async () => {
    render(
      <IngredientOptions
        draft={{ ...EMPTY_FILTER, excludeCodes: ["FRAGRANCE_ALLERGENS"] }}
        setDraft={vi.fn()}
        excludeCodes={fragranceCode}
        names={new Map()}
      />,
    );

    await userEvent.type(screen.getByRole("searchbox", { name: "성분명 검색" }), "판");

    expect(await screen.findByRole("button", { name: "판테놀 포함" })).toBeDisabled();
  });

  it("포함한 성분이 속한 빠른 필터는 고를 수 없다", () => {
    render(
      <IngredientOptions
        draft={{ ...EMPTY_FILTER, includeIngredientIds: [6] }}
        setDraft={vi.fn()}
        excludeCodes={fragranceCode}
        names={new Map([[6, "판테놀"]])}
      />,
    );

    expect(screen.getByRole("checkbox", { name: /향료\/알레르기 성분 제외/ })).toBeDisabled();
  });

  it("이미 충돌하는 조건은 어느 쪽이든 해제할 수 있다", async () => {
    const draft = {
      ...EMPTY_FILTER,
      includeIngredientIds: [6],
      excludeCodes: ["FRAGRANCE_ALLERGENS"] as const,
    };
    const setDraft = vi.fn();
    render(
      <IngredientOptions
        draft={draft}
        setDraft={setDraft}
        excludeCodes={fragranceCode}
        names={new Map([[6, "판테놀"]])}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: /향료\/알레르기 성분 제외/ });
    expect(checkbox).toBeEnabled();
    await userEvent.click(checkbox);
    expect(setDraft).toHaveBeenCalledWith({ ...draft, excludeCodes: [] });

    await userEvent.type(screen.getByRole("searchbox", { name: "성분명 검색" }), "판");
    const includeButton = await screen.findByRole("button", { name: "판테놀 포함" });
    expect(includeButton).toBeEnabled();
    await userEvent.click(includeButton);
    expect(setDraft).toHaveBeenCalledWith({ ...draft, includeIngredientIds: [], excludeIngredientIds: [] });
  });
});
