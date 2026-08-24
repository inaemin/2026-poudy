/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuickFilterConflictDialog } from "./QuickFilterConflictDialog";

import { BottomSheet } from "@/components/ui/BottomSheet";

describe("QuickFilterConflictDialog", () => {
  it("중첩 확인창이 열리면 바깥 시트 대신 취소 버튼에 초점을 둔다", () => {
    render(
      <BottomSheet open title="성분" onClose={vi.fn()} submitLabel="제품 보기" onSubmit={vi.fn()}>
        <QuickFilterConflictDialog
          codeName="향료/알레르기 성분 제외"
          ingredientNames={["리모넨"]}
          onCancel={vi.fn()}
          onConfirm={vi.fn()}
        />
      </BottomSheet>,
    );

    expect(screen.getByRole("button", { name: "취소" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "닫기" }).parentElement).toHaveProperty("inert", true);
    expect(screen.getByText("‘향료/알레르기 성분 제외’을 적용합니다.")).toHaveClass("whitespace-nowrap");
  });

  it("중첩 확인창에서 Escape를 누르면 확인창만 취소한다", async () => {
    const onCancel = vi.fn();
    const onClose = vi.fn();
    render(
      <BottomSheet open title="성분" onClose={onClose} submitLabel="제품 보기" onSubmit={vi.fn()}>
        <QuickFilterConflictDialog
          codeName="향료/알레르기 성분 제외"
          ingredientNames={["리모넨"]}
          onCancel={onCancel}
          onConfirm={vi.fn()}
        />
      </BottomSheet>,
    );

    await userEvent.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("마지막 버튼에서 Tab을 누르면 취소 버튼으로 돌아간다", async () => {
    render(
      <QuickFilterConflictDialog
        codeName="향료/알레르기 성분 제외"
        ingredientNames={["리모넨"]}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    screen.getByRole("button", { name: "해제하고 적용" }).focus();
    await userEvent.tab();

    expect(screen.getByRole("button", { name: "취소" })).toHaveFocus();
  });
});
