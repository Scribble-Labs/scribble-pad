import { CandyMachine, Metadata } from "@metaplex-foundation/js";
import {
  CandyMachine as MplCandyMachine,
  fetchCandyMachine,
  mintV2,
  route,
  safeFetchAllowListProofFromSeeds,
} from "@metaplex-foundation/mpl-candy-machine";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import {
  findAssociatedTokenPda,
  setComputeUnitLimit,
} from "@metaplex-foundation/mpl-toolbox";
import {
  BlockhashWithExpiryBlockHeight,
  RpcConfirmTransactionStrategy,
  generateSigner,
  none,
  publicKey,
  some,
  transactionBuilder,
  transactionBuilderGroup,
} from "@metaplex-foundation/umi";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CMID, MINT_NFT_FEE, MINT_PNFT_FEE } from "../constants";
import { useMetaplexContext } from "../metaplex/metaplex.store";
import { useRpcContext } from "../rpc/rpc.store";
import {
  EligibiltyInfo,
  GuardInfo,
  getMintArgs,
  MintGuardInfo,
} from "./mint.eligibility";

export interface MintMessage {
  severity: "success" | "info" | "warning" | "error";
  progress?: number;
  text: React.ReactNode;
  autoHide: boolean;
  timeToHide?: number;
}

interface MintContextProps {
  candyMachine?: CandyMachine;
  mintFee: number;
  eligibility?: EligibiltyInfo;
  onMint: (guardInfo: GuardInfo, guardMintInfo: MintGuardInfo) => Promise<void>;
  isMinting: boolean;
  mintMessage?: MintMessage;
  setMintMessage: (message?: MintMessage) => void;
  clearMintMessage: () => void;
  myCollectionMinted: Metadata[];
  refreshing: boolean;
  recomputeEligibility: () => void;
  mintMultiplier: number;
  setMintMultiplier: (multiplier: number) => void;
}

const MintContext = createContext<MintContextProps>({
  mintFee: 0,
  onMint: () => Promise.resolve(),
  isMinting: false,
  setMintMessage: () => {},
  clearMintMessage: () => {},
  myCollectionMinted: [],
  refreshing: true,
  recomputeEligibility: () => {},
  mintMultiplier: 1,
  setMintMultiplier: () => {},
});

export const useMintContext = () => useContext(MintContext);

const cmPubkey = new PublicKey(CMID);

