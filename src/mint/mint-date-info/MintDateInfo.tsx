import Countdown from "../../common/countdown/Countdown";
import { GuardInfo } from "../mint.eligibility";
import "./mint-date-info.css";

interface MintDateInfoProps {
  soldOut: boolean;
  guardInfo: GuardInfo;
  recomputeDate: () => void;
}

export default function MintDateInfo({
  soldOut,
  guardInfo,
  recomputeDate,
}: MintDateInfoProps) {
  const now = Date.now();
  const showStart = guardInfo.startDate && guardInfo.startDate.getTime() > now;
  const showEnd =
    !showStart && guardInfo.endDate && now < guardInfo.endDate.getTime();
  const ended = guardInfo.endDate && now > guardInfo.endDate.getTime();

  return soldOut ? null : (
    <div className="mint-date">
      {showStart && (
        <>
          <div className="mint-date-title">Starts in:</div>
          <Countdown
            endDate={guardInfo.startDate!}
            onComplete={recomputeDate}
          />
        </>
      )}
      {showEnd && (
        <>
          <div className="mint-date-title">Ends in:</div>
          <Countdown endDate={guardInfo.endDate!} onComplete={recomputeDate} />
        </>
      )}
      {ended && <h2 className="mint-date-title-closed">Mint closed</h2>}
    </div>
  );
}
