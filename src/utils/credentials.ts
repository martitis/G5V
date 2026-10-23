/** The API's rules for panel accounts (G5API src/utility/credentials.ts), checked before sending. */
export const usernameRule = (value: string) => /^[A-Za-z0-9_.-]{3,32}$/.test(value?.trim() ?? "");
