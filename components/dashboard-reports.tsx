"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Download,
  Eye,
  Clock
} from "lucide-react"

interface MonthlyReport {
  id: string
  title: string
  date: string
  month: string
  year: number
  duration: string
  thumbnail: string
  summary: string
  highlights: string[]
  metrics: {
    totalProfit: string
    communityGrowth: string
    newFeatures: number
    tradingVolume: string
  }
  vimeoUrl: string
  isWatched: boolean
}

const monthlyReports: MonthlyReport[] = [
  {
    id: "2024-01",
    title: "January 2024 Performance Report",
    date: "2024-02-01",
    month: "January",
    year: 2024,
    duration: "12:45",
    thumbnail: "/api/placeholder/400/225",
    summary: "Outstanding performance across all trading bots with significant community growth and new feature launches.",
    highlights: [
      "Bybit trading bots achieved 30.2% monthly returns",
      "Greek community grew by 15% to 3,498 members",
      "Sui Network integration progress",
      "Completed 847 successful trades"
    ],
    metrics: {
      totalProfit: "+$1,191,869",
      communityGrowth: "+15%",
      newFeatures: 3,
      tradingVolume: "$12.4M"
    },
    vimeoUrl: "https://vimeo.com/example1",
    isWatched: true
  },
  {
    id: "2023-12",
    title: "December 2023 Year-End Report",
    date: "2024-01-01",
    month: "December",
    year: 2023,
    duration: "18:30",
    thumbnail: "/api/placeholder/400/225",
    summary: "Year-end comprehensive review showcasing annual achievements and setting goals for 2024.",
    highlights: [
      "Annual profit exceeded $10M milestone",
      "Launched PRO and ROYAL NFT tiers on Sui",
      "Achieved 95.5% average win rate",
      "DEWhale development milestones reached"
    ],
    metrics: {
      totalProfit: "+$10.2M",
      communityGrowth: "+180%",
      newFeatures: 8,
      tradingVolume: "$89.7M"
    },
    vimeoUrl: "https://vimeo.com/example2",
    isWatched: true
  },
  {
    id: "2023-11",
    title: "November 2023 Growth Report",
    date: "2023-12-01",
    month: "November",
    year: 2023,
    duration: "14:20",
    thumbnail: "/api/placeholder/400/225",
    summary: "Exceptional month with record-breaking performance and major platform updates.",
    highlights: [
      "Hermes stock bot launched successfully",
      "Discord community reached 3,000 members",
      "Implemented advanced analytics dashboard",
      "Partnership with major exchanges"
    ],
    metrics: {
      totalProfit: "+$892,450",
      communityGrowth: "+22%",
      newFeatures: 5,
      tradingVolume: "$8.9M"
    },
    vimeoUrl: "https://vimeo.com/example3",
    isWatched: false
  }
]

