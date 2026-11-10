import { create } from "zustand";

interface OrderApprovalState {
  /** The order under review, or null when no approval is open. */
  orderId: string | null;
  open: (orderId: string) => void;
  close: () => void;
}

export const useOrderApprovalStore = create<OrderApprovalState>((set) => ({
  orderId: null,
  open: (orderId: string) => set({ orderId }),
  close: () => set({ orderId: null }),
}));
