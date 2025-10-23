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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0f0f0f] dark:via-[#1a1a2e] dark:to-[#0f0f0f] p-3 sm:p-6 md:p-12 transition-colors duration-300">
      <div className="container max-w-5xl mx-auto py-6 sm:py-12 px-3 sm:px-6 animate-fade-in mobile-px">
        <div className="mb-8 sm:mb-14 animate-fade-in">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent mb-4 tracking-tight leading-tight">{t("settings.title")}</h1>
        </div>

        <div className="space-y-8">
          {/* Appearance Settings */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 sm:p-8 transition-all duration-300 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white tracking-tight">{t("settings.appearance.title")}</h2>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <Label htmlFor="theme-select" className="text-gray-700 dark:text-gray-300 font-medium">{t("settings.appearance.theme")}</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-600 mobile-touch-target">
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
                <Label className="text-gray-700 dark:text-gray-300 font-medium">{t("settings.appearance.language")}</Label>
                <div className="w-[180px]">
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          </div>

          {/* Editor Settings */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-8 transition-all duration-300 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white tracking-tight">{t("settings.editor.title")}</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="autosave-toggle" className="text-gray-700 dark:text-gray-300 font-medium">{t("settings.editor.autoSave")}</Label>
                <Switch
                  id="autosave-toggle"
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="font-size" className="text-gray-700 dark:text-gray-300 font-medium">{t("settings.editor.fontSize")}</Label>
                <Input
                  id="font-size"
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="w-[180px] bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="font-family" className="text-gray-700 dark:text-gray-300 font-medium">{t("settings.editor.fontFamily")}</Label>
                <Select value={fontFamily} onValueChange={setFontFamily}>
                  <SelectTrigger className="w-[180px] bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-600">
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
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="text-gray-700 dark:text-gray-300 font-medium">{t("settings.notifications.email")}</Label>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="collaboration-alerts" className="text-gray-700 dark:text-gray-300 font-medium">{t("settings.notifications.collaboration")}</Label>
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
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="share-edit-history" className="text-gray-700 dark:text-gray-300 font-medium">{t("settings.privacy.shareHistory")}</Label>
                <Switch
                  id="share-edit-history"
                  checked={shareEditHistory}
                  onCheckedChange={setShareEditHistory}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-online-status" className="text-gray-700 dark:text-gray-300 font-medium">{t("settings.privacy.onlineStatus")}</Label>
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
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t("settings.account.email")}</Label>
                  <p className="text-lg text-gray-900 dark:text-gray-100 mt-2 font-medium">{user.emailAddresses[0].toString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t("settings.account.name")}</Label>
                  <p className="text-lg text-gray-900 dark:text-gray-100 mt-2 font-medium">{user.fullName || t("settings.account.notProvided")}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 flex justify-end animate-fade-in">
          <Button onClick={handleSaveSettings} size="lg" className="hover-scale bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg">
            {t("settings.saveButton")}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Settings