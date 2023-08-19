import {
  CandyMachine,
  DefaultCandyGuardSettings,
  getMerkleProof,
  getMerkleRoot,
  Metadata,
  Metaplex,
} from "@metaplex-foundation/js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import ogList from "./lists/og-list.json";
import wlList from "./lists/wl-list.json";
import {
  DefaultGuardSet,
  DefaultGuardSetMintArgs,
  GuardGroup,
} from "@metaplex-foundation/mpl-candy-machine";
import { publicKey, some } from "@metaplex-foundation/umi";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";

function uint8ToHex(merkle: Uint8Array) {
  return Buffer.from(merkle).toString("hex");
}

const allowLists: string[][] = [ogList, wlList];
const merkleRoots = allowLists.map((w) => uint8ToHex(getMerkleRoot(w)));
console.info(merkleRoots);

function getAllowList(merkleRoot: string) {
  const ix = merkleRoots.indexOf(merkleRoot);
  if (ix >= 0) {
    return allowLists[ix];
  }
  return [];
}

export interface TokenAccount {
  account?: PublicKey;
  mint: PublicKey;
  decimals: number;
  amount: number;
  metadata?: Metadata;
}

export interface OwnerInfo {
  address: PublicKey;
  solBalance: number;
  nfts?: Metadata[];
  tokenAccounts?: TokenAccount[];
}

export interface GuardInfo {
  label: string;

  startDate?: Date;
  endDate?: Date;
  maxToBeMinted?: number;
  solPayment?: { amount: number; destination: PublicKey };
  freeze: boolean;

  addressGate?: PublicKey;
  allowList?: string[];
  mintLimit?: {
    id: number;
    limit: number;
    minted?: number;
  };

  nftBurn?: Metadata;
  nftGate?: Metadata;
  nftPayment?: Metadata & { destination: PublicKey };

  tokenBurn?: TokenAccount;
  tokenGate?: TokenAccount;
  tokenPayment?: TokenAccount & { destinationAta: PublicKey };
}

export interface MintGuardInfo {
  label: string;
  merkleRoot?: Uint8Array;
  merkleProof?: Uint8Array[];
  tokenBurn?: TokenAccount;
  tokenGate?: TokenAccount;
  tokenPayment?: TokenAccount & { destinationAta: PublicKey };
  nftBurn?: TokenAccount;
  nftGate?: TokenAccount;
  nftPayment?: TokenAccount & { destination: PublicKey };
}

export interface GuardEligibility {
  startDate: boolean;
  endDate: boolean;
  maxToBeMinted: boolean;
  solPayment: boolean;
  solFees: boolean;
  addressGate: boolean;
  allowList: boolean;
  mintLimit: boolean;
  nftBurn: boolean;
  nftGate: boolean;
  nftPayment: boolean;
  tokenBurn: boolean;
  tokenGate: boolean;
  tokenPayment: boolean;
}

export class EligibiltyInfo {
  connection: Connection;
  ownerInfo: OwnerInfo | undefined;
  guardsInfo: GuardInfo[];

  constructor(connection: Connection) {
    this.connection = connection;
    this.guardsInfo = [];
  }

  static canMint(guardEligibility: GuardEligibility) {
    return (
      guardEligibility.startDate &&
      guardEligibility.endDate &&
      guardEligibility.maxToBeMinted &&
      guardEligibility.solPayment &&
      guardEligibility.solFees &&
      guardEligibility.addressGate &&
      guardEligibility.allowList &&
      guardEligibility.mintLimit &&
      guardEligibility.nftBurn &&
      guardEligibility.nftGate &&
      guardEligibility.nftPayment &&
      guardEligibility.tokenBurn &&
      guardEligibility.tokenGate &&
      guardEligibility.tokenPayment
    );
  }

  static maxMintWithGuard(
    ownerInfo: OwnerInfo,
    g: GuardInfo,
    date: Date,
    candyMachine: CandyMachine,
    mintFee: number
  ) {
    let max = 0;
    while (max < 20) {
      if (
        !this.canMint(
          this.canMintWithGuard(
            ownerInfo,
            g,
            date,
            candyMachine,
            mintFee,
            max + 1
          )
        )
      ) {
        break;
      }
      max++;
    }
    return max;
  }

