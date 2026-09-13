export function csvCell(value: unknown) {
  const raw = String(value ?? "");
  const safe = /^\s*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function csvResponse(header: string, rows: unknown[][], filename: string) {
  return new Response([header, ...rows.map((row) => row.map(csvCell).join(","))].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
