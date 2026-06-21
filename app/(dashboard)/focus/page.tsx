import { Pomodoro } from "@/components/Pomodoro";

export default function FocusPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-4xl text-ink">Focus</h1>
      <Pomodoro />
    </div>
  );
}
