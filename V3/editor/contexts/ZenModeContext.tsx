'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ZenModeContextType {
    zenMode: boolean
    setZenMode: (value: boolean) => void
}

const ZenModeContext = createContext<ZenModeContextType | undefined>(undefined)

export function ZenModeProvider({ children }: { children: ReactNode }) {
    const [zenMode, setZenMode] = useState(false)

    return (
        <ZenModeContext.Provider value={{ zenMode, setZenMode }}>
            {children}
        </ZenModeContext.Provider>
    )
}

export function useZenMode() {
    const context = useContext(ZenModeContext)
    if (context === undefined) {
        throw new Error('useZenMode must be used within a ZenModeProvider')
    }
    return context
}
