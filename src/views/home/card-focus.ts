export function taskCardId(taskId: string) {
  return `task-${taskId}`;
}

export function focusTaskCard(taskId: string) {
  const card = document.getElementById(taskCardId(taskId));
  card?.focus({ preventScroll: true });
  card?.scrollIntoView({ block: "nearest", inline: "nearest" });
}
