"use client";

import type { ExcludeCodeResponse } from "@poudy/api/api.zod";
import { useId, useRef, useState } from "react";

import {
  type ExcludeCodeIngredients,
  findConflicts,
  findDirectConflictIngredientIds,
  resolveDirectConflict,
  resolveGroupConflict,
} from "@/lib/domain/conflict";
import type { Filter } from "@/lib/domain/filter";
import { useModalLifecycle } from "@/lib/hooks/useModalLifecycle";

type Resolution = "include" | "exclude" | "neither";

type IngredientConflictResolverProps = {
  readonly filter: Filter;
  readonly codeIngredients: ExcludeCodeIngredients;
  readonly excludeCodes: readonly ExcludeCodeResponse[];
  readonly names: ReadonlyMap<number, string>;
  readonly onResolve: (filter: Filter) => void;
};

export function IngredientConflictResolver({
  filter,
  codeIngredients,
  excludeCodes,
  names,
  onResolve,
}: IngredientConflictResolverProps) {
  const groupConflicts = findConflicts(filter, codeIngredients);
  const directIngredientIds = findDirectConflictIngredientIds(filter);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [resolutions, setResolutions] = useState<Readonly<Record<string, Resolution>>>({});
  const total = groupConflicts.length + directIngredientIds.length;
  const complete = Object.keys(resolutions).length === total;
  useModalLifecycle(dialogRef, { active: true, restoreFocus: false });

  const choose = (key: string, resolution: Resolution) =>
    setResolutions((current) => ({ ...current, [key]: resolution }));

  const apply = () => {
    if (!complete) return;

    const groupResolved = groupConflicts.reduce((current, conflict) => {
      const resolution = resolutions[`group:${conflict.code}`];
      return resolution ? resolveGroupConflict(current, conflict, resolution) : current;
    }, filter);
    const resolved = directIngredientIds.reduce((current, ingredientId) => {
      const resolution = resolutions[`direct:${ingredientId}`];
      return resolution ? resolveDirectConflict(current, ingredientId, resolution) : current;
    }, groupResolved);

    onResolve(resolved);
  };

  const removeAll = () => {
    const groupResolved = groupConflicts.reduce(
      (current, conflict) => resolveGroupConflict(current, conflict, "neither"),
      filter,
    );
    onResolve(
      directIngredientIds.reduce(
        (current, ingredientId) => resolveDirectConflict(current, ingredientId, "neither"),
        groupResolved,
      ),
    );
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-y-auto bg-white px-5 pt-8 pb-5"
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <p className="text-[12px] font-bold text-brand">성분 조건 확인</p>
        <h1 id={titleId} className="pt-2 text-[24px] leading-8 font-bold text-text-primary">
          함께 적용할 수 없는 <span className="whitespace-nowrap">조건이 있어요</span>
        </h1>
        <p className="pt-2 text-[13px] leading-5 text-text-secondary">
          제품을 조회하기 전에 각 조건에서 <span className="whitespace-nowrap">유지할 항목을 선택해 주세요.</span>
        </p>

        <div className="flex flex-col gap-4 pt-6">
          {groupConflicts.map((conflict) => {
            const key = `group:${conflict.code}`;
            const codeName = excludeCodes.find((code) => code.code === conflict.code)?.name ?? conflict.code;
            const ingredientName = conflict.ingredientIds.map((id) => names.get(id) ?? `성분 ${id}`).join(", ");
            return (
              <ConflictChoice
                key={key}
                title={`${ingredientName} · ${codeName}`}
                selected={resolutions[key]}
                includeLabel={`${ingredientName} 포함 유지`}
                excludeLabel={`${codeName} 유지`}
                onChoose={(resolution) => choose(key, resolution)}
              />
            );
          })}

          {directIngredientIds.map((ingredientId) => {
            const key = `direct:${ingredientId}`;
            const ingredientName = names.get(ingredientId) ?? `성분 ${ingredientId}`;
            return (
              <ConflictChoice
                key={key}
                title={`${ingredientName} 포함 · 제외`}
                selected={resolutions[key]}
                includeLabel={`${ingredientName} 포함 유지`}
                excludeLabel={`${ingredientName} 제외 유지`}
                onChoose={(resolution) => choose(key, resolution)}
              />
            );
          })}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-8">
          {total > 1 ? (
            <button
              type="button"
              onClick={removeAll}
              className="h-12 rounded-[10px] border border-border bg-white text-[14px] font-bold text-text-primary"
            >
              충돌 조건 모두 제거
            </button>
          ) : null}
          <button
            type="button"
            disabled={!complete}
            onClick={apply}
            className="h-13 rounded-[10px] bg-[#212124] text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            선택한 조건으로 계속
          </button>
        </div>
      </div>
    </div>
  );
}

function ConflictChoice({
  title,
  selected,
  includeLabel,
  excludeLabel,
  onChoose,
}: {
  readonly title: string;
  readonly selected?: Resolution;
  readonly includeLabel: string;
  readonly excludeLabel: string;
  readonly onChoose: (resolution: Resolution) => void;
}) {
  const options: readonly { readonly value: Resolution; readonly label: string }[] = [
    { value: "include", label: includeLabel },
    { value: "exclude", label: excludeLabel },
    { value: "neither", label: "둘 다 제거" },
  ];

  return (
    <fieldset className="rounded-2xl border border-border p-4">
      <legend className="px-1 text-[14px] font-bold text-text-primary">{title}</legend>
      <div className="flex flex-col gap-2 pt-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 text-[13px] font-semibold ${
              selected === option.value ? "border-[#212124] bg-[#F2F3F5]" : "border-border bg-white"
            }`}
          >
            <input
              type="radio"
              name={title}
              checked={selected === option.value}
              onChange={() => onChoose(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
