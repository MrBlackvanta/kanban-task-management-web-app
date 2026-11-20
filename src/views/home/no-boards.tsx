import { openDialog } from "@/store";

export const CREATE_FIRST_BOARD_ID = "create-first-board";

export default function NoBoards() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-4 pb-16 text-center md:px-6 md:pb-20 lg:gap-8 lg:pb-24">
      <p className="text-heading-l text-pretty text-muted">
        There are no boards yet. Create a new board to get started.
      </p>
      <button
        id={CREATE_FIRST_BOARD_ID}
        type="button"
        onClick={() =>
          openDialog({ kind: "addBoard", returnFocusId: CREATE_FIRST_BOARD_ID })
        }
        className="h-12 rounded-full bg-purple px-4.5 text-heading-m text-white transition-[background-color] hover:bg-purple-hover"
      >
        <span aria-hidden="true">+ </span>Create New Board
      </button>
    </div>
  );
}
