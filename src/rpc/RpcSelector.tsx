import { useCallback } from "react";
import { useRpcContext } from "./rpc.store";
import "./rpc-selector.css";
import clsx from "clsx";

interface RpcProps {
  index: number;
  selected: boolean;
  onSelect: (index: number) => void;
}

function Rpc({ index, selected, onSelect }: RpcProps) {
  const handleClick = useCallback(() => onSelect(index), [onSelect, index]);
  return (
    <button
      className={clsx(
        "rpc-selector-button",
        selected && "rpc-selector-button-active"
      )}
      onClick={handleClick}
    >
      RPC #{index + 1}
    </button>
  );
}

export default function RpcSelector() {
  const { rpcList, rpcIndex, setRpcIndex } = useRpcContext();

  if (rpcList.length < 2) {
    return null;
  }

  return (
    <div className="rpc-selector">
      {rpcList.map((rpc, ix) => (
        <Rpc
          key={rpc}
          index={ix}
          selected={rpcIndex === ix}
          onSelect={setRpcIndex}
        />
      ))}
    </div>
  );
}
