import { Logo } from "@/components/icons";
import type { ReactNode } from "react";
import Signature from "./signature";

type ErrorPanelProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function ErrorPanel({
  title,
  description,
  children,
}: ErrorPanelProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 shrink-0 items-center bg-surface px-4 md:box-content md:h-20 md:border-b md:border-line md:px-6 lg:h-24 lg:px-8">
        <Logo className="text-ink" />
      </header>
      <main className="relative flex flex-1 flex-col items-center justify-center gap-6 px-4 pt-8 pb-16 text-center md:px-6 md:pb-20 lg:gap-8 lg:pb-24">
        <div className="flex max-w-120 flex-col gap-4">
          <h1 className="text-heading-xl">{title}</h1>
          <p className="text-heading-l text-pretty text-muted">{description}</p>
        </div>
        {children}
        <Signature />
      </main>
    </div>
  );
}
