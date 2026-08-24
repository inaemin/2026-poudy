/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { IngredientSearchScreen } from "./IngredientSearchScreen";

import { excludeCodes } from "@/mocks/fixtures";
import { server } from "@/mocks/server";

const { replace, searchParams } = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams.current,
}));

/** 조건에 걸린 제품 수를 정해 둔다. */
const countIs = (count: number) => server.use(http.get("*/api/products/count", () => HttpResponse.json({ count })));

describe("IngredientSearchScreen", () => {
  beforeEach(() => {
    searchParams.current = new URLSearchParams();
    replace.mockReset();
  });

  it("조건이 없으면 버튼을 보여 주지 않는다", () => {
    countIs(120);
    render(<IngredientSearchScreen excludeCodes={excludeCodes} />);

    expect(screen.queryByRole("button", { name: /제품 보기/ })).not.toBeInTheDocument();
  });

  it("조건이 걸리면 버튼에 그 조건의 제품 수를 보여 준다", async () => {
    countIs(7);
    searchParams.current = new URLSearchParams("includeIngredientIds=6");

    render(<IngredientSearchScreen excludeCodes={excludeCodes} />);

    expect(await screen.findByRole("button", { name: "7개 조건에 맞는 제품 보기" })).toBeInTheDocument();
  });

  it("결과 버튼은 하단 내비게이션 높이만큼 띄워 고정한다", async () => {
    countIs(7);
    searchParams.current = new URLSearchParams("includeIngredientIds=6");

    render(<IngredientSearchScreen excludeCodes={excludeCodes} />);

    const button = await screen.findByRole("button", { name: "7개 조건에 맞는 제품 보기" });
    expect(button.closest("div")).toHaveClass("bottom-18", "px-4", "py-2");
  });

  it("조건이 바뀌면 버튼의 개수도 따라 바뀐다", async () => {
    countIs(7);
    searchParams.current = new URLSearchParams("includeIngredientIds=6");

    const { rerender } = render(<IngredientSearchScreen excludeCodes={excludeCodes} />);
    expect(await screen.findByRole("button", { name: "7개 조건에 맞는 제품 보기" })).toBeInTheDocument();

    // URL 이 바뀐 것처럼 조건을 하나 더 건다.
    countIs(3);
    searchParams.current = new URLSearchParams("includeIngredientIds=6&excludeIngredientIds=8");
    rerender(<IngredientSearchScreen excludeCodes={excludeCodes} />);

    expect(await screen.findByRole("button", { name: "3개 조건에 맞는 제품 보기" })).toBeInTheDocument();
  });

  it("URL의 성분 조건이 충돌하면 제품 수를 요청하거나 결과 화면으로 이동할 수 없다", async () => {
    searchParams.current = new URLSearchParams({
      includeIngredientIds: "101",
      excludeCodes: "FRAGRANCE_ALLERGENS",
    });
    let requests = 0;
    server.use(
      http.get("*/api/products/count", () => {
        requests += 1;
        return HttpResponse.json({ count: 0 });
      }),
    );

    render(<IngredientSearchScreen excludeCodes={excludeCodes} />);

    expect(screen.getByRole("heading", { name: "함께 적용할 수 없는 조건이 있어요" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "선택한 조건으로 계속" })).toBeDisabled();
    expect(screen.queryByRole("link", { name: /조건에 맞는 제품 보기/ })).not.toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(requests).toBe(0);
  });

  it("URL 충돌에서 유지할 조건을 고르면 안전한 URL로 바꾼다", async () => {
    searchParams.current = new URLSearchParams({
      includeIngredientIds: "101",
      excludeCodes: "FRAGRANCE_ALLERGENS",
    });
    render(<IngredientSearchScreen excludeCodes={excludeCodes} />);

    await userEvent.click(await screen.findByRole("radio", { name: "리모넨 포함 유지" }));
    await userEvent.click(screen.getByRole("button", { name: "선택한 조건으로 계속" }));

    expect(replace).toHaveBeenCalledWith("/search/ingredients?includeIngredientIds=101", { scroll: false });
  });

  it("충돌 해제 직후 이전 충돌 조건으로 제품 수를 요청하지 않는다", async () => {
    searchParams.current = new URLSearchParams({
      includeIngredientIds: "101",
      excludeCodes: "FRAGRANCE_ALLERGENS",
    });
    const requestedQueries: string[] = [];
    server.use(
      http.get("*/api/products/count", ({ request }) => {
        requestedQueries.push(new URL(request.url).search);
        return HttpResponse.json({ count: 2 });
      }),
    );
    const { rerender } = render(<IngredientSearchScreen excludeCodes={excludeCodes} />);

    searchParams.current = new URLSearchParams({ includeIngredientIds: "101" });
    rerender(<IngredientSearchScreen excludeCodes={excludeCodes} />);

    expect(await screen.findByRole("button", { name: "2개 조건에 맞는 제품 보기" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "성분 검색" })).toHaveFocus();
    expect(requestedQueries).toEqual(["?includeIngredientIds=101"]);
  });
});
