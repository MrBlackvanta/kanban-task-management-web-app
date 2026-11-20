import type { Board, Column } from "@/lib";
import { dispatch } from "@/store";
import ColumnSelect from "./column-select";

type StatusSelectProps = { board: Board; column: Column; taskId: string };

export default function StatusSelect({
  board,
  column,
  taskId,
}: StatusSelectProps) {
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
    <ColumnSelect
      label="Current Status"
      columns={board.columns}
      value={column.id}
      onChange={moveTo}
    />
  );
}