export function DashboardReports() {
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleWatchReport = (report: MonthlyReport) => {
    setSelectedReport(report)
    setIsPlaying(true)
    // Mark as watched
    const reportIndex = monthlyReports.findIndex(r => r.id === report.id)
    if (reportIndex !== -1) {
      monthlyReports[reportIndex].isWatched = true
    }
  }

  const handleCloseVideo = () => {
    setSelectedReport(null)
    setIsPlaying(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">MetadudesX Monthly Reports</h2>
          <p className="text-[#C0E6FF] mt-1">Comprehensive video reports on trading performance and AIO Connect growth</p>
        </div>
        <Badge className="bg-[#4da2ff] hover:bg-[#3d8ae6] text-white px-4 py-2 transition-colors duration-200 cursor-default">
          {monthlyReports.length} Reports Available
        </Badge>
      </div>

      {/* Video Player Modal */}
      {selectedReport && isPlaying && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#011829] rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{selectedReport.title}</h3>
              <Button
                onClick={handleCloseVideo}
                variant="outline"
                className="border-[#C0E6FF] text-[#C0E6FF]"
              >
                Close
              </Button>
            </div>

            {/* Video Player Placeholder */}
            <div className="aspect-video bg-[#030F1C] rounded-lg flex items-center justify-center mb-4">
              <div className="text-center">
                <Play className="w-16 h-16 text-[#4DA2FF] mx-auto mb-4" />
                <p className="text-[#C0E6FF]">Video Player</p>
                <p className="text-sm text-[#C0E6FF]/70">Vimeo integration would be implemented here</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <h4 className="font-semibold text-white mb-2">Summary</h4>
                <p className="text-[#C0E6FF] text-sm">{selectedReport.summary}</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Key Metrics</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#C0E6FF]">Total Profit:</span>
                    <span className="text-[#4DA2FF] font-semibold">{selectedReport.metrics.totalProfit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C0E6FF]">Community Growth:</span>
                    <span className="text-[#4DA2FF] font-semibold">{selectedReport.metrics.communityGrowth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C0E6FF]">Trading Volume:</span>
                    <span className="text-[#4DA2FF] font-semibold">{selectedReport.metrics.tradingVolume}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {monthlyReports.map((report) => (
          <div key={report.id} className="enhanced-card group hover:border-[#4DA2FF]/50 transition-all duration-300">
            <div className="enhanced-card-content">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="border-[#C0E6FF] text-[#C0E6FF]">
                  {report.month} {report.year}
                </Badge>
                {report.isWatched && (
                  <Badge className="bg-green-500 text-white">
                    <Eye className="w-3 h-3 mr-1" />
                    Watched
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-white mb-4">
                <FileText className="w-5 h-5 text-[#4DA2FF]" />
                <h3 className="font-semibold text-lg leading-tight">{report.title}</h3>
              </div>

              <div className="space-y-4">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-[#030F1C] rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-[#4DA2FF]/20 to-[#011829]/40 flex items-center justify-center">
                  <div className="text-center">
                    <Play className="w-12 h-12 text-[#4DA2FF] mx-auto mb-2" />
                    <span className="text-[#C0E6FF] text-sm">{report.duration}</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <p className="text-[#C0E6FF] text-sm leading-relaxed line-clamp-3">
                {report.summary}
              </p>

              {/* Metrics */}
              <div className="grid gap-2 grid-cols-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#4DA2FF]" />
                  <div>
                    <div className="text-xs text-[#C0E6FF]">Profit</div>
                    <div className="text-sm font-semibold text-white">{report.metrics.totalProfit}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#4DA2FF]" />
                  <div>
                    <div className="text-xs text-[#C0E6FF]">Growth</div>
                    <div className="text-sm font-semibold text-white">{report.metrics.communityGrowth}</div>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-[#C0E6FF]">Key Highlights:</h4>
                <ul className="space-y-1">
                  {report.highlights.slice(0, 2).map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-white">
                      <div className="w-1 h-1 bg-[#4DA2FF] rounded-full mt-2 flex-shrink-0"></div>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleWatchReport(report)}
                  className="flex-1 bg-[#4da2ff] hover:bg-[#3d8ae6] text-white transition-colors duration-200"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Watch Report
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#C0E6FF] text-[#C0E6FF]"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-xs text-[#C0E6FF]/70 pt-2 border-t border-[#C0E6FF]/10">
                <Calendar className="w-3 h-3" />
                Published: {new Date(report.date).toLocaleDateString()}
              </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="enhanced-card">
        <div className="enhanced-card-content">
          <div className="flex items-center gap-2 text-white mb-4">
            <FileText className="w-5 h-5 text-[#4DA2FF]" />
            <h3 className="font-semibold">Reports Overview</h3>
          </div>
          <div>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#4DA2FF]">{monthlyReports.length}</div>
              <div className="text-sm text-[#C0E6FF]">Total Reports</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#4DA2FF]">
                {monthlyReports.filter(r => r.isWatched).length}
              </div>
              <div className="text-sm text-[#C0E6FF]">Watched</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#4DA2FF]">
                {monthlyReports.reduce((acc, r) => {
                  const [minutes] = r.duration.split(':').map(Number)
                  return acc + minutes
                }, 0)}m
              </div>
              <div className="text-sm text-[#C0E6FF]">Total Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#4DA2FF]">
                {new Date().getFullYear()}
              </div>
              <div className="text-sm text-[#C0E6FF]">Current Year</div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
