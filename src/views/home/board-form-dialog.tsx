import { Button, Modal, TextInput } from "@/components/ui";
import { LIMITS, validateBoard, type Board, type BoardDraft } from "@/lib";
import { changeDialog, dispatch, selectBoard } from "@/store";
import { useId, useState, type SubmitEvent } from "react";
import ListFields, { newRow, type ListRow } from "./list-fields";
import { useFormErrors } from "./use-form-errors";

type BoardFormDialogProps = {
  board?: Board;
  addColumn?: boolean;
  onFinish: () => void;
};

type BoardFormValues = { name: string; columns: ListRow[] };

const STARTER_COLUMNS = ["Todo", "Doing"];

export default function BoardFormDialog({
  board,
  addColumn = false,
  onFinish,
}: BoardFormDialogProps) {
  const headingId = useId();
  const nameId = useId();
  const [newColumn] = useState(() =>
    addColumn && hasRoomForColumn(board) ? newRow() : undefined,
  );
  const [values, setValues] = useState(() => initialValues(board, newColumn));
  const { errors, check } = useFormErrors(values, validate);

  function update(changes: Partial<BoardFormValues>) {
    setValues((current) => ({ ...current, ...changes }));
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!check(event.currentTarget)) return;

    const draft = toDraft(values, board?.id ?? crypto.randomUUID());
    changeDialog(() => {
      if (board) {
        dispatch({ type: "updateBoard", board: draft });
      } else {
        dispatch({ type: "createBoard", board: draft });
        selectBoard(draft.id);
      }
      onFinish();
    });
  }

  return (
    <Modal titleId={headingId} onClose={onFinish} className="p-6 md:p-8">
      <h2 id={headingId} className="text-heading-l">
        {board ? "Edit Board" : "Add New Board"}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label htmlFor={nameId} className="block text-body-m text-label">
            Board Name
          </label>
          <TextInput
            id={nameId}
            value={values.name}
            onChange={(event) => update({ name: event.target.value })}
            placeholder="e.g. Web Design"
            maxLength={LIMITS.nameLength}
            error={errors?.name}
            className="mt-2"
          />
        </div>
        <ListFields
          legend="Board Columns"
          rowLabel="Column"
          rows={values.columns}
          errors={errors?.columns}
          limit={LIMITS.columnsPerBoard}
          maxLength={LIMITS.nameLength}
          autoFocusRowId={newColumn?.id}
          onChange={(columns) => update({ columns })}
        />
        <Button type="submit" variant="primary" className="w-full">
          {board ? "Save Changes" : "Create New Board"}
        </Button>
      </form>
    </Modal>
  );
}

function hasRoomForColumn(board?: Board) {
  return (board?.columns.length ?? 0) < LIMITS.columnsPerBoard;
}

function initialValues(board?: Board, newColumn?: ListRow): BoardFormValues {
  if (!board) {
    return { name: "", columns: STARTER_COLUMNS.map((name) => newRow(name)) };
  }
  const columns = board.columns.map(({ id, name }) => ({ id, value: name }));
  return {
    name: board.name,
    columns: newColumn ? [...columns, newColumn] : columns,
  };
}

function validate(values: BoardFormValues) {
  return validateBoard({
    name: values.name,
    columns: values.columns.map((column) => column.value),
  });
}

function toDraft(values: BoardFormValues, id: string): BoardDraft {
  return {
    id,
    name: values.name.trim(),
    columns: values.columns.map((column) => ({
      id: column.id,
      name: column.value.trim(),
    })),
  };
}
