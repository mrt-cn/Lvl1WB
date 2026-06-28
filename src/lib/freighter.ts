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
  let address: string;
  try {
    const result = await requestAccess();
    address =
      typeof result === "object" && result !== null
        ? (result as { address: string }).address
        : (result as unknown as string);
  } catch (e) {
    console.error("Freighter connect failed:", e);
    throw new Error("ACCESS_DENIED");
  }
  if (!address) throw new Error("ACCESS_DENIED");
  return address;
}

export async function signTransaction(xdr: string): Promise<string> {
  let signed: string;
  try {
    const result = await freighterSign(xdr, {
      networkPassphrase: Networks.TESTNET,
    });
    signed =
      typeof result === "object" && result !== null
        ? (result as { signedTxXdr: string }).signedTxXdr
        : (result as unknown as string);
  } catch (e) {
    console.error("Freighter sign failed:", e);
    throw new Error("SIGN_CANCELLED");
  }
  if (!signed) throw new Error("SIGN_CANCELLED");
  return signed;
}
