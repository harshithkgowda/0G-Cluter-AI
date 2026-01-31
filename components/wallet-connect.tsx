"use client"

import { useState } from 'react'
import { Wallet, ChevronDown, ExternalLink, Copy, Check, LogOut, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface WalletConnectProps {
  address: string | null
  balance: string | null
  isConnected: boolean
  isConnecting: boolean
  chainId: string | null
  error: string | null
  onConnect: () => Promise<void>
  onDisconnect: () => void
  onSwitchNetwork: () => Promise<void>
  onRefreshBalance: () => Promise<void>
}

export function WalletConnect({
  address,
  balance,
  isConnected,
  isConnecting,
  chainId,
  error,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
  onRefreshBalance,
}: WalletConnectProps) {
  const [copied, setCopied] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const isOnZeroG = chainId === '0x40D8' // 16600 in hex

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefreshBalance()
    setIsRefreshing(false)
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <Button
        onClick={onConnect}
        disabled={isConnecting}
        size="sm"
        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 text-xs sm:text-sm px-2 sm:px-4"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
            <span className="hidden sm:inline">Connecting...</span>
            <span className="sm:hidden">...</span>
          </>
        ) : (
          <>
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Connect Wallet</span>
            <span className="sm:hidden">Connect</span>
          </>
        )}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "border-emerald-500/30 hover:border-emerald-500/50 transition-colors px-2 sm:px-3",
            !isOnZeroG && "border-amber-500/30 hover:border-amber-500/50"
          )}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isOnZeroG ? "bg-emerald-500" : "bg-amber-500"
            )} />
            <span className="font-mono text-xs sm:text-sm">{formatAddress(address!)}</span>
            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Wallet Info */}
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Connected Wallet</span>
            <div className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              isOnZeroG 
                ? "bg-emerald-500/10 text-emerald-600" 
                : "bg-amber-500/10 text-amber-600"
            )}>
              {isOnZeroG ? '0G Testnet' : 'Wrong Network'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="font-mono text-sm flex-1 truncate">{address}</code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={copyAddress}
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Balance */}
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block">Balance</span>
              <span className="text-lg font-semibold">{balance || '0'} A0GI</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Actions */}
        {!isOnZeroG && (
          <>
            <DropdownMenuItem onClick={onSwitchNetwork} className="text-amber-600 cursor-pointer">
              <RefreshCw className="w-4 h-4 mr-2" />
              Switch to 0G Testnet
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem asChild>
          <a
            href={`https://chainscan-newton.0g.ai/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Explorer
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          onClick={onDisconnect}
          className="text-destructive cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
