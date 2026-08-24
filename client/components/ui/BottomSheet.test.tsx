/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BottomSheet } from "./BottomSheet";

const sheet = (open: boolean, onClose = vi.fn()) => (
  <>
    <button type="button">배경 동작</button>
    <BottomSheet open={open} title="필터" onClose={onClose} submitLabel="적용" onSubmit={vi.fn()}>
      <input aria-label="필터 값" />
    </BottomSheet>
  </>
);

describe("BottomSheet", () => {
  it("열리면 배경과 스크롤을 잠그고 첫 조작 요소로 초점을 옮긴다", () => {
    render(sheet(true));

    expect(screen.getByRole("button", { name: "배경 동작" })).toHaveProperty("inert", true);
    expect(document.body).toHaveStyle({ overflow: "hidden" });
    expect(screen.getByRole("button", { name: "닫기" })).toHaveFocus();
  });

  it("마지막 조작 요소에서 Tab을 누르면 처음으로 돌아간다", async () => {
    render(sheet(true));

    screen.getByRole("button", { name: "적용" }).focus();
    await userEvent.tab();

    expect(screen.getByRole("button", { name: "닫기" })).toHaveFocus();
  });

  it("배경막을 누르면 시트를 닫는다", async () => {
    const onClose = vi.fn();
    render(sheet(true, onClose));

    const backdrop = screen.getByTestId("bottom-sheet-backdrop");
    expect(backdrop.inert).not.toBe(true);
    await userEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("닫히면 배경과 스크롤 상태를 복원한다", () => {
    const { rerender } = render(sheet(true));

    rerender(sheet(false));

    expect(screen.getByRole("button", { name: "배경 동작" }).inert).not.toBe(true);
    expect(document.body).not.toHaveStyle({ overflow: "hidden" });
  });
});
