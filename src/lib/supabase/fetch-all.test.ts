import { describe, expect, it } from "vitest";
import { fetchAllRows } from "./fetch-all";

describe("fetchAllRows", () => {
  it("collects every page without stopping at a full first page", async () => {
    const source = [1, 2, 3, 4, 5];
    const ranges: Array<[number, number]> = [];
    const result = await fetchAllRows(async (from, to) => {
      ranges.push([from, to]);
      return { data: source.slice(from, to + 1), error: null };
    }, 2);
    expect(result).toEqual(source);
    expect(ranges).toEqual([[0, 1], [2, 3], [4, 5]]);
  });

  it("rejects oversized results rather than reporting incomplete totals", async () => {
    await expect(fetchAllRows(async (from, to) => ({ data: [1, 2, 3, 4].slice(from, to + 1), error: null }), 2, 3))
      .rejects.toThrow("too many records");
  });
});
