import { useLayoutEffect, useRef, type ReactNode } from "react";

type ModalProps = {
  titleId: string;
  descriptionId?: string;
  role?: "alertdialog";
  onClose: () => void;
  className: string;
  children: ReactNode;
};

export default function Modal({
  titleId,
  descriptionId,
  role,
  onClose,
  className,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      role={role}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      className="m-0 size-full max-h-none max-w-none items-center justify-center overflow-clip bg-transparent p-4 text-ink backdrop:bg-scrim open:flex"
    >
      <div
        className={`flex max-h-full w-full max-w-120 flex-col gap-6 overflow-y-auto overscroll-contain rounded-md bg-surface motion-dialog:[view-transition-name:sheet] ${className}`}
      >
        {children}
      </div>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 -z-10 cursor-default"
      />
    </dialog>
  );
}
