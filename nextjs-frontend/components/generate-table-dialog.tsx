'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Sparkles, Loader2, Table2 } from 'lucide-react'

interface GenerateTableDialogProps {
    onGenerate: (tableName: string, rowCount: number) => Promise<void>
}

const SAMPLE_TABLES = [
    {
        name: 'employees',
        description: 'Employee records with names, departments, salaries',
        columns: ['id', 'name', 'email', 'department', 'salary', 'hire_date', 'manager_id']
    },
    {
        name: 'customers',
        description: 'Customer data with contact information',
        columns: ['id', 'name', 'email', 'phone', 'address', 'city', 'country', 'created_at']
    },
    {
        name: 'products',
        description: 'Product catalog with pricing',
        columns: ['id', 'name', 'description', 'price', 'category', 'stock', 'created_at']
    },
    {
        name: 'orders',
        description: 'Order transactions',
        columns: ['id', 'customer_id', 'order_date', 'total_amount', 'status', 'shipping_address']
    },
    {
        name: 'sales',
        description: 'Sales transactions with revenue data',
        columns: ['id', 'product_id', 'quantity', 'price', 'sale_date', 'customer_id', 'revenue']
    },
    {
        name: 'users',
        description: 'User accounts and profiles',
        columns: ['id', 'username', 'email', 'created_at', 'last_login', 'is_active', 'role']
    },
]

export function GenerateTableDialog({ onGenerate }: GenerateTableDialogProps) {
    const [open, setOpen] = useState(false)
    const [customTableName, setCustomTableName] = useState('')
    const [rowCount, setRowCount] = useState(50)
    const [generating, setGenerating] = useState(false)

    const handleGenerate = async (tableName: string) => {
        setGenerating(true)
        try {
            await onGenerate(tableName, rowCount)
            setOpen(false)
            setCustomTableName('')
        } catch (error) {
            console.error('Failed to generate table:', error)
        } finally {
            setGenerating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8">
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate Sample Data
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Generate Sample Table
                    </DialogTitle>
                    <DialogDescription>
                        Choose a predefined table or enter a custom name to generate sample data
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Row Count Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Number of Rows</label>
                        <div className="flex gap-2">
                            {[50, 100, 200, 500].map((count) => (
                                <Button
                                    key={count}
                                    variant={rowCount === count ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setRowCount(count)}
                                    className="flex-1"
                                >
                                    {count}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Predefined Tables */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Predefined Tables</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {SAMPLE_TABLES.map((table) => (
                                <div
                                    key={table.name}
                                    className="border border-border rounded-lg p-3 hover:border-primary/50 transition-colors cursor-pointer group"
                                    onClick={() => !generating && handleGenerate(table.name)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Table2 className="h-4 w-4 text-primary" />
                                            <h4 className="font-semibold text-sm">{table.name}</h4>
                                        </div>
                                        <Badge variant="secondary" className="text-xs">
                                            {table.columns.length} cols
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        {table.description}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {table.columns.slice(0, 4).map((col) => (
                                            <Badge key={col} variant="outline" className="text-xs px-1.5 py-0">
                                                {col}
                                            </Badge>
                                        ))}
                                        {table.columns.length > 4 && (
                                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                +{table.columns.length - 4}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Custom Table Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Or Enter Custom Table Name</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customTableName}
                                onChange={(e) => setCustomTableName(e.target.value)}
                                placeholder="e.g., transactions, inventory, reviews..."
                                className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={generating}
                            />
                            <Button
                                onClick={() => customTableName && handleGenerate(customTableName)}
                                disabled={!customTableName || generating}
                                size="sm"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Generating...
                                    </>
                                ) : (
                                    'Generate'
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            We'll generate realistic sample data based on the table name
                        </p>
                    </div>
                </div>

                {generating && (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        <span className="text-sm text-muted-foreground">
                            Generating {rowCount} rows of sample data...
                        </span>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

