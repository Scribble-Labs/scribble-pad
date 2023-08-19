import { CandyMachine } from "@metaplex-foundation/js";
import clsx from "clsx";
import React from "react";
import { Token } from "../../common/token/Token";
import { formatPublicKey, formatSOLPrice } from "../../format";
import { EligibiltyInfo, GuardInfo, OwnerInfo } from "../mint.eligibility";
import "./mint-eligibility-info.css";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
interface MintConditionProps {
  required: boolean;
  valid: boolean;
  text: React.ReactNode;
}

function MintCondition({ required, valid, text }: MintConditionProps) {
  return !required ? null : (
    <li
      className={clsx(
        "mint-eligibility-condition",
        !valid && "mint-eligibility-condition-invalid"
      )}
    >
      {text}
    </li>
  );
}

interface MintEligibilityInfoProps {
  ownerInfo: OwnerInfo;
  guardInfo: GuardInfo;
  candyMachine: CandyMachine;
  mintFee: number;
  mintMultiplier: number;
}

export default function MintEligibilityInfo({
  ownerInfo,
  guardInfo,
  candyMachine,
  mintFee,
  mintMultiplier,
}: MintEligibilityInfoProps) {
  const date = new Date();
  mintMultiplier = Math.max(mintMultiplier, 1);
  const eligibility = EligibiltyInfo.canMintWithGuard(
    ownerInfo,
    guardInfo,
    date,
    candyMachine,
    mintFee,
    mintMultiplier
  );

  return (
    <div className="mint-eligibility box">
      <h5 className="mint-eligibility-title">Mint requirements</h5>
      <ul>
        <MintCondition
          required={!!guardInfo.solPayment}
          valid={eligibility.solPayment}
          text={
            <>
              Have{" "}
              <em>
                {/* {formatSOLPrice(
                  mintMultiplier * (mintFee + guardInfo.solPayment!.amount)
                )}{" "}
                SOL */}
                something
              </em>{" "}
              (mint fees included)
            </>
          }
        />
        <MintCondition
          required={!guardInfo.solPayment}
          valid={eligibility.solFees}
          text={
            <>
              Have <em>{formatSOLPrice(mintMultiplier * mintFee)} SOL</em> to
              cover mint fees
            </>
          }
        />
        <MintCondition
          required={!!guardInfo.addressGate}
          valid={eligibility.addressGate}
          text={
            <>
              Only <em>{formatPublicKey(guardInfo.addressGate!)}</em> can mint
            </>
          }
        />
        <MintCondition
          required={!!guardInfo.allowList}
          valid={eligibility.allowList}
          text={
            eligibility.allowList ? (
              <>
                Your wallet <em>is</em> whitelisted for this group
              </>
            ) : (
              <>
                Your wallet is <em>not</em> whitelisted for this group
              </>
            )
          }
        />
        <MintCondition
          required={!!guardInfo.mintLimit}
          valid={eligibility.mintLimit}
          text={
            <>
              {guardInfo.mintLimit?.minted! < guardInfo.mintLimit?.limit! ? (
                <>
                  Can mint{" "}
                  <em>
                    {guardInfo.mintLimit?.limit! - guardInfo.mintLimit?.minted!}
                  </em>{" "}
                  more NFTs with this wallet ({guardInfo.mintLimit?.limit} max)
                </>
              ) : (
                <>
                  Already minted the <em>{guardInfo.mintLimit?.limit} max</em>{" "}
                  NFTs with this wallet
                </>
              )}
            </>
          }
        />
        <MintCondition
          required={!!guardInfo.nftBurn}
          valid={eligibility.nftBurn}
          text={
            <>
              <em>Burn</em> {mintMultiplier} NFTs from{" "}
              <em>{guardInfo.nftGate?.name}</em> collection to mint
            </>
          }
        />
        <MintCondition
          required={!!guardInfo.nftGate}
          valid={eligibility.nftGate}
          text={
            <>
              <em>Hold</em> an NFT from <em>{guardInfo.nftGate?.name}</em>{" "}
              collection to mint
            </>
          }
        />
        <MintCondition
          required={!!guardInfo.nftPayment}
          valid={eligibility.nftPayment}
          text={
            <>
              <em>Pay with {mintMultiplier}</em> NFTs from{" "}
              <em>{guardInfo.nftGate?.name}</em> collection to mint
            </>
          }
        />
        <MintCondition
          required={!!guardInfo.tokenBurn}
          valid={eligibility.tokenBurn}
          text={
            <>
              <em>
                Burn {mintMultiplier * guardInfo.tokenBurn?.amount!} x{" "}
                {!!guardInfo.tokenBurn && (
                  <Token
                    className="mint-eligibility-token"
                    metadata={guardInfo.tokenBurn.metadata!}
                  />
                )}{" "}
                {guardInfo.tokenBurn?.metadata?.name}
              </em>{" "}
              tokens to mint
            </>
          }
        />
        <MintCondition
          required={!!guardInfo.tokenGate}
          valid={eligibility.tokenGate}
          text={
            <>
              <em>
                Hold {guardInfo.tokenGate?.amount} x{" "}
                {guardInfo.tokenGate?.metadata?.symbol}
              </em>{" "}
              tokens to mint
            </>
          }
        />
        <MintCondition
          required={!!guardInfo.tokenPayment}
          valid={eligibility.tokenPayment}
          text={
            <>
              <em>
                Pay with{" "}
                {(mintMultiplier * guardInfo.tokenPayment?.amount!) /
                  LAMPORTS_PER_SOL}{" "}
                x {guardInfo.tokenPayment?.metadata?.symbol}
              </em>{" "}
              tokens to mint
            </>
          }
        />
        <MintCondition
          required={guardInfo.freeze}
          valid={true}
          text={
            <>
              NFTs are <em>frozen</em> until it's <em>sold out</em> or for{" "}
              <em>24hs</em> since mint start.
            </>
          }
        />
      </ul>
    </div>
  );
}
