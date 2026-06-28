interface Props {
  address: string | null;
  status: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletConnect({ address, status, onConnect, onDisconnect }: Props) {
  const short = address ? `${address.slice(0, 6)}...${address.slice(-6)}` : "";
  return (
    <div className="flex items-center justify-between gap-4">
      {address ? (
        <>
          <span className="font-mono text-sm text-emerald-400">{short}</span>
          <button
            onClick={onDisconnect}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
          >
            Bağlantıyı Kes
          </button>
        </>
      ) : (
        <button
          onClick={onConnect}
          disabled={status === "connecting"}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {status === "connecting" ? "Bağlanıyor..." : "Cüzdanı Bağla"}
        </button>
      )}
    </div>
  );
}
