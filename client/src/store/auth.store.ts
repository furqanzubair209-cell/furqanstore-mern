import { create } from "zustand";
import { persist } from "zustand/middleware";

export type User = {
  id: number;
  fullName: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "VENDOR" | "CUSTOMER";
  status: string;
  vendorName?: string | null;
};

type AuthState = {
  accessToken: string | null;
  user: User | null;
  setSession: (token: string, user: User) => void;
  logout: () => void;
};

// Only the short-lived access token + user profile are persisted client-side.
// The refresh token lives solely in the httpOnly cookie the server set.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: (accessToken, user) => set({ accessToken, user }),
      logout: () => set({ accessToken: null, user: null }),
    }),
    { name: "furqanstore-auth" }
  )
);
