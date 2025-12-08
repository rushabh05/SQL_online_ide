'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Database, Table2, Columns3, Key, Hash, Type, Calendar, FileText, PanelLeftClose, PanelLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Column {
    name: string
    type: string
}

interface Table {
    table_name: string
    row_count: number
    columns: Column[]
}

interface DatabaseSidebarProps {
    tables: Table[]
    isCollapsed: boolean
    onToggleCollapse: () => void
    onTableClick?: (tableName: string) => void
    onColumnClick?: (tableName: string, columnName: string) => void
    onTableDelete?: (tableName: string) => Promise<void>
}

export function DatabaseSidebar({ 
    tables, 
    isCollapsed, 
    onToggleCollapse,
    onTableClick,
    onColumnClick,
    onTableDelete 
}: DatabaseSidebarProps) {
    const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
    const [deletingTable, setDeletingTable] = useState<string | null>(null)

    const toggleTable = (tableName: string) => {
        setExpandedTables(prev => {
            const next = new Set(prev)
            if (next.has(tableName)) {
                next.delete(tableName)
            } else {
                next.add(tableName)
            }
            return next
        })
        onTableClick?.(tableName)
    }

    const getTypeIcon = (type: string) => {
        const lowerType = type.toLowerCase()
        if (lowerType.includes('int') || lowerType.includes('number')) return <Hash className="h-2.5 w-2.5" />
        if (lowerType.includes('varchar') || lowerType.includes('text') || lowerType.includes('string')) return <FileText className="h-2.5 w-2.5" />
        if (lowerType.includes('date') || lowerType.includes('time')) return <Calendar className="h-2.5 w-2.5" />
        if (lowerType.includes('bool')) return <Type className="h-2.5 w-2.5" />
        return <Type className="h-2.5 w-2.5" />
    }

    const getTypeColor = (type: string) => {
        const lowerType = type.toLowerCase()
        if (lowerType.includes('int') || lowerType.includes('number')) return 'text-blue-400'
        if (lowerType.includes('varchar') || lowerType.includes('text') || lowerType.includes('string')) return 'text-green-400'
        if (lowerType.includes('date') || lowerType.includes('time')) return 'text-purple-400'
        if (lowerType.includes('bool')) return 'text-yellow-400'
        return 'text-gray-400'
    }

    if (isCollapsed) {
        return (
            <div className="h-full w-full bg-card border-r border-border flex flex-col items-center py-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleCollapse}
                    className="mb-4"
                    title="Expand sidebar"
                >
                    <PanelLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 flex flex-col items-center gap-3">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    {tables.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            {tables.length}
                        </Badge>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="h-full w-full bg-card border-r border-border flex flex-col">
            {/* Header */}
            <div className="p-2 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-[11px]">Database Schema</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleCollapse}
                    className="h-6 w-6"
                    title="Collapse sidebar"
                >
                    <PanelLeftClose className="h-3 w-3" />
                </Button>
            </div>

            {/* Connection Info */}
            <div className="p-2 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-1.5 text-[10px]">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-muted-foreground">Session Active</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0">
                        <Table2 className="h-2.5 w-2.5" />
                        {tables.length} {tables.length === 1 ? 'Table' : 'Tables'}
                    </Badge>
                </div>
            </div>

            {/* Tables Tree */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5">
                {tables.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-3">
                        <Table2 className="h-10 w-10 text-muted-foreground/30 mb-2" />
                        <p className="text-[10px] text-muted-foreground">No tables loaded</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">Upload CSV files to begin</p>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {tables.map((table) => {
                            const isExpanded = expandedTables.has(table.table_name)
                            
                            return (
                                <div key={table.table_name} className="select-none">
                                    {/* Table Row */}
                                    <div
                                        className={cn(
                                            "flex items-center gap-1 px-1.5 py-1 rounded-md group",
                                            "hover:bg-accent transition-colors",
                                            isExpanded && "bg-accent/50"
                                        )}
                                    >
                                        <button 
                                            className="p-0.5 hover:bg-accent-foreground/10 rounded"
                                            onClick={() => toggleTable(table.table_name)}
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
                                            )}
                                        </button>
                                        <Table2 className="h-3 w-3 text-primary flex-shrink-0" />
                                        <span 
                                            className="text-[11px] font-medium truncate flex-1 cursor-pointer" 
                                            title={table.table_name}
                                            onClick={() => toggleTable(table.table_name)}
                                        >
                                            {table.table_name}
                                        </span>
                                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">
                                            {table.row_count}
                                        </Badge>
                                        
                                        {/* Delete Button */}
                                        {onTableDelete && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={deletingTable === table.table_name}
                                                        className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {deletingTable === table.table_name ? (
                                                            <span className="animate-spin text-[10px]">⏳</span>
                                                        ) : (
                                                            <Trash2 className="h-2.5 w-2.5" />
                                                        )}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="max-w-sm">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-sm">Delete Table</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-[11px]">
                                                            Are you sure you want to delete table &quot;{table.table_name}&quot;? This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="h-7 text-[11px]">Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={async () => {
                                                                setDeletingTable(table.table_name)
                                                                try {
                                                                    await onTableDelete(table.table_name)
                                                                } finally {
                                                                    setDeletingTable(null)
                                                                }
                                                            }}
                                                            className="h-7 text-[11px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>

                                    {/* Columns List */}
                                    {isExpanded && (
                                        <div className="ml-3 mt-0.5 space-y-0 border-l border-border/50 pl-1.5">
                                            {/* Columns Header */}
                                            <div className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                <Columns3 className="h-2.5 w-2.5" />
                                                <span className="font-semibold">Columns ({table.columns.length})</span>
                                            </div>
                                            
                                            {/* Column Items */}
                                            {table.columns.map((column, idx) => (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        "flex items-center gap-1 px-1.5 py-0.5 rounded-md cursor-pointer",
                                                        "hover:bg-accent/70 transition-colors group/col"
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onColumnClick?.(table.table_name, column.name)
                                                    }}
                                                    title={`${column.name} (${column.type})`}
                                                >
                                                    <div className={cn("flex-shrink-0", getTypeColor(column.type))}>
                                                        {getTypeIcon(column.type)}
                                                    </div>
                                                    <span className="text-[10px] font-mono truncate flex-1 group-hover/col:text-primary transition-colors">
                                                        {column.name}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[9px] uppercase font-semibold flex-shrink-0 opacity-60 group-hover/col:opacity-100 transition-opacity",
                                                        getTypeColor(column.type)
                                                    )}>
                                                        {column.type.length > 8 ? column.type.substring(0, 8) : column.type}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Footer Stats */}
            {tables.length > 0 && (
                <div className="p-2 border-t border-border/50 bg-muted/20">
                    <div className="text-[10px] space-y-0.5">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Total Rows:</span>
                            <span className="font-semibold text-foreground">
                                {tables.reduce((sum, t) => sum + t.row_count, 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Total Columns:</span>
                            <span className="font-semibold text-foreground">
                                {tables.reduce((sum, t) => sum + t.columns.length, 0)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

