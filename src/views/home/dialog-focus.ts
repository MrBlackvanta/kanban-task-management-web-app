import { closeDialog } from "@/store";
import { flushSync } from "react-dom";

export function closeDialogAndFocus(elementId: string) {
  flushSync(closeDialog);
  document.getElementById(elementId)?.focus();
}
