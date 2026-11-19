import { AppShell } from "@/components/layout";
import { ActiveBoard, BoardDialogs } from "@/views/home";

export default function Home() {
  return (
    <AppShell>
      <ActiveBoard />
      <BoardDialogs />
    </AppShell>
  );
}
