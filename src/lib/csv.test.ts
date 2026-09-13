import { describe, expect, it } from "vitest";
import { csvCell } from "./csv";

describe("CSV export safety", () => {
  it.each(["=1+1", "+CMD", "-2+3", "@SUM(1)", "  =HYPERLINK(1)"])("neutralizes formula input %s", (value) => {
    expect(csvCell(value)).toBe(`"'${value}"`);
  });
  it("quotes ordinary CSV text", () => {
    expect(csvCell('Ada "Lovelace", HR')).toBe('"Ada ""Lovelace"", HR"');
  });
});
