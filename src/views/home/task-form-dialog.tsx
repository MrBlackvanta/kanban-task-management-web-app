import { Button, FIELD_CLASS_NAME, Modal, TextInput } from "@/components/ui";
import {
  LIMITS,
  validateTask,
  type Board,
  type Task,
  type TaskDraft,
  type TaskErrors,
} from "@/lib";
import { dispatch } from "@/store";
import { useId, useState, type SubmitEvent } from "react";
import { flushSync } from "react-dom";
import ColumnSelect from "./column-select";
import SubtaskFields, { type SubtaskValue } from "./subtask-fields";

type TaskFormDialogProps = {
  board: Board;
  columnId: string;
  task?: Task;
  onFinish: () => void;
};

type TaskFormValues = {
  title: string;
  description: string;
  subtasks: SubtaskValue[];
  columnId: string;
};

const DESCRIPTION_PLACEHOLDER =
  "e.g. It’s always good to take a break. This 15 minute break will recharge the batteries a little.";

export default function TaskFormDialog({
  board,
  columnId,
  task,
  onFinish,
}: TaskFormDialogProps) {
  const headingId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const [values, setValues] = useState(() => initialValues(columnId, task));
  const [showErrors, setShowErrors] = useState(false);
  const errors = showErrors ? validate(values) : null;
  const editing = task !== undefined;

  function update(changes: Partial<TaskFormValues>) {
    setValues((current) => ({ ...current, ...changes }));
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const found = validate(values);
    if (found) {
      flushSync(() => setShowErrors(true));
      firstInvalidField(form, found)?.focus();
      return;
    }

    const draft = toDraft(values, task?.id ?? crypto.randomUUID());
    dispatch(
      editing
        ? { type: "updateTask", columnId: values.columnId, task: draft }
        : { type: "createTask", columnId: values.columnId, task: draft },
    );
    onFinish();
  }

  return (
    <Modal titleId={headingId} onClose={onFinish} className="p-6 md:p-8">
      <h2 id={headingId} className="text-heading-l">
        {editing ? "Edit Task" : "Add New Task"}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label htmlFor={titleId} className="block text-body-m text-label">
            Title
          </label>
          <TextInput
            id={titleId}
            name="title"
            value={values.title}
            onChange={(event) => update({ title: event.target.value })}
            placeholder="e.g. Take coffee break"
            maxLength={LIMITS.titleLength}
            error={errors?.title}
            className="mt-2"
          />
        </div>
        <div>
          <label
            htmlFor={descriptionId}
            className="block text-body-m text-label"
          >
            Description
          </label>
          <textarea
            id={descriptionId}
            value={values.description}
            onChange={(event) => update({ description: event.target.value })}
            placeholder={DESCRIPTION_PLACEHOLDER}
            maxLength={LIMITS.descriptionLength}
            className={`mt-2 block field-sizing-content max-h-60 min-h-28 resize-none py-2 ${FIELD_CLASS_NAME}`}
          />
        </div>
        <SubtaskFields
          subtasks={values.subtasks}
          errors={errors?.subtasks}
          onChange={(subtasks) => update({ subtasks })}
        />
        <ColumnSelect
          label="Status"
          columns={board.columns}
          value={values.columnId}
          onChange={(nextColumnId) => update({ columnId: nextColumnId })}
        />
        <Button type="submit" variant="primary" className="w-full">
          {editing ? "Save Changes" : "Create Task"}
        </Button>
      </form>
    </Modal>
  );
}

function initialValues(columnId: string, task?: Task): TaskFormValues {
  if (!task) {
    return {
      title: "",
      description: "",
      subtasks: [emptySubtask(), emptySubtask()],
      columnId,
    };
  }
  return {
    title: task.title,
    description: task.description,
    subtasks: task.subtasks.map(({ id, title }) => ({ id, title })),
    columnId,
  };
}

function emptySubtask(): SubtaskValue {
  return { id: crypto.randomUUID(), title: "" };
}

function validate(values: TaskFormValues) {
  return validateTask({
    title: values.title,
    subtasks: values.subtasks.map((subtask) => subtask.title),
  });
}

function firstInvalidField(form: HTMLFormElement, errors: TaskErrors) {
  if (errors.title) return form.querySelector<HTMLElement>("[name=title]");
  const index = errors.subtasks.findIndex(Boolean);
  return form.querySelectorAll<HTMLElement>("li input").item(index);
}

function toDraft(values: TaskFormValues, id: string): TaskDraft {
  return {
    id,
    title: values.title.trim(),
    description: values.description.trim(),
    subtasks: values.subtasks.map((subtask) => ({
      id: subtask.id,
      title: subtask.title.trim(),
    })),
  };
}
