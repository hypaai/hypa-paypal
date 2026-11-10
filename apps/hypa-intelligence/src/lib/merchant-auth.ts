import { create } from "zustand";

/**
 * The merchant's sign-in. Chat works without it, but payments act for a
 * merchant account, so approving an order and sending its link need one.
 */
const STORAGE_KEY = "hypa.merchant.token";

const readToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private windows can refuse storage; the token then lasts for this tab only.
  }
};

interface MerchantAuthState {
  token: string | null;
  setToken: (token: string | null) => void;
  signOut: () => void;
}

export const useMerchantAuth = create<MerchantAuthState>((set) => ({
  token: readToken(),
  setToken: (token) => {
    writeToken(token);
    set({ token });
  },
  signOut: () => {
    writeToken(null);
    set({ token: null });
  },
}));

export const merchantToken = () => useMerchantAuth.getState().token;
