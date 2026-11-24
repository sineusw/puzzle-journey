import { cn } from "@/lib/utils";

export const ICONS = {
  hammer: "/icons/hammer.webp",
  refresh: "/icons/refresh.webp",
  bomb: "/icons/bomb.webp",
  frost: "/icons/frost.webp",
  daily: "/icons/daily.webp",
  gift: "/icons/gift.webp",
  events: "/icons/events.webp",
  map: "/icons/map.webp",
  quests: "/icons/quests.webp",
  shop: "/icons/shop.webp",
  coin: "/icons/coin.webp",
  gem: "/icons/gem.webp",
  home: "/icons/home.webp",
  adventure: "/icons/adventure.webp",
  skins: "/icons/skins.webp",
  more: "/icons/more.webp",
  settings: "/icons/settings.webp",
  challenges: "/icons/events.webp",
} as const;

export type IconName = keyof typeof ICONS;

export function GameIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <img
      src={ICONS[name]}
      alt=""
      draggable={false}
      className={cn("pj-ico", className)}
    />
  );
}
