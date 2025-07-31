"use client"

import { useTokens } from "@/contexts/points-context"
import { Coins, TrendingUp, History, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function TransactionHistory() {
  const { transactions, isLoading } = useTokens()
  const router = useRouter()

  // Show only the last 5 transactions
  const recentTransactions = transactions.slice(0, 5)

  if (isLoading) {
    return (
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#1a2f51] rounded-lg">
              <History className="w-5 h-5 text-[#4DA2FF] animate-pulse" />
            </div>
            <h3 className="text-white text-lg font-semibold">Recent Transactions</h3>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[#1a2f51] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#030f1c] rounded-full animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="w-32 h-4 bg-[#030f1c] rounded animate-pulse"></div>
                    <div className="w-20 h-3 bg-[#030f1c] rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="w-16 h-4 bg-[#030f1c] rounded animate-pulse"></div>
                  <div className="w-12 h-3 bg-[#030f1c] rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="enhanced-card">
      <div className="enhanced-card-content">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1a2f51] rounded-lg">
              <History className="w-5 h-5 text-[#4DA2FF]" />
            </div>
            <h3 className="text-white text-lg font-semibold">Recent Transactions</h3>
          </div>
          {recentTransactions.length > 0 && (
            <Button
              onClick={() => router.push('/transaction-history')}
              variant="outline"
              size="sm"
              className="border-[#4DA2FF] text-[#4DA2FF] hover:bg-[#4DA2FF]/10"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-[#1a2f51] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === "earned"
                      ? "bg-green-500/20"
                      : "bg-orange-500/20"
                  }`}>
                    {transaction.type === "earned" ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <Coins className="w-4 h-4 text-orange-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {transaction.description}
                    </p>
                    <p className="text-[#C0E6FF] text-xs">
                      {transaction.timestamp.toLocaleDateString()} • {transaction.source_type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === "earned"
                      ? "text-green-400"
                      : "text-orange-400"
                  }`}>
                    {transaction.type === "earned" ? "+" : "-"}
                    {transaction.amount.toLocaleString()} pAION
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      transaction.type === "earned"
                        ? "border-green-400 text-green-400"
                        : "border-orange-400 text-orange-400"
                    }`}
                  >
                    {transaction.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-[#C0E6FF] mx-auto mb-4 opacity-50" />
            <h4 className="text-white text-lg font-semibold mb-2">No Transactions Yet</h4>
            <p className="text-[#C0E6FF]">
              Your transaction history will appear here once you start earning or spending pAION tokens.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
