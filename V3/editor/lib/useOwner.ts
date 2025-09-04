'use client'

import { useUser } from '@clerk/nextjs';

export function useOwner(userId?: string) {
    const { user } = useUser();
    
    if (!userId) return false;
    return user?.id === userId;
}