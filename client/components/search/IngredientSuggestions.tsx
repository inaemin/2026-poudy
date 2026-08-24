"use client";

import type { IngredientResponse } from "@poudy/api/api.zod";

import { ConditionButton } from "@/components/ui/ConditionButton";
import { ingredientCountLabel } from "@/lib/domain/ingredient-search";

type IngredientSuggestionsProps = {
  readonly keyword: string;
  readonly items: readonly IngredientResponse[];
  readonly loading: boolean;
  readonly includedIds: readonly number[];
  readonly excludedIds: readonly number[];
  readonly blockedIncludeIds: ReadonlySet<number>;
  readonly onToggle: (key: "includeIngredientIds" | "excludeIngredientIds", item: IngredientResponse) => void;
  readonly onRelease: (ingredientId: number) => void;
};

export function IngredientSuggestions({
  keyword,
  items,
  loading,
  includedIds,
  excludedIds,
  blockedIncludeIds,
  onToggle,
  onRelease,
}: IngredientSuggestionsProps) {
  return (
    <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-[#E8E9EC] bg-white shadow-lg">
      <h3 className="flex items-center gap-1.5 border-b border-[#F2F3F6] px-3.5 py-2.5">
        <span className="truncate text-[12px] font-bold text-[#212124]">‘{keyword}’이 포함된 성분</span>
        {loading ? null : (
          <span className="shrink-0 text-[12px] font-medium text-[#868B94]">{ingredientCountLabel(items.length)}</span>
        )}
      </h3>

      {loading ? (
        <p className="flex min-h-40 items-center justify-center text-[13px] text-text-secondary">검색하는 중…</p>
      ) : items.length === 0 ? (
        <p className="flex min-h-40 items-center justify-center text-[13px] text-text-secondary">찾는 성분이 없어요</p>
      ) : (
        <ul aria-label="성분 검색 결과">
          {items.map((item) => {
            const included = includedIds.includes(item.id);
            const blocked = !included && blockedIncludeIds.has(item.id);
            return (
              <li
                key={item.id}
                className="flex h-[58px] items-center gap-1.5 border-b border-[#EEF0F3] px-3.5 last:border-b-0"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="truncate text-[12px] font-semibold text-text-primary">{item.koreanName}</span>
                  <span className="truncate text-[10px] text-text-secondary">
                    {item.skinEffects.map((effect) => effect.name).join(" · ")}
                  </span>
                </span>

                {blocked ? (
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-[11px] font-semibold text-brand">제외 중</span>
                    <button
                      type="button"
                      onClick={() => onRelease(item.id)}
                      aria-label={`${item.koreanName} 차단 필터 해제`}
                      className="h-8 rounded-2xl border border-brand px-3 text-[11px] font-bold text-brand"
                    >
                      필터 해제
                    </button>
                  </span>
                ) : (
                  <span className="flex shrink-0 gap-1.5">
                    <ConditionButton
                      kind="include"
                      active={included}
                      ingredientName={item.koreanName}
                      onClick={() => onToggle("includeIngredientIds", item)}
                    />
                    <ConditionButton
                      kind="exclude"
                      active={excludedIds.includes(item.id)}
                      ingredientName={item.koreanName}
                      onClick={() => onToggle("excludeIngredientIds", item)}
                    />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
