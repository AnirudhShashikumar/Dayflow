export function businessDate(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function monthBounds(date: string) {
  const [year, month] = date.slice(0, 7).split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${date.slice(0, 7)}-01`, to: `${date.slice(0, 7)}-${String(lastDay).padStart(2, "0")}` };
}

export function formatBusinessTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function formatBusinessLocal(value: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function parseBusinessLocal(value: string, timezone: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Enter a valid date and time.");
  const [year, month, day, hour, minute] = value.match(/\d+/g)!.map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let instant = target;
  for (let i = 0; i < 3; i++) {
    const rendered = formatBusinessLocal(new Date(instant).toISOString(), timezone);
    const [y, m, d, h, min] = rendered.match(/\d+/g)!.map(Number);
    instant += target - Date.UTC(y, m - 1, d, h, min);
  }
  const result = new Date(instant).toISOString();
  if (formatBusinessLocal(result, timezone) !== value) throw new Error("This local time does not exist in the organization timezone.");
  return result;
}
