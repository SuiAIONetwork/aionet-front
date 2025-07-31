"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTokens } from '@/contexts/points-context'
import { useSuiAuth } from '@/contexts/sui-auth-context'
import { paionTokenService, type PaionTransaction } from '@/lib/paion-token-service'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  ArrowLeft,
  Download,
  Search,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2
} from 'lucide-react'

interface TransactionFilters {
  type: string
  dateRange: string
  search: string
  status: string
}

const TRANSACTIONS_PER_PAGE = 20

const TRANSACTION_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'earned', label: 'Earned' },
  { value: 'spent', label: 'Spent' },
  { value: 'transfer_in', label: 'Transfer In' },
  { value: 'transfer_out', label: 'Transfer Out' },
  { value: 'locked', label: 'Locked' },
  { value: 'unlocked', label: 'Unlocked' }
]

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' }
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' }
]

export default function TransactionHistoryPage() {
  const router = useRouter()
  const { user } = useSuiAuth()
  const { balance, refreshBalance } = useTokens()
  
  const [transactions, setTransactions] = useState<PaionTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  
  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'all',
    dateRange: 'all',
    search: '',
    status: 'all'
  })

  // Load transactions
  const loadTransactions = async () => {
    if (!user?.address) return

    setIsLoading(true)
    try {
      const result = await paionTokenService.getTransactionHistory(
        user.address,
        TRANSACTIONS_PER_PAGE,
        (currentPage - 1) * TRANSACTIONS_PER_PAGE
      )

      if (result) {
        setTransactions(result.transactions)
        setTotalTransactions(result.totalCount)
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
      toast.error('Failed to load transaction history')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(tx => tx.transaction_type === filters.type)
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(tx => tx.status === filters.status)
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const days = parseInt(filters.dateRange)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      filtered = filtered.filter(tx => new Date(tx.created_at) >= cutoffDate)
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(tx => 
        tx.description.toLowerCase().includes(searchLower) ||
        tx.source_type.toLowerCase().includes(searchLower) ||
        tx.transaction_type.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [transactions, filters])

  // Calculate total pages based on filtered results
  const totalPages = Math.ceil(filteredTransactions.length / TRANSACTIONS_PER_PAGE)
  
  // Get current page transactions
  const currentTransactions = filteredTransactions.slice(
    (currentPage - 1) * TRANSACTIONS_PER_PAGE,
    currentPage * TRANSACTIONS_PER_PAGE
  )

  // Load data on mount and when user changes
  useEffect(() => {
    if (user?.address) {
      loadTransactions()
      refreshBalance()
    }
  }, [user?.address, currentPage])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount: number, type: string) => {
    const prefix = ['earned', 'transfer_in', 'unlocked'].includes(type) ? '+' : '-'
    return `${prefix}${amount.toLocaleString()}`
  }

  const getAmountColor = (type: string) => {
    return ['earned', 'transfer_in', 'unlocked'].includes(type) 
      ? 'text-green-400' 
      : 'text-red-400'
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'spent':
        return <TrendingDown className="w-4 h-4 text-red-400" />
      case 'transfer_in':
        return <ArrowDownLeft className="w-4 h-4 text-green-400" />
      case 'transfer_out':
        return <ArrowUpRight className="w-4 h-4 text-red-400" />
      case 'locked':
        return <Clock className="w-4 h-4 text-yellow-400" />
      case 'unlocked':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      default:
        return <Coins className="w-4 h-4 text-blue-400" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const truncateDescription = (description: string, maxLength: number = 50) => {
    return description.length > maxLength
      ? `${description.substring(0, maxLength)}...`
      : description
  }

  // PDF Export functionality
  const exportToPDF = async () => {
    if (!user?.address || filteredTransactions.length === 0) return

    setIsExporting(true)
    try {
      const doc = new jsPDF()

      // Load and add AIONET logo
      try {
        const logoResponse = await fetch('/images/aionet-logo.png')
        const logoBlob = await logoResponse.blob()
        const logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(logoBlob)
        })

        // Add logo image (adjust size and position as needed)
        doc.addImage(logoBase64, 'PNG', 20, 10, 40, 20)
      } catch (logoError) {
        console.warn('Could not load logo, using text fallback:', logoError)
        // Fallback to text if logo fails to load
        doc.setFontSize(20)
        doc.setTextColor(77, 162, 255) // #4DA2FF
        doc.text('AIONET', 20, 20)
      }

      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text('Transaction History Report', 20, 35)

      // Add user info and summary
      doc.setFontSize(12)
      doc.text(`Wallet Address: ${user.address}`, 20, 50)
      doc.text(`Current pAION Balance: ${balance.toLocaleString()}`, 20, 60)
      doc.text(`Report Generated: ${new Date().toLocaleString()}`, 20, 70)
      doc.text(`Total Transactions: ${filteredTransactions.length}`, 20, 80)

      // Calculate summary statistics
      const totalEarned = filteredTransactions
        .filter(tx => ['earned', 'transfer_in', 'unlocked'].includes(tx.transaction_type))
        .reduce((sum, tx) => sum + tx.amount, 0)

      const totalSpent = filteredTransactions
        .filter(tx => ['spent', 'transfer_out', 'locked'].includes(tx.transaction_type))
        .reduce((sum, tx) => sum + tx.amount, 0)

      doc.text(`Total Earned: +${totalEarned.toLocaleString()} pAION`, 20, 90)
      doc.text(`Total Spent: -${totalSpent.toLocaleString()} pAION`, 20, 100)

      // Add filters info if any are applied
      let filtersText = 'Filters Applied: '
      const activeFilters = []
      if (filters.type !== 'all') activeFilters.push(`Type: ${filters.type}`)
      if (filters.dateRange !== 'all') activeFilters.push(`Date: Last ${filters.dateRange} days`)
      if (filters.status !== 'all') activeFilters.push(`Status: ${filters.status}`)
      if (filters.search) activeFilters.push(`Search: "${filters.search}"`)

      if (activeFilters.length > 0) {
        doc.text(filtersText + activeFilters.join(', '), 20, 110)
      } else {
        doc.text('Filters Applied: None (All transactions)', 20, 110)
      }

      // Prepare table data
      const tableData = filteredTransactions.map(tx => [
        formatDate(tx.created_at),
        tx.transaction_type.replace('_', ' '),
        formatAmount(tx.amount, tx.transaction_type),
        tx.description.length > 40 ? tx.description.substring(0, 40) + '...' : tx.description,
        tx.source_type.replace('_', ' '),
        tx.balance_after.toLocaleString(),
        tx.status
      ])

      // Add table
      autoTable(doc, {
        head: [['Date/Time', 'Type', 'Amount', 'Description', 'Source', 'Balance After', 'Status']],
        body: tableData,
        startY: 125,
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [77, 162, 255], // #4DA2FF
          textColor: [255, 255, 255]
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Date
          1: { cellWidth: 20 }, // Type
          2: { cellWidth: 20 }, // Amount
          3: { cellWidth: 35 }, // Description
          4: { cellWidth: 20 }, // Source
          5: { cellWidth: 25 }, // Balance After
          6: { cellWidth: 15 }  // Status
        }
      })

      // Save the PDF
      const fileName = `AIONET_Transaction_History_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)

      toast.success('Transaction history exported successfully!')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Failed to export transaction history')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Profile
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Transaction History
            </h1>
            <p className="text-gray-400 mt-1">
              View and manage your pAION token transaction history
            </p>
          </div>
        </div>
      </div>

      {/* Balance Summary Card */}
      <Card className="bg-[#0c1b36] border-[#1a2f51]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#4DA2FF]/20 p-3 rounded-full">
                <Coins className="w-6 h-6 text-[#4DA2FF]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Current pAION Balance</p>
                <p className="text-2xl font-bold text-white">{balance.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Transactions</p>
              <p className="text-xl font-semibold text-white">{totalTransactions}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card className="bg-[#0c1b36] border-[#1a2f51]">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 bg-[#1a2f51] border-[#1a2f51] text-white placeholder-gray-400"
              />
            </div>

            {/* Transaction Type Filter */}
            <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
              <SelectTrigger className="bg-[#1a2f51] border-[#1a2f51] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2f51] border-[#1a2f51]">
                {TRANSACTION_TYPE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-white">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
              <SelectTrigger className="bg-[#1a2f51] border-[#1a2f51] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2f51] border-[#1a2f51]">
                {DATE_RANGE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-white">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="bg-[#1a2f51] border-[#1a2f51] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2f51] border-[#1a2f51]">
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-white">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Export Button */}
            <Button
              onClick={exportToPDF}
              disabled={isExporting || filteredTransactions.length === 0}
              className="bg-[#4da2ff] hover:bg-[#3d8ae6] text-white"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-[#0c1b36] border-[#1a2f51]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#4DA2FF]" />
            Transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#4DA2FF]" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Transactions Found</h3>
              <p className="text-gray-400">
                {filters.search || filters.type !== 'all' || filters.dateRange !== 'all' || filters.status !== 'all'
                  ? 'Try adjusting your filters to see more transactions.'
                  : 'You haven\'t made any transactions yet.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#1a2f51] hover:bg-[#1a2f51]/50">
                      <TableHead className="text-gray-300">Date/Time</TableHead>
                      <TableHead className="text-gray-300">Type</TableHead>
                      <TableHead className="text-gray-300">Amount</TableHead>
                      <TableHead className="text-gray-300">Description</TableHead>
                      <TableHead className="text-gray-300">Source</TableHead>
                      <TableHead className="text-gray-300">Balance After</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTransactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className="border-[#1a2f51] hover:bg-[#1a2f51]/30 transition-colors"
                      >
                        <TableCell className="text-white">
                          {formatDate(transaction.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(transaction.transaction_type)}
                            <span className="text-white capitalize">
                              {transaction.transaction_type.replace('_', ' ')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className={getAmountColor(transaction.transaction_type)}>
                          <span className="font-semibold">
                            {formatAmount(transaction.amount, transaction.transaction_type)} pAION
                          </span>
                        </TableCell>
                        <TableCell className="text-white max-w-xs">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  {truncateDescription(transaction.description)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#1a2f51] border-[#1a2f51] text-white max-w-sm">
                                <p>{transaction.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-white">
                          <Badge variant="outline" className="border-[#4DA2FF]/30 text-[#4DA2FF]">
                            {transaction.source_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white font-mono">
                          {transaction.balance_after.toLocaleString()} pAION
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(transaction.status)}
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {currentTransactions.map((transaction) => (
                  <Card key={transaction.id} className="bg-[#1a2f51] border-[#1a2f51]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.transaction_type)}
                          <span className="text-white font-semibold capitalize">
                            {transaction.transaction_type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Amount:</span>
                          <span className={`font-semibold ${getAmountColor(transaction.transaction_type)}`}>
                            {formatAmount(transaction.amount, transaction.transaction_type)} pAION
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-400">Balance After:</span>
                          <span className="text-white font-mono">
                            {transaction.balance_after.toLocaleString()} pAION
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-400">Source:</span>
                          <Badge variant="outline" className="border-[#4DA2FF]/30 text-[#4DA2FF]">
                            {transaction.source_type.replace('_', ' ')}
                          </Badge>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-400">Date:</span>
                          <span className="text-white text-sm">
                            {formatDate(transaction.created_at)}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-[#1a2f51]">
                          <p className="text-gray-400 text-sm mb-1">Description:</p>
                          <p className="text-white text-sm">{transaction.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-[#1a2f51]">
                  <div className="text-sm text-gray-400">
                    Showing {((currentPage - 1) * TRANSACTIONS_PER_PAGE) + 1} to{' '}
                    {Math.min(currentPage * TRANSACTIONS_PER_PAGE, filteredTransactions.length)} of{' '}
                    {filteredTransactions.length} transactions
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage <= 1}
                      className="bg-[#1a2f51] border-[#1a2f51] text-white hover:bg-[#2a3f61]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages}
                      className="bg-[#1a2f51] border-[#1a2f51] text-white hover:bg-[#2a3f61]"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
