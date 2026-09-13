/** Fetch every row of a bounded report query despite Supabase's per-request row cap. */
export async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { code?: string } | null }>,
  pageSize = 500,
  maxRows = 20_000,
): Promise<T[]> {
  const rows: T[] = [];
  while (rows.length <= maxRows) {
    const { data, error } = await fetchPage(rows.length, rows.length + pageSize - 1);
    if (error) throw new Error(`Report query failed (${error.code ?? "unknown"})`);
    if (!data?.length) return rows;
    rows.push(...data);
    if (rows.length > maxRows) break;
    if (data.length < pageSize) return rows;
  }
  throw new Error("Report has too many records. Narrow the date range or department.");
}