function useMint(): MintContextProps {
  const { pickNextRpc } = useRpcContext();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { metaplex, umi } = useMetaplexContext();
  const refreshingRef = useRef(0);
  const [_, setNonce] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const candyMachineRef = useRef<CandyMachine>();
  const cmRef = useRef<MplCandyMachine>();
  const candyMachine = candyMachineRef.current;
  const [mintFee, setMintFee] = useState(0);
  const [eligibility, setEligibility] = useState<EligibiltyInfo | undefined>();
  const [mintMultiplier, setMintMultiplier] = useState(1);
  const [myCollectionMinted, setMyCollectionMinted] = useState<Metadata[]>([]);

  const refreshCandyMachine = useCallback(async () => {
    if (!metaplex || !umi) {
      return;
    }

    try {
      const [candyMachine, cm] = await Promise.all([
        candyMachineRef.current
          ? metaplex.candyMachines().refresh(candyMachineRef.current)
          : metaplex.candyMachines().findByAddress({ address: cmPubkey }),
        fetchCandyMachine(umi, publicKey(cmPubkey)),
      ]);
      candyMachineRef.current = candyMachine;
      cmRef.current = cm;
      setMintFee(
        cm.tokenStandard === TokenStandard.ProgrammableNonFungible
          ? MINT_PNFT_FEE
          : MINT_NFT_FEE
      );

      return candyMachineRef.current;
    } catch (err) {
      console.error(err);
      pickNextRpc();
      throw err;
    }
  }, [metaplex, umi, candyMachineRef, pickNextRpc, setMintFee]);

  const checkEligibility = useCallback(
    async (candyMachine: CandyMachine) => {
      if (metaplex && !wallet.disconnecting) {
        const eligibility = new EligibiltyInfo(connection);
        await eligibility.check(metaplex, candyMachine, wallet?.publicKey);
        const myCollectionMinted = eligibility.ownerInfo?.nfts?.filter(
          (n) =>
            n.collection?.verified &&
            n.collection?.address.toBase58() ===
              candyMachine.collectionMintAddress.toBase58()
        );
        setMyCollectionMinted(myCollectionMinted || []);
        setEligibility(eligibility);
      } else {
        setMintMultiplier(1);
        setMyCollectionMinted([]);
        setEligibility(undefined);
      }
    },
    [
      connection,
      wallet,
      metaplex,
      setMintMultiplier,
      setMyCollectionMinted,
      setEligibility,
    ]
  );
  const recomputeEligibility = useCallback(() => {
    if (candyMachine) {
      checkEligibility(candyMachine);
    }
  }, [checkEligibility, candyMachine]);

  useEffect(() => {
    if (autoRefresh) {
      async function refreshAndCheck() {
        try {
          refreshingRef.current++;
          setNonce(Math.random());
          const candyMachine = await refreshCandyMachine();
          if (candyMachine) {
            await checkEligibility(candyMachine);
          }
        } finally {
          refreshingRef.current--;
          setNonce(Math.random());
        }
      }
      const interval = setInterval(refreshAndCheck, 20000);
      refreshAndCheck();
      return () => clearInterval(interval);
    }
  }, [
    autoRefresh,
    refreshCandyMachine,
    checkEligibility,
    refreshingRef,
    setNonce,
  ]);

  const [isMinting, setIsMinting] = useState(false);
  const [mintMessage, setMintMessage] = useState<MintMessage | undefined>();
  const clearMintMessage = useCallback(
    () => setMintMessage(undefined),
    [setMintMessage]
  );
  const onMint = useCallback(
    async (guardInfo: GuardInfo, guardMintInfo: MintGuardInfo) => {
      if (wallet && metaplex && umi && candyMachine && cmRef.current) {
        try {
          setAutoRefresh(false);
          setIsMinting(true);
          const candyGuard = publicKey(candyMachine.candyGuard!.address);
          const group =
            guardMintInfo.label === "default"
              ? none<string>()
              : some(guardMintInfo.label);
          if (guardMintInfo.merkleProof && guardMintInfo.merkleRoot) {
            const allowListProof = await safeFetchAllowListProofFromSeeds(umi, {
              candyGuard,
              candyMachine: cmRef.current.publicKey,
              merkleRoot: guardMintInfo.merkleRoot,
              user: publicKey(umi.identity),
            });
            if (!allowListProof) {
              setMintMessage({
                severity: "info",
                text: "Please approve the transaction to be able to mint in the whitelist",
                autoHide: false,
              });
              await route(umi, {
                candyMachine: publicKey(cmPubkey),
                candyGuard,
                guard: "allowList",
                group,
                routeArgs: {
                  path: "proof",
                  merkleRoot: guardMintInfo.merkleRoot,
                  merkleProof: guardMintInfo.merkleProof,
                },
              }).sendAndConfirm(umi);
            }
          }
          setMintMessage({
            severity: "info",
            text: `Please approve the transaction to mint ${mintMultiplier} NFTs`,
            autoHide: false,
          });
          const transactionBuilders = new Array(mintMultiplier)
            .fill(0)
            .map(() => {
              const nftMint = generateSigner(umi);
              const builder = transactionBuilder()
                .add(setComputeUnitLimit(umi, { units: 800_000 }))
                .add(
                  mintV2(umi, {
                    candyMachine: publicKey(candyMachine.address),
                    candyGuard,
                    nftMint,
                    collectionMint: publicKey(cmRef.current!.collectionMint),
                    collectionUpdateAuthority: publicKey(
                      cmRef.current!.authority
                    ),
                    group,
                    tokenStandard: cmRef.current!.tokenStandard,
                    mintArgs: getMintArgs(guardInfo, guardMintInfo),
                  })
                );
              return {
                builder,
                mint: nftMint,
                mintAddress: nftMint.publicKey,
                tokenAddress: findAssociatedTokenPda(umi, {
                  mint: nftMint.publicKey,
                  owner: umi.identity.publicKey,
                })[0],
              };
            });

          const builderGroup = transactionBuilderGroup(
            transactionBuilders.map((t) => t.builder)
          ).parallel();
          const transactions = await builderGroup.buildAndSign(umi);

          const status = {
            sent: 0,
            succeeded: 0,
            failed: 0,
            total: transactions.length,
            errors: [] as any[],
          };
          const updateMintMessage = () => {
            setMintMessage({
              severity: "info",
              progress: (status.failed + status.succeeded) / status.total,
              text: `${status.succeeded} of ${
                status.total
              } mints succeded!${status.errors.join("\n")}`,
              autoHide: false,
            });
          };

          let refCollection = myCollectionMinted.slice();

          await Promise.all(
            transactions.map(async (tx, ix) => {
              try {
                const { mintAddress, tokenAddress } = transactionBuilders[ix];
                const signature = await umi.rpc.sendTransaction(tx);
                status.sent++;
                const strategy: RpcConfirmTransactionStrategy = {
                  type: "blockhash",
                  ...(builderGroup.builders[ix].options
                    .blockhash as BlockhashWithExpiryBlockHeight),
                };
                await umi.rpc.confirmTransaction(signature, {
                  strategy,
                });
                status.succeeded++;
                updateMintMessage();
                const nft = await metaplex.nfts().findByMint({
                  mintAddress: new PublicKey(mintAddress),
                  tokenAddress: new PublicKey(tokenAddress),
                });

                refCollection = [
                  ...refCollection,
                  {
                    ...nft,
                    mintAddress: new PublicKey(mintAddress),
                  } as unknown as Metadata,
                ];
                setMyCollectionMinted(refCollection);
              } catch (error) {
                console.error(error);
                status.failed++;
                status.errors.push(`\n${ix + 1}. ${(error as any).message}`);
                updateMintMessage();
              }
            })
          );

          setTimeout(() => setAutoRefresh(true), 1000);
          if (status.succeeded > 0) {
            setMintMultiplier(1);
            setMintMessage({
              severity: "success",
              text: `${status.succeeded} of ${
                status.total
              } mints succeded! Your new NFTs shows now under My collection.${
                status.failed > 0
                  ? "\nFailed mints:" + status.errors.join("")
                  : ""
              }`,
              autoHide: true,
            });
          } else {
            setMintMessage({
              severity: "error",
              text: `All mints failed!${status.errors.join("")}`,
              autoHide: true,
            });
          }
        } catch (err: any) {
          console.error(err);
          setMintMessage({
            severity: "error",
            text: "Failed to mint: " + err.message,
            autoHide: true,
          });
          setAutoRefresh(true);
        } finally {
          setIsMinting(false);
        }
      }
    },
    [
      setAutoRefresh,
      setIsMinting,
      wallet,
      metaplex,
      candyMachine,
      mintMultiplier,
      myCollectionMinted,
      setMyCollectionMinted,
      refreshCandyMachine,
      setMintMultiplier,
    ]
  );

  return {
    candyMachine,
    mintFee,
    eligibility,
    recomputeEligibility,
    onMint,
    isMinting,
    mintMessage,
    setMintMessage,
    clearMintMessage,
    myCollectionMinted,
    refreshing: refreshingRef.current > 0,
    mintMultiplier,
    setMintMultiplier,
  };
}

export function MintStore({ children }: { children: React.ReactNode }) {
  const context = useMint();

  return (
    <MintContext.Provider value={context}>{children}</MintContext.Provider>
  );
}

export function withMintStore(
  Component: React.FC<{ children?: React.ReactNode }>
) {
  function MintStoreWrapper({ children }: { children?: React.ReactNode }) {
    return (
      <MintStore>
        <Component>{children}</Component>
      </MintStore>
    );
  }
  return MintStoreWrapper;
}
