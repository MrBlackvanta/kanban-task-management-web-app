import { glide, poseOf, type Pose } from "@/lib";
import { taskCardId } from "./card-focus";

export function taskCardPose(taskId: string) {
  const card = taskCardOf(taskId);
  return card ? poseOf(card) : undefined;
}

export function settleTaskCard(taskId: string, from: Pose | undefined) {
  const card = taskCardOf(taskId);
  if (card && from) glide(card, from);
}

function taskCardOf(taskId: string) {
  return document.getElementById(taskCardId(taskId))?.closest("article");
}
