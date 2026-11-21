import { locateTask, type Board } from "@/lib";
import type { DragSession } from "@/store";
import type { CSSProperties, Ref } from "react";
import { TaskCardGhost } from "./task-card";

type DragGhostProps = {
  ref: Ref<HTMLDivElement>;
  board: Board;
  session: DragSession | undefined;
};

export default function DragGhost({ ref, board, session }: DragGhostProps) {
  if (session?.mode !== "pointer") return null;
  const location = locateTask([board], session.taskId);
  if (!location) return null;

  const { left, top, width } = session.ghost;
  const position = {
    "--ghost-left": `${left}px`,
    "--ghost-top": `${top}px`,
    "--ghost-width": `${width}px`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={position}
      className="pointer-events-none fixed top-(--ghost-top) left-(--ghost-left) z-20 w-(--ghost-width) translate-x-(--drag-x) translate-y-(--drag-y) motion-safe:scale-103 motion-safe:rotate-2 motion-safe:transition-[scale,rotate] motion-safe:duration-(--motion-quick) motion-safe:ease-enter motion-safe:starting:scale-100 motion-safe:starting:rotate-0"
    >
      <TaskCardGhost task={location.task} />
    </div>
  );
}
