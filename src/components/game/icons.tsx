import { cn } from "@/lib/utils";

export const ICONS = {
  hammer: "/icons/hammer.png",
  refresh: "/icons/refresh.png",
  bomb: "/icons/bomb.png",
  frost: "/icons/frost.png",
  daily: "/icons/daily.png",
  gift: "/icons/gift.png",
  events: "/icons/events.png",
  map: "/icons/map.png",
  quests: "/icons/quests.png",
  shop: "/icons/shop.png",
  coin: "/icons/coin.png",
  gem: "/icons/gem.png",
  home: "/icons/home.png",
  adventure: "/icons/adventure.png",
  skins: "/icons/skins.png",
  more: "/icons/more.png",
  settings: "/icons/settings.png",
  challenges: "/icons/events.png",
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
