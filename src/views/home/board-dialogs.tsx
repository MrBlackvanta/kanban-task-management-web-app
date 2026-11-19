"use client";

import { locateTask } from "@/lib";
import { useBoards, useDialog } from "@/store";
import ViewTaskDialog from "./view-task-dialog";

export default function BoardDialogs() {
  const request = useDialog();
  const boards = useBoards();
  if (request?.kind !== "viewTask") return null;

  const location = locateTask(boards, request.taskId);
  if (!location) return null;
  return <ViewTaskDialog key={request.taskId} location={location} />;
}
