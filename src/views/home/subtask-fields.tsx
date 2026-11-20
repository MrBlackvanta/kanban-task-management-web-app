import { CrossIcon } from "@/components/icons";
import { Button, TextInput } from "@/components/ui";
import { LIMITS, type FieldError } from "@/lib";
import { useId, useRef } from "react";
import { flushSync } from "react-dom";

export type SubtaskValue = { id: string; title: string };

type SubtaskFieldsProps = {
  subtasks: SubtaskValue[];
  errors?: (FieldError | undefined)[];
  onChange: (subtasks: SubtaskValue[]) => void;
};

const PLACEHOLDERS = ["e.g. Make coffee", "e.g. Drink coffee & smile"];

export default function SubtaskFields({
  subtasks,
  errors,
  onChange,
}: SubtaskFieldsProps) {
  const baseId = useId();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const atLimit = subtasks.length >= LIMITS.subtasksPerTask;

  const inputId = (subtaskId: string) => `${baseId}-${subtaskId}`;
  const removeId = (subtaskId: string) => `${inputId(subtaskId)}-remove`;

  function add() {
    if (atLimit) return;
    const subtask = { id: crypto.randomUUID(), title: "" };
    flushSync(() => onChange([...subtasks, subtask]));
    document.getElementById(inputId(subtask.id))?.focus();
  }

  function remove(index: number) {
    const neighbour = subtasks[index + 1] ?? subtasks[index - 1];
    onChange(subtasks.toSpliced(index, 1));
    const nextFocus =
      neighbour && document.getElementById(removeId(neighbour.id));
    (nextFocus ?? addButtonRef.current)?.focus();
  }

  function rename(index: number, title: string) {
    onChange(subtasks.with(index, { ...subtasks[index], title }));
  }

  return (
    <fieldset>
      <legend className="text-body-m text-label">Subtasks</legend>
      <div className="mt-2 flex flex-col gap-3">
        {subtasks.length > 0 && (
          <ul className="flex flex-col gap-3">
            {subtasks.map((subtask, index) => (
              <li key={subtask.id} className="flex items-center gap-4">
                <TextInput
                  id={inputId(subtask.id)}
                  aria-label={`Subtask ${index + 1}`}
                  value={subtask.title}
                  onChange={(event) => rename(index, event.target.value)}
                  placeholder={PLACEHOLDERS[index]}
                  maxLength={LIMITS.titleLength}
                  error={errors?.[index]}
                  className="min-w-0 flex-1"
                />
                <button
                  type="button"
                  id={removeId(subtask.id)}
                  aria-label={`Remove subtask ${index + 1}`}
                  onClick={() => remove(index)}
                  className={`relative shrink-0 transition-[color] after:absolute after:-inset-3 hover:text-danger-ink ${errors?.[index] ? "text-danger-ink" : "text-grey"}`}
                >
                  <CrossIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
        <Button
          ref={addButtonRef}
          variant="secondary"
          aria-disabled={atLimit || undefined}
          onClick={add}
          className="w-full"
        >
          <span aria-hidden="true">+ </span>Add New Subtask
        </Button>
      </div>
    </fieldset>
  );
}
