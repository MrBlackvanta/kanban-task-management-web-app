import { placeholderIndex, type Column } from "@/lib";
import type { DragSession } from "@/store";
import type { CSSProperties } from "react";
import TaskCard from "./task-card";

const dotColors = ["bg-cyan", "bg-violet", "bg-mint"];

type BoardColumnProps = {
  column: Column;
  index: number;
  session: DragSession | undefined;
};

export default function BoardColumn({
  column,
  index,
  session,
}: BoardColumnProps) {
  const pointerSession = session?.mode === "pointer" ? session : undefined;
  const hiddenId = pointerSession?.taskId;
  const liftedId = session?.mode === "keyboard" ? session.taskId : undefined;
  const dropSlot =
    pointerSession?.slot.columnId === column.id ? pointerSession : undefined;

  const cards = column.tasks.map((task) => (
    <li key={task.id} data-task-id={task.id} hidden={task.id === hiddenId}>
      <TaskCard task={task} lifted={task.id === liftedId} />
    </li>
  ));
  const items = dropSlot
    ? cards.toSpliced(
        placeholderIndex(dropSlot.origin, dropSlot.slot),
        0,
        <DropPlaceholder key=":placeholder" height={dropSlot.ghost.height} />,
      )
    : cards;
  const shownCount =
    column.tasks.filter((task) => task.id !== hiddenId).length +
    (dropSlot ? 1 : 0);

  return (
    <section data-column-id={column.id} className="flex w-70 shrink-0 flex-col">
      <h2 className="flex items-center text-heading-s text-muted uppercase">
        <span
          aria-hidden="true"
          className={`mr-3 size-3.75 shrink-0 rounded-full ${dotColors[index % dotColors.length]}`}
        />
        <span className="truncate">{column.name}</span>
        <span className="shrink-0 whitespace-pre">{` (${column.tasks.length})`}</span>
      </h2>
      <ol
        className={`mt-6 flex flex-1 flex-col gap-5 ${shownCount === 0 ? "rounded-lg border-2 border-dashed border-muted/30" : ""}`}
      >
        {items}
      </ol>
    </section>
  );
}

function DropPlaceholder({ height }: { height: number }) {
  return (
    <li
      aria-hidden="true"
      style={{ "--slot-height": `${height}px` } as CSSProperties}
      className="h-(--slot-height) rounded-lg border-2 border-dashed border-muted/30"
    />
  );
}
