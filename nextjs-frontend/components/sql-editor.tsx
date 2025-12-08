'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Play, Trash2, Download, Info, Code2, Sparkles, Loader2, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { queryStorage } from '@/lib/storage'
import { queryAPI } from '@/lib/api'

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
})

const SAMPLE_QUERIES = [
    {
        name: 'Select All',
        sql: 'SELECT * FROM your_table LIMIT 10;',
        category: 'basic'
    },
    {
        name: 'Count Rows',
        sql: 'SELECT COUNT(*) as total_rows FROM your_table;',
        category: 'basic'
    },
    {
        name: 'Group By Aggregate',
        sql: 'SELECT column_name, COUNT(*) as count\nFROM your_table\nGROUP BY column_name\nORDER BY count DESC;',
        category: 'basic'
    },
    {
        name: 'Statistics',
        sql: 'SELECT \n  AVG(numeric_column) as average,\n  MIN(numeric_column) as minimum,\n  MAX(numeric_column) as maximum\nFROM your_table;',
        category: 'basic'
    },
    {
        name: 'INNER JOIN',
        sql: '-- Upload 2+ tables to use JOINs!\nSELECT \n  t1.*,\n  t2.column_name\nFROM table1 AS t1\nINNER JOIN table2 AS t2\n  ON t1.id = t2.table1_id\nLIMIT 100;',
        category: 'joins'
    },
    {
        name: 'LEFT JOIN',
        sql: '-- Get all from left table, matching from right\nSELECT \n  t1.name,\n  t2.value\nFROM table1 AS t1\nLEFT JOIN table2 AS t2\n  ON t1.id = t2.ref_id;',
        category: 'joins'
    },
    {
        name: 'Multi-Table Aggregate',
        sql: '-- Combine multiple tables with aggregation\nSELECT \n  t1.category,\n  COUNT(DISTINCT t2.id) as count,\n  AVG(t2.value) as avg_value\nFROM table1 t1\nINNER JOIN table2 t2\n  ON t1.id = t2.table1_id\nGROUP BY t1.category\nORDER BY count DESC;',
        category: 'joins'
    },
]

interface SQLEditorProps {
    onExecute: (sql: string) => void
    onExplain: (sql: string) => void
    onDownload: (sql: string) => void
    loading: boolean
    userId?: string | null  // User ID for per-user query storage
}

