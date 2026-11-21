"use client";

import { DarkThemeIcon, LightThemeIcon } from "@/components/icons";
import { chooseTheme, useTheme } from "@/store";

export default function ThemeSwitch({ className }: { className: string }) {
  const theme = useTheme();

  return (
    <label
      className={`group/theme flex h-12 shrink-0 cursor-pointer items-center justify-center gap-6 rounded-md bg-inset text-grey ${className}`}
    >
      <LightThemeIcon />
      <input
        type="checkbox"
        aria-label="Dark theme"
        checked={theme === "dark"}
        onChange={(event) =>
          chooseTheme(event.target.checked ? "dark" : "light")
        }
        className="peer/switch sr-only"
      />
      <span className="flex h-5 w-10 rounded-full bg-purple p-0.75 transition-[background-color] group-hover/theme:bg-purple-hover peer-focus-visible/switch:outline-2 peer-focus-visible/switch:outline-offset-2 peer-focus-visible/switch:outline-accent-ink">
        <span className="size-3.5 rounded-full bg-white motion-safe:transition-[translate] motion-safe:duration-(--motion-quick) motion-safe:ease-enter dark:translate-x-5" />
      </span>
      <DarkThemeIcon />
    </label>
  );
}
