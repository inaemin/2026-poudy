"use client";

import type { ExcludeCodeResponse } from "@poudy/api/api.zod";
import { useState } from "react";

import { QuickFilterConflictDialog } from "./QuickFilterConflictDialog";

import { Icon } from "@/components/ui/icons/Icon";
import { type ExcludeCodeIngredients, planExcludeCode } from "@/lib/domain/conflict";
import type { ExcludeCode, Filter } from "@/lib/domain/filter";

type QuickFilterOptionsProps = {
  readonly filter: Filter;
  readonly onChange: (filter: Filter) => void;
  readonly excludeCodes: readonly ExcludeCodeResponse[];
  readonly codeIngredients: ExcludeCodeIngredients;
  readonly names: ReadonlyMap<number, string>;
  readonly className: string;
};

export function QuickFilterOptions({
  filter,
  onChange,
  excludeCodes,
  codeIngredients,
  names,
  className,
}: QuickFilterOptionsProps) {
  const [pendingCode, setPendingCode] = useState<ExcludeCode>();
  const pendingPlan = pendingCode ? planExcludeCode(filter, pendingCode, codeIngredients) : undefined;

  const toggle = (code: ExcludeCode) => {
    if (filter.excludeCodes.includes(code)) {
      onChange({ ...filter, excludeCodes: filter.excludeCodes.filter((item) => item !== code) });
      return;
    }

    const plan = planExcludeCode(filter, code, codeIngredients);
    if (plan.includedIngredientIds.length > 0) {
      setPendingCode(code);
      return;
    }
    onChange(plan.next);
  };

  return (
    <section className={className}>
      <div className="flex h-6 items-center gap-1.5 px-0.5">
        <h2 className="text-[15px] font-bold text-[#212124]">빠른 필터</h2>
        {filter.excludeCodes.length > 0 ? (
          <span className="text-[12px] font-medium text-[#868B94]">{filter.excludeCodes.length}개 선택</span>
        ) : null}
      </div>

      <ul className="grid grid-cols-2 gap-2 pt-2">
        {excludeCodes.map((code) => {
          const checked = filter.excludeCodes.includes(code.code);
          return (
            <li key={code.code}>
              <label
                className={`flex h-13 w-full cursor-pointer items-center gap-2 rounded-[10px] border px-2.5 text-left ${
                  checked ? "border-transparent bg-[#F2F3F5]" : "border-[#DDE0E4] bg-[#F7F7F8]"
                }`}
              >
                <input type="checkbox" checked={checked} onChange={() => toggle(code.code)} className="peer sr-only" />
                <span className={`flex-1 text-[11px] text-[#4D5159] ${checked ? "font-bold" : "font-semibold"}`}>
                  {code.name}
                </span>
                <span
                  className={`flex size-[18px] shrink-0 items-center justify-center rounded border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#212124] ${
                    checked ? "border-[#212124] bg-[#212124]" : "border-[#B9BDC5] bg-white"
                  }`}
                >
                  {checked ? <Icon name="check" size={12} className="text-white" /> : null}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {pendingCode && pendingPlan ? (
        <QuickFilterConflictDialog
          codeName={excludeCodes.find((code) => code.code === pendingCode)?.name ?? pendingCode}
          ingredientNames={pendingPlan.includedIngredientIds.map((id) => names.get(id) ?? `성분 ${id}`)}
          onCancel={() => setPendingCode(undefined)}
          onConfirm={() => {
            onChange(pendingPlan.next);
            setPendingCode(undefined);
          }}
        />
      ) : null}
    </section>
  );
}