  static canMintWithGuard(
    ownerInfo: OwnerInfo,
    g: GuardInfo,
    date: Date,
    candyMachine: CandyMachine,
    mintFee: number,
    mintMultiplier: number
  ): GuardEligibility {
    return {
      startDate: this.isValidForStartDate(g, date),
      endDate: this.isValidForEndDate(g, date),
      maxToBeMinted: this.isValidForMaxToBeMinted(
        g,
        candyMachine,
        mintMultiplier
      ),
      solPayment: this.isValidForSolPayment(
        g,
        mintFee,
        ownerInfo,
        mintMultiplier
      ),
      solFees: this.isValidForSolFees(mintFee, ownerInfo, mintMultiplier),
      addressGate: this.isValidForAddress(g, ownerInfo),
      allowList: this.isValidForAllowList(g, ownerInfo),
      mintLimit: this.isValidForMintLimit(g, mintMultiplier),
      nftBurn: this.isValidForCollection(g.nftBurn, ownerInfo, mintMultiplier),
      nftGate: this.isValidForCollection(g.nftGate, ownerInfo, 1),
      nftPayment: this.isValidForCollection(
        g.nftPayment,
        ownerInfo,
        mintMultiplier
      ),
      tokenBurn: !!this.isValidForTokens(
        g.tokenBurn,
        ownerInfo,
        mintMultiplier
      ),
      tokenGate: !!this.isValidForTokens(g.tokenGate, ownerInfo, 1),
      tokenPayment: !!this.isValidForTokens(
        g.tokenPayment,
        ownerInfo,
        mintMultiplier
      ),
    };
  }

  getMintInfoWithGuard(g: GuardInfo) {
    if (!this.ownerInfo) {
      return;
    }

    const nftPayment = EligibiltyInfo.getNftValidForCollection(
      g.nftPayment,
      this.ownerInfo
    );

    const mintGuardInfo: MintGuardInfo = {
      label: g.label,
      merkleRoot: g.allowList ? getMerkleRoot(g.allowList) : undefined,
      merkleProof: g.allowList
        ? getMerkleProof(g.allowList, this.ownerInfo.address.toBase58())
        : undefined,
      nftBurn: EligibiltyInfo.getNftValidForCollection(
        g.nftBurn,
        this.ownerInfo
      ),
      nftGate: EligibiltyInfo.getNftValidForCollection(
        g.nftGate,
        this.ownerInfo
      ),
      nftPayment: nftPayment
        ? { ...nftPayment, destination: g.nftPayment!.destination }
        : undefined,
      tokenBurn: g.tokenBurn,
      tokenGate: g.tokenGate,
      tokenPayment: g.tokenPayment,
    };

    return mintGuardInfo;
  }

  static isValidForStartDate(guard: GuardInfo, date: Date) {
    return !guard.startDate || guard.startDate.getTime() <= date.getTime();
  }

  static isValidForEndDate(guard: GuardInfo, date: Date) {
    return !guard.endDate || guard.endDate.getTime() > date.getTime();
  }

  static isValidForMaxToBeMinted(
    guard: GuardInfo,
    candyMachine: CandyMachine,
    mintMultiplier: number
  ) {
    return (
      !guard.maxToBeMinted ||
      candyMachine.itemsMinted.toNumber() + mintMultiplier <=
        guard.maxToBeMinted
    );
  }

  static isValidForAddress(guard: GuardInfo, owner: OwnerInfo) {
    return (
      !guard.addressGate ||
      guard.addressGate.toBase58() === owner.address.toBase58()
    );
  }

  static isValidForAllowList(guard: GuardInfo, owner: OwnerInfo) {
    return (
      !guard.allowList || guard.allowList.includes(owner.address.toBase58())
    );
  }

  static isValidForMintLimit(guard: GuardInfo, mintMultiplier: number) {
    return (
      !guard.mintLimit ||
      (guard.mintLimit.minted || 0) + mintMultiplier <= guard.mintLimit.limit
    );
  }

