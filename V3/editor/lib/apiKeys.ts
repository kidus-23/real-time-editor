// lib/apiKeys.ts
export interface UserAPIKeys {
    openrouter?: string
    gemini?: string
    cloudflare?: string
}

export function getUserAPIKeys(): UserAPIKeys {
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

export function hasUserAPIKey(provider: keyof UserAPIKeys): boolean {
    const keys = getUserAPIKeys()
    return !!(keys[provider] && keys[provider]!.length > 0)
}
