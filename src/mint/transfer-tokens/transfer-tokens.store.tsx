import { PublicKey } from "@solana/web3.js";
import { createContext, useCallback, useContext, useState } from "react";
import { useMetaplexContext } from "../../metaplex/metaplex.store";
import { toBigNumber } from "@metaplex-foundation/js";
import { TokenAccount } from "../mint.eligibility";
import {
  getExplorerUrlForMint,
  getExplorerUrlForTransaction,
} from "../../utils";
import { useMintContext } from "../mint.store";

interface TransferTokensContextProps {
  sending: boolean;
  amount: number;
  setAmount: (value: number) => void;
  onTransfer: (
    tokenAccount: TokenAccount,
    destination: string
  ) => Promise<void>;
}

const TransferTokensContext = createContext<TransferTokensContextProps>({
  sending: false,
  amount: 0,
  setAmount: () => {},
  onTransfer: () => Promise.resolve(),
});

export const useTransferTokensContext = () => useContext(TransferTokensContext);

function useTransferTokens(): TransferTokensContextProps {
  const { metaplex } = useMetaplexContext();
  const { setMintMessage, recomputeEligibility } = useMintContext();
  const [sending, setSending] = useState(false);
  const [amount, setAmount] = useState(0);

  const onTransfer = useCallback(
    async (tokenAccount: TokenAccount, destination: string) => {
      if (!metaplex) {
        return;
      }
      try {
        setSending(true);
        setMintMessage({
          severity: "info",
          text: "Please approve the transfer transaction",
          autoHide: false,
        });
        const result = await metaplex.tokens().send({
          mintAddress: tokenAccount.mint,
          amount: {
            basisPoints: toBigNumber(amount),
            currency: {
              symbol: "",
              decimals: tokenAccount.decimals,
              namespace: "spl-token",
            },
          },
          toOwner: new PublicKey(destination),
        });
        setMintMessage({
          severity: "success",
          text: "Transfer completed",
          autoHide: true,
        });
        window.open(
          getExplorerUrlForTransaction(result.response.signature),
          "_blank"
        );
      } catch (err: any) {
        console.error(err);
        setMintMessage({
          severity: "error",
          text: `Could not transfer the tokens. Error: ${err.message}`,
          autoHide: true,
        });
      } finally {
        setSending(false);
        recomputeEligibility();
      }
    },
    [metaplex, setSending, amount, setMintMessage, recomputeEligibility]
  );

  return {
    sending,
    amount,
    setAmount,
    onTransfer,
  };
}

export function TransferTokensStore({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = useTransferTokens();

  return (
    <TransferTokensContext.Provider value={context}>
      {children}
    </TransferTokensContext.Provider>
  );
}

export function withTransferTokensStore(Component: React.FC<any>) {
  function TransferTokensStoreWrapper(props: any) {
    return (
      <TransferTokensStore>
        <Component {...props} />
      </TransferTokensStore>
    );
  }
  return TransferTokensStoreWrapper;
}
