import {
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
  Networks,
  BASE_FEE,
  StrKey,
} from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
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
  try {
    const result = await server.submitTransaction(signedTx);
    return result.hash;
  } catch (e: unknown) {
    const codes =
      e && typeof e === "object"
        ? (e as { response?: { data?: { extras?: { result_codes?: { transaction?: string; operations?: string[] } } } } })
            .response?.data?.extras?.result_codes
        : undefined;
    if (codes) {
      const opCode = Array.isArray(codes.operations)
        ? codes.operations.find((c) => c && c !== "op_success")
        : undefined;
      const reason = opCode || codes.transaction;
      if (reason) throw new Error(`HORIZON:${reason}`);
    }
    throw e;
  }
}
