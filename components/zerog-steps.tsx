"use client"

import { useState, useEffect } from 'react'
import { CheckCircle2, Loader2, Shield, Database, Lock, Upload, FileCheck, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ZeroGStep {
  id: string
  label: string
  description: string
  status: 'pending' | 'active' | 'complete' | 'error'
  icon: 'wallet' | 'upload' | 'hash' | 'verify' | 'complete'
}

interface ZeroGStepsProps {
  steps: ZeroGStep[]
  isActive: boolean
  rootHash?: string
}

const iconMap = {
  wallet: Wallet,
  upload: Upload,
  hash: Database,
  verify: Shield,
  complete: FileCheck,
}

export function ZeroGSteps({ steps, isActive, rootHash }: ZeroGStepsProps) {
  return (
    <div className={cn(
      "rounded-xl border bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 p-4 transition-all duration-500",
      isActive ? "border-emerald-500/30 shadow-lg shadow-emerald-500/10" : "border-border/50"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Lock className="w-4 h-4 text-emerald-500" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">0G Decentralized Storage</h3>
          <p className="text-xs text-muted-foreground">Securing your content on-chain</p>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const Icon = iconMap[step.icon]
          const isLast = index === steps.length - 1

          return (
            <div key={step.id} className="relative">
              {/* Connection line */}
              {!isLast && (
                <div className={cn(
                  "absolute left-4 top-8 w-0.5 h-6 transition-all duration-500",
                  step.status === 'complete' ? "bg-emerald-500" : "bg-border"
                )} />
              )}

              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
                  step.status === 'pending' && "bg-muted text-muted-foreground",
                  step.status === 'active' && "bg-emerald-500/20 text-emerald-500 animate-pulse",
                  step.status === 'complete' && "bg-emerald-500 text-white",
                  step.status === 'error' && "bg-destructive text-destructive-foreground"
                )}>
                  {step.status === 'active' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : step.status === 'complete' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium transition-colors",
                    step.status === 'active' && "text-emerald-500",
                    step.status === 'complete' && "text-foreground",
                    step.status === 'pending' && "text-muted-foreground"
                  )}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Root Hash Display */}
      {rootHash && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs">
            <Shield className="w-3 h-3 text-emerald-500" />
            <span className="text-muted-foreground">Root Hash:</span>
            <code className="font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded truncate flex-1">
              {rootHash}
            </code>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook to manage step progression
export function useZeroGSteps() {
  const [steps, setSteps] = useState<ZeroGStep[]>([
    { id: 'connect', label: 'Wallet Connected', description: 'Verifying wallet connection', status: 'pending', icon: 'wallet' },
    { id: 'prepare', label: 'Preparing Upload', description: 'Hashing file content', status: 'pending', icon: 'hash' },
    { id: 'upload', label: 'Uploading to 0G', description: 'Sending to decentralized storage', status: 'pending', icon: 'upload' },
    { id: 'verify', label: 'Verifying', description: 'Confirming storage on network', status: 'pending', icon: 'verify' },
    { id: 'complete', label: 'Secured', description: 'File stored on 0G network', status: 'pending', icon: 'complete' },
  ])
  const [isActive, setIsActive] = useState(false)
  const [rootHash, setRootHash] = useState<string | undefined>()

  const startProcess = () => {
    setIsActive(true)
    setRootHash(undefined)
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })))
  }

  const updateStep = (id: string, status: ZeroGStep['status'], description?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === id 
        ? { ...step, status, description: description || step.description }
        : step
    ))
  }

  const completeProcess = (hash: string) => {
    setRootHash(hash)
    setIsActive(false)
  }

  const resetSteps = () => {
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })))
    setIsActive(false)
    setRootHash(undefined)
  }

  return {
    steps,
    isActive,
    rootHash,
    startProcess,
    updateStep,
    completeProcess,
    resetSteps,
  }
}
