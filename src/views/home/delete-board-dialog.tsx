import { BOARD_OPTIONS_ID } from "@/components/layout";
import type { Board } from "@/lib";
import { changeDialog, dispatch, selectBoard } from "@/store";
import DeleteDialog from "./delete-dialog";
import { closeDialogAndFocus } from "./dialog-focus";
import { CREATE_FIRST_BOARD_ID } from "./no-boards";

type DeleteBoardDialogProps = { board: Board; boards: Board[] };

export default function DeleteBoardDialog({
  board,
  boards,
}: DeleteBoardDialogProps) {
  function deleteBoard() {
    const index = boards.indexOf(board);
    const neighbour = boards[index + 1] ?? boards[index - 1];
    changeDialog(() => {
      dispatch({ type: "deleteBoard", boardId: board.id });
      if (neighbour) selectBoard(neighbour.id);
      closeDialogAndFocus(BOARD_OPTIONS_ID, CREATE_FIRST_BOARD_ID);
    });
  }

  return (
    <DeleteDialog
      heading="Delete this board?"
      message={`Are you sure you want to delete the ‘${board.name}’ board? This action will remove all columns and tasks and cannot be reversed.`}
      onDelete={deleteBoard}
      onCancel={() => closeDialogAndFocus(BOARD_OPTIONS_ID)}
    />
  );
}
