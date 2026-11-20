import { useEffect, useRef, type ReactNode, type RefObject } from "react";

type ModalProps = {
  titleId: string;
  descriptionId?: string;
  role?: "alertdialog";
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  className: string;
  children: ReactNode;
};

export default function Modal({
  titleId,
  descriptionId,
  role,
  initialFocusRef,
  onClose,
  className,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    initialFocusRef?.current?.focus();
  }, [initialFocusRef]);

  return (
    <dialog
      ref={dialogRef}
      role={role}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={onClose}
      className="m-0 size-full max-h-none max-w-none items-center justify-center overflow-clip bg-transparent p-4 text-ink backdrop:bg-scrim open:flex"
    >
      <div
        className={`flex max-h-full w-full max-w-120 flex-col gap-6 overflow-y-auto overscroll-contain rounded-md bg-surface ${className}`}
      >
        {children}
      </div>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => dialogRef.current?.close()}
        className="absolute inset-0 -z-10 cursor-default"
      />
    </dialog>
  );
}
