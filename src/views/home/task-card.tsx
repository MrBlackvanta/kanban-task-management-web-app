import { completedCount, type Task } from "@/lib";
import { openDialog } from "@/store";

export function taskCardId(taskId: string) {
  return `task-${taskId}`;
}

export default function TaskCard({ task }: { task: Task }) {
  const total = task.subtasks.length;

  return (
    <article className="relative rounded-lg bg-surface px-4 py-5.75 shadow-card">
      <h3 className="text-heading-m">
        <button
          id={taskCardId(task.id)}
          type="button"
          onClick={() => openDialog({ kind: "viewTask", taskId: task.id })}
          className="w-full text-left wrap-break-word transition-[color] after:absolute after:inset-0 after:rounded-lg hover:text-accent-ink focus-visible:outline-transparent focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent-ink"
        >
          {task.title}
        </button>
      </h3>
      <p className="mt-2 text-body-m text-muted">
        {completedCount(task)} of {total} {total === 1 ? "subtask" : "subtasks"}
      </p>
    </article>
  );
}