  static isValidForSolPayment(
    guard: GuardInfo,
    mintFee: number,
    ownerInfo: OwnerInfo,
    mintMultiplier: number
  ) {
    return (
      !guard.solPayment ||
      ownerInfo.solBalance >
        mintMultiplier * (guard.solPayment.amount + mintFee)
    );
  }

  static isValidForSolFees(
    mintFee: number,
    ownerInfo: OwnerInfo,
    mintMultiplier: number
  ) {
    return ownerInfo.solBalance > mintMultiplier * mintFee;
  }

  static getNftValidForCollection(
    collection: Metadata | undefined,
    ownerInfo: OwnerInfo
  ) {
    const metadata =
      collection &&
      ownerInfo.nfts &&
      ownerInfo.nfts?.find(
        (n) =>
          n.collection?.verified &&
          n.collection?.address.toBase58() === collection.mintAddress.toBase58()
      );
    if (metadata) {
      return ownerInfo.tokenAccounts?.find(
        (t) =>
          t.mint.toBase58() === metadata.mintAddress.toBase58() &&
          t.amount === 1
      );
    }
  }

  static isValidForCollection(
    collection: Metadata | undefined,
    ownerInfo: OwnerInfo,
    mintMultiplier: number
  ) {
    return (
      !collection ||
      (ownerInfo.nfts?.filter(
        (n) =>
          n.collection?.verified &&
          n.collection?.address.toBase58() === collection.mintAddress.toBase58()
      )?.length || 0) >= mintMultiplier
    );
  }

  static isValidForTokens(
    tokenInfo: TokenAccount | undefined,
    ownerInfo: OwnerInfo,
    mintMultiplier: number
  ) {
    return (
      !tokenInfo ||
      ownerInfo.tokenAccounts?.some(
        (t) =>
          t.mint.toBase58() === tokenInfo.mint.toBase58() &&
          t.amount >= (mintMultiplier * tokenInfo.amount) / LAMPORTS_PER_SOL
      )
    );
  }

