import { useState } from "react";
import { flushSync } from "react-dom";

export function useFormErrors<Values, Errors>(
  values: Values,
  validate: (values: Values) => Errors | null,
) {
  const [showErrors, setShowErrors] = useState(false);

  function check(form: HTMLFormElement) {
    if (!validate(values)) return true;
    flushSync(() => setShowErrors(true));
    form.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
    return false;
  }

  return { errors: showErrors ? validate(values) : null, check };
}
