"use client"

import { useState, useEffect, useCallback } from 'react'

// 0G Testnet Configuration
const ZEROG_TESTNET = {
  chainId: '0x40D8', // 16600 in hex
  chainName: '0G-Newton-Testnet',
  nativeCurrency: {
    name: 'A0GI',
    symbol: 'A0GI',
    decimals: 18,
  },
  rpcUrls: ['https://evmrpc-testnet.0g.ai/'],
  blockExplorerUrls: ['https://chainscan-newton.0g.ai/'],
}

export interface WalletState {
  address: string | null
  balance: string | null
  isConnected: boolean
  isConnecting: boolean
  chainId: string | null
  error: string | null
}

export interface WalletActions {
  connect: () => Promise<void>
  disconnect: () => void
  switchToZeroG: () => Promise<void>
  refreshBalance: () => Promise<void>
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, callback: (...args: unknown[]) => void) => void
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void
    }
  }
}

export function useWallet(): WalletState & WalletActions {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
    error: null,
  })

  // Check if already connected on mount
  useEffect(() => {
    checkConnection()
    
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
      
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum?.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const handleAccountsChanged = (accounts: unknown) => {
    const accountsArray = accounts as string[]
    if (accountsArray.length === 0) {
      disconnect()
    } else {
      setState(prev => ({ ...prev, address: accountsArray[0] }))
      refreshBalance()
    }
  }

  const handleChainChanged = (chainId: unknown) => {
    setState(prev => ({ ...prev, chainId: chainId as string }))
    refreshBalance()
  }

  const checkConnection = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[]
      if (accounts.length > 0) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string
        setState(prev => ({
          ...prev,
          address: accounts[0],
          isConnected: true,
          chainId,
        }))
        await fetchBalance(accounts[0])
      }
    } catch (error) {
      console.error('[v0] Error checking connection:', error)
    }
  }

  const fetchBalance = async (address: string) => {
    if (!window.ethereum) return

    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }) as string
      
      // Convert from wei to A0GI (18 decimals)
      const balanceInWei = BigInt(balance)
      const balanceInA0GI = Number(balanceInWei) / 1e18
      
      setState(prev => ({
        ...prev,
        balance: balanceInA0GI.toFixed(4),
      }))
    } catch (error) {
      console.error('[v0] Error fetching balance:', error)
    }
  }

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setState(prev => ({
        ...prev,
        error: 'MetaMask is not installed. Please install MetaMask to connect.',
      }))
      return
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[]

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string

      setState(prev => ({
        ...prev,
        address: accounts[0],
        isConnected: true,
        isConnecting: false,
        chainId,
      }))

      await fetchBalance(accounts[0])

      // If not on 0G testnet, prompt to switch
      if (chainId !== ZEROG_TESTNET.chainId) {
        await switchToZeroG()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet'
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }))
    }
  }, [])

  const disconnect = useCallback(() => {
    setState({
      address: null,
      balance: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
      error: null,
    })
  }, [])

  const switchToZeroG = useCallback(async () => {
    if (!window.ethereum) return

    try {
      // Try to switch to 0G testnet
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ZEROG_TESTNET.chainId }],
      })
    } catch (switchError: unknown) {
      // Chain not added, add it
      const error = switchError as { code?: number }
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [ZEROG_TESTNET],
          })
        } catch (addError) {
          console.error('[v0] Error adding 0G testnet:', addError)
          setState(prev => ({
            ...prev,
            error: 'Failed to add 0G testnet to MetaMask',
          }))
        }
      }
    }
  }, [])

  const refreshBalance = useCallback(async () => {
    if (state.address) {
      await fetchBalance(state.address)
    }
  }, [state.address])

  return {
    ...state,
    connect,
    disconnect,
    switchToZeroG,
    refreshBalance,
  }
}
