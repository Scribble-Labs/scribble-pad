import { Metadata } from "@metaplex-foundation/js";
import { useEffect, useState } from "react";

const cachedMetadata: { [key: string]: string } = {};

export function useMetadataImage(metadata: Metadata) {
  const [image, setImage] = useState(cachedMetadata[metadata.uri] || "");
  useEffect(() => {
    if (!cachedMetadata[metadata.uri]) {
      (async function () {
        const { image } = await fetch(metadata.uri).then((r) => r.json());
        cachedMetadata[metadata.uri] = image;
        setImage(image);
      })();
    }
  }, [metadata, setImage]);

  return image;
}
