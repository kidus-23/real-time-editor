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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { toast } from 'sonner'

function Settings() {
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
    toast.success('Settings saved successfully')
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100">Settings</h1>
      
      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance" className="space-y-6">
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg border border-gray-100 dark:border-neutral-700 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Theme Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme-select">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <Label>Language</Label>
                <div className="w-[180px]">
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="editor" className="space-y-6">
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg border border-gray-100 dark:border-neutral-700 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Editor Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autosave-toggle">Auto Save</Label>
                <Switch 
                  id="autosave-toggle" 
                  checked={autoSave} 
                  onCheckedChange={setAutoSave} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="font-size">Font Size</Label>
                <Input 
                  id="font-size" 
                  type="number" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(e.target.value)} 
                  className="w-[180px]" 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="font-family">Font Family</Label>
                <Select value={fontFamily} onValueChange={setFontFamily}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="mono">Monospace</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg border border-gray-100 dark:border-neutral-700 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Notification Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch 
                  id="email-notifications" 
                  checked={emailNotifications} 
                  onCheckedChange={setEmailNotifications} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="collaboration-alerts">Collaboration Alerts</Label>
                <Switch 
                  id="collaboration-alerts" 
                  checked={collaborationAlerts} 
                  onCheckedChange={setCollaborationAlerts} 
                />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="privacy" className="space-y-6">
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg border border-gray-100 dark:border-neutral-700 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Privacy Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="share-edit-history">Share Edit History</Label>
                <Switch 
                  id="share-edit-history" 
                  checked={shareEditHistory} 
                  onCheckedChange={setShareEditHistory} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-online-status">Show Online Status</Label>
                <Switch 
                  id="show-online-status" 
                  checked={showOnlineStatus} 
                  onCheckedChange={setShowOnlineStatus} 
                />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="account" className="space-y-6">
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg border border-gray-100 dark:border-neutral-700 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Account Information</h2>
            {user && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-500 dark:text-gray-400">Email</Label>
                  <p className="text-gray-800 dark:text-gray-200">{user.emailAddresses[0].toString()}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500 dark:text-gray-400">Name</Label>
                  <p className="text-gray-800 dark:text-gray-200">{user.fullName || 'Not provided'}</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 flex justify-end">
        <Button onClick={handleSaveSettings}>Save Settings</Button>
      </div>
    </div>
  )
}

export default Settings