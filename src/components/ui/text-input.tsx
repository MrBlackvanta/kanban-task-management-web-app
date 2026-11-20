import type { ComponentProps } from "react";
import { FIELD_CLASS_NAME } from "./field";

type TextInputProps = Omit<ComponentProps<"input">, "id" | "className"> & {
  id: string;
  error?: string;
  className?: string;
};

export default function TextInput({
  id,
  error,
  className = "",
  ...props
}: TextInputProps) {
  const errorId = `${id}-error`;

  return (
    <div className={`grid ${className}`}>
      <input
        id={id}
        type="text"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`col-start-1 row-start-1 h-10 aria-invalid:pr-32 ${FIELD_CLASS_NAME}`}
        {...props}
      />
      {error && (
        <p
          id={errorId}
          className="pointer-events-none col-start-1 row-start-1 mr-4 self-center justify-self-end text-body-l text-danger-ink"
        >
          {error}
        </p>
      )}
    </div>
  );
}