  async check(
    metaplex: Metaplex,
    candyMachine: CandyMachine,
    owner: PublicKey | null
  ) {
    if (candyMachine.candyGuard) {
      const defaultGuard = candyMachine.candyGuard.guards;
      const groups =
        candyMachine.candyGuard.groups.length === 0
          ? [{ label: "default", guards: defaultGuard }]
          : candyMachine.candyGuard.groups.map(({ label, guards }) => ({
              label,
              guards: [
                ...Object.keys(guards),
                ...Object.keys(defaultGuard),
              ].reduce(
                (res, key) => ({
                  ...res,
                  [key]: guards[key] || defaultGuard[key],
                }),
                {}
              ) as DefaultCandyGuardSettings,
            }));

      const needNfts = groups.some(
        (g) => !!g.guards.nftBurn || !!g.guards.nftGate || !!g.guards.nftPayment
      );
      const needTokens =
        needNfts ||
        groups.some(
          (g) =>
            !!g.guards.tokenBurn ||
            !!g.guards.tokenGate ||
            !!g.guards.tokenPayment
        );

      if (owner) {
        const [solBalance, nfts, tokenAccounts] = await Promise.all([
          this.connection.getBalance(owner),
          (
            await metaplex.nfts().findAllByOwner({ owner })
          ).filter((f) => f.model === "metadata"),
          needTokens
            ? this.connection
                .getParsedTokenAccountsByOwner(owner, {
                  programId: TOKEN_PROGRAM_ID,
                })
                .then(({ value }) =>
                  value.reduce<TokenAccount[]>((res, { pubkey, account }) => {
                    const { mint, tokenAmount } = account.data.parsed.info;
                    return [
                      ...res,
                      {
                        account: pubkey,
                        mint: new PublicKey(mint),
                        decimals: tokenAmount.decimals,
                        amount: tokenAmount.uiAmount,
                      },
                    ];
                  }, [])
                )
            : undefined,
        ]);

        this.ownerInfo = {
          address: owner,
          solBalance: solBalance / LAMPORTS_PER_SOL,
          nfts: nfts as Metadata[],
          tokenAccounts,
        };
      }

      const guardsInfo: GuardInfo[] = groups.map(({ label, guards }) => {
        let solPayment: { amount: number; destination: PublicKey } | undefined =
          undefined;
        if (guards.solPayment) {
          solPayment = {
            amount:
              guards.solPayment.amount.basisPoints.toNumber() /
              LAMPORTS_PER_SOL,
            destination: guards.solPayment.destination,
          };
        } else if (guards.freezeSolPayment) {
          solPayment = {
            amount:
              guards.freezeSolPayment.amount.basisPoints.toNumber() /
              LAMPORTS_PER_SOL,
            destination: guards.freezeSolPayment.destination,
          };
        }
        let tokenPayment:
          | (TokenAccount & { destinationAta: PublicKey })
          | undefined;
        if (guards.tokenPayment) {
          tokenPayment = {
            account: guards.tokenPayment.destinationAta,
            mint: guards.tokenPayment.mint,
            decimals: guards.tokenPayment.amount.currency.decimals,
            amount: guards.tokenPayment.amount.basisPoints.toNumber(),
            destinationAta: guards.tokenPayment.destinationAta,
          };
        } else if (guards.freezeTokenPayment) {
          tokenPayment = {
            account: guards.freezeTokenPayment.destinationAta,
            mint: guards.freezeTokenPayment.mint,
            decimals: guards.freezeTokenPayment.amount.currency.decimals,
            amount: guards.freezeTokenPayment.amount.basisPoints.toNumber(),
            destinationAta: guards.freezeTokenPayment.destinationAta,
          };
        }

        return {
          label,
          startDate: guards.startDate
            ? new Date(guards.startDate.date.toNumber() * 1000)
            : undefined,
          endDate: guards.endDate
            ? new Date(guards.endDate.date.toNumber() * 1000)
            : undefined,
          maxToBeMinted:
            guards.redeemedAmount?.maximum.toNumber() ||
            candyMachine.itemsAvailable.toNumber(),
          solPayment,
          freeze: !!guards.freezeSolPayment || !!guards.freezeTokenPayment,
          addressGate: guards.addressGate?.address,
          allowList: guards.allowList
            ? getAllowList(uint8ToHex(guards.allowList.merkleRoot))
            : undefined,
          mintLimit: guards.mintLimit ? guards.mintLimit : undefined,
          tokenBurn: guards.tokenBurn
            ? {
                mint: guards.tokenBurn.mint,
                decimals: guards.tokenBurn.amount.currency.decimals,
                amount: guards.tokenBurn.amount.basisPoints.toNumber(),
              }
            : undefined,
          tokenGate: guards.tokenGate
            ? {
                mint: guards.tokenGate.mint,
                decimals: guards.tokenGate.amount.currency.decimals,
                amount: guards.tokenGate.amount.basisPoints.toNumber(),
              }
            : undefined,
          tokenPayment,
        };
      });

      if (needTokens || needNfts) {
        const mints = groups
          .map(({ guards }) => [
            guards.nftBurn?.requiredCollection,
            guards.nftGate?.requiredCollection,
            guards.nftPayment?.requiredCollection,
            guards.tokenBurn?.mint,
            guards.tokenGate?.mint,
            guards.tokenPayment?.mint,
          ])
          .flat()
          .filter((a) => a) as PublicKey[];
        const tokens = (await metaplex
          .nfts()
          .findAllByMintList({ mints })) as Metadata[];

        groups.forEach(({ guards }, ix) => {
          const guardInfo = guardsInfo[ix];
          if (guards.nftBurn) {
            guardInfo.nftBurn = tokens.find(
              (t) =>
                t?.mintAddress?.toBase58() ===
                guards.nftBurn?.requiredCollection.toBase58()
            ) as Metadata;
          }
          if (guards.nftGate) {
            guardInfo.nftGate = tokens.find(
              (t) =>
                t?.mintAddress?.toBase58() ===
                guards.nftGate?.requiredCollection.toBase58()
            ) as Metadata;
          }
          if (guards.nftPayment) {
            guardInfo.nftPayment = {
              ...(tokens.find(
                (t) =>
                  t?.mintAddress?.toBase58() ===
                  guards.nftPayment?.requiredCollection.toBase58()
              ) as Metadata),
              destination: guards.nftPayment.destination,
            };
          }
          if (guardInfo.tokenBurn) {
            guardInfo.tokenBurn.metadata = tokens.find(
              (t) =>
                t?.mintAddress.toBase58() === guards.tokenBurn?.mint.toBase58()
            ) as Metadata;
          }
          if (guardInfo.tokenGate) {
            guardInfo.tokenGate.metadata = tokens.find(
              (t) =>
                t?.mintAddress.toBase58() === guards.tokenGate?.mint.toBase58()
            ) as Metadata;
          }
          if (guardInfo.tokenPayment) {
            guardInfo.tokenPayment.metadata = tokens.find(
              (t) =>
                t?.mintAddress.toBase58() ===
                guards.tokenPayment?.mint.toBase58()
            ) as Metadata;
          }
        });
      }

      if (owner) {
        await Promise.all(
          guardsInfo.map(async (guardInfo) => {
            if (guardInfo.mintLimit) {
              const mintLimitCounter = metaplex
                .candyMachines()
                .pdas()
                .mintLimitCounter({
                  id: guardInfo.mintLimit.id,
                  user: owner,
                  candyMachine: candyMachine.address,
                  candyGuard: candyMachine.candyGuard!.address,
                });
              //Read Data from chain
              const mintedAmountBuffer =
                await metaplex.connection.getAccountInfo(
                  mintLimitCounter,
                  "processed"
                );
              if (mintedAmountBuffer != null) {
                guardInfo.mintLimit.minted = mintedAmountBuffer.data.readUintLE(
                  0,
                  1
                );
              } else {
                guardInfo.mintLimit.minted = 0;
              }
            }
          })
        );
      }

      this.guardsInfo = guardsInfo;
    }

    return this;
  }
}

