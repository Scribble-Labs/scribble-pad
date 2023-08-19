import { Cluster } from "@solana/web3.js";

export const NETWORK = import.meta.env.VITE_NETWORK as Cluster;
export const RPC: string[] = import.meta.env.VITE_RPC.split("||");

export const CMID = import.meta.env.VITE_CMID;
export const ALREADY_MINTED = 3;
export const MINT_NFT_FEE = 0.012 + 0.01;
export const MINT_PNFT_FEE = 0.0135 + 0.01;
