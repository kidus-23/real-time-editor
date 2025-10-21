// lib/useUserAPIKeys.ts
'use client'

import { useState, useEffect } from 'react'

export interface UserAPIKeys {
    openrouter?: string
    gemini?: string
    cloudflare?: string
}

export function useUserAPIKeys() {
    const [apiKeys, setApiKeys] = useState<UserAPIKeys>({})

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('user-api-keys')
            if (stored) {
                try {
                    setApiKeys(JSON.parse(stored))
                } catch (e) {
                    console.error('Failed to parse API keys:', e)
                }
            }
        }
    }, [])

    const refreshKeys = () => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('user-api-keys')
            if (stored) {
                try {
                    setApiKeys(JSON.parse(stored))
                } catch (e) {
                    console.error('Failed to parse API keys:', e)
                }
            }
        }
    }

    return { apiKeys, refreshKeys }
}

export function getUserAPIKeysSync(): UserAPIKeys {
    if (typeof window === 'undefined') return {}

    try {
        const stored = localStorage.getItem('user-api-keys')
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (e) {
        console.error('Failed to parse user API keys:', e)
    }

    return {}
}
