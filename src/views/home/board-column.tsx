import type { Column } from "@/lib";
import TaskCard from "./task-card";

const dotColors = ["bg-cyan", "bg-violet", "bg-mint"];

export default function BoardColumn({
  column,
  index,
}: {
  column: Column;
  index: number;
}) {
  return (
    <section className="flex w-70 shrink-0 flex-col">
      <h2 className="flex items-center text-heading-s text-muted uppercase">
        <span
          aria-hidden="true"
          className={`mr-3 size-3.75 shrink-0 rounded-full ${dotColors[index % dotColors.length]}`}
        />
        <span className="truncate">{column.name}</span>
        <span className="shrink-0 whitespace-pre">{` (${column.tasks.length})`}</span>
      </h2>
      <ol className="mt-6 flex flex-1 flex-col gap-5 empty:rounded-lg empty:border-2 empty:border-dashed empty:border-muted/30">
        {column.tasks.map((task) => (
          <li key={task.id}>
            <TaskCard task={task} />
          </li>
        ))}
      </ol>
    </section>
  );
}
