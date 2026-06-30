import { LoadingState } from "@/components/LoadingState";

export default function Loading() {
  return (
    <main className="page">
      <div className="shell">
        <LoadingState />
      </div>
    </main>
  );
}
