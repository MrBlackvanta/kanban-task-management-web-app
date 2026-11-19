import { CheckIcon } from "@/components/icons";
import { completedCount, type Subtask, type Task } from "@/lib";
import { dispatch } from "@/store";

export default function SubtaskList({ task }: { task: Task }) {
  return (
    <fieldset>
      <legend className="text-body-m text-label">
        Subtasks ({completedCount(task)} of {task.subtasks.length})
      </legend>
      <ul className="mt-4 flex flex-col gap-2">
        {task.subtasks.map((subtask) => (
          <li key={subtask.id}>
            <SubtaskRow subtask={subtask} />
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

function SubtaskRow({ subtask }: { subtask: Subtask }) {
  return (
    <label className="group/subtask flex cursor-pointer items-center gap-4 rounded-sm bg-inset py-3 pr-4 pl-3 transition-[background-color] hover:bg-purple/25 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-ink">
      <span className="grid shrink-0">
        <input
          type="checkbox"
          checked={subtask.isCompleted}
          onChange={(event) =>
            dispatch({
              type: "setSubtaskCompleted",
              subtaskId: subtask.id,
              isCompleted: event.target.checked,
            })
          }
          className="col-start-1 row-start-1 size-4 cursor-pointer appearance-none rounded-xs border border-muted bg-surface checked:border-purple checked:bg-purple focus-visible:outline-transparent"
        />
        <CheckIcon className="pointer-events-none invisible col-start-1 row-start-1 place-self-center text-white group-has-checked/subtask:visible" />
      </span>
      <span className="min-w-0 text-body-m wrap-break-word group-has-checked/subtask:text-done group-has-checked/subtask:line-through">
        {subtask.title}
      </span>
    </label>
  );
}
