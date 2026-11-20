import type { ComponentProps, ReactNode } from "react";

type Tone = "idle" | "current" | "accent";

const tones: Record<Tone, string> = {
  idle: "text-muted hover:bg-purple/10 hover:text-purple dark:hover:bg-white",
  current: "bg-purple text-white focus-visible:outline-white",
  accent:
    "text-accent-ink not-aria-disabled:hover:bg-purple/10 not-aria-disabled:hover:text-purple aria-disabled:cursor-not-allowed aria-disabled:opacity-25 dark:not-aria-disabled:hover:bg-white",
};

type NavPillProps = ComponentProps<"button"> & {
  icon: ReactNode;
  tone?: Tone;
};

export default function NavPill({
  icon,
  tone = "idle",
  children,
  ...props
}: NavPillProps) {
  return (
    <button
      type="button"
      className={`flex h-12 w-60 items-center gap-3 rounded-r-full pl-6 text-left text-heading-m -outline-offset-4 transition-[color,background-color] lg:w-69 lg:gap-4 lg:pl-8 ${tones[tone]}`}
      {...props}
    >
      <span className="flex w-4 shrink-0 justify-center *:shrink-0">
        {icon}
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}
