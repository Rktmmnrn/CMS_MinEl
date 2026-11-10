export default function Loading() {
    return (
        <div role="status" aria-label="Chargement" className="mx-auto max-w-6xl space-y-4 px-4 py-10 sm:px-6">
            <div className="h-9 w-1/3 animate-pulse rounded-lg bg-muted" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
                ))}
            </div>
        </div>
    );
}
