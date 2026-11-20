import { CrossIcon } from "@/components/icons";
import { Button, TextInput } from "@/components/ui";
import { useId, useRef } from "react";
import { flushSync } from "react-dom";

export type ListRow = { id: string; value: string };

export function newRow(value = ""): ListRow {
  return { id: crypto.randomUUID(), value };
}

type ListFieldsProps = {
  legend: string;
  rowLabel: string;
  rows: ListRow[];
  errors?: (string | undefined)[];
  limit: number;
  maxLength: number;
  placeholders?: string[];
  autoFocusRowId?: string;
  onChange: (rows: ListRow[]) => void;
};

export default function ListFields({
  legend,
  rowLabel,
  rows,
  errors,
  limit,
  maxLength,
  placeholders = [],
  autoFocusRowId,
  onChange,
}: ListFieldsProps) {
  const baseId = useId();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const atLimit = rows.length >= limit;

  const inputId = (rowId: string) => `${baseId}-${rowId}`;
  const removeId = (rowId: string) => `${inputId(rowId)}-remove`;

  function add() {
    if (atLimit) return;
    const row = newRow();
    flushSync(() => onChange([...rows, row]));
    document.getElementById(inputId(row.id))?.focus();
  }

  function remove(index: number) {
    const neighbour = rows[index + 1] ?? rows[index - 1];
    onChange(rows.toSpliced(index, 1));
    const nextFocus =
      neighbour && document.getElementById(removeId(neighbour.id));
    (nextFocus ?? addButtonRef.current)?.focus();
  }

  function edit(index: number, value: string) {
    onChange(rows.with(index, { ...rows[index], value }));
  }

  return (
    <fieldset>
      <legend className="text-body-m text-label">{legend}</legend>
      <div className="mt-2 flex flex-col gap-3">
        {rows.length > 0 && (
          <ul className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <li key={row.id} className="flex items-center gap-4">
                <TextInput
                  id={inputId(row.id)}
                  aria-label={`${rowLabel} ${index + 1}`}
                  data-autofocus={row.id === autoFocusRowId || undefined}
                  value={row.value}
                  onChange={(event) => edit(index, event.target.value)}
                  placeholder={placeholders[index]}
                  maxLength={maxLength}
                  error={errors?.[index]}
                  className="min-w-0 flex-1"
                />
                <button
                  type="button"
                  id={removeId(row.id)}
                  aria-label={`Remove ${rowLabel.toLowerCase()} ${index + 1}`}
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
          <span aria-hidden="true">+ </span>Add New {rowLabel}
        </Button>
      </div>
    </fieldset>
  );
}
