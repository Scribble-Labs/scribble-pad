import "./header.css";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Header() {
  return (
    <header className="site-header">
      <WalletMultiButton />
    </header>
  );
}
