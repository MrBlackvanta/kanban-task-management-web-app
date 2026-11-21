"use client";

import { ErrorPanel } from "@/components/layout";

type PageErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PageError({ reset }: PageErrorProps) {
  return (
    <ErrorPanel
      title="Something went wrong"
      description="This board couldn’t be shown. Every change that saved is still saved, so trying again picks up where you left off."
    >
      <button type="button" onClick={reset} className="v-button-l">
        Try again
      </button>
    </ErrorPanel>
  );
}
