export const LIMITS = {
  boards: 20,
  columnsPerBoard: 10,
  tasks: 200,
  subtasksPerTask: 20,
  nameLength: 40,
  titleLength: 120,
  descriptionLength: 2000,
} as const;

export const FIELD_ERRORS = {
  empty: "Can't be empty",
  duplicate: "Used already",
} as const;

export type FieldError = (typeof FIELD_ERRORS)[keyof typeof FIELD_ERRORS];

type ListErrors = (FieldError | undefined)[];

export type BoardValues = { name: string; columns: string[] };
export type BoardErrors = { name?: FieldError; columns: ListErrors };

export type TaskValues = { title: string; subtasks: string[] };
export type TaskErrors = { title?: FieldError; subtasks: ListErrors };

export function validateBoard({ name, columns }: BoardValues) {
  const errors: BoardErrors = {
    name: required(name),
    columns: requiredAndUnique(columns),
  };
  return errors.name || errors.columns.some(Boolean) ? errors : null;
}

export function validateTask({ title, subtasks }: TaskValues) {
  const errors: TaskErrors = {
    title: required(title),
    subtasks: subtasks.map(required),
  };
  return errors.title || errors.subtasks.some(Boolean) ? errors : null;
}

function required(value: string) {
  return value.trim() ? undefined : FIELD_ERRORS.empty;
}

function requiredAndUnique(values: string[]): ListErrors {
  const seen = new Set<string>();
  return values.map((value) => {
    const key = value.trim().toLowerCase();
    if (!key) return FIELD_ERRORS.empty;
    if (seen.has(key)) return FIELD_ERRORS.duplicate;
    seen.add(key);
    return undefined;
  });
}
