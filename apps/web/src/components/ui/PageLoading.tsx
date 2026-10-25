export function PageLoading() {
  return (
    <main
      className="flex min-h-screen items-center justify-center gap-3 bg-surface text-sm text-muted"
      role="status"
      aria-busy="true"
    >
      <span
        aria-hidden="true"
        className="material-symbols-rounded animate-spin text-xl text-primary"
      >
        progress_activity
      </span>
      Carregando…
    </main>
  );
}
