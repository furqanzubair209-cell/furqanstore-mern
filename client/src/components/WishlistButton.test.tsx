import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WishlistButton from "./WishlistButton";
import { useAuthStore } from "../store/auth.store";
import { wishlistApi } from "../api/account.api";

vi.mock("../api/account.api", () => ({
  wishlistApi: {
    list: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("WishlistButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: { id: 1, fullName: "Test User", email: "t@example.com", role: "CUSTOMER", status: "ACTIVE" },
      accessToken: "token",
    });
  });

  it("renders nothing when there is no logged-in user", () => {
    useAuthStore.setState({ user: null, accessToken: null });
    (wishlistApi.list as any).mockResolvedValue({ data: [] });
    const { container } = renderWithClient(<WishlistButton productId={1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows an unfilled heart when the product is not wishlisted", async () => {
    (wishlistApi.list as any).mockResolvedValue({ data: [] });
    renderWithClient(<WishlistButton productId={1} />);
    await waitFor(() => expect(screen.getByRole("button")).toBeInTheDocument());
    expect(screen.getByRole("button")).toHaveAccessibleName("Add to wishlist");
  });

  it("shows a filled heart when the product is already wishlisted", async () => {
    (wishlistApi.list as any).mockResolvedValue({ data: [{ productId: 1 }] });
    renderWithClient(<WishlistButton productId={1} />);
    await waitFor(() => expect(screen.getByRole("button")).toHaveAccessibleName("Remove from wishlist"));
  });

  it("calls wishlistApi.add when toggled while not wishlisted", async () => {
    (wishlistApi.list as any).mockResolvedValue({ data: [] });
    (wishlistApi.add as any).mockResolvedValue({});
    renderWithClient(<WishlistButton productId={5} />);

    const button = await screen.findByRole("button", { name: "Add to wishlist" });
    fireEvent.click(button);

    await waitFor(() => expect(wishlistApi.add).toHaveBeenCalledWith(5));
    expect(wishlistApi.remove).not.toHaveBeenCalled();
  });

  it("calls wishlistApi.remove when toggled while already wishlisted", async () => {
    (wishlistApi.list as any).mockResolvedValue({ data: [{ productId: 5 }] });
    (wishlistApi.remove as any).mockResolvedValue({});
    renderWithClient(<WishlistButton productId={5} />);

    const button = await screen.findByRole("button", { name: "Remove from wishlist" });
    fireEvent.click(button);

    await waitFor(() => expect(wishlistApi.remove).toHaveBeenCalledWith(5));
    expect(wishlistApi.add).not.toHaveBeenCalled();
  });
});
