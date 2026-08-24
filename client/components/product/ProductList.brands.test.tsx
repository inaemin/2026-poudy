/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProductList } from "./ProductList";

import { brands, categories, excludeCodes } from "@/mocks/fixtures";
import { server } from "@/mocks/server";

vi.mock("@/lib/analytics/track", () => ({ track: vi.fn() }));

const navigation = vi.hoisted(() => ({ replace: vi.fn(), searchParams: new URLSearchParams() }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
  useRouter: () => ({ replace: navigation.replace, push: vi.fn() }),
  useSearchParams: () => navigation.searchParams,
}));

beforeEach(() => {
  navigation.searchParams = new URLSearchParams();
  navigation.replace.mockReset();
});

const openBrandSheet = async () => {
  render(<ProductList categories={categories} brands={brands} excludeCodes={excludeCodes} />);

  // 목록 응답이 도착해 조건에 걸린 브랜드를 알게 될 때까지 기다린다.
  await waitFor(() => expect(screen.getByRole("list")).toBeInTheDocument());

  await userEvent.click(screen.getByRole("button", { name: /브랜드/ }));

  // 제품 카드에도 브랜드 이름이 나오므로 시트 안으로 범위를 좁힌다.
  return within(await screen.findByRole("dialog"));
};

describe("ProductList 브랜드 시트", () => {
  it("조건에 걸린 브랜드만 고를 수 있다", async () => {
    const sheet = await openBrandSheet();

    // 닥터지(id 5)는 픽스처에 제품이 없어 목록에서 빠진다.
    await waitFor(() => expect(sheet.getByText("라운드랩")).toBeInTheDocument());
    expect(sheet.queryByText("닥터지")).not.toBeInTheDocument();
  });

  it("URL의 성분 조건이 충돌하면 제품 목록을 요청하지 않는다", async () => {
    navigation.searchParams = new URLSearchParams({
      includeIngredientIds: "101",
      excludeCodes: "FRAGRANCE_ALLERGENS",
    });
    let requests = 0;
    server.use(
      http.get("*/api/products", () => {
        requests += 1;
        return HttpResponse.json({
          items: [],
          brands: [],
          pagination: { page: 0, size: 20, totalElements: 0, totalPages: 0, hasNext: false },
        });
      }),
    );

    render(<ProductList categories={categories} brands={brands} excludeCodes={excludeCodes} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("제품을 불러오기 전에 성분 조건을 확인해 주세요");
    expect(screen.queryByText("총 0개")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "제품명 오름차순" })).not.toBeInTheDocument();
    expect(screen.getByText("성분 조건을 확인해 주세요")).toHaveClass("whitespace-nowrap");
    expect(screen.getByText("제외한 성분군의 성분을 포함하고 있어요.")).toHaveClass("whitespace-nowrap");
    expect(screen.queryByText("불러오는 중…")).not.toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(requests).toBe(0);
  });

  it("충돌 안내에서 성분 시트를 열어 조건을 고친다", async () => {
    navigation.searchParams = new URLSearchParams({
      includeIngredientIds: "101",
      excludeCodes: "FRAGRANCE_ALLERGENS",
    });
    render(<ProductList categories={categories} brands={brands} excludeCodes={excludeCodes} />);

    await userEvent.click(await screen.findByRole("button", { name: "성분 조건 수정하기" }));
    const sheet = within(screen.getByRole("dialog", { name: "성분" }));
    await userEvent.click(sheet.getByRole("checkbox", { name: /향료\/알레르기 성분 제외/ }));
    await userEvent.click(sheet.getByRole("button", { name: /제품 보기/ }));

    expect(navigation.replace).toHaveBeenCalledWith("/products?includeIngredientIds=101", { scroll: false });
  });
});
