"use client";

import { OptionsMenu } from "@/components/ui";
import { openDialog, useActiveBoard } from "@/store";

export const BOARD_OPTIONS_ID = "board-options";

export default function BoardOptions() {
  const board = useActiveBoard();

  return (
    <OptionsMenu
      id={BOARD_OPTIONS_ID}
      label="Board options"
      disabled={!board}
      iconClassName="h-4 w-auto md:h-5"
      menuClassName="mt-4.5 [position-area:bottom_span-left] md:mt-6 md:translate-x-2 lg:mt-8"
      actions={[
        {
          label: "Edit Board",
          onSelect: () =>
            openDialog({
              kind: "editBoard",
              returnFocusId: BOARD_OPTIONS_ID,
              addColumn: false,
            }),
        },
        {
          label: "Delete Board",
          destructive: true,
          onSelect: () => openDialog({ kind: "deleteBoard" }),
        },
      ]}
    />
  );
}
