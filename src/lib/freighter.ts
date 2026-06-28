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
