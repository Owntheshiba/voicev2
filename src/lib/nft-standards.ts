import { type Address } from "viem";

// Known contract addresses
export const KNOWN_CONTRACTS = {
  manifoldExtension: "0x5e4e1482636c5c9b4c6a9c9b4c6a9c9b4c6a9c9b4" as Address,
} as const;

// Manifold Extension ABI
export const MANIFOLD_EXTENSION_ABI = [
  {
    inputs: [
      { name: "contractAddress", type: "address" },
      { name: "instanceId", type: "uint256" },
      { name: "tokenId", type: "uint256" },
      { name: "merkleProof", type: "bytes32[]" },
      { name: "recipient", type: "address" }
    ],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { name: "contractAddress", type: "address" },
      { name: "instanceId", type: "uint256" }
    ],
    name: "MINT_FEE",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Manifold ERC721 Extension ABI
export const MANIFOLD_ERC721_EXTENSION_ABI = [
  {
    inputs: [
      { name: "contractAddress", type: "address" },
      { name: "instanceId", type: "uint256" },
      { name: "tokenId", type: "uint256" },
      { name: "merkleProof", type: "bytes32[]" },
      { name: "recipient", type: "address" }
    ],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { name: "contractAddress", type: "address" },
      { name: "instanceId", type: "uint256" }
    ],
    name: "MINT_FEE",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Manifold ERC1155 Extension ABI
export const MANIFOLD_ERC1155_EXTENSION_ABI = [
  {
    inputs: [
      { name: "contractAddress", type: "address" },
      { name: "instanceId", type: "uint256" },
      { name: "tokenId", type: "uint256" },
      { name: "merkleProof", type: "bytes32[]" },
      { name: "recipient", type: "address" }
    ],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { name: "contractAddress", type: "address" },
      { name: "instanceId", type: "uint256" }
    ],
    name: "MINT_FEE",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Generic price discovery ABI
export const PRICE_DISCOVERY_ABI = [
  {
    inputs: [],
    name: "mintPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "price",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "publicMintPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Generic mint ABI
export const MINT_ABI = [
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
] as const;

// Thirdweb OpenEditionERC721 ABI
export const THIRDWEB_OPENEDITONERC721_ABI = [
  {
    inputs: [
      { name: "_receiver", type: "address" },
      { name: "_quantity", type: "uint256" },
      { name: "_currency", type: "address" },
      { name: "_pricePerToken", type: "uint256" },
      {
        name: "_allowlistProof",
        type: "tuple",
        components: [
          { name: "proof", type: "bytes32[]" },
          { name: "quantityLimitPerWallet", type: "uint256" },
          { name: "pricePerToken", type: "uint256" },
          { name: "currency", type: "address" }
        ]
      },
      { name: "_data", type: "bytes" }
    ],
    name: "claim",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "_conditionId", type: "uint256" }],
    name: "getClaimConditionById",
    outputs: [
      {
        name: "condition",
        type: "tuple",
        components: [
          { name: "startTimestamp", type: "uint256" },
          { name: "maxClaimableSupply", type: "uint256" },
          { name: "supplyClaimed", type: "uint256" },
          { name: "quantityLimitPerWallet", type: "uint256" },
          { name: "merkleRoot", type: "bytes32" },
          { name: "pricePerToken", type: "uint256" },
          { name: "currency", type: "address" },
          { name: "metadata", type: "string" }
        ]
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "claimCondition",
    outputs: [
      {
        name: "condition",
        type: "tuple",
        components: [
          { name: "startTimestamp", type: "uint256" },
          { name: "maxClaimableSupply", type: "uint256" },
          { name: "supplyClaimed", type: "uint256" },
          { name: "quantityLimitPerWallet", type: "uint256" },
          { name: "merkleRoot", type: "bytes32" },
          { name: "pricePerToken", type: "uint256" },
          { name: "currency", type: "address" },
          { name: "metadata", type: "string" }
        ]
      }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Thirdweb native token address (ETH)
export const THIRDWEB_NATIVE_TOKEN = "0x0000000000000000000000000000000000000000" as Address;
