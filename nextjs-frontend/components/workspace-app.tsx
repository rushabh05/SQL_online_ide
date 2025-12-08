'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { FileUpload } from '@/components/file-upload'
import { DatabaseSidebar } from '@/components/database-sidebar'
import { SQLEditor } from '@/components/sql-editor'
import { TerminalResults } from '@/components/terminal-results'
import { QueryHistory } from '@/components/query-history'
import { GenerateTableDialog } from '@/components/generate-table-dialog'
import { AuthGuard } from '@/components/auth-guard'
import { UserMenu } from '@/components/user-menu'
import { EmailVerificationBanner } from '@/components/email-verification-banner'
import { useAuth } from '@/lib/auth-context'
import { sessionAPI, queryAPI, uploadAPI } from '@/lib/api'
import { sessionStorage, queryStorage } from '@/lib/storage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Database, Upload, History, LogIn, User, AlertTriangle } from 'lucide-react'

interface QueryHistoryItem {
    id: string
    sql: string
    timestamp: Date
    success: boolean
    executionTime?: number
    favorite: boolean
}

export function WorkspaceApp() {
    const { user, loading: authLoading, isEmailVerified } = useAuth()
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [tables, setTables] = useState<any[]>([])
    const [queryResult, setQueryResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [resultsCollapsed, setResultsCollapsed] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([])
    const [showUpload, setShowUpload] = useState(false)
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
    
    // Resizable panel states
    const [sidebarWidth, setSidebarWidth] = useState(264)
    const [resultsHeight, setResultsHeight] = useState(350)
    const [isResizingSidebar, setIsResizingSidebar] = useState(false)
    const [isResizingResults, setIsResizingResults] = useState(false)

    const editorRef = useRef<any>(null)

    useEffect(() => {
        // Wait for auth to finish loading before initializing session
        if (!authLoading) {
            initializeSession()
            loadQueryHistory()
        }
    }, [authLoading, user])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyboard = (e: KeyboardEvent) => {
            // Ctrl/Cmd + B: Toggle sidebar
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault()
                setSidebarCollapsed(prev => !prev)
            }
            // Ctrl/Cmd + H: Toggle history
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault()
                setShowHistory(prev => !prev)
            }
            // Ctrl/Cmd + J: Toggle results
            if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
                e.preventDefault()
                setResultsCollapsed(prev => !prev)
            }
            // F1: Show keyboard shortcuts
            if (e.key === 'F1') {
                e.preventDefault()
                setShowKeyboardShortcuts(prev => !prev)
            }
        }

        window.addEventListener('keydown', handleKeyboard)
        return () => window.removeEventListener('keydown', handleKeyboard)
    }, [])

    // Resize handlers for sidebar
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingSidebar) {
                const newWidth = Math.max(200, Math.min(600, e.clientX))
                setSidebarWidth(newWidth)
            }
        }

        const handleMouseUp = () => {
            setIsResizingSidebar(false)
        }

        if (isResizingSidebar) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
    }, [isResizingSidebar])

    // Resize handlers for results panel
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingResults) {
                const windowHeight = window.innerHeight
                const toolbarHeight = 48 // Approximate toolbar height
                const maxHeight = windowHeight - toolbarHeight - 200 // Leave space for editor
                const newHeight = Math.max(150, Math.min(maxHeight, windowHeight - e.clientY))
                setResultsHeight(newHeight)
            }
        }

        const handleMouseUp = () => {
            setIsResizingResults(false)
        }

        if (isResizingResults) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'row-resize'
            document.body.style.userSelect = 'none'
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
    }, [isResizingResults])

    const initializeSession = async () => {
        try {
            // Get user ID if logged in
            const userId = user?.uid || null
            
            // IMPORTANT: Each user (and guests) have their own session storage
            // This prevents cross-user data access on the same browser
            
            // Step 1: Try to get session from user-specific localStorage
            const savedSessionId = sessionStorage.get(userId)
            
            if (savedSessionId) {
                console.log(`Attempting to restore ${userId ? 'user' : 'guest'} session:`, savedSessionId)
                try {
                    // Try to restore the session from backend
                    const restoreResponse = await sessionAPI.restoreSession(savedSessionId, userId)
                    setSessionId(restoreResponse.session_id)
                    sessionStorage.save(restoreResponse.session_id, userId, restoreResponse.expires_at)
                    
                    // Load tables from restored session
                    const tablesResponse = await sessionAPI.getSessionTables(restoreResponse.session_id)
                    setTables(tablesResponse.tables || [])
                    
                    console.log('Session restored successfully with', tablesResponse.tables?.length || 0, 'tables')
                    return
                } catch (restoreError) {
                    console.log('Failed to restore local session, trying server:', restoreError)
                    sessionStorage.clear(userId)
                }
            }
            
            // Step 2: If user is logged in, try to load their session from the server
            // This handles cross-device access - user's session is stored on server
            if (userId) {
                try {
                    console.log('Fetching user session from server for user:', userId)
                    const userSessionResponse = await sessionAPI.getUserSession(userId)
                    if (userSessionResponse.session_id) {
                        setSessionId(userSessionResponse.session_id)
                        sessionStorage.save(userSessionResponse.session_id, userId, userSessionResponse.expires_at)
                        
                        const tablesResponse = await sessionAPI.getSessionTables(userSessionResponse.session_id)
                        setTables(tablesResponse.tables || [])
                        
                        console.log('User session loaded from server with', tablesResponse.tables?.length || 0, 'tables')
                        return
                    }
                } catch (error) {
                    console.log('No existing user session on server, creating new one')
                }
            }
            
            // Step 3: Create new session (linked to user if logged in)
            const response = await sessionAPI.createSession(userId)
            setSessionId(response.session_id)
            sessionStorage.save(response.session_id, userId, response.expires_at)
            console.log('New session created:', response.session_id, userId ? '(linked to user)' : '(guest)')
        } catch (error) {
            console.error('Failed to initialize session:', error)
        }
    }

    const loadQueryHistory = () => {
        // For logged-in users, we could load from server
        // For now, load from localStorage
        const historyKey = user ? `queryHistory_${user.uid}` : 'queryHistory_guest'
        const saved = localStorage.getItem(historyKey)
        if (saved) {
            const parsed = JSON.parse(saved)
            setQueryHistory(parsed.map((item: any) => ({
                ...item,
                timestamp: new Date(item.timestamp)
            })))
        }
    }

    const saveQueryHistory = (history: QueryHistoryItem[]) => {
        const historyKey = user ? `queryHistory_${user.uid}` : 'queryHistory_guest'
        localStorage.setItem(historyKey, JSON.stringify(history))
        setQueryHistory(history)
    }

    const addToHistory = (sql: string, success: boolean, executionTime?: number) => {
        const newItem: QueryHistoryItem = {
            id: Date.now().toString(),
            sql,
            timestamp: new Date(),
            success,
            executionTime,
            favorite: false
        }
        const updated = [newItem, ...queryHistory].slice(0, 50) // Keep last 50
        saveQueryHistory(updated)
    }

    const handleUploadSuccess = useCallback((uploadData: any) => {
        const newTable = uploadData.table_info
        setTables(prev => [...prev, newTable])
        setShowUpload(false)
    }, [])

    const handleTableDelete = useCallback(async (tableName: string) => {
        try {
            if (!sessionId) return
            await uploadAPI.deleteTable(sessionId, tableName)
            setTables(prev => prev.filter(table => table.table_name !== tableName))
        } catch (error: any) {
            alert('Failed to delete table: ' + (error.response?.data?.detail || error.message))
            throw error
        }
    }, [sessionId])

    const handleGenerateTable = useCallback(async (tableName: string, rowCount: number) => {
        try {
            if (!sessionId) return
            const result = await uploadAPI.generateSampleTable(sessionId, tableName, rowCount)
            setTables(prev => [...prev, result.table_info])
        } catch (error: any) {
            alert('Failed to generate table: ' + (error.response?.data?.detail || error.message))
            throw error
        }
    }, [sessionId])

    const handleExecuteQuery = useCallback(async (sql: string) => {
        if (!sessionId) return
        setLoading(true)
        setQueryResult(null)
        setResultsCollapsed(false) // Auto-expand results
        
        const startTime = performance.now()
        try {
            const result = await queryAPI.executeQuery(sessionId, sql)
            const executionTime = ((performance.now() - startTime) / 1000).toFixed(3)
            setQueryResult({ ...result, execution_time: executionTime })
            addToHistory(sql, true, parseFloat(executionTime))
        } catch (error: any) {
            const executionTime = ((performance.now() - startTime) / 1000).toFixed(3)
            setQueryResult({
                success: false,
                error: error.response?.data?.detail || error.message,
                execution_time: executionTime
            })
            addToHistory(sql, false, parseFloat(executionTime))
        } finally {
            setLoading(false)
        }
    }, [sessionId, queryHistory])

    const handleExplainQuery = useCallback(async (sql: string) => {
        if (!sessionId) return
        setLoading(true)
        setResultsCollapsed(false)
        
        try {
            const result = await queryAPI.explainQuery(sessionId, sql)
            setQueryResult(result)
        } catch (error: any) {
            setQueryResult({
                success: false,
                error: error.response?.data?.detail || error.message
            })
        } finally {
            setLoading(false)
        }
    }, [sessionId])

    const handleDownloadResults = useCallback(async (sql: string) => {
        if (!sessionId) return
        try {
            await queryAPI.downloadResults(sessionId, sql)
        } catch (error: any) {
            alert('Failed to download results: ' + (error.response?.data?.detail || error.message))
        }
    }, [sessionId])

    const handleQuerySelect = (sql: string) => {
        // Insert query into editor
        if (editorRef.current) {
            editorRef.current.setValue(sql)
            editorRef.current.focus()
        }
    }

    const handleQueryDelete = (id: string) => {
        const updated = queryHistory.filter(item => item.id !== id)
        saveQueryHistory(updated)
    }

    const handleToggleFavorite = (id: string) => {
        const updated = queryHistory.map(item =>
            item.id === id ? { ...item, favorite: !item.favorite } : item
        )
        saveQueryHistory(updated)
    }

    const handleClearHistory = () => {
        if (confirm('Are you sure you want to clear all query history?')) {
            saveQueryHistory([])
        }
    }

    const handleTableClick = (tableName: string) => {
        // Could auto-generate SELECT query
        console.log('Table clicked:', tableName)
    }

    const handleColumnClick = (tableName: string, columnName: string) => {
        // Insert column name at cursor position
        console.log('Column clicked:', tableName, columnName)
    }

    // Show loading while auth is checking or session is initializing
    if (authLoading || !sessionId) {
        return (
            <AuthGuard requireAuth={false}>
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="text-center space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full animate-pulse-glow"></div>
                            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary relative z-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold gradient-text">Initializing SQL Workspace</h2>
                            <p className="text-muted-foreground">Setting up your session...</p>
                        </div>
                    </div>
                </div>
            </AuthGuard>
        )
    }

    return (
        <AuthGuard requireAuth={false}>
        <div className="h-screen flex flex-col bg-background overflow-hidden">
            {/* Top Toolbar - DBeaver Style */}
            <header className="h-10 border-b border-border bg-card flex items-center justify-between px-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                        <Database className="h-4 w-4 text-primary" />
                        <span className="font-bold text-sm gradient-text">SQL Workspace</span>
                    </Link>
                    <div className="h-3 w-px bg-border" />
                    <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        Connected
                    </Badge>
                    {tables.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                            {tables.length} {tables.length === 1 ? 'Table' : 'Tables'}
                        </Badge>
                    )}
                    {/* Guest mode indicator */}
                    {!user && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 text-yellow-500 border-yellow-500/50">
                            <User className="h-2.5 w-2.5 mr-0.5" />
                            Guest Mode
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Upload CSV - restricted for unverified users */}
                    <div className="relative group">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (user && !isEmailVerified) {
                                    alert('Please verify your email to upload CSV files.')
                                    return
                                }
                                setShowUpload(!showUpload)
                            }}
                            className={`gap-1.5 h-7 text-[11px] px-2 ${user && !isEmailVerified ? 'opacity-60' : ''}`}
                        >
                            <Upload className="h-3 w-3" />
                            Upload CSV
                            {user && !isEmailVerified && (
                                <AlertTriangle className="h-2.5 w-2.5 text-amber-400" />
                            )}
                        </Button>
                        {user && !isEmailVerified && (
                            <div className="absolute hidden group-hover:block top-full left-0 mt-1 p-1.5 bg-amber-500/20 border border-amber-500/30 rounded text-[10px] text-amber-200 whitespace-nowrap z-50">
                                Verify your email to upload files
                            </div>
                        )}
                    </div>

                    {/* Generate Sample Data - restricted for unverified users */}
                    <div className="relative group">
                        {user && !isEmailVerified ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => alert('Please verify your email to generate sample data.')}
                                    className="gap-1.5 h-7 text-[11px] px-2 opacity-60"
                                >
                                    Generate Data
                                    <AlertTriangle className="h-2.5 w-2.5 text-amber-400" />
                                </Button>
                                <div className="absolute hidden group-hover:block top-full left-0 mt-1 p-1.5 bg-amber-500/20 border border-amber-500/30 rounded text-[10px] text-amber-200 whitespace-nowrap z-50">
                                    Verify your email to generate data
                                </div>
                            </>
                        ) : (
                            <GenerateTableDialog onGenerate={handleGenerateTable} />
                        )}
                    </div>

                    <Button
                        variant={showHistory ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowHistory(!showHistory)}
                        className="gap-1.5 h-7 text-[11px] px-2"
                    >
                        <History className="h-3 w-3" />
                        History
                    </Button>

                    <div className="h-3 w-px bg-border" />

                    {/* Show login button for guests, user menu for authenticated */}
                    {user ? (
                        <UserMenu />
                    ) : (
                        <Link href="/login">
                            <Button size="sm" className="gap-1.5 h-7 text-[11px] px-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90">
                                <LogIn className="h-3 w-3" />
                                Sign In
                            </Button>
                        </Link>
                    )}
                </div>
            </header>

            {/* Guest Mode Banner */}
            {!user && (
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-500/20 px-3 py-1.5">
                    <div className="flex items-center justify-between max-w-screen-xl mx-auto">
                        <p className="text-[11px] text-gray-300">
                            <span className="font-medium text-blue-400">Guest Mode:</span> Your data is stored locally and will be lost when you close the browser.
                        </p>
                        <Link href="/login">
                            <Button size="sm" variant="outline" className="text-[10px] h-6 px-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                                Sign in to save your work
                            </Button>
                        </Link>
                    </div>
                </div>
            )}

            {/* Email Verification Banner - for logged in users with unverified email */}
            {user && !isEmailVerified && (
                <div className="px-3 py-1.5 border-b border-border">
                    <EmailVerificationBanner />
                </div>
            )}

            {/* Upload Panel (Collapsible) */}
            {showUpload && (
                <div className="border-b border-border bg-muted/30 p-3">
                    <FileUpload sessionId={sessionId} onUploadSuccess={handleUploadSuccess} />
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Database Schema */}
                <div 
                    className="relative flex-shrink-0 transition-all duration-200"
                    style={{ width: sidebarCollapsed ? '48px' : `${sidebarWidth}px` }}
                >
                    <DatabaseSidebar
                        tables={tables}
                        isCollapsed={sidebarCollapsed}
                        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                        onTableClick={handleTableClick}
                        onColumnClick={handleColumnClick}
                        onTableDelete={handleTableDelete}
                    />
                    
                    {/* Resize Handle for Sidebar */}
                    {!sidebarCollapsed && (
                        <div
                            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors group"
                            onMouseDown={() => setIsResizingSidebar(true)}
                        >
                            <div className="absolute inset-y-0 -right-1 w-3" />
                        </div>
                    )}
                </div>

                {/* Center - Editor and Results */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* SQL Editor */}
                    <div 
                        className="overflow-hidden transition-all duration-200"
                        style={{ 
                            height: resultsCollapsed 
                                ? 'calc(100% - 40px)' 
                                : `calc(100% - ${resultsHeight}px)` 
                        }}
                    >
                        <SQLEditor
                            onExecute={handleExecuteQuery}
                            onExplain={handleExplainQuery}
                            onDownload={handleDownloadResults}
                            loading={loading}
                            userId={user?.uid}
                        />
                    </div>

                    {/* Resize Handle for Results */}
                    {!resultsCollapsed && (
                        <div
                            className="relative h-1 cursor-row-resize hover:bg-primary/50 transition-colors bg-border"
                            onMouseDown={() => setIsResizingResults(true)}
                        >
                            <div className="absolute inset-x-0 -top-1 h-3" />
                        </div>
                    )}

                    {/* Bottom Terminal Results */}
                    <div 
                        className="transition-all duration-200"
                        style={{ 
                            height: resultsCollapsed ? '40px' : `${resultsHeight}px` 
                        }}
                    >
                        <TerminalResults
                            result={queryResult}
                            isCollapsed={resultsCollapsed}
                            onToggleCollapse={() => setResultsCollapsed(!resultsCollapsed)}
                        />
                    </div>
                </div>

                {/* Right Sidebar - Query History (Optional) */}
                {showHistory && (
                    <div className="w-80 border-l border-border bg-card overflow-hidden">
                        <QueryHistory
                            history={queryHistory}
                            onQuerySelect={handleQuerySelect}
                            onQueryDelete={handleQueryDelete}
                            onToggleFavorite={handleToggleFavorite}
                            onClearHistory={handleClearHistory}
                        />
                    </div>
                )}
            </div>
        </div>
        </AuthGuard>
    )
}
