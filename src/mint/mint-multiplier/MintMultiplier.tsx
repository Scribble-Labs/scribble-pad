import { ChangeEvent, useCallback, useEffect } from "react";
import "./mint-multiplier.css";

interface MintMultiplierProps {
  mintMultiplier: number;
  setMintMultiplier: (value: number) => void;
  isMinting: boolean;
  maxMintMultiplier: number;
}

export default function MintMultiplier({
  mintMultiplier,
  setMintMultiplier,
  isMinting,
  maxMintMultiplier,
}: MintMultiplierProps) {
  const onIncrement = useCallback(
    () => setMintMultiplier(mintMultiplier + 1),
    [setMintMultiplier, mintMultiplier]
  );
  const onDecrement = useCallback(
    () => setMintMultiplier(mintMultiplier - 1),
    [setMintMultiplier, mintMultiplier]
  );
  const onMax = useCallback(
    () => setMintMultiplier(maxMintMultiplier),
    [setMintMultiplier, maxMintMultiplier]
  );
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.target.value);
      if (value > 0) {
        setMintMultiplier(Math.min(Math.max(1, value), maxMintMultiplier));
      }
    },
    [setMintMultiplier, maxMintMultiplier]
  );
  useEffect(() => {
    if (mintMultiplier > maxMintMultiplier) {
      setMintMultiplier(maxMintMultiplier);
    } else if (mintMultiplier === 0 && maxMintMultiplier > 0) {
      setMintMultiplier(1);
    }
  }, [mintMultiplier, maxMintMultiplier, setMintMultiplier]);

  return (
    <div className="mint-multiplier">
      <div className="mint-multiplier-selector">
        <button
          className="secondary mint-multiplier-selector-action"
          disabled={mintMultiplier <= 1 || isMinting}
          onClick={onDecrement}
        >
          -
        </button>
        <input type="tel" value={mintMultiplier} onChange={onChange} />
        {maxMintMultiplier > 0 && (
          <span className="mint-multiplier-selector-total">
            / {maxMintMultiplier}
          </span>
        )}
        <button
          className="secondary mint-multiplier-selector-max"
          disabled={mintMultiplier === maxMintMultiplier || isMinting}
          onClick={onMax}
        >
          Max
        </button>
        <button
          className="secondary mint-multiplier-selector-action"
          disabled={mintMultiplier >= maxMintMultiplier || isMinting}
          onClick={onIncrement}
        >
          +
        </button>
      </div>
    </div>
  );
}
