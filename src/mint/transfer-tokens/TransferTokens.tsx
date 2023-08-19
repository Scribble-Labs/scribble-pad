import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { Token } from "../../common/token/Token";
import MintMultiplier from "../mint-multiplier/MintMultiplier";
import { GuardInfo, OwnerInfo } from "../mint.eligibility";
import "./transfer-tokens.css";
import {
  useTransferTokensContext,
  withTransferTokensStore,
} from "./transfer-tokens.store";

interface TransferTokensProps {
  ownerInfo: OwnerInfo;
  guardInfo: GuardInfo;
}

function TransferTokens({ ownerInfo, guardInfo }: TransferTokensProps) {
  const tokenAccount = useMemo(
    () =>
      ownerInfo.tokenAccounts?.find(
        (t) =>
          t.mint.toBase58() === guardInfo.tokenBurn?.mint.toBase58() &&
          t.amount > 0
      ),
    [ownerInfo, guardInfo]
  );
  const { amount, setAmount, sending, onTransfer } = useTransferTokensContext();
  const [destination, setDestination] = useState("");
  const onChangeDestination = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setDestination(event.target.value),
    [setDestination]
  );
  const handleTransfer = useCallback(
    () => onTransfer(tokenAccount!, destination),
    [onTransfer, tokenAccount, destination]
  );

  if (!tokenAccount) {
    return null;
  }

  return (
    <div className="mint-box box">
      <h2>My WL Tokens</h2>
      <div className="transfer-tokens">
        <Token
          className="transfer-tokens-token"
          metadata={guardInfo.tokenBurn!.metadata!}
        />
        <span>x</span>
        <span>{tokenAccount.amount}</span>
      </div>
      {tokenAccount.amount > 0 && (
        <>
          <MintMultiplier
            mintMultiplier={amount}
            setMintMultiplier={setAmount}
            isMinting={sending}
            maxMintMultiplier={tokenAccount.amount}
          />
          <label>Transfer to</label>
          <input
            type="text"
            value={destination}
            onChange={onChangeDestination}
            placeholder="Wallet to receive the tokens"
          />
          <button
            className="primary"
            disabled={sending || amount === 0 || !destination}
            onClick={handleTransfer}
          >
            Transfer
          </button>
        </>
      )}
    </div>
  );
}

export default withTransferTokensStore(TransferTokens);
