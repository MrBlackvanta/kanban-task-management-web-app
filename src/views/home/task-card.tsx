import { completedCount, type Task } from "@/lib";
import { openDialog } from "@/store";
import { taskCardId } from "./card-focus";
import { onCardKeyDown, onCardKeyUp } from "./keyboard-drag";

export const DRAG_HINT_ID = "drag-hint";

export default function TaskCard({
  task,
  lifted,
}: {
  task: Task;
  lifted: boolean;
}) {
  return (
    <article
      className={`relative rounded-lg bg-surface px-4 py-5.75 select-none [-webkit-touch-callout:none] ${lifted ? "shadow-menu" : "shadow-card"}`}
    >
      <h3 className="text-heading-m">
        <button
          id={taskCardId(task.id)}
          type="button"
          aria-describedby={DRAG_HINT_ID}
          onClick={() => openDialog({ kind: "viewTask", taskId: task.id })}
          onKeyDown={(event) => onCardKeyDown(event, task.id)}
          onKeyUp={onCardKeyUp}
          className="w-full text-left wrap-break-word transition-[color] after:absolute after:inset-0 after:rounded-lg hover:text-accent-ink focus-visible:outline-transparent focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent-ink"
        >
          {task.title}
        </button>
      </h3>
      <SubtaskProgress task={task} />
    </article>
  );
}

export function TaskCardGhost({ task }: { task: Task }) {
  return (
    <div className="rounded-lg bg-surface px-4 py-5.75 shadow-menu">
      <p className="text-heading-m wrap-break-word">{task.title}</p>
      <SubtaskProgress task={task} />
    </div>
  );
}

function SubtaskProgress({ task }: { task: Task }) {
  const total = task.subtasks.length;

  return (
    <p className="mt-2 text-body-m text-muted">
      {completedCount(task)} of {total} {total === 1 ? "subtask" : "subtasks"}
    </p>
  );
}
