/**
 * @vitest-environment jsdom
 */
import type { ExcludeCodeResponse } from "@poudy/api/api.zod";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { IngredientSearchPanel } from "./IngredientSearchPanel";

import { EMPTY_FILTER, type Filter } from "@/lib/domain/filter";

const excludeCodes: readonly ExcludeCodeResponse[] = [
  {
    code: "FRAGRANCE_ALLERGENS",
    name: "향료/알레르기 성분 제외",
    description: "착향 목적의 성분입니다.",
    ingredients: [{ id: 6, koreanName: "판테놀", englishName: "Panthenol" }],
  },
];

const setup = (filter: Filter = EMPTY_FILTER) => {
  const onChange = vi.fn();
  render(
    <IngredientSearchPanel
      filter={filter}
      onChange={onChange}
      excludeCodes={excludeCodes}
      names={new Map([[6, "판테놀"]])}
    />,
  );
  return { onChange };
};

/**
 * 자동완성이 뜨도록 검색어를 넣는다.
 * 결과가 여러 개라 성분 이름으로 행을 특정한 뒤 그 안의 버튼을 찾는다.
 */
const search = async (name = "판테놀") => {
  await userEvent.type(screen.getByRole("searchbox", { name: "성분 검색" }), "판");

  const row = await waitFor(() => {
    const list = screen.getByRole("list", { name: "성분 검색 결과" });
    const found = within(list).getByText(name).closest("li");
    if (!found) throw new Error(`${name} 행을 찾지 못했습니다`);
    return found;
  });

  return within(row);
};

