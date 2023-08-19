import { PublicKey } from "@solana/web3.js";
import { NETWORK } from "./constants";

export function getExplorerUrlForMint(mintAddress: PublicKey) {
  const suffix = NETWORK === "mainnet-beta" ? "" : `?cluster=${NETWORK}`;
  return `https://solscan.io/token/${mintAddress.toBase58()}${suffix}`;
}

export function getExplorerUrlForTransaction(signature: string) {
  const suffix = NETWORK === "mainnet-beta" ? "" : `?cluster=${NETWORK}`;
  return `https://solscan.io/tx/${signature}${suffix}`;
}
