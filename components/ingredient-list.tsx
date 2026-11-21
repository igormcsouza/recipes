"use client";
import { Check } from "lucide-react";
import { useState } from "react";
import type { Ingredient } from "@/lib/recipes";

/** Tap an ingredient to tick it off while cooking. */
export function IngredientList({ items }: { items: Ingredient[] }) {
  const [done, setDone] = useState<Record<number, boolean>>({});
  return (
    <ul>
      {items.map((ing, i) => (
        <li key={i} className="border-b last:border-b-0">
          <button
            type="button"
            aria-pressed={!!done[i]}
            onClick={() => setDone({ ...done, [i]: !done[i] })}
            className={`group flex w-full items-start gap-3.5 py-3.5 text-left ${done[i] ? "opacity-55" : ""}`}
          >
            <span
              className={`mt-px grid size-[26px] shrink-0 place-items-center rounded-full border-2 transition ${done[i] ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}
            >
              <Check aria-hidden className={`size-3.5 ${done[i] ? "" : "opacity-0"}`} strokeWidth={3} />
            </span>
            <span className={`flex flex-col gap-[3px] ${done[i] ? "line-through" : ""}`}>
              <span className="text-base font-medium leading-snug min-[720px]:text-[17px]">{ing.text}</span>
              {ing.note && <span className="text-sm leading-[1.45] text-muted-foreground">{ing.note}</span>}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
