'use client'

import { useState, useCallback } from 'react'
import { Upload, Loader2, CheckCircle2, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { uploadAPI } from '@/lib/api'

interface FileUploadProps {
    sessionId: string
    onUploadSuccess: (data: any) => void
}

export function FileUpload({ sessionId, onUploadSuccess }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files)
        handleFiles(files)
    }, [])

    const handleFiles = async (files: File[]) => {
        setError(null)
        setSuccessMessage(null)

        const csvFiles = files.filter(file => file.name.endsWith('.csv'))

        if (csvFiles.length === 0) {
            setError('Please select CSV files only')
            return
        }

        setUploadProgress({ current: 0, total: csvFiles.length })

        let successCount = 0
        for (let i = 0; i < csvFiles.length; i++) {
            setUploadProgress({ current: i + 1, total: csvFiles.length })
            const success = await uploadFile(csvFiles[i])
            if (success) successCount++
        }

        if (successCount > 0) {
            const msg = successCount === 1
                ? '✨ 1 table created successfully!'
                : `✨ ${successCount} tables created! Ready for JOIN queries.`
            setSuccessMessage(msg)
            setTimeout(() => setSuccessMessage(null), 5000)
        }
    }

    const uploadFile = async (file: File): Promise<boolean> => {
        setUploading(true)
        setError(null)

        try {
            const data = await uploadAPI.uploadCSV(sessionId, file)
            onUploadSuccess(data)
            return true
        } catch (err: any) {
            setError(`Error uploading ${file.name}: ${err.message}`)
            return false
        } finally {
            setUploading(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files)
            handleFiles(files)
        }
    }

    return (
        <div className="w-full space-y-4">
            <Card
                className={cn(
                    "border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden relative group",
                    isDragging && "border-primary bg-primary/5 scale-[1.02]",
                    uploading && "opacity-70 pointer-events-none",
                    !isDragging && !uploading && "hover:border-primary/50 hover:bg-accent/50"
                )}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <CardContent className="relative flex flex-col items-center justify-center py-12 sm:py-16">
                    <input
                        type="file"
                        accept=".csv"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer w-full">
                        {uploading ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-full"></div>
                                    <Loader2 className="h-12 w-12 sm:h-14 sm:w-14 animate-spin text-primary relative z-10" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-base sm:text-lg font-semibold text-foreground">
                                        Uploading {uploadProgress.current} of {uploadProgress.total}
                                    </p>
                                    <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                                            style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-5">
                                <div className="relative">
                                    <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full group-hover:bg-primary/30 transition-all"></div>
                                    <div className="relative bg-primary/10 p-4 sm:p-5 rounded-2xl border border-primary/20 group-hover:border-primary/40 transition-all">
                                        <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-base sm:text-lg font-semibold text-foreground">
                                        Drop CSV files here
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        or click to browse your files
                                    </p>
                                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-3">
                                        <FileText className="h-3 w-3" />
                                        <span>Upload multiple files for JOIN queries • Max 50MB</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </label>
                </CardContent>
            </Card>

            {successMessage && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">{successMessage}</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-sm font-medium text-destructive">{error}</p>
                </div>
            )}
        </div>
    )
}
