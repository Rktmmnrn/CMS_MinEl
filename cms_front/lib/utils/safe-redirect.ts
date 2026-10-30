export function safeRedirect(next: string | null, fallback = "/dashboard") {
  if (!next) return fallback;
  // Un chemin interne commence par "/" mais pas par "//" ni "/\"
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
