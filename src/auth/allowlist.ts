export function parseAllowlist(rawAllowlist: string | undefined): Set<string> {
  return new Set(
    (rawAllowlist ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function isAllowed(
  email: string | null | undefined,
  rawAllowlist = import.meta.env.VITE_ALLOWLIST_EMAILS,
): Promise<boolean> {
  if (!email) {
    return false;
  }

  return parseAllowlist(rawAllowlist).has(email.trim().toLowerCase());
}
