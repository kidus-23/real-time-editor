'use client'

import { useState, useEffect, useContext } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, Save, Trash2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/useTranslation"
import { LocaleContext } from "@/components/LocaleProvider"

interface APIKeys {
    openrouter?: string
    gemini?: string
    cloudflare?: string
}

interface APIKeySettingsProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function APIKeySettings({ open, onOpenChange }: APIKeySettingsProps) {
    const { t } = useTranslation()
    const context = useContext(LocaleContext)
    const dictionary = context?.dictionary as any
    const [apiKeys, setApiKeys] = useState<APIKeys>({})
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
    const [isSaving, setIsSaving] = useState(false)

    // Load API keys from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('user-api-keys')
            if (stored) {
                try {
                    setApiKeys(JSON.parse(stored))
                } catch (e) {
                    console.error('Failed to parse stored API keys:', e)
                }
            }
        }
    }, [])

    const handleSave = () => {
        setIsSaving(true)
        try {
            localStorage.setItem('user-api-keys', JSON.stringify(apiKeys))
            toast.success(t("apiKeys.toast.saved"))
            onOpenChange(false)
        } catch (error) {
            toast.error(t("apiKeys.toast.saveFailed"))
        } finally {
            setIsSaving(false)
        }
    }

    const handleClear = (provider: keyof APIKeys) => {
        setApiKeys(prev => {
            const updated = { ...prev }
            delete updated[provider]
            return updated
        })
        toast.success(t("apiKeys.toast.cleared", { provider }))
    }

    const handleClearAll = () => {
        setApiKeys({})
        localStorage.removeItem('user-api-keys')
        toast.success(t("apiKeys.toast.allCleared"))
    }

    const toggleShowKey = (provider: string) => {
        setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }))
    }

    const updateKey = (provider: keyof APIKeys, value: string) => {
        setApiKeys(prev => ({ ...prev, [provider]: value }))
    }

    const hasAnyKey = Object.values(apiKeys).some(key => key && key.length > 0)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t("apiKeys.title")}</DialogTitle>
                    <DialogDescription>
                        {t("apiKeys.description")}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="openrouter" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="openrouter">
                            {t("apiKeys.openrouter")}
                            {apiKeys.openrouter && <Badge className="ml-2 h-4 px-1" variant="secondary">✓</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="gemini">
                            {t("apiKeys.gemini")}
                            {apiKeys.gemini && <Badge className="ml-2 h-4 px-1" variant="secondary">✓</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="cloudflare">
                            {t("apiKeys.cloudflare")}
                            {apiKeys.cloudflare && <Badge className="ml-2 h-4 px-1" variant="secondary">✓</Badge>}
                        </TabsTrigger>
                    </TabsList>

                    {/* OpenRouter */}
                    <TabsContent value="openrouter" className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="openrouter-key">{t("apiKeys.labels.openrouterKey")}</Label>
                                <a
                                    href="https://openrouter.ai/keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                                >
                                    {t("apiKeys.getKey")} <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                            <div className="relative">
                                <Input
                                    id="openrouter-key"
                                    type={showKeys.openrouter ? "text" : "password"}
                                    placeholder={t("apiKeys.placeholders.openrouter")}
                                    value={apiKeys.openrouter || ''}
                                    onChange={(e) => updateKey('openrouter', e.target.value)}
                                    className="pr-20"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => toggleShowKey('openrouter')}
                                    >
                                        {showKeys.openrouter ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    {apiKeys.openrouter && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                            onClick={() => handleClear('openrouter')}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t("apiKeys.usedFor.openrouter")}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted p-4 space-y-2">
                            <h4 className="text-sm font-medium">{t("apiKeys.features.title", { provider: t("apiKeys.openrouter") })}</h4>
                            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                                {dictionary?.apiKeys?.features?.openrouter?.map((feature: string, i: number) => (
                                    <li key={i}>{feature}</li>
                                ))}
                            </ul>
                        </div>
                    </TabsContent>

                    {/* Google Gemini */}
                    <TabsContent value="gemini" className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="gemini-key">{t("apiKeys.labels.geminiKey")}</Label>
                                <a
                                    href="https://makersuite.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                                >
                                    {t("apiKeys.getKey")} <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                            <div className="relative">
                                <Input
                                    id="gemini-key"
                                    type={showKeys.gemini ? "text" : "password"}
                                    placeholder={t("apiKeys.placeholders.gemini")}
                                    value={apiKeys.gemini || ''}
                                    onChange={(e) => updateKey('gemini', e.target.value)}
                                    className="pr-20"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => toggleShowKey('gemini')}
                                    >
                                        {showKeys.gemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    {apiKeys.gemini && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                            onClick={() => handleClear('gemini')}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t("apiKeys.usedFor.gemini")}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted p-4 space-y-2">
                            <h4 className="text-sm font-medium">{t("apiKeys.features.title", { provider: t("apiKeys.gemini") })}</h4>
                            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                                {dictionary?.apiKeys?.features?.gemini?.map((feature: string, i: number) => (
                                    <li key={i}>{feature}</li>
                                ))}
                            </ul>
                        </div>
                    </TabsContent>

                    {/* Cloudflare AI */}
                    <TabsContent value="cloudflare" className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="cloudflare-key">{t("apiKeys.labels.cloudflareKey")}</Label>
                                <a
                                    href="https://dash.cloudflare.com/profile/api-tokens"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                                >
                                    {t("apiKeys.getKey")} <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                            <div className="relative">
                                <Input
                                    id="cloudflare-key"
                                    type={showKeys.cloudflare ? "text" : "password"}
                                    placeholder={t("apiKeys.placeholders.cloudflare")}
                                    value={apiKeys.cloudflare || ''}
                                    onChange={(e) => updateKey('cloudflare', e.target.value)}
                                    className="pr-20"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => toggleShowKey('cloudflare')}
                                    >
                                        {showKeys.cloudflare ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    {apiKeys.cloudflare && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                            onClick={() => handleClear('cloudflare')}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t("apiKeys.usedFor.cloudflare")}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted p-4 space-y-2">
                            <h4 className="text-sm font-medium">{t("apiKeys.features.title", { provider: t("apiKeys.cloudflare") })}</h4>
                            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                                {dictionary?.apiKeys?.features?.cloudflare?.map((feature: string, i: number) => (
                                    <li key={i}>{feature}</li>
                                ))}
                            </ul>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-between items-center pt-4 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearAll}
                        disabled={!hasAnyKey}
                        className="text-red-500 hover:text-red-600"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t("apiKeys.buttons.clearAll")}
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            {t("apiKeys.buttons.cancel")}
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? t("apiKeys.buttons.saving") : t("apiKeys.buttons.save")}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
