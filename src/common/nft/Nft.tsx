import { Metadata } from "@metaplex-foundation/js";
import { getExplorerUrlForMint } from "../../utils";
import "./nft.css";
import { useMetadataImage } from "./nft.hooks";

interface NftProps {
  metadata: Metadata;
}

export default function Nft({ metadata }: NftProps) {
  const image = useMetadataImage(metadata);

  return (
    <a href={getExplorerUrlForMint(metadata.mintAddress)} target="_blank">
      <img className="nft-image" src={image} alt={metadata.symbol} />
    </a>
  );
}
