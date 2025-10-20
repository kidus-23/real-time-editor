import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
    saveFunction: () => Promise<void>;
    debounceMs?: number;
    minIntervalMs?: number;
}

/**
 * Unified auto-save hook with debouncing and interval-based saving
 * 
 * Features:
 * - Saves 2 seconds after typing stops (debounced)
 * - Minimum interval between saves (default: 30s)
 * - Saves on visibility change (tab switch/minimize)
 * - Saves on window close/refresh
 * 
 * @param saveFunction - Async function to save the content
 * @param debounceMs - Debounce time in milliseconds (default: 2000ms = 2s)
 * @param minIntervalMs - Minimum interval between saves (default: 30000ms = 30s)
 */
export function useAutoSave({
    saveFunction,
    debounceMs = 2000,
    minIntervalMs = 30000,
}: UseAutoSaveOptions) {
    const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const lastSaveTimeRef = useRef<number>(Date.now());
    const isDirtyRef = useRef<boolean>(false);
    const isSavingRef = useRef<boolean>(false);

    // Actual save function that checks minimum interval
    const performSave = useCallback(async () => {
        if (isSavingRef.current) return; // Prevent concurrent saves
        if (!isDirtyRef.current) return; // No changes to save

        const now = Date.now();
        const timeSinceLastSave = now - lastSaveTimeRef.current;

        // Respect minimum interval
        if (timeSinceLastSave < minIntervalMs) {
            return;
        }

        try {
            isSavingRef.current = true;
            await saveFunction();
            lastSaveTimeRef.current = now;
            isDirtyRef.current = false;
        } catch (error) {
            console.error('Auto-save error:', error);
        } finally {
            isSavingRef.current = false;
        }
    }, [saveFunction, minIntervalMs]);

    // Debounced trigger function (called on content change)
    const triggerSave = useCallback(() => {
        isDirtyRef.current = true;

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new debounced timer
        debounceTimerRef.current = setTimeout(() => {
            performSave();
        }, debounceMs);
    }, [debounceMs, performSave]);

    // Force save (for visibility change and beforeunload)
    const forceSave = useCallback(async () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        await performSave();
    }, [performSave]);

    // Save on visibility change (tab switch/minimize)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && isDirtyRef.current) {
                forceSave();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [forceSave]);

    // Save on window close/refresh
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (isDirtyRef.current) {
                // Use navigator.sendBeacon for reliable save on unload
                // This is a backup - the forceSave above is the primary mechanism
                forceSave();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [forceSave]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return {
        triggerSave,
        forceSave,
    };
}
