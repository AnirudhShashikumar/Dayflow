export function safeCallbackPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f]|%2f|%5c/i.test(value)) return "/home";
  return value;
}
