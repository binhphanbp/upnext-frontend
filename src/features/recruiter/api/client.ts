export function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function jsonAuthHeaders(token: string) {
  return {
    ...authHeaders(token),
    "Content-Type": "application/json",
  };
}

export function removeEmptyFields<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== ""),
  ) as Partial<T>;
}
