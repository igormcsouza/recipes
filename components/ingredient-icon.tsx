import { Carrot, Cheese, Drumstick, Milk, Soup, Utensils, Wheat, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = { drumstick: Drumstick, wheat: Wheat, soup: Soup, milk: Milk, carrot: Carrot, cheese: Cheese };

export function IngredientIcon({ name }: { name: string }) {
  const Icon = ICONS[name] ?? Utensils;
  return <Icon aria-hidden className="size-4" />;
}
