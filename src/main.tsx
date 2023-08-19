import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { MetaplexStore } from "./metaplex/metaplex.store";
import Mint from "./mint/Mint";
import { WalletStore } from "./wallet/wallet.store";
import { RpcStore } from "./rpc/rpc.store";
import RpcSelector from "./rpc/RpcSelector";
import Logo from "./logo/Logo";
import Header from "./header/Header";

if (window.innerWidth <= 1156) {
  document.body.innerHTML = `
      <div style="
          display: flex;
          height: 100vh;
          align-items: center;
          justify-content: center;
          font-family: Arial, sans-serif;
          font-size: 24px;
          text-align: center;
      ">
      ⋆˙⟡♡ go 2 desktop pls and ty ♡⟡˙⋆
          <br> </br>
          (つ . •́ _ʖ •̀ .)つ
      </div>
  `;
}

interface StoresProps {
  children: React.ReactNode;
}

function Stores({ children }: StoresProps) {
  return (
    <RpcStore>
      <WalletStore>
        <MetaplexStore>{children}</MetaplexStore>
      </WalletStore>
    </RpcStore>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Stores>
      {/* <Logo /> */}
      <Header />
      <RpcSelector />
      <Mint />
      <div className="footer-placeholder" />
      <footer />
    </Stores>
  </React.StrictMode>
);
