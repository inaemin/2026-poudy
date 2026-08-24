"use client";

import { useRef } from "react";

import { useModalLifecycle } from "@/lib/hooks/useModalLifecycle";

type QuickFilterConflictDialogProps = {
  readonly codeName: string;
  readonly ingredientNames: readonly string[];
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

export function QuickFilterConflictDialog({
  codeName,
  ingredientNames,
  onCancel,
  onConfirm,
}: QuickFilterConflictDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalLifecycle(dialogRef, { active: true, onEscape: onCancel });

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/40" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-filter-conflict-title"
        className="fixed inset-x-0 bottom-0 z-70 mx-auto w-full max-w-md rounded-t-3xl bg-white px-5 pt-6 pb-5"
      >
        <h2 id="quick-filter-conflict-title" className="text-[18px] font-bold text-text-primary">
          기존 포함 조건을 해제할까요?
        </h2>
        <p className="pt-2 text-[13px] leading-5 text-text-secondary">
          {ingredientNames.join(", ")} 포함 조건을 해제하고{" "}
          <span className="whitespace-nowrap">‘{codeName}’을 적용합니다.</span>
        </p>
        <dl className="mt-5 grid grid-cols-[64px_1fr] gap-x-3 gap-y-2 rounded-xl bg-surface px-4 py-3 text-[12px]">
          <dt className="font-semibold text-text-secondary">해제</dt>
          <dd className="font-semibold text-brand">{ingredientNames.join(", ")} 포함</dd>
          <dt className="font-semibold text-text-secondary">적용</dt>
          <dd className="font-semibold text-text-primary">{codeName}</dd>
        </dl>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 flex-1 rounded-[10px] border border-border bg-white text-[14px] font-bold text-text-primary"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-12 flex-1 rounded-[10px] bg-[#212124] text-[14px] font-bold text-white"
          >
            해제하고 적용
          </button>
        </div>
      </div>
    </>
  );
}
