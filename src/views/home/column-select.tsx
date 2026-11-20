import { ChevronDownIcon } from "@/components/icons";
import type { Column } from "@/lib";
import { useId } from "react";

type ColumnSelectProps = {
  label: string;
  columns: Pick<Column, "id" | "name">[];
  value: string;
  onChange: (columnId: string) => void;
};

export default function ColumnSelect({
  label,
  columns,
  value,
  onChange,
}: ColumnSelectProps) {
  const selectId = useId();

  return (
    <div>
      <label htmlFor={selectId} className="block text-body-m text-label">
        {label}
      </label>
      <div className="relative mt-2">
        <select
          id={selectId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="peer/select v-select flex h-10 w-full cursor-pointer items-center rounded-sm border border-grey/25 bg-transparent pr-10 pl-4 text-body-l text-ink transition-[border-color] open:border-purple hover:border-purple focus-visible:border-purple"
        >
          {columns.map((option) => (
            <option
              key={option.id}
              value={option.id}
              className="text-body-l text-muted not-first:mt-2 hover:text-ink focus-visible:text-ink"
            >
              {option.name}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-purple peer-open/select:rotate-180" />
      </div>
    </div>
  );
}
