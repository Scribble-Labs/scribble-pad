import { createContext, useCallback, useContext, useState } from "react";
import { RPC } from "../constants";

interface RpcContextProps {
  rpc: string;
  rpcList: string[];
  rpcIndex: number;
  setRpcIndex: (ix: number) => void;
  pickNextRpc: () => void;
}

const RpcContext = createContext<RpcContextProps>({
  rpc: "",
  rpcList: [],
  rpcIndex: 0,
  setRpcIndex: () => {},
  pickNextRpc: () => {},
});

export const useRpcContext = () => useContext(RpcContext);

function useRpc(): RpcContextProps {
  const [rpcIndex, setRpcIndex] = useState(0);
  const pickNextRpc = useCallback(() => {
    if (RPC.length > 1) {
      setRpcIndex(rpcIndex + (1 % RPC.length));
    }
  }, [rpcIndex, setRpcIndex]);
  const rpc = RPC[rpcIndex];

  return { rpc, rpcList: RPC, rpcIndex, setRpcIndex, pickNextRpc };
}

export function RpcStore({ children }: { children: React.ReactNode }) {
  const context = useRpc();

  return <RpcContext.Provider value={context}>{children}</RpcContext.Provider>;
}
