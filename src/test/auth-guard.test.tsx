import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const authState = {
  user: null as null | { id: string },
  loading: true,
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

describe("AuthGuard", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    authState.user = null;
    authState.loading = true;
  });

  it("renders loading state while auth is resolving", () => {
    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders children when user is authenticated", () => {
    authState.loading = false;
    authState.user = { id: "123" };

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