export function getMintArgs(
  guardInfo: GuardInfo,
  guardMintInfo: MintGuardInfo
): Partial<DefaultGuardSetMintArgs> {
  return {
    allowList: guardMintInfo.merkleRoot
      ? some({ merkleRoot: guardMintInfo.merkleRoot })
      : undefined,
    mintLimit: guardInfo.mintLimit
      ? some({ id: guardInfo.mintLimit.id })
      : undefined,
    solPayment: guardInfo.solPayment
      ? some({ destination: publicKey(guardInfo.solPayment.destination) })
      : undefined,
    tokenBurn: guardMintInfo.tokenBurn
      ? some({
          mint: publicKey(guardMintInfo.tokenBurn.mint),
        })
      : undefined,
    tokenGate: guardMintInfo.tokenGate
      ? some({
          mint: publicKey(guardMintInfo.tokenGate.mint),
        })
      : undefined,
    tokenPayment: guardMintInfo.tokenPayment
      ? some({
          mint: publicKey(guardMintInfo.tokenPayment.mint),
          destinationAta: publicKey(guardMintInfo.tokenPayment.destinationAta),
        })
      : undefined,
    nftBurn: guardMintInfo.nftBurn
      ? some({
          requiredCollection: publicKey(
            guardMintInfo.nftBurn.metadata!.collection!.address
          ),
          mint: publicKey(guardMintInfo.nftBurn.mint),
          tokenStandard:
            (guardMintInfo.nftBurn.metadata!.tokenStandard as TokenStandard) ||
            TokenStandard.NonFungible,
        })
      : undefined,
    nftGate: guardMintInfo.nftGate
      ? some({
          mint: publicKey(guardMintInfo.nftGate.mint),
        })
      : undefined,
    nftPayment: guardMintInfo.nftPayment
      ? some({
          destination: publicKey(guardMintInfo.nftPayment.destination),
          mint: publicKey(guardMintInfo.nftPayment.mint),
          tokenStandard:
            guardMintInfo.nftPayment.metadata!.tokenStandard ||
            TokenStandard.NonFungible,
        })
      : undefined,
  };
}
