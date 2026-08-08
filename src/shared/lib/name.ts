/**
 * Two-letter initials for an avatar placeholder.
 *
 * Takes the first and last name part rather than the first two, so Vietnamese names
 * ("Nguyễn Minh Anh" → NA) read the same way western ones do.
 */
export function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/u).filter(Boolean);

  if (parts.length === 0) return "UN";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();

  return `${parts[0]![0] ?? ""}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}
