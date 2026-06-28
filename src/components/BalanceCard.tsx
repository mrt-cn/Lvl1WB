interface Props {
  balance: string | null;
  onRefresh: () => void;
}

export function BalanceCard({ balance, onRefresh }: Props) {
  return (
    <div className="rounded-xl bg-slate-800 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">XLM Bakiyesi</span>
        <button onClick={onRefresh} className="text-xs text-emerald-400 hover:underline">
          Yenile
        </button>
      </div>
      <div className="mt-2 text-3xl font-bold">
        {balance !== null ? `${balance} XLM` : "—"}
      </div>
    </div>
  );
}
