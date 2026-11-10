import { useState, type FormEvent } from "react";
import { Button } from "@heroui/button";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { api, getApiErrorMessage } from "@/lib/api";
import { useMerchantAuth } from "@/lib/merchant-auth";

/**
 * Payments act for a merchant account, so approving an order asks the
 * merchant to sign in first. Chat itself stays open to everyone.
 */
export const MerchantSignIn = ({
  onClose,
  onSignedIn,
}: {
  onClose: () => void;
  onSignedIn?: () => void;
}) => {
  const setToken = useMerchantAuth((state) => state.setToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (working) return;
    setWorking(true);
    setError(null);
    try {
      const { data } = await api.post<{ access_token: string }>("/auth/login", {
        email: email.trim(),
        password,
      });

      setToken(data.access_token);
      onSignedIn?.();
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Could not sign in. Check your email and password."));
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle className="text-xl font-bold tracking-tight">
          Sign in to take payments
        </DialogTitle>
        <p className="text-sm text-default-500">
          Orders are approved and paid into a merchant account.
        </p>
        <form className="flex flex-col gap-3" onSubmit={(event) => void submit(event)}>
          <input
            required
            autoComplete="email"
            className="h-11 rounded-xl border border-divider bg-transparent px-3 text-sm"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            required
            autoComplete="current-password"
            className="h-11 rounded-xl border border-divider bg-transparent px-3 text-sm"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? (
            <p className="text-sm text-foreground" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            className="h-11 font-semibold"
            color="primary"
            isLoading={working}
            radius="lg"
            type="submit"
          >
            Sign in
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
