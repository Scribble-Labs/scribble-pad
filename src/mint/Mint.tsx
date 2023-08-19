import { CandyMachine } from "@metaplex-foundation/js";
import { useCallback, useMemo, useState } from "react";
import Nft from "../common/nft/Nft";
import Logo from "../logo/Logo";
import MintCountInfo from "./mint-count-info/MintCountInfo";
import MintDateInfo from "./mint-date-info/MintDateInfo";
import MintEligibilityInfo from "./mint-eligibility-info/MintEligibilityInfo";
import MintLoading from "./mint-loading/MintLoading";
import MintMessageInfo from "./mint-message-info/MintMessageInfo";
import MintMultiplier from "./mint-multiplier/MintMultiplier";
import MintPhases from "./mint-phases/MintPhases";
import "./mint.css";
import { EligibiltyInfo, GuardInfo, OwnerInfo } from "./mint.eligibility";
import { useMintContext, withMintStore } from "./mint.store";
import TransferTokens from "./transfer-tokens/TransferTokens";
import { ALREADY_MINTED } from "../constants";

interface MintContentProps {
  date: Date;
  recomputeDate: () => void;
  minted: number;
  total: number;
  ownerInfo?: OwnerInfo;
  guardInfo: GuardInfo;
  candyMachine: CandyMachine;
  mintFee: number;
  mintMultiplier: number;
  setMintMultiplier: (value: number) => void;
  isMinting: boolean;
  handleMint: () => void;
}

function MintContent({
  date,
  recomputeDate,
  minted,
  total,
  ownerInfo,
  guardInfo,
  candyMachine,
  mintFee,
  mintMultiplier,
  setMintMultiplier,
  isMinting,
  handleMint,
}: MintContentProps) {
  total = guardInfo?.maxToBeMinted || total;
  const soldOut = minted >= total;
  const maxMint = useMemo(
    () =>
      ownerInfo &&
      EligibiltyInfo.maxMintWithGuard(
        ownerInfo,
        guardInfo,
        date,
        candyMachine,
        mintFee
      ),
    [ownerInfo, guardInfo, date, candyMachine, mintFee]
  );
  const canMint = useMemo(
    () =>
      ownerInfo &&
      EligibiltyInfo.canMint(
        EligibiltyInfo.canMintWithGuard(
          ownerInfo,
          guardInfo,
          date,
          candyMachine,
          mintFee,
          Math.max(mintMultiplier, 1)
        )
      ),
    [ownerInfo, guardInfo, date, candyMachine, mintFee, mintMultiplier]
  );

  return (
    <div className="bg-purple">
      <MintDateInfo
        guardInfo={guardInfo}
        soldOut={minted >= total}
        recomputeDate={recomputeDate}
      />
      <MintCountInfo
        minted={minted + ALREADY_MINTED}
        total={total + ALREADY_MINTED}
      />
      {!!ownerInfo && !soldOut && (
        <MintEligibilityInfo
          ownerInfo={ownerInfo}
          guardInfo={guardInfo}
          candyMachine={candyMachine}
          mintFee={mintFee}
          mintMultiplier={mintMultiplier}
        />
      )}
      {/* {!!ownerInfo && (
        <MintMultiplier
          mintMultiplier={mintMultiplier}
          setMintMultiplier={setMintMultiplier}
          isMinting={isMinting}
          maxMintMultiplier={maxMint!}
        />
      )} */}

      <button
        className="primary mint-button"
        disabled={!canMint || isMinting}
        onClick={handleMint}
      >
        {soldOut && "Sold out!"}
        {!soldOut && <>{isMinting ? "Minting" : "Mint"}</>}
      </button>
      <p style={{ fontSize: "1.8rem", textAlign: "center" }}>
        By using this website and minting an NFT you will be deemed to have done
        your own research and used at least one brain cell.
      </p>
    </div>
  );
}

