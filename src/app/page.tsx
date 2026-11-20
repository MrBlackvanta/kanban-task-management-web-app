import { AppShell } from "@/components/layout";
import { ActiveBoard, BoardDialogs, BoardSync } from "@/views/home";

export default function Home() {
  return (
    <AppShell>
      <ActiveBoard />
      <BoardDialogs />
      <BoardSync />
    </AppShell>
  );
}
