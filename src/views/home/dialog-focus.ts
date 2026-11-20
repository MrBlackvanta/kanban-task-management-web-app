import { closeDialog } from "@/store";
import { flushSync } from "react-dom";

export function closeDialogAndFocus(...elementIds: (string | undefined)[]) {
  flushSync(closeDialog);
  for (const id of elementIds) {
    if (id && focusById(id)) return;
  }
}

function focusById(id: string) {
  const element = document.getElementById(id);
  element?.focus();
  return element !== null && element === document.activeElement;
}
