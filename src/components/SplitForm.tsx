import { useState } from "react";
import { splitBill } from "../lib/splitBill";
import { isValidAddress, sendPayment } from "../lib/stellar";
import { signTransaction } from "../lib/freighter";
import { TxStatus } from "./TxStatus";

interface Props {
  senderAddress: string;
  onPaid: () => void;
}

type TxState = "idle" | "signing" | "submitting" | "success" | "error";

export function SplitForm({ senderAddress, onPaid }: Props) {
  const [total, setTotal] = useState("");
  const [people, setPeople] = useState("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [calcError, setCalcError] = useState<string | null>(null);
  const [txState, setTxState] = useState<TxState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txMessage, setTxMessage] = useState<string | null>(null);

  function handleCalculate() {
    const { perPerson, error } = splitBill(Number(total), Number(people));
    setCalcError(error);
    if (!error) setAmount(perPerson);
  }

  const destValid = destination === "" || isValidAddress(destination);

  function resetTxIfFinished() {
    if (txState === "success" || txState === "error") {
      setTxState("idle");
      setTxHash(null);
      setTxMessage(null);
    }
  }

  function horizonErrorToTurkish(e: unknown): string {
    if (e instanceof Error) {
      if (e.message === "SIGN_CANCELLED") return "İşlem iptal edildi.";
      if (
        e.message === "HORIZON:tx_insufficient_balance" ||
        e.message === "HORIZON:op_underfunded"
      )
        return "Yetersiz bakiye.";
      if (e.message === "HORIZON:op_no_destination")
        return "Alıcı hesabı testnet'te bulunamadı (fonlanmamış olabilir).";
      if (e.message.startsWith("HORIZON:"))
        return "İşlem reddedildi: " + e.message.slice("HORIZON:".length);
    }
    return "İşlem gönderilemedi. Bakiyenizi ve adresi kontrol edin.";
  }

  async function handleSend() {
    setCalcError(null);
    if (!isValidAddress(destination)) {
      setTxState("error");
      setTxMessage("Geçersiz alıcı adresi.");
      return;
    }
    if (!(Number(amount) > 0)) {
      setTxState("error");
      setTxMessage("Gönderilecek tutar 0'dan büyük olmalı.");
      return;
    }
    try {
      setTxHash(null);
      setTxMessage(null);
      setTxState("signing");
      const hash = await sendPayment({
        senderAddress,
        destination,
        amount,
        signXdr: async (xdr) => {
          const signed = await signTransaction(xdr);
          setTxState("submitting");
          return signed;
        },
      });
      setTxHash(hash);
      setTxState("success");
      onPaid();
    } catch (e) {
      setTxState("error");
      setTxMessage(horizonErrorToTurkish(e));
    }
  }

  const inputCls =
    "w-full rounded-lg bg-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <div className="space-y-4 rounded-xl bg-slate-800 p-5">
      <h2 className="text-lg font-semibold">Hesabı Bölüştür</h2>
      <div className="grid grid-cols-2 gap-3">
        <input
          className={inputCls}
          type="number"
          placeholder="Toplam tutar (XLM)"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
        />
        <input
          className={inputCls}
          type="number"
          placeholder="Kişi sayısı"
          value={people}
          onChange={(e) => setPeople(e.target.value)}
        />
      </div>
      <button
        onClick={handleCalculate}
        className="rounded-lg bg-slate-600 px-4 py-2 text-sm hover:bg-slate-500"
      >
        Kişi Başı Hesapla
      </button>
      {calcError && <p className="text-sm text-red-400">{calcError}</p>}

      <input
        className={inputCls}
        placeholder="Alıcı adresi (G...)"
        value={destination}
        onChange={(e) => {
          setDestination(e.target.value);
          resetTxIfFinished();
        }}
      />
      {!destValid && <p className="text-sm text-red-400">Geçersiz adres formatı.</p>}

      <input
        className={inputCls}
        type="number"
        placeholder="Gönderilecek tutar (XLM)"
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value);
          resetTxIfFinished();
        }}
      />

      <button
        onClick={handleSend}
        disabled={!destValid || destination === "" || amount === "" || !(Number(amount) > 0) || txState === "signing" || txState === "submitting"}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 disabled:opacity-50"
      >
        Payımı Gönder
      </button>

      <TxStatus state={txState} hash={txHash} message={txMessage} />
    </div>
  );
}
