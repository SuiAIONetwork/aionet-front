import { NFTMintingInterface } from "@/components/nft-minting-interface"

export default function MintNFTPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Mint AIONET NFT</h1>
          <p className="text-gray-400 mt-1">Unlock exclusive features and join our NFT-gated community</p>
        </div>
      </div>

      <NFTMintingInterface />
    </div>
  )
}
