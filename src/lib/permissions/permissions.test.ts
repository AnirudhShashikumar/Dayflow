import { describe, expect, it } from "vitest";
import { can, dashboardPath } from ".";
describe("role permissions",()=>{
  it("isolates employee administrative data",()=>{expect(can("employee","attendance:manage")).toBe(false);expect(can("employee","payroll:manage")).toBe(false);expect(can("employee","roles:manage")).toBe(false)});
  it("allows HR operations without administrator settings",()=>{expect(can("hr","leave:approve")).toBe(true);expect(can("hr","settings:manage")).toBe(false)});
  it("resolves safe role dashboards",()=>{expect(dashboardPath("employee")).toBe("/overview");expect(dashboardPath("hr")).toBe("/hr");expect(dashboardPath("admin")).toBe("/admin")});
});
