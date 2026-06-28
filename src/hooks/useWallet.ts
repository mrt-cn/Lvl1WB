import { useState, useCallback, useRef } from "react";
import { connectWallet } from "../lib/freighter";
import { getBalance } from "../lib/stellar";

type Status = "idle" | "connecting" | "loading-balance" | "ready" | "error";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef(0);

  const loadBalance = useCallback(async (addr: string, session: number) => {
    setStatus("loading-balance");
    try {
      const bal = await getBalance(addr);
      if (sessionRef.current !== session) return;
      setBalance(bal);
      setStatus("ready");
    } catch (e) {
      if (sessionRef.current !== session) return;
      const msg =
        e instanceof Error && e.message === "ACCOUNT_NOT_FOUND"
          ? "Hesap testnet'te bulunamadı. Friendbot ile fonlayın."
          : "Bakiye alınamadı.";
      setError(msg);
      setStatus("error");
    }
  }, []);

  const connect = useCallback(async () => {
    const session = ++sessionRef.current;
    setError(null);
    setStatus("connecting");
    try {
      const addr = await connectWallet();
      if (sessionRef.current !== session) return;
      setAddress(addr);
      await loadBalance(addr, session);
    } catch (e) {
      const msg =
        e instanceof Error && e.message === "NOT_INSTALLED"
          ? "Freighter eklentisi bulunamadı. Lütfen yükleyin."
          : "Cüzdan bağlantısı reddedildi.";
      setError(msg);
      setStatus("error");
    }
  }, [loadBalance]);

  const disconnect = useCallback(() => {
    sessionRef.current += 1;
    setAddress(null);
    setBalance(null);
    setStatus("idle");
    setError(null);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (address) {
      const session = ++sessionRef.current;
      await loadBalance(address, session);
    }
  }, [address, loadBalance]);

  return { address, balance, status, error, connect, disconnect, refreshBalance };
}