export function SQLEditor({ onExecute, onExplain, onDownload, loading, userId }: SQLEditorProps) {
    const editorRef = useRef<any>(null)
    const [editorMounted, setEditorMounted] = useState(false)
    const [initialValue, setInitialValue] = useState('')
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const basicQueries = SAMPLE_QUERIES.filter(q => q.category === 'basic')
    const joinQueries = SAMPLE_QUERIES.filter(q => q.category === 'joins')

    // Debounced save to server for logged-in users
    const saveQueryToServer = useCallback(async (query: string) => {
        if (!userId) return
        
        try {
            await queryAPI.saveUserQuery(userId, query)
        } catch (error) {
            console.error('Failed to save query to server:', error)
        }
    }, [userId])

    // Load saved query on mount (per-user)
    // For logged-in users, try to load from server first
    useEffect(() => {
        const loadQuery = async () => {
            // First try localStorage for quick load
            const localQuery = queryStorage.get(userId)
            if (localQuery) {
                setInitialValue(localQuery)
            }
            
            // For logged-in users, also try to load from server (cross-device sync)
            if (userId) {
                try {
                    const response = await queryAPI.getUserQuery(userId)
                    if (response.found && response.query) {
                        // Server query takes precedence for cross-device sync
                        setInitialValue(response.query)
                        // Also update localStorage
                        queryStorage.save(response.query, userId)
                        // Update editor if already mounted
                        if (editorRef.current) {
                            editorRef.current.setValue(response.query)
                        }
                    }
                } catch (error) {
                    console.error('Failed to load query from server:', error)
                }
            }
        }
        
        loadQuery()
    }, [userId])

    // Save query to localStorage on change (debounced, per-user)
    // Also sync to server for logged-in users
    useEffect(() => {
        if (!editorRef.current) return

        const editor = editorRef.current
        const disposable = editor.onDidChangeModelContent(() => {
            const value = editor.getValue()
            
            // Always save to localStorage immediately
            queryStorage.save(value, userId)
            
            // For logged-in users, debounce save to server (2 second delay)
            if (userId) {
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current)
                }
                saveTimeoutRef.current = setTimeout(() => {
                    saveQueryToServer(value)
                }, 2000) // 2 second debounce
            }
        })

        return () => {
            disposable?.dispose()
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    }, [editorMounted, userId, saveQueryToServer])

    // Define theme in beforeMount - this runs client-side only
    const handleEditorWillMount = (monaco: any) => {
        // Define the custom theme with VISIBLE selection colors (DBeaver-style blue)
        monaco.editor.defineTheme('sqlDark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6A9955' },
                { token: 'keyword', foreground: '569CD6' },
                { token: 'string', foreground: 'CE9178' },
                { token: 'number', foreground: 'B5CEA8' },
                { token: 'identifier', foreground: '9CDCFE' },
                { token: 'type', foreground: '4EC9B0' },
                { token: 'delimiter', foreground: 'D4D4D4' },
            ],
            colors: {
                'editor.background': '#1e1e1e',
                'editor.foreground': '#D4D4D4',
                'editor.lineHighlightBackground': '#2a2d2e',
                'editorCursor.foreground': '#FFFFFF',
                // CRITICAL: Selection colors - DBeaver blue
                'editor.selectionBackground': '#264F78',
                'editor.inactiveSelectionBackground': '#3A3D41',
                'editor.selectionHighlightBackground': '#ADD6FF4D',
                'editor.findMatchBackground': '#515C6A',
                'editor.findMatchHighlightBackground': '#EA5C0055',
                'editor.wordHighlightBackground': '#575757B8',
                'editor.wordHighlightStrongBackground': '#004972B8',
                'editor.rangeHighlightBackground': '#264F7833',
                'editorBracketMatch.background': '#0064001a',
                'editorBracketMatch.border': '#888888',
            }
        })
    }

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor
        setEditorMounted(true)

        // Restore saved query
        if (initialValue) {
            editor.setValue(initialValue)
        }

        // Explicitly set the theme after mount
        monaco.editor.setTheme('sqlDark')

        // Add keyboard shortcut: Ctrl+Enter or Cmd+Enter to run query
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            const sql = editor.getValue()
            if (sql && sql.trim() && !loading) {
                onExecute(sql)
            }
        })

        // Focus the editor on mount
        editor.focus()

        // Update cursor options
        editor.updateOptions({
            cursorBlinking: 'blink',
            cursorSmoothCaretAnimation: 'on',
        })
    }

    const getCurrentSQL = () => {
        if (!editorRef.current) return ''
        const value = editorRef.current.getValue()
        return value || ''
    }

    const setEditorValue = (value: string) => {
        if (editorRef.current) {
            editorRef.current.setValue(value)
            editorRef.current.focus()
        }
    }

    const handleRunClick = () => {
        const sql = getCurrentSQL()
        if (sql && sql.trim()) {
            onExecute(sql)
        }
    }

    const handleExplainClick = () => {
        const sql = getCurrentSQL()
        if (sql && sql.trim()) {
            onExplain(sql)
        }
    }

    const handleDownloadClick = () => {
        const sql = getCurrentSQL()
        if (sql && sql.trim()) {
            onDownload(sql)
        }
    }

    return (
        <Card className="h-full flex flex-col overflow-hidden group hover:border-primary/30 transition-all duration-300">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <CardHeader className="p-2.5 sm:p-3 relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-md border border-primary/20">
                            <Code2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-[12px] font-semibold text-foreground">SQL Editor</h3>
                            <div className="flex items-center gap-1.5">
                                <p className="text-[9px] text-muted-foreground">Write and execute queries</p>
                                <Badge variant="outline" className="text-[8px] px-1 py-0 gap-0.5 h-4">
                                    <Keyboard className="h-2 w-2" />
                                    Ctrl+Enter
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="text-[10px] gap-1 h-6 px-1.5">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    <span>Samples</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 sm:w-64">
                                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">Basic Queries</div>
                                {basicQueries.map((query, idx) => (
                                    <DropdownMenuItem
                                        key={idx}
                                        onClick={() => setEditorValue(query.sql)}
                                        className="flex flex-col items-start cursor-pointer py-1.5"
                                    >
                                        <span className="font-medium text-[11px]">{query.name}</span>
                                        <span className="text-[10px] text-muted-foreground truncate w-full mt-0.5">
                                            {query.sql.split('\n')[0]}...
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                                    <span>🔗</span> JOIN Queries
                                </div>
                                {joinQueries.map((query, idx) => (
                                    <DropdownMenuItem
                                        key={idx}
                                        onClick={() => setEditorValue(query.sql)}
                                        className="flex flex-col items-start cursor-pointer py-1.5"
                                    >
                                        <span className="font-medium text-[11px]">{query.name}</span>
                                        <span className="text-[10px] text-muted-foreground truncate w-full mt-0.5">
                                            {query.sql.split('\n')[0]}...
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditorValue('')}
                                disabled={loading}
                                className="hidden sm:flex h-6 w-6 p-0"
                            >
                                <Trash2 className="h-2.5 w-2.5" />
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExplainClick}
                                disabled={loading || !getCurrentSQL().trim()}
                                className="text-[10px] gap-1 h-6 px-1.5"
                            >
                                <Info className="h-2.5 w-2.5" />
                                <span className="hidden sm:inline">Explain</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadClick}
                                disabled={loading || !getCurrentSQL().trim()}
                                className="text-[10px] gap-1 h-6 px-1.5"
                            >
                                <Download className="h-2.5 w-2.5" />
                                <span className="hidden sm:inline">Download</span>
                            </Button>

                            <Button
                                size="sm"
                                onClick={handleRunClick}
                                disabled={loading || !getCurrentSQL().trim()}
                                className="text-[10px] gap-1 h-6 px-2 bg-primary hover:bg-primary/90"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin text-[10px]">⏳</span>
                                        <span className="hidden sm:inline">Running...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-2.5 w-2.5" />
                                        <span>Run</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0 bg-[#1e1e1e] flex-1">
                <div className="h-[500px] w-full relative">
                    {!editorMounted && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] text-white z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    <Editor
                        height="500px"
                        width="100%"
                        defaultLanguage="sql"
                        defaultValue={`-- Write your SQL query here
-- Upload multiple CSV files to JOIN tables!
-- Press Ctrl+Enter to run (like LeetCode!)
SELECT * FROM your_table LIMIT 100;`}
                        beforeMount={handleEditorWillMount}
                        onMount={handleEditorDidMount}
                        theme="sqlDark"
                        loading={
                            <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-white">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        }
                        options={{
                            minimap: { enabled: false },
                            fontSize: 12,
                            lineNumbers: 'on',
                            roundedSelection: false,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 2,
                            wordWrap: 'on',
                            padding: { top: 12, bottom: 12 },
                            fontFamily: "'Consolas', 'Courier New', monospace",
                            fontWeight: '500',
                            cursorBlinking: 'blink',
                            cursorStyle: 'line',
                            cursorWidth: 2,
                            renderLineHighlight: 'all',
                            selectOnLineNumbers: true,
                            readOnly: false,
                            domReadOnly: false,
                            selectionHighlight: true,
                            occurrencesHighlight: 'singleFile',
                            // Force DOM-based rendering for selection visibility
                            disableLayerHinting: true,
                            useTabStops: true,
                            lineHeight: 18,
                        }}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
