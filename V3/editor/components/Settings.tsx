'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { useUser } from '@clerk/nextjs'
import { Button } from './ui/button'
import LanguageSwitcher from './LanguageSwitcher'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'

function Settings() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { user } = useUser()

  // Editor settings
  const [autoSave, setAutoSave] = useState(true)
  const [fontSize, setFontSize] = useState('16')
  const [fontFamily, setFontFamily] = useState('default')

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [collaborationAlerts, setCollaborationAlerts] = useState(true)

  // Privacy settings
  const [shareEditHistory, setShareEditHistory] = useState(true)
  const [showOnlineStatus, setShowOnlineStatus] = useState(true)

  const handleSaveSettings = () => {
    // In a real implementation, these settings would be saved to a database
    // For now, we'll just show a toast notification
    toast.success(t("settings.saveSuccess"))
  }

  return (
    <div className="container max-w-5xl mx-auto py-12 px-6 animate-fade-in min-h-screen">
      <h1 className="text-5xl font-bold mb-12 text-gray-900 dark:text-white tracking-tight">{t("settings.title")}</h1>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-8 transition-all duration-300 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white tracking-tight">{t("settings.appearance.title")}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-select">{t("settings.appearance.theme")}</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("settings.appearance.themePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t("settings.appearance.themeOptions.light")}</SelectItem>
                  <SelectItem value="dark">{t("settings.appearance.themeOptions.dark")}</SelectItem>
                  <SelectItem value="system">{t("settings.appearance.themeOptions.system")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>{t("settings.appearance.language")}</Label>
              <div className="w-[180px]">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>

        {/* Editor Settings */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-8 transition-all duration-300 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white tracking-tight">{t("settings.editor.title")}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autosave-toggle">{t("settings.editor.autoSave")}</Label>
              <Switch
                id="autosave-toggle"
                checked={autoSave}
                onCheckedChange={setAutoSave}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="font-size">{t("settings.editor.fontSize")}</Label>
              <Input
                id="font-size"
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="w-[180px]"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="font-family">{t("settings.editor.fontFamily")}</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("settings.editor.fontPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t("settings.editor.fontOptions.default")}</SelectItem>
                  <SelectItem value="serif">{t("settings.editor.fontOptions.serif")}</SelectItem>
                  <SelectItem value="mono">{t("settings.editor.fontOptions.mono")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-8 transition-all duration-300 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white tracking-tight">{t("settings.notifications.title")}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">{t("settings.notifications.email")}</Label>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="collaboration-alerts">{t("settings.notifications.collaboration")}</Label>
              <Switch
                id="collaboration-alerts"
                checked={collaborationAlerts}
                onCheckedChange={setCollaborationAlerts}
              />
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-8 transition-all duration-300 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white tracking-tight">{t("settings.privacy.title")}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="share-edit-history">{t("settings.privacy.shareHistory")}</Label>
              <Switch
                id="share-edit-history"
                checked={shareEditHistory}
                onCheckedChange={setShareEditHistory}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-online-status">{t("settings.privacy.onlineStatus")}</Label>
              <Switch
                id="show-online-status"
                checked={showOnlineStatus}
                onCheckedChange={setShowOnlineStatus}
              />
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-8 transition-all duration-300 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white tracking-tight">{t("settings.account.title")}</h2>
          {user && (
            <div className="space-y-5">
              <div>
                <Label className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t("settings.account.email")}</Label>
                <p className="text-lg text-gray-900 dark:text-gray-100 mt-2">{user.emailAddresses[0].toString()}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t("settings.account.name")}</Label>
                <p className="text-lg text-gray-900 dark:text-gray-100 mt-2">{user.fullName || t("settings.account.notProvided")}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <Button onClick={handleSaveSettings} size="lg" className="hover-scale">{t("settings.saveButton")}</Button>
      </div>
    </div>
  )
}

export default Settings