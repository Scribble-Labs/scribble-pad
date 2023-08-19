import { PublicKey } from "@solana/web3.js";

export function formatNumber(
  value: number,
  { decimals = 2 }: { decimals: number }
) {
  const formatter = new Intl.NumberFormat("en-us", {
    maximumFractionDigits: decimals,
  });
  return formatter.format(value);
}

export function formatSOLPrice(value: number) {
  return formatNumber(value, { decimals: 3 });
}

export function formatPublicKey(address?: PublicKey) {
  if (!address) {
    return "";
  }
  const str = address.toBase58();
  return `${str.substring(0, 4)}..${str.substring(str.length - 4)}`;
}
