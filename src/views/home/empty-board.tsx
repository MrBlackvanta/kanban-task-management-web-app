import { openDialog } from "@/store";

export const ADD_COLUMN_ID = "add-column";

export default function EmptyBoard() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-4 pb-16 text-center md:px-6 md:pb-20 lg:gap-8 lg:pb-24">
      <p className="text-heading-l text-pretty text-muted">
        This board is empty. Create a new column to get started.
      </p>
      <button
        id={ADD_COLUMN_ID}
        type="button"
        onClick={() => openDialog({ kind: "editBoard", addColumn: true })}
        className="v-button-l"
      >
        <span aria-hidden="true">+ </span>Add New Column
      </button>
    </div>
  );
}
