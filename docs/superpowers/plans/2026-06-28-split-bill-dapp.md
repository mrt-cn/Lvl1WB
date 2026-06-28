# Split Bill dApp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Stellar Testnet "Split Bill" web dApp where a user connects Freighter, sees their XLM balance, splits a bill among N people, and sends their share to a recipient address with transaction feedback.

**Architecture:** Three layers — pure TS service layer (`src/lib/`) for all Stellar/Freighter calls, React hooks for state, and React components for UI. Service layer is framework-agnostic and unit-tested. UI composes in `App.tsx`.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, `@stellar/stellar-sdk`, `@stellar/freighter-api`, Vitest.

## Global Constraints

- Network: Stellar **Testnet** only. Horizon URL `https://horizon-testnet.org`, passphrase `Networks.TESTNET`.
- XLM amounts use 7 decimal places (Stellar precision).
- All errors surface to the user via UI (no silent `console.error`).
- Language of UI copy: Turkish (matching user's existing prototype).
- Existing prototype files (`test.js`, root `index.html`) are obsolete and replaced by the Vite scaffold.

---

### Task 1: Project scaffold (Vite + React + TS + Tailwind)

**Files:**
- Delete: `test.js`, root `index.html`
- Create: `package.json` (overwrite), `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `tailwind.config.js`, `postcss.config.js`, `.gitignore`, `vitest.config.ts`
- Keep: `node_modules/` deps (`@stellar/stellar-sdk`, `@stellar/freighter-api`) — reinstalled by new package.json

- [ ] **Step 1: Remove obsolete prototype files**

```bash
rm -f test.js index.html package-lock.json
```

- [ ] **Step 2: Scaffold Vite React-TS project in place**

Run:
```bash
npm create vite@latest . -- --template react-ts
```
If it refuses because the dir is non-empty, answer "Ignore files and continue". This regenerates `index.html`, `src/`, `tsconfig*.json`, `vite.config.ts`, `package.json`.

- [ ] **Step 3: Install all dependencies (app + Tailwind + Vitest)**

Run:
```bash
npm install @stellar/stellar-sdk @stellar/freighter-api
npm install -D tailwindcss postcss autoprefixer vitest jsdom @testing-library/react @testing-library/jest-dom
npx tailwindcss init -p
```

- [ ] **Step 4: Configure Tailwind content paths**

Overwrite `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 5: Add Tailwind directives to `src/index.css`**

Overwrite `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Configure Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

Create `src/test/setup.ts`:
```ts
import "@testing-library/jest-dom";
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 7: Minimal App renders**

Overwrite `src/App.tsx`:
```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
      <h1 className="text-2xl font-bold">Stellar Hesap Bölüştürme</h1>
    </div>
  );
}
```

- [ ] **Step 8: Verify dev server boots**

Run: `npm run dev`
Expected: Vite serves on localhost, page shows the heading with dark background (Tailwind working). Stop server (Ctrl+C).

- [ ] **Step 9: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Vite + React + TS + Tailwind project"
```

---

### Task 2: Split bill calculation (pure function, TDD)

**Files:**
- Create: `src/lib/splitBill.ts`
- Test: `src/lib/splitBill.test.ts`

**Interfaces:**
- Produces: `splitBill(total: number, people: number): { perPerson: string; error: string | null }` — `perPerson` is a 7-decimal string suitable for a Stellar payment amount; on invalid input `perPerson` is `"0"` and `error` is a Turkish message.

- [ ] **Step 1: Write the failing test**

Create `src/lib/splitBill.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { splitBill } from "./splitBill";

describe("splitBill", () => {
  it("divides evenly", () => {
    expect(splitBill(100, 4)).toEqual({ perPerson: "25.0000000", error: null });
  });
  it("rounds to 7 decimals", () => {
    expect(splitBill(10, 3)).toEqual({ perPerson: "3.3333333", error: null });
  });
  it("rejects zero or negative total", () => {
    expect(splitBill(0, 2).error).toBeTruthy();
    expect(splitBill(-5, 2).error).toBeTruthy();
  });
  it("rejects fewer than 1 person", () => {
    expect(splitBill(100, 0).error).toBeTruthy();
  });
  it("rejects non-integer people", () => {
    expect(splitBill(100, 2.5).error).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- splitBill`
Expected: FAIL — `splitBill` not defined.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/splitBill.ts`:
```ts
export interface SplitResult {
  perPerson: string;
  error: string | null;
}

export function splitBill(total: number, people: number): SplitResult {
  if (!(total > 0)) {
    return { perPerson: "0", error: "Toplam tutar 0'dan büyük olmalı." };
  }
  if (!Number.isInteger(people) || people < 1) {
    return { perPerson: "0", error: "Kişi sayısı en az 1 tam sayı olmalı." };
  }
  const perPerson = (total / people).toFixed(7);
  return { perPerson, error: null };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- splitBill`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/splitBill.ts src/lib/splitBill.test.ts
git commit -m "feat: add split bill calculation"
```

---

### Task 3: Stellar service — address validation + balance + payment

**Files:**
- Create: `src/lib/stellar.ts`
- Test: `src/lib/stellar.test.ts`

**Interfaces:**
- Consumes: nothing from prior tasks.
- Produces:
  - `isValidAddress(address: string): boolean` — true for valid Stellar public keys (G...).
  - `getBalance(address: string): Promise<string>` — returns the native XLM balance string; throws `Error("ACCOUNT_NOT_FOUND")` if account is not funded on testnet.
  - `sendPayment(opts: { senderAddress: string; destination: string; amount: string; signXdr: (xdr: string) => Promise<string> }): Promise<string>` — builds, signs (via injected `signXdr`), submits; returns the transaction hash.

- [ ] **Step 1: Write the failing test (address validation only — pure, no network)**

Create `src/lib/stellar.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { isValidAddress } from "./stellar";

describe("isValidAddress", () => {
  it("accepts a valid public key", () => {
    expect(
      isValidAddress("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7")
    ).toBe(true);
  });
  it("rejects garbage", () => {
    expect(isValidAddress("not-an-address")).toBe(false);
    expect(isValidAddress("")).toBe(false);
  });
  it("rejects a secret key", () => {
    expect(
      isValidAddress("SAOKEM6XUZP3ZBPKZWZ5K3W2E6QZJ6RZ6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q")
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- stellar`
Expected: FAIL — `isValidAddress` not defined.

- [ ] **Step 3: Write the implementation**

Create `src/lib/stellar.ts`:
```ts
import {
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
  Networks,
  BASE_FEE,
  StrKey,
} from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.org";
const server = new Horizon.Server(HORIZON_URL);

export function isValidAddress(address: string): boolean {
  return StrKey.isValidEd25519PublicKey(address);
}

export async function getBalance(address: string): Promise<string> {
  try {
    const account = await server.loadAccount(address);
    const native = account.balances.find((b) => b.asset_type === "native");
    return native ? native.balance : "0";
  } catch (e: unknown) {
    if (e && typeof e === "object" && "response" in e) {
      const resp = (e as { response?: { status?: number } }).response;
      if (resp?.status === 404) throw new Error("ACCOUNT_NOT_FOUND");
    }
    throw e;
  }
}

export async function sendPayment(opts: {
  senderAddress: string;
  destination: string;
  amount: string;
  signXdr: (xdr: string) => Promise<string>;
}): Promise<string> {
  const { senderAddress, destination, amount, signXdr } = opts;
  const account = await server.loadAccount(senderAddress);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount,
      })
    )
    .setTimeout(180)
    .build();

  const signedXdr = await signXdr(tx.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const result = await server.submitTransaction(signedTx);
  return result.hash;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- stellar`
Expected: PASS (3 tests).

Note: `getBalance`/`sendPayment` are verified manually against testnet (Task 8); only the pure `isValidAddress` is unit-tested here to avoid brittle network mocks.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stellar.ts src/lib/stellar.test.ts
git commit -m "feat: add stellar service (address validation, balance, payment)"
```

---

### Task 4: Freighter wallet service

**Files:**
- Create: `src/lib/freighter.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `connectWallet(): Promise<string>` — checks install, requests access, returns public key. Throws `Error("NOT_INSTALLED")` or `Error("ACCESS_DENIED")`.
  - `signTransaction(xdr: string): Promise<string>` — signs a transaction XDR on testnet via Freighter, returns signed XDR. Throws `Error("SIGN_CANCELLED")` on rejection.

- [ ] **Step 1: Write the implementation (thin wrapper, no unit test — verified manually)**

Create `src/lib/freighter.ts`:
```ts
import {
  isConnected,
  requestAccess,
  signTransaction as freighterSign,
} from "@stellar/freighter-api";
import { Networks } from "@stellar/stellar-sdk";

export async function connectWallet(): Promise<string> {
  const connected = await isConnected();
  if (!connected || (typeof connected === "object" && !connected.isConnected)) {
    throw new Error("NOT_INSTALLED");
  }
  try {
    const result = await requestAccess();
    const address =
      typeof result === "object" && result !== null
        ? (result as { address: string }).address
        : (result as unknown as string);
    if (!address) throw new Error("ACCESS_DENIED");
    return address;
  } catch {
    throw new Error("ACCESS_DENIED");
  }
}

export async function signTransaction(xdr: string): Promise<string> {
  try {
    const result = await freighterSign(xdr, {
      networkPassphrase: Networks.TESTNET,
    });
    return typeof result === "object" && result !== null
      ? (result as { signedTxXdr: string }).signedTxXdr
      : (result as unknown as string);
  } catch {
    throw new Error("SIGN_CANCELLED");
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/freighter.ts
git commit -m "feat: add freighter wallet service"
```

---

### Task 5: useWallet hook

**Files:**
- Create: `src/hooks/useWallet.ts`

**Interfaces:**
- Consumes: `connectWallet` (Task 4), `getBalance` (Task 3).
- Produces: `useWallet()` returning `{ address: string | null; balance: string | null; status: "idle" | "connecting" | "loading-balance" | "ready" | "error"; error: string | null; connect: () => Promise<void>; disconnect: () => void; refreshBalance: () => Promise<void>; }`.

- [ ] **Step 1: Write the implementation**

Create `src/hooks/useWallet.ts`:
```ts
import { useState, useCallback } from "react";
import { connectWallet } from "../lib/freighter";
import { getBalance } from "../lib/stellar";

type Status = "idle" | "connecting" | "loading-balance" | "ready" | "error";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const loadBalance = useCallback(async (addr: string) => {
    setStatus("loading-balance");
    try {
      const bal = await getBalance(addr);
      setBalance(bal);
      setStatus("ready");
    } catch (e) {
      const msg =
        e instanceof Error && e.message === "ACCOUNT_NOT_FOUND"
          ? "Hesap testnet'te bulunamadı. Friendbot ile fonlayın."
          : "Bakiye alınamadı.";
      setError(msg);
      setStatus("error");
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setStatus("connecting");
    try {
      const addr = await connectWallet();
      setAddress(addr);
      await loadBalance(addr);
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
    setAddress(null);
    setBalance(null);
    setStatus("idle");
    setError(null);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (address) await loadBalance(address);
  }, [address, loadBalance]);

  return { address, balance, status, error, connect, disconnect, refreshBalance };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useWallet.ts
git commit -m "feat: add useWallet hook"
```

---

### Task 6: UI components (WalletConnect, BalanceCard, SplitForm, TxStatus)

**Files:**
- Create: `src/components/WalletConnect.tsx`, `src/components/BalanceCard.tsx`, `src/components/TxStatus.tsx`, `src/components/SplitForm.tsx`

**Interfaces:**
- Consumes: `splitBill` (Task 2), `isValidAddress`/`sendPayment` (Task 3), `signTransaction` (Task 4).
- Produces (component props):
  - `WalletConnect({ address, status, onConnect, onDisconnect })`
  - `BalanceCard({ balance, onRefresh })`
  - `TxStatus({ state, hash, message })` where `state: "idle" | "signing" | "submitting" | "success" | "error"`
  - `SplitForm({ senderAddress, onPaid })`

- [ ] **Step 1: WalletConnect component**

Create `src/components/WalletConnect.tsx`:
```tsx
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
```

- [ ] **Step 2: BalanceCard component**

Create `src/components/BalanceCard.tsx`:
```tsx
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
```

- [ ] **Step 3: TxStatus component**

Create `src/components/TxStatus.tsx`:
```tsx
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
```

- [ ] **Step 4: SplitForm component**

Create `src/components/SplitForm.tsx`:
```tsx
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

  async function handleSend() {
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
      setTxMessage(
        e instanceof Error && e.message === "SIGN_CANCELLED"
          ? "İşlem iptal edildi."
          : "İşlem gönderilemedi. Bakiyenizi ve adresi kontrol edin."
      );
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
        onChange={(e) => setDestination(e.target.value)}
      />
      {!destValid && <p className="text-sm text-red-400">Geçersiz adres formatı.</p>}

      <input
        className={inputCls}
        type="number"
        placeholder="Gönderilecek tutar (XLM)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button
        onClick={handleSend}
        disabled={!destValid || destination === "" || amount === "" || txState === "signing" || txState === "submitting"}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 disabled:opacity-50"
      >
        Payımı Gönder
      </button>

      <TxStatus state={txState} hash={txHash} message={txMessage} />
    </div>
  );
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components
git commit -m "feat: add UI components (wallet, balance, split form, tx status)"
```

---

### Task 7: App integration

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useWallet` (Task 5), all components (Task 6).

- [ ] **Step 1: Compose the app**

Overwrite `src/App.tsx`:
```tsx
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
```

- [ ] **Step 2: Run full test + type-check + build**

Run:
```bash
npm test
npx tsc --noEmit
npm run build
```
Expected: tests pass, no type errors, build succeeds.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`. In browser with Freighter (Testnet): connect wallet → address + balance show. If unfunded, fund via https://friendbot.stellar.org. Calculate split, enter a destination, send payment → success state with hash link.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up app integration"
```

---

### Task 8: README, screenshots, and GitHub publish

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `README.md` with: project description, features, setup/run instructions (`npm install`, `npm run dev`), Freighter + Testnet note, Friendbot funding link, and placeholders for three screenshots (wallet connected, balance displayed, successful transaction with result shown).

- [ ] **Step 2: Capture screenshots**

Run the app, capture: (1) wallet connected state, (2) balance displayed, (3) successful testnet transaction showing the result/hash. Save under `docs/screenshots/` and reference them in README.

- [ ] **Step 3: Commit**

```bash
git add README.md docs/screenshots
git commit -m "docs: add README and screenshots"
```

- [ ] **Step 4: Create GitHub repo and push**

Under account `mrt-cn` (public). If `gh` is installed: `gh repo create mrt-cn/stellar-split-bill --public --source=. --push`. Otherwise create the repo on github.com, then:
```bash
git branch -M main
git remote add origin https://github.com/mrt-cn/stellar-split-bill.git
git push -u origin main
```

---

## Self-Review

**Spec coverage:**
- Wallet setup (Freighter/Testnet) → Tasks 4, 7 (manual). ✓
- Connect/disconnect → Tasks 4, 5, 6 (WalletConnect), 7. ✓
- Balance fetch + display → Tasks 3 (getBalance), 5, 6 (BalanceCard). ✓
- Send XLM transaction + feedback (success/fail, hash) → Tasks 3 (sendPayment), 6 (SplitForm, TxStatus). ✓
- Split calculation → Task 2. ✓
- Error handling table → Tasks 3, 5, 6 messages. ✓
- Testing approach → Tasks 2, 3 unit tests; manual in 7. ✓
- Submission (repo, README, screenshots) → Task 8. ✓

**Placeholder scan:** No TBD/TODO in code steps; all code blocks complete.

**Type consistency:** `splitBill` returns `{perPerson, error}` (used in SplitForm). `sendPayment` signature with `signXdr` injection matches SplitForm call. `signTransaction`/`connectWallet`/`getBalance` names consistent across hook and components. `TxState` union consistent between SplitForm and TxStatus.
