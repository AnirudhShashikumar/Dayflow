import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const actionMocks = vi.hoisted(() => ({
  signIn: vi.fn(),
}));

vi.mock("./actions", () => ({
  signIn: actionMocks.signIn,
  register: vi.fn(),
  requestPasswordReset: vi.fn(),
  updatePassword: vi.fn(),
}));

import { LoginForm } from "./auth-form";
import { PortalSelector } from "./portal-selector";

afterEach(cleanup);
beforeEach(() => {
  actionMocks.signIn.mockReset();
  actionMocks.signIn.mockResolvedValue({});
});

describe("LoginForm portal experience", () => {
  it("selects the Employee Portal by default", () => {
    render(<LoginForm />);

    expect(screen.getByRole("tab", { name: /Employee Portal/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "Employee sign in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in to Employee Portal" })).toBeInTheDocument();
  });

  it("updates the copy and harmless URL preference when HR / Admin Portal is selected", () => {
    window.history.replaceState(null, "", "/login");
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("tab", { name: /HR \/ Admin Portal/ }));

    expect(screen.getByRole("tab", { name: /HR \/ Admin Portal/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "HR & Admin sign in" })).toBeInTheDocument();
    expect(screen.getByText("Manage employees, approvals, attendance and payroll.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in to HR Portal" })).toBeInTheDocument();
    expect(window.location.search).toBe("?portal=hr");
  });

  it("supports arrow-key navigation between portal tabs", () => {
    render(<LoginForm />);
    const employeeTab = screen.getByRole("tab", { name: /Employee Portal/ });

    employeeTab.focus();
    fireEvent.keyDown(employeeTab, { key: "ArrowRight" });

    const hrTab = screen.getByRole("tab", { name: /HR \/ Admin Portal/ });
    expect(hrTab).toHaveAttribute("aria-selected", "true");
    expect(hrTab).toHaveFocus();
  });

  it("honors a remembered HR portal selection", () => {
    render(<LoginForm initialPortal="hr" />);

    expect(screen.getByRole("tab", { name: /HR \/ Admin Portal/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "HR & Admin sign in" })).toBeInTheDocument();
  });

  it("disables portal switching while submission is pending", () => {
    render(<PortalSelector value="employee" onChange={() => undefined} disabled />);

    expect(screen.getByRole("tab", { name: /Employee Portal/ })).toBeDisabled();
    expect(screen.getByRole("tab", { name: /HR \/ Admin Portal/ })).toBeDisabled();
  });

  it("locks the shared form and shows portal-aware loading copy during sign in", async () => {
    let finishSignIn: ((state: Record<string, never>) => void) | undefined;
    actionMocks.signIn.mockImplementation(() => new Promise((resolve) => { finishSignIn = resolve; }));
    render(<LoginForm initialPortal="hr" />);

    fireEvent.change(screen.getByRole("textbox", { name: "Work email" }), { target: { value: "test@dayflow.invalid" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Password1" } });
    fireEvent.submit(screen.getByRole("button", { name: "Sign in to HR Portal" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Employee Portal/ })).toBeDisabled();
      expect(screen.getByRole("tab", { name: /HR \/ Admin Portal/ })).toBeDisabled();
      expect(screen.getByRole("textbox", { name: "Work email" })).toBeDisabled();
      expect(screen.getByLabelText("Password")).toBeDisabled();
      expect(screen.getByRole("button", { name: "Signing in to HR Portal..." })).toBeDisabled();
    });

    await act(async () => finishSignIn?.({}));
  });
});
