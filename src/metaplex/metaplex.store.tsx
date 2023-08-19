import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { Umi, signerIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { createContext, useContext, useMemo } from "react";
import { createSignerFromWalletAdapter } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { mplCandyMachine } from "@metaplex-foundation/mpl-candy-machine";

interface MetaplexContextProps {
  metaplex?: Metaplex;
  umi?: Umi;
}

const MetaplexContext = createContext<MetaplexContextProps>({});

export const useMetaplexContext = () => useContext(MetaplexContext);

function useMetaplex(): MetaplexContextProps {
  const { connection } = useConnection();
  const wallet = useWallet();

  const metaplex = useMemo(
    () => Metaplex.make(connection).use(walletAdapterIdentity(wallet)),
    [connection, wallet]
  );

  const umi = useMemo(
    () =>
      createUmi(connection.rpcEndpoint)
        .use(signerIdentity(createSignerFromWalletAdapter(wallet)))
        .use(mplCandyMachine()),
    [connection, wallet]
  );

  return { metaplex, umi };
}

export function MetaplexStore({ children }: { children: React.ReactNode }) {
  const context = useMetaplex();

  return (
    <MetaplexContext.Provider value={context}>
      {children}
    </MetaplexContext.Provider>
  );
}
