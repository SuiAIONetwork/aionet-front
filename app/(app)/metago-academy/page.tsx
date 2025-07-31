import { MetaGoAcademy } from "@/components/metago-academy"

export default function MetaGoAcademyPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">MetaGo Academy</h1>
          <p className="text-gray-400 mt-1">Learn cryptocurrency trading, DeFi, NFTs, and blockchain technology</p>
        </div>
      </div>

      <MetaGoAcademy />
    </div>
  )
}
