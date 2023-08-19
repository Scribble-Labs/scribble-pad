import ProgressBar from "../../common/progress-bar/ProgressBar";
import "./mint-count-info.css";

interface MintCountInfoProps {
  minted: number;
  total: number;
}

export default function MintCountInfo({ minted, total }: MintCountInfoProps) {
  const remaining = total - minted;
  const value = minted / total;

  return (
    <div style={{ width: "100%" }}>
      {/* <div className="mint-count-stat box mint-count-minted">
        <span className="mint-count-stat-value">
          {minted}/<small>{total}</small>
        </span>
        <span className="mint-count-stat-text">minted</span>
      </div> */}
      <div className="mint-count-progress" style={{ display: "block" }}>
        <ProgressBar value={value} />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          color: "white",
          fontSize: "2rem",
          fontWeight: "600",
          marginTop: "1rem",
          padding: "0 9px",
        }}
      >
        <span>Total Minted:</span>
        <span>
          {minted}/<small>{total - 3}</small>
        </span>
      </div>
      {/* <div className="mint-count-stat box mint-count-remaining">
        <span className="mint-count-stat-value">{remaining}</span>
        <span className="mint-count-stat-text">left</span>
      </div> */}
    </div>
  );
}