function Mint() {
  const {
    candyMachine,
    mintFee,
    eligibility,
    onMint,
    isMinting,
    mintMessage,
    clearMintMessage,
    myCollectionMinted,
    refreshing,
    mintMultiplier,
    setMintMultiplier,
  } = useMintContext();

  const [dateNonce, setDateNonce] = useState(0);
  const recomputeDate = useCallback(
    () => setDateNonce(Math.random()),
    [setDateNonce]
  );
  const date = useMemo(() => new Date(), [dateNonce]);

  const guardInfo = useMemo(() => {
    if (eligibility?.guardsInfo.length || 0 > 0) {
      const guardsInfo = eligibility?.guardsInfo!;
      const now = date.getTime();
      if (now < guardsInfo[0].startDate?.getTime()!) {
        return guardsInfo[0];
      } else {
        return guardsInfo.find(
          (g) =>
            now > g.startDate?.getTime()! &&
            (!g.endDate || now < g.endDate?.getTime())
        );
      }
    }
  }, [date, eligibility, eligibility?.guardsInfo]);

  const handleMint = useCallback(async () => {
    if (guardInfo) {
      const mintInfo = eligibility!.getMintInfoWithGuard(guardInfo);
      if (mintInfo) {
        await onMint(guardInfo, mintInfo).then((res) => {
          console.log(mintInfo);
        });
      }
    }
  }, [onMint, eligibility, guardInfo]);

  const total = candyMachine?.itemsAvailable.toNumber();
  const minted = candyMachine?.itemsMinted.toNumber();

  return (
    <main className="mint zoom">
      <div className="mint-box box">
        <MintLoading show={refreshing} className="mint-loading" />
        {!candyMachine || (!guardInfo && <h1>Loading...</h1>)}
        {!!candyMachine && guardInfo && (
          <div className="mint-container">
            <div className="flex-custom">
              <h1 className="main-header">
                The Cosmic <br /> Lottery
              </h1>
              <div className="flex-row">
                <div>Doxxed</div>
                <div>Escrow: 0d</div>
                <div>Total Supply: 666</div>
              </div>
              <div className="flex-row">
                <a href="https://twitter.com/xscribblelabsx" target="_blank">
                  <img src="/twitter.png" alt="twitter" />
                </a>
                <a href="https://discord.gg/scribblelabs" target="_blank">
                  <img src="/discord.png" alt="discord" />
                </a>
                <a href="https://scribblelabs.xyz" target="_blank">
                  {" "}
                  <img src="/globe.png" alt="globe" />
                </a>
              </div>
              <p className="copy-main">
                "I'm an alligator. I'm a mama-papa comin' for you. I'm the space
                invader. I'll be a rock 'n' rollin bitch for you. Keep your
                mouth shut. You're squawking like a pink monkey bird. And I'm
                bustin up my brains for the words. <br /> <br />
                Keep your electric eye on me, babe. Put your ray gun to my head.
                Press your space face close to mine love. Freak out in a moonage
                daydream, oh yeah!"
              </p>

              <MintPhases
                minted={minted!}
                total={total!}
                allGuards={eligibility!.guardsInfo}
                currentGuard={guardInfo}
              />
            </div>

            <div
              className="flex-column"
              style={{
                padding: "",
              }}
            >
              <img src="/OG.png" />

              <MintContent
                date={date}
                recomputeDate={recomputeDate}
                minted={minted!}
                total={total!}
                candyMachine={candyMachine}
                ownerInfo={eligibility!.ownerInfo}
                guardInfo={guardInfo}
                mintFee={mintFee}
                mintMultiplier={1}
                setMintMultiplier={setMintMultiplier}
                isMinting={isMinting}
                handleMint={handleMint}
              />
            </div>
          </div>
        )}
      </div>

      {/* {myCollectionMinted.length > 0 && (
        <div className="mint-box box">
          <h2>My Primates</h2>
          <div className="mint-nfts">
            {myCollectionMinted
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((m) => (
                <Nft key={m.mintAddress.toBase58()} metadata={m} />
              ))}
          </div>
        </div>
      )} */}

      {!!guardInfo && !!eligibility?.ownerInfo && (
        <TransferTokens
          guardInfo={guardInfo}
          ownerInfo={eligibility!.ownerInfo}
        />
      )}

      <MintMessageInfo message={mintMessage} clearMessage={clearMintMessage} />
    </main>
  );
}

export default withMintStore(Mint);
