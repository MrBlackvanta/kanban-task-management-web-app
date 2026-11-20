import { Button, Modal } from "@/components/ui";
import { useId } from "react";

type DeleteDialogProps = {
  heading: string;
  message: string;
  onDelete: () => void;
  onCancel: () => void;
};

export default function DeleteDialog({
  heading,
  message,
  onDelete,
  onCancel,
}: DeleteDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Modal
      role="alertdialog"
      titleId={titleId}
      descriptionId={descriptionId}
      onClose={onCancel}
      className="p-6 md:p-8 md:pb-10"
    >
      <h2 id={titleId} className="text-heading-l text-danger-ink">
        {heading}
      </h2>
      <p id={descriptionId} className="text-body-l wrap-break-word text-muted">
        {message}
      </p>
      <div className="flex flex-col gap-4 md:flex-row">
        <Button variant="destructive" onClick={onDelete} className="md:flex-1">
          Delete
        </Button>
        <Button
          variant="secondary"
          data-autofocus
          onClick={onCancel}
          className="md:flex-1"
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
