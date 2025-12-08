'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, ChevronDown, Loader2 } from 'lucide-react'

export function UserMenu() {
    const { user, signOut } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleSignOut = async () => {
        setLoading(true)
        try {
            await signOut()
            router.push('/login')
        } catch (error) {
            console.error('Error signing out:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    // Get initials for avatar
    const getInitials = () => {
        if (user.displayName) {
            return user.displayName
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
        }
        if (user.email) {
            return user.email[0].toUpperCase()
        }
        return 'U'
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    className="flex items-center gap-1.5 h-7 px-1.5 hover:bg-[#1e1e2e]"
                >
                    {/* Avatar */}
                    {user.photoURL ? (
                        <img 
                            src={user.photoURL} 
                            alt={user.displayName || 'User'} 
                            className="w-5 h-5 rounded-full border border-[#2a2a3e]"
                        />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[9px] font-medium text-white">
                            {getInitials()}
                        </div>
                    )}
                    
                    {/* Name (hidden on mobile) */}
                    <span className="hidden sm:block text-[11px] text-gray-300 max-w-[100px] truncate">
                        {user.displayName || user.email?.split('@')[0]}
                    </span>
                    
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
                align="end" 
                className="w-48 bg-[#12121a] border-[#2a2a3e] text-gray-200"
            >
                {/* User Info */}
                <div className="px-2 py-1.5">
                    <p className="text-[11px] font-medium text-white truncate">
                        {user.displayName || 'User'}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                        {user.email}
                    </p>
                </div>
                
                <DropdownMenuSeparator className="bg-[#2a2a3e]" />
                
                <DropdownMenuItem 
                    className="cursor-pointer focus:bg-[#1e1e2e] focus:text-white text-[11px] py-1.5"
                    disabled
                >
                    <User className="mr-1.5 h-3 w-3" />
                    Profile
                    <span className="ml-auto text-[9px] text-gray-500">Soon</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                    className="cursor-pointer focus:bg-[#1e1e2e] focus:text-white text-[11px] py-1.5"
                    disabled
                >
                    <Settings className="mr-1.5 h-3 w-3" />
                    Settings
                    <span className="ml-auto text-[9px] text-gray-500">Soon</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-[#2a2a3e]" />
                
                <DropdownMenuItem 
                    onClick={handleSignOut}
                    disabled={loading}
                    className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400 text-[11px] py-1.5"
                >
                    {loading ? (
                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    ) : (
                        <LogOut className="mr-1.5 h-3 w-3" />
                    )}
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

