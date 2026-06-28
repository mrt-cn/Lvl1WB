interface Props {
  state: "idle" | "signing" | "submitting" | "success" | "error";
  hash: string | null;
  message: string | null;
}

export function TxStatus({ state, hash, message }: Props) {
  if (state === "idle") return null;
  if (state === "signing" || state === "submitting") {
    return (
      <p className="text-sm text-amber-400">
        {state === "signing" ? "İmzalanıyor..." : "Gönderiliyor..."}
      </p>
    );
  }
  if (state === "success") {
    return (
      <div className="rounded-lg bg-emerald-900/40 p-3 text-sm text-emerald-300">
        <p>İşlem başarılı!</p>
        {hash && (
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
            className="break-all underline"
          >
            {hash}
          </a>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-red-900/40 p-3 text-sm text-red-300">
      {message ?? "İşlem başarısız."}
    </div>
  );
}
