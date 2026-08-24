/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { IngredientConflictResolver } from "./IngredientConflictResolver";

import { EMPTY_FILTER } from "@/lib/domain/filter";
import { excludeCodes } from "@/mocks/fixtures";

const codeIngredients = new Map(
  excludeCodes.map((code) => [code.code, code.ingredients.map((ingredient) => ingredient.id)]),
);
const names = new Map([
  [101, "리모넨"],
  [112, "에탄올"],
]);

describe("IngredientConflictResolver", () => {
  it("해결 전에는 앱 셸을 가리는 전체 화면 모달로 열린다", () => {
    render(
      <>
        <nav data-testid="app-navigation" />
        <IngredientConflictResolver
          filter={{
            ...EMPTY_FILTER,
            includeIngredientIds: [101],
            excludeCodes: ["FRAGRANCE_ALLERGENS"],
          }}
          codeIngredients={codeIngredients}
          excludeCodes={excludeCodes}
          names={names}
          onResolve={vi.fn()}
        />
      </>,
    );

    expect(screen.getByRole("dialog", { name: "함께 적용할 수 없는 조건이 있어요" })).toHaveAttribute(
      "aria-modal",
      "true",
    );
    expect(screen.getByText("조건이 있어요")).toHaveClass("whitespace-nowrap");
    expect(screen.getByText("유지할 항목을 선택해 주세요.")).toHaveClass("whitespace-nowrap");
    expect(screen.getByTestId("app-navigation")).toHaveProperty("inert", true);
    expect(screen.getByRole("radio", { name: "리모넨 포함 유지" })).toHaveFocus();
  });

  it("첫 선택지에서 이전 Tab을 누르면 마지막 선택지로 순환한다", async () => {
    render(
      <IngredientConflictResolver
        filter={{ ...EMPTY_FILTER, includeIngredientIds: [101], excludeCodes: ["FRAGRANCE_ALLERGENS"] }}
        codeIngredients={codeIngredients}
        excludeCodes={excludeCodes}
        names={names}
        onResolve={vi.fn()}
      />,
    );

    await userEvent.tab({ shift: true });

    expect(screen.getByRole("radio", { name: "둘 다 제거" })).toHaveFocus();
  });

  it("모든 충돌의 해결 방법을 고르기 전에는 계속할 수 없다", async () => {
    const onResolve = vi.fn();
    render(
      <IngredientConflictResolver
        filter={{
          ...EMPTY_FILTER,
          includeIngredientIds: [101, 112],
          excludeCodes: ["FRAGRANCE_ALLERGENS", "DRYING_ALCOHOLS"],
        }}
        codeIngredients={codeIngredients}
        excludeCodes={excludeCodes}
        names={names}
        onResolve={onResolve}
      />,
    );

    const submit = screen.getByRole("button", { name: "선택한 조건으로 계속" });
    expect(submit).toBeDisabled();
    await userEvent.click(screen.getByRole("radio", { name: "향료/알레르기 성분 제외 유지" }));
    expect(submit).toBeDisabled();
    await userEvent.click(screen.getByRole("radio", { name: "건조 알코올 제외 유지" }));
    expect(submit).toBeEnabled();
    await userEvent.click(submit);

    expect(onResolve).toHaveBeenCalledWith({
      ...EMPTY_FILTER,
      includeIngredientIds: [],
      excludeCodes: ["FRAGRANCE_ALLERGENS", "DRYING_ALCOHOLS"],
    });
  });

  it("여러 충돌 조건을 한 번에 모두 제거한다", async () => {
    const onResolve = vi.fn();
    render(
      <IngredientConflictResolver
        filter={{
          ...EMPTY_FILTER,
          includeIngredientIds: [101, 112],
          excludeCodes: ["FRAGRANCE_ALLERGENS", "DRYING_ALCOHOLS"],
        }}
        codeIngredients={codeIngredients}
        excludeCodes={excludeCodes}
        names={names}
        onResolve={onResolve}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "충돌 조건 모두 제거" }));

    expect(onResolve).toHaveBeenCalledWith({ ...EMPTY_FILTER, includeIngredientIds: [], excludeCodes: [] });
  });

  it("같은 성분의 포함과 제외 중 하나만 유지한다", async () => {
    const onResolve = vi.fn();
    render(
      <IngredientConflictResolver
        filter={{ ...EMPTY_FILTER, includeIngredientIds: [101], excludeIngredientIds: [101] }}
        codeIngredients={codeIngredients}
        excludeCodes={excludeCodes}
        names={names}
        onResolve={onResolve}
      />,
    );

    await userEvent.click(screen.getByRole("radio", { name: "리모넨 포함 유지" }));
    await userEvent.click(screen.getByRole("button", { name: "선택한 조건으로 계속" }));

    expect(onResolve).toHaveBeenCalledWith({
      ...EMPTY_FILTER,
      includeIngredientIds: [101],
      excludeIngredientIds: [],
    });
  });
});
