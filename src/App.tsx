import { useWallet } from "./hooks/useWallet";
import { WalletConnect } from "./components/WalletConnect";
import { BalanceCard } from "./components/BalanceCard";
import { SplitForm } from "./components/SplitForm";

export default function App() {
  const { address, balance, status, error, connect, disconnect, refreshBalance } =
    useWallet();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto max-w-md space-y-5 p-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Stellar Hesap Bölüştürme</h1>
        </header>

        <WalletConnect
          address={address}
          status={status}
          onConnect={connect}
          onDisconnect={disconnect}
        />

        {error && (
          <div className="rounded-lg bg-red-900/40 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {address && (
          <>
            <BalanceCard balance={balance} onRefresh={refreshBalance} />
            <SplitForm senderAddress={address} onPaid={refreshBalance} />
          </>
        )}

        {!address && (
          <p className="text-sm text-slate-400">
            Başlamak için Freighter cüzdanınızı bağlayın (Stellar Testnet).
          </p>
        )}
      </div>
    </div>
  );
}
