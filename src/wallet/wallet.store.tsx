import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, ConnectionConfig } from "@solana/web3.js";
import React, { useMemo } from "react";
import { NETWORK } from "../constants";
import { useRpcContext } from "../rpc/rpc.store";

function useWallet() {
  const { rpc } = useRpcContext();
  const endpoint = useMemo(() => rpc || clusterApiUrl(NETWORK), [rpc]);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new SolletWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolletExtensionWalletAdapter(),
    ],
    []
  );

  return { endpoint, wallets };
}

const config: ConnectionConfig = {
  commitment: "processed",
};

interface WalletStoreProps {
  children: React.ReactNode;
}

export function WalletStore({ children }: WalletStoreProps) {
  const { endpoint, wallets } = useWallet();

  return (
    <ConnectionProvider endpoint={endpoint} config={config}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
