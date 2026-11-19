import { ChevronDownIcon } from "@/components/icons";
import type { Board, Column } from "@/lib";
import { dispatch } from "@/store";
import { useId } from "react";

type StatusSelectProps = { board: Board; column: Column; taskId: string };

export default function StatusSelect({
  board,
  column,
  taskId,
}: StatusSelectProps) {
  const selectId = useId();

  function moveTo(columnId: string) {
    const target = board.columns.find((candidate) => candidate.id === columnId);
    if (!target) return;
    dispatch({
      type: "moveTask",
      taskId,
      columnId,
      index: target.tasks.length,
    });
  }

  return (
    <div>
      <label htmlFor={selectId} className="block text-body-m text-label">
        Current Status
      </label>
      <div className="relative mt-2">
        <select
          id={selectId}
          value={column.id}
          onChange={(event) => moveTo(event.target.value)}
          className="peer/status v-select flex h-10 w-full cursor-pointer items-center rounded-sm border border-grey/25 bg-transparent pr-10 pl-4 text-body-l text-ink transition-[border-color] open:border-purple hover:border-purple focus-visible:border-purple"
        >
          {board.columns.map((option) => (
            <option
              key={option.id}
              value={option.id}
              className="text-body-l text-muted not-first:mt-2 hover:text-ink focus-visible:text-ink"
            >
              {option.name}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-purple peer-open/status:rotate-180" />
      </div>
    </div>
  );
}
