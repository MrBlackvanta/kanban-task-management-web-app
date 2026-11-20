import { VerticalEllipsisIcon } from "@/components/icons";
import { useId } from "react";

export type MenuAction = {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
};

type OptionsMenuProps = {
  id?: string;
  label: string;
  disabled?: boolean;
  actions: MenuAction[];
  iconClassName: string;
  menuClassName: string;
};

export default function OptionsMenu({
  id,
  label,
  disabled,
  actions,
  iconClassName,
  menuClassName,
}: OptionsMenuProps) {
  const menuId = useId();

  return (
    <>
      <button
        id={id}
        type="button"
        aria-label={label}
        disabled={disabled}
        popoverTarget={menuId}
        className="relative shrink-0 text-grey after:absolute after:-inset-x-2.5 after:-inset-y-3 disabled:opacity-25"
      >
        <VerticalEllipsisIcon className={iconClassName} />
      </button>
      <div
        id={menuId}
        popover="auto"
        className={`v-popover-menu w-48 flex-col items-start gap-4 rounded-lg bg-menu p-4 shadow-menu open:flex ${menuClassName}`}
      >
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            popoverTarget={menuId}
            popoverTargetAction="hide"
            onClick={action.onSelect}
            className={`text-body-l underline-offset-4 hover:underline ${action.destructive ? "text-danger-ink" : "text-muted"}`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </>
  );
}
