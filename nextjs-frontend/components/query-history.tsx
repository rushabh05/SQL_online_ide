'use client'

import { useState } from 'react'
import { Clock, Trash2, Play, Copy, ChevronRight, ChevronDown, CheckCircle2, XCircle, Star, StarOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface QueryHistoryItem {
    id: string
    sql: string
    timestamp: Date
    success: boolean
    executionTime?: number
    favorite: boolean
}

interface QueryHistoryProps {
    history: QueryHistoryItem[]
    onQuerySelect: (sql: string) => void
    onQueryDelete: (id: string) => void
    onToggleFavorite: (id: string) => void
    onClearHistory: () => void
}

export function QueryHistory({ 
    history, 
    onQuerySelect, 
    onQueryDelete,
    onToggleFavorite,
    onClearHistory 
}: QueryHistoryProps) {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const formatTime = (date: Date) => {
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const seconds = Math.floor(diff / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (days > 0) return `${days}d ago`
        if (hours > 0) return `${hours}h ago`
        if (minutes > 0) return `${minutes}m ago`
        return `${seconds}s ago`
    }

    const truncateSQL = (sql: string, maxLength: number = 60) => {
        const singleLine = sql.replace(/\s+/g, ' ').trim()
        return singleLine.length > maxLength 
            ? singleLine.substring(0, maxLength) + '...' 
            : singleLine
    }

    const favorites = history.filter(item => item.favorite)
    const recent = history.filter(item => !item.favorite)

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Clock className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-[11px] text-muted-foreground">No query history</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">Execute queries to see them here</p>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-2 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-[11px]">Query History</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                        {history.length}
                    </Badge>
                </div>
                {history.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearHistory}
                        className="h-6 text-[10px] px-1.5 text-destructive hover:text-destructive"
                    >
                        Clear All
                    </Button>
                )}
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-3">
                {/* Favorites Section */}
                {favorites.length > 0 && (
                    <div className="space-y-0.5">
                        <div className="px-1.5 py-0.5 text-[10px] font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            Favorites
                        </div>
                        {favorites.map((item) => {
                            const isExpanded = expandedItems.has(item.id)
                            
                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "rounded-md border border-border/50 bg-card hover:border-primary/30 transition-all",
                                        isExpanded && "border-primary/50"
                                    )}
                                >
                                    {/* Collapsed View */}
                                    <div className="p-1.5 flex items-start gap-1.5">
                                        <button
                                            onClick={() => toggleExpand(item.id)}
                                            className="p-0.5 hover:bg-accent rounded mt-0.5"
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
                                            )}
                                        </button>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start gap-1.5 mb-0.5">
                                                {item.success ? (
                                                    <CheckCircle2 className="h-2.5 w-2.5 text-green-500 mt-0.5 flex-shrink-0" />
                                                ) : (
                                                    <XCircle className="h-2.5 w-2.5 text-red-500 mt-0.5 flex-shrink-0" />
                                                )}
                                                <p className="text-[10px] font-mono truncate flex-1" title={item.sql}>
                                                    {truncateSQL(item.sql)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                                                <span>{formatTime(item.timestamp)}</span>
                                                {item.executionTime && (
                                                    <span>• {item.executionTime}s</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-0.5">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onToggleFavorite(item.id)}
                                                className="h-5 w-5 text-yellow-500 hover:text-yellow-600"
                                                title="Remove from favorites"
                                            >
                                                <Star className="h-2.5 w-2.5 fill-current" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Expanded View */}
                                    {isExpanded && (
                                        <div className="px-1.5 pb-1.5 space-y-1.5 border-t border-border/50 pt-1.5 mt-0.5">
                                            <div className="bg-muted/50 rounded p-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                                                <pre className="text-[10px] font-mono whitespace-pre-wrap break-words">
                                                    {item.sql}
                                                </pre>
                                            </div>
                                            <div className="flex gap-0.5">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onQuerySelect(item.sql)}
                                                    className="h-6 text-[10px] gap-1 flex-1 px-1.5"
                                                >
                                                    <Play className="h-2.5 w-2.5" />
                                                    Run Again
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigator.clipboard.writeText(item.sql)}
                                                    className="h-6 text-[10px] gap-1 px-1.5"
                                                >
                                                    <Copy className="h-2.5 w-2.5" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onQueryDelete(item.id)}
                                                    className="h-6 text-[10px] px-1.5 text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-2.5 w-2.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Recent Section */}
                {recent.length > 0 && (
                    <div className="space-y-1">
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            Recent
                        </div>
                        {recent.map((item) => {
                            const isExpanded = expandedItems.has(item.id)
                            
                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "rounded-md border border-border/50 bg-card hover:border-primary/30 transition-all",
                                        isExpanded && "border-primary/50"
                                    )}
                                >
                                    {/* Collapsed View */}
                                    <div className="p-2 flex items-start gap-2">
                                        <button
                                            onClick={() => toggleExpand(item.id)}
                                            className="p-0.5 hover:bg-accent rounded mt-0.5"
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                            )}
                                        </button>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start gap-2 mb-1">
                                                {item.success ? (
                                                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                                ) : (
                                                    <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                                )}
                                                <p className="text-xs font-mono truncate flex-1" title={item.sql}>
                                                    {truncateSQL(item.sql)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{formatTime(item.timestamp)}</span>
                                                {item.executionTime && (
                                                    <span>• {item.executionTime}s</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onToggleFavorite(item.id)}
                                                className="h-6 w-6 text-muted-foreground hover:text-yellow-500"
                                                title="Add to favorites"
                                            >
                                                <StarOff className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Expanded View */}
                                    {isExpanded && (
                                        <div className="px-2 pb-2 space-y-2 border-t border-border/50 pt-2 mt-1">
                                            <div className="bg-muted/50 rounded p-2 max-h-32 overflow-y-auto custom-scrollbar">
                                                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                                                    {item.sql}
                                                </pre>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onQuerySelect(item.sql)}
                                                    className="h-7 text-xs gap-1.5 flex-1"
                                                >
                                                    <Play className="h-3 w-3" />
                                                    Run Again
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigator.clipboard.writeText(item.sql)}
                                                    className="h-7 text-xs gap-1.5"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onQueryDelete(item.id)}
                                                    className="h-7 text-xs text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

