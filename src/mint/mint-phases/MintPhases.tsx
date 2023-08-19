import clsx from "clsx";
import Countdown from "../../common/countdown/Countdown";
import { formatSOLPrice } from "../../format";
import { GuardInfo, EligibiltyInfo } from "../mint.eligibility";
import "./mint-phases.css";
import spl from "@solana/spl-token";
import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

let splName = "PEEL";

interface MintPhaseProps {
  minted: number;
  total: number;
  guard: GuardInfo;
  eligibility?: EligibiltyInfo;
  isActive: boolean;
  tokenInfo?: any;
  ownerInfo?: any;
}

const countdownClasses = {
  root: "mint-phases-phase-countdown-item",
  value: "mint-phases-phase-countdown-item-value",
  text: "mint-phases-phase-countdown-item-text",
};

function MintPhase({
  minted,
  total,
  guard,
  eligibility,
  isActive,
  tokenInfo,
  ownerInfo,
}: MintPhaseProps) {
  total = guard?.maxToBeMinted || total;
  const soldOut = minted >= total;

  const now = Date.now();
  const showStart = guard.startDate && guard.startDate.getTime() > now;
  // const showStart = true;
  const showEnd = !showStart && guard.endDate && now < guard.endDate.getTime();
  const ended = guard.endDate && now > guard.endDate.getTime();

  return (
    <div
      className={clsx(
        "mint-phases-phase",
        !soldOut && isActive && "mint-phases-phase-active"
      )}
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        padding: "1.5rem 1.5rem",
        height: "12rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        <h6
          className="mint-phases-phase-label"
          style={{
            fontSize: "1.4rem",
            fontFamily: "Montserrat",
            fontWeight: 400,
          }}
        >
          {guard.label == "OG" ? (
            <>Redacted</>
          ) : guard.label == "WL" ? (
            <>
              Whitelisted:{" "}
              {guard.tokenGate?.account ? (
                <span style={{ color: "#23a03f" }}>Yes</span>
              ) : (
                <span style={{ color: "#de2f2b" }}>No</span>
              )}
            </>
          ) : (
            "Public"
          )}
          <span className="mint-phases-phase-max">
            {!!guard.mintLimit?.limit && (
              <span> ({guard.mintLimit.limit} MAX)</span>
            )}
          </span>
        </h6>
        <h6
          style={{
            alignSelf: "flex-start",
            fontWeight: "700",
            fontSize: "1.4rem",
          }}
        >
          {guard.label} Mint
        </h6>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "flex-end",
          height: "100%",
        }}
      >
        <div
          className="mint-phases-phase-date"
          style={{ alignSelf: "flex-end" }}
        >
          {!soldOut && showStart ? (
            <>
              <div className="mint-phases-phase-date-title">
                <Countdown
                  className="mint-phases-phase-countdown"
                  countdownClasses={countdownClasses}
                  endDate={guard.startDate!}
                />
              </div>
            </>
          ) : !soldOut ? (
            <span
              style={{
                color: "#23a03f",
                fontWeight: "600",
                fontSize: "1.4rem",
                backgroundColor: "#23a03e37",
                padding: "8px",
                borderRadius: "15px",
              }}
            >
              LIVE
            </span>
          ) : (
            <span
              style={{
                color: "#de2f2b",
                fontWeight: "600",
                fontSize: "1.4rem",
                backgroundColor: "#de2e2b53",
                padding: "8px",
                borderRadius: "15px",
              }}
            >
              ENDED
            </span>
          )}
          {!soldOut && showEnd && (
            <>
              <div className="mint-phases-phase-date-title">Ends in:</div>
              <Countdown
                className="mint-phases-phase-countdown"
                countdownClasses={countdownClasses}
                endDate={guard.endDate!}
              />
            </>
          )}
          {(ended || soldOut) && (
            <span className="mint-phases-phase-date-title">Closed</span>
          )}
        </div>
        <span className="mint-phases-phase-price">
          Price: {"  "}
          <span style={{ fontWeight: "700" }}>
            {guard.solPayment
              ? (guard.solPayment?.amount * 10).toFixed(3)
              : guard.tokenPayment?.amount! / LAMPORTS_PER_SOL || 0}{" "}
            {guard.solPayment ? "SOL" : splName}
          </span>
        </span>
      </div>
    </div>
  );
}

interface MintPhasesProps {
  minted: number;
  total: number;
  allGuards: GuardInfo[];
  currentGuard: GuardInfo;
  ownerInfo?: any;
  tokenInfo?: any;
}

export default function MintPhases({
  minted,
  total,
  allGuards,
  currentGuard,
  ownerInfo,
  tokenInfo,
}: MintPhasesProps) {
  return (
    <div className="mint-phases">
      {allGuards.map((g) => (
        <MintPhase
          key={g.label}
          minted={minted}
          total={total}
          guard={g}
          isActive={true}
          tokenInfo={tokenInfo}
          ownerInfo={ownerInfo}
        />
      ))}
    </div>
  );
}
