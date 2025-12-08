'use client'

import { CheckCircle2, XCircle, ChevronUp, ChevronDown, Terminal, Copy, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TerminalResultsProps {
    result: any
    isCollapsed: boolean
    onToggleCollapse: () => void
}

export function TerminalResults({ result, isCollapsed, onToggleCollapse }: TerminalResultsProps) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const downloadResults = () => {
        if (!result?.data) return
        
        const csv = [
            result.columns.join(','),
            ...result.data.map((row: any[]) => row.join(','))
        ].join('\n')
        
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `query-results-${Date.now()}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    if (isCollapsed) {
        return (
            <div className="h-8 bg-[#1e1e1e] border-t border-border flex items-center justify-between px-3">
                <div className="flex items-center gap-1.5">
                    <Terminal className="h-3 w-3 text-green-400" />
                    <span className="text-[10px] text-muted-foreground font-mono">Query Results</span>
                    {result && (
                        <Badge variant={result.success ? "default" : "destructive"} className="text-[9px] h-4 px-1.5">
                            {result.success ? 'Success' : 'Error'}
                        </Badge>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleCollapse}
                    className="h-6 w-6"
                >
                    <ChevronUp className="h-3 w-3" />
                </Button>
            </div>
        )
    }

    return (
        <div className="h-full bg-[#1e1e1e] border-t border-border flex flex-col">
            {/* Terminal Header */}
            <div className="h-8 bg-[#2d2d2d] border-b border-[#3e3e3e] flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                    <Terminal className="h-3 w-3 text-green-400" />
                    <span className="text-[10px] text-gray-300 font-mono font-semibold">QUERY RESULTS</span>
                    {result && (
                        <>
                            {result.success ? (
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                                    <span className="text-[10px] text-green-400 font-mono">SUCCESS</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <XCircle className="h-3 w-3 text-red-400" />
                                    <span className="text-[10px] text-red-400 font-mono">ERROR</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className="flex items-center gap-0.5">
                    {result?.data && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(JSON.stringify(result.data, null, 2))}
                                className="h-6 w-6 text-gray-400 hover:text-white"
                                title="Copy results"
                            >
                                <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={downloadResults}
                                className="h-6 w-6 text-gray-400 hover:text-white"
                                title="Download CSV"
                            >
                                <Download className="h-3 w-3" />
                            </Button>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleCollapse}
                        className="h-6 w-6 text-gray-400 hover:text-white"
                    >
                        <ChevronDown className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* Terminal Content */}
            <div className="flex-1 overflow-auto custom-scrollbar p-3 font-mono text-[11px]">
                {!result ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Terminal className="h-12 w-12 text-gray-600 mb-3" />
                        <p className="text-gray-500 text-[11px]">$ Ready to execute queries...</p>
                        <p className="text-gray-600 text-[10px] mt-1.5">Press Ctrl+Enter to run your SQL query</p>
                    </div>
                ) : result.success === false ? (
                    <div className="space-y-2">
                        <div className="flex items-start gap-1.5">
                            <span className="text-red-400">$</span>
                            <div className="flex-1">
                                <p className="text-red-400 mb-1.5 text-[10px]">Query execution failed:</p>
                                <div className="bg-red-950/30 border border-red-900/50 rounded p-2">
                                    <pre className="text-red-300 text-[10px] whitespace-pre-wrap break-words">
                                        {result.error}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : result.explain_plan ? (
                    <div className="space-y-2">
                        <div className="flex items-start gap-1.5">
                            <span className="text-green-400">$</span>
                            <div className="flex-1">
                                <p className="text-green-400 mb-1.5 text-[10px]">Query execution plan:</p>
                                <div className="bg-blue-950/20 border border-blue-900/30 rounded p-2">
                                    <pre className="text-blue-300 text-[10px] whitespace-pre-wrap">
                                        {result.explain_plan}
                                    </pre>
                                </div>
                            </div>
                        </div>
                        {result.execution_time && (
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                <span>Execution time: {result.execution_time}s</span>
                            </div>
                        )}
                    </div>
                ) : result.data && result.data.length > 0 ? (
                    <div className="space-y-2">
                        {/* Query Info */}
                        <div className="flex items-center gap-3 text-[10px] text-gray-400 pb-1.5 border-b border-gray-700">
                            <span className="text-green-400">$</span>
                            <span>Query executed successfully</span>
                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-gray-800 text-gray-300">
                                {result.row_count || result.data.length} rows
                            </Badge>
                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-gray-800 text-gray-300">
                                {result.columns.length} columns
                            </Badge>
                            {result.execution_time && (
                                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-gray-800 text-gray-300">
                                    {result.execution_time}s
                                </Badge>
                            )}
                        </div>

                        {/* Results Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-[10px]">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        {result.columns.map((col: string, idx: number) => (
                                            <th 
                                                key={idx} 
                                                className="text-left p-1.5 font-semibold text-cyan-400 whitespace-nowrap"
                                            >
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.data.map((row: any[], rowIdx: number) => (
                                        <tr 
                                            key={rowIdx} 
                                            className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                                        >
                                            {row.map((cell: any, cellIdx: number) => (
                                                <td 
                                                    key={cellIdx} 
                                                    className="p-1.5 text-gray-300 whitespace-nowrap"
                                                >
                                                    {cell === null || cell === undefined ? (
                                                        <span className="text-gray-600 italic">NULL</span>
                                                    ) : typeof cell === 'number' ? (
                                                        <span className="text-yellow-300">{cell}</span>
                                                    ) : typeof cell === 'boolean' ? (
                                                        <span className="text-purple-300">{String(cell)}</span>
                                                    ) : (
                                                        <span className="text-green-300">{String(cell)}</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-start gap-1.5">
                            <span className="text-green-400">$</span>
                            <div className="flex-1">
                                <p className="text-green-400 text-[10px]">Query executed successfully</p>
                                <p className="text-gray-500 text-[10px] mt-1.5">No rows returned</p>
                            </div>
                        </div>
                        {result.execution_time && (
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                <span>Execution time: {result.execution_time}s</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

