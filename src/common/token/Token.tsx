import { Metadata } from "@metaplex-foundation/js";
import { useMetadataImage } from "../nft/nft.hooks";

export function Token({
  className,
  metadata,
}: {
  className?: string;
  metadata: Metadata;
}) {
  const image = useMetadataImage(metadata);

  return <img className={className} src={image} alt={metadata.symbol} />;
}