describe("IngredientSearchPanel", () => {
  it("입력하기 전에는 자동완성을 띄우지 않는다", () => {
    setup();

    expect(screen.queryByRole("list", { name: "성분 검색 결과" })).not.toBeInTheDocument();
  });

  it("입력하면 입력 아래에 자동완성을 띄운다", async () => {
    setup();
    await search();

    expect(screen.getByRole("list", { name: "성분 검색 결과" })).toBeInTheDocument();
  });

  it("Esc 를 누르면 자동완성을 닫는다", async () => {
    setup();
    await search();

    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("list", { name: "성분 검색 결과" })).not.toBeInTheDocument());
  });

  it("바깥을 누르면 자동완성을 닫는다", async () => {
    setup();
    await search();

    await userEvent.click(screen.getByText("빠른 필터"));

    await waitFor(() => expect(screen.queryByRole("list", { name: "성분 검색 결과" })).not.toBeInTheDocument());
  });

  it("포함을 고르면 포함 조건에 담는다", async () => {
    const { onChange } = setup();
    const row = await search();
    await userEvent.click(row.getByRole("button", { name: "판테놀 포함" }));

    expect(onChange).toHaveBeenCalledWith({
      includeIngredientIds: [6],
      excludeIngredientIds: [],
    });
  });

  it("제외를 고르면 이미 담긴 포함 조건에서 뺀다", async () => {
    const { onChange } = setup({ ...EMPTY_FILTER, includeIngredientIds: [6] });
    const row = await search();

    await userEvent.click(row.getByRole("button", { name: "판테놀 제외" }));

    expect(onChange).toHaveBeenCalledWith({
      excludeIngredientIds: [6],
      includeIngredientIds: [],
    });
  });

  it("포함을 고르면 이미 담긴 제외 조건에서 뺀다", async () => {
    const { onChange } = setup({ ...EMPTY_FILTER, excludeIngredientIds: [6] });
    const row = await search();

    await userEvent.click(row.getByRole("button", { name: "판테놀 포함" }));

    expect(onChange).toHaveBeenCalledWith({
      includeIngredientIds: [6],
      excludeIngredientIds: [],
    });
  });

  it("이미 고른 조건을 다시 누르면 뺀다", async () => {
    const { onChange } = setup({ ...EMPTY_FILTER, includeIngredientIds: [6] });
    const row = await search();

    await userEvent.click(row.getByRole("button", { name: "판테놀 포함" }));

    expect(onChange).toHaveBeenCalledWith({
      includeIngredientIds: [],
      excludeIngredientIds: [],
    });
  });

  it("고른 조건만 눌린 상태로 보여 준다", async () => {
    setup({ ...EMPTY_FILTER, includeIngredientIds: [6] });
    const row = await search();

    expect(row.getByRole("button", { name: "판테놀 포함" })).toHaveAttribute("aria-pressed", "true");
    expect(row.getByRole("button", { name: "판테놀 제외" })).toHaveAttribute("aria-pressed", "false");
  });

  it("담은 조건을 선택한 성분 영역에 보여 준다", () => {
    setup({ ...EMPTY_FILTER, includeIngredientIds: [6] });

    expect(screen.getByRole("button", { name: "판테놀 포함 조건 삭제" })).toBeInTheDocument();
  });

  it("선택한 성분의 삭제를 누르면 그 조건만 뺀다", async () => {
    const { onChange } = setup({ ...EMPTY_FILTER, includeIngredientIds: [6] });

    await userEvent.click(screen.getByRole("button", { name: "판테놀 포함 조건 삭제" }));

    expect(onChange).toHaveBeenCalledWith({ includeIngredientIds: [] });
  });

  it("빠른 필터는 설명 없이 라벨만 보여 준다", () => {
    setup();

    expect(screen.getByRole("checkbox", { name: /향료\/알레르기 성분 제외/ })).toBeInTheDocument();
    expect(screen.queryByText("착향 목적의 성분입니다.")).not.toBeInTheDocument();
  });

  it("제외한 성분군에 속한 성분은 상태와 필터 해제 동작을 보여 준다", async () => {
    const { onChange } = setup({ ...EMPTY_FILTER, excludeCodes: ["FRAGRANCE_ALLERGENS"] });

    const row = await search();

    expect(row.getByText("제외 중")).toBeInTheDocument();
    await userEvent.click(row.getByRole("button", { name: "판테놀 차단 필터 해제" }));
    expect(onChange).toHaveBeenCalledWith({ excludeCodes: [] });
  });

  it("포함한 성분이 속한 빠른 필터를 누르면 확인을 요청한다", async () => {
    const { onChange } = setup({ ...EMPTY_FILTER, includeIngredientIds: [6] });

    await userEvent.click(screen.getByRole("checkbox", { name: /향료\/알레르기 성분 제외/ }));

    expect(screen.getByRole("dialog", { name: "기존 포함 조건을 해제할까요?" })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("확인하면 포함 성분을 해제하고 빠른 필터를 적용한다", async () => {
    const filter = { ...EMPTY_FILTER, includeIngredientIds: [6] };
    const { onChange } = setup(filter);

    await userEvent.click(screen.getByRole("checkbox", { name: /향료\/알레르기 성분 제외/ }));
    await userEvent.click(screen.getByRole("button", { name: "해제하고 적용" }));

    expect(onChange).toHaveBeenCalledWith({
      ...filter,
      includeIngredientIds: [],
      excludeCodes: ["FRAGRANCE_ALLERGENS"],
    });
  });

  it("개별 제외 성분은 더 넓은 빠른 필터에 자동으로 흡수한다", async () => {
    const filter = { ...EMPTY_FILTER, excludeIngredientIds: [6] };
    const { onChange } = setup(filter);

    await userEvent.click(screen.getByRole("checkbox", { name: /향료\/알레르기 성분 제외/ }));

    expect(onChange).toHaveBeenCalledWith({
      ...filter,
      excludeIngredientIds: [],
      excludeCodes: ["FRAGRANCE_ALLERGENS"],
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("이미 충돌하는 조건은 어느 쪽이든 해제할 수 있다", async () => {
    const filter = {
      ...EMPTY_FILTER,
      includeIngredientIds: [6],
      excludeCodes: ["FRAGRANCE_ALLERGENS"] as const,
    };
    const { onChange } = setup(filter);

    const checkbox = screen.getByRole("checkbox", { name: /향료\/알레르기 성분 제외/ });
    expect(checkbox).toBeEnabled();
    await userEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith({ ...filter, excludeCodes: [] });

    const row = await search();
    const includeButton = row.getByRole("button", { name: "판테놀 포함" });
    expect(includeButton).toBeEnabled();
    await userEvent.click(includeButton);
    expect(onChange).toHaveBeenCalledWith({ includeIngredientIds: [], excludeIngredientIds: [] });
  });
});
