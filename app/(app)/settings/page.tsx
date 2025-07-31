"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Bell, Globe, Zap, AlertTriangle, User, Shield, Eye, EyeOff, Settings, Flag } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { useProfile } from "@/contexts/profile-context"

import { useSuiAuth } from "@/contexts/sui-auth-context"
import { DashboardProfiles } from "@/components/dashboard-profiles"
import { NewUserOnboarding } from "@/components/new-user-onboarding"


import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


export default function SettingsPage() {
  // Use persistent profile system
  const { user, isNewUser } = useSuiAuth()

  // Check if user is admin
  const isAdmin = user?.address === '0x311479200d45ef0243b92dbcf9849b8f6b931d27ae885197ea73066724f2bcf4'

  // Use our notification hook
  const {
    permission: notificationPermission,
    settings: notifications,
    updateSettings: updateNotificationSettings,
    requestPermission: requestNotificationPermission,
    isSupported: isNotificationSupported,
    sendTestNotification
  } = useNotifications(user?.address)
  const { profile, updateProfile, isLoading } = useProfile()






  // General settings state - loaded from persistent profile
  const [performanceMode, setPerformanceMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Privacy settings state
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>('public')
  const [showAchievements, setShowAchievements] = useState(true)
  const [showLevel, setShowLevel] = useState(true)
  const [showJoinDate, setShowJoinDate] = useState(true)
  const [showLastActive, setShowLastActive] = useState(false)
  const [allowProfileSearch, setAllowProfileSearch] = useState(true)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const isDeleteConfirmed = deleteConfirmation === "DELETE"

  // Load settings from persistent profile
  useEffect(() => {
    if (profile) {
      // Load display preferences
      const displayPrefs = profile.display_preferences || {}
      setPerformanceMode(displayPrefs.performance_mode || false)

      // Load privacy preferences
      const privacyPrefs = displayPrefs.privacy_settings || {}
      setProfileVisibility(privacyPrefs.profile_visibility || 'public')
      setShowAchievements(privacyPrefs.show_achievements !== false)
      setShowLevel(privacyPrefs.show_level !== false)
      setShowJoinDate(privacyPrefs.show_join_date !== false)
      setShowLastActive(privacyPrefs.show_last_active === true)
      setAllowProfileSearch(privacyPrefs.allow_profile_search !== false)
    }
  }, [profile])



  // Save general settings to database
  const saveGeneralSettings = async () => {
    if (!user?.address) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsSaving(true)

    try {
      console.log('💾 Saving general settings to database and Walrus...')

      const displayPreferences = {
        ...profile?.display_preferences,
        performance_mode: performanceMode,
        privacy_settings: {
          profile_visibility: profileVisibility,
          show_achievements: showAchievements,
          show_level: showLevel,
          show_join_date: showJoinDate,
          show_last_active: showLastActive,
          allow_profile_search: allowProfileSearch
        }
      }

      await updateProfile({
        display_preferences: displayPreferences
      })

      toast.success('✅ Profile preferences saved successfully!')
    } catch (error) {
      console.error('💥 Error saving settings:', error)
      toast.error(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    setIsSaving(false)
  }

  const handleDeleteAccount = () => {
    if (!isDeleteConfirmed) return

    // Here you would implement the actual account deletion logic
    console.log("Account deletion requested")
    setDeleteDialogOpen(false)
    setDeleteConfirmation("")
  }

  return (
    <>
      {/* New User Onboarding Modal */}
      <NewUserOnboarding />



      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Settings</h1>
            <p className="text-[#C0E6FF] mt-1">
              {isNewUser && !user?.onboardingCompleted
                ? "Complete your account setup to access all features"
                : "Manage your account settings and preferences"
              }
            </p>
          </div>

        </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-[#011829] border border-[#C0E6FF]/20">
          <TabsTrigger value="account" className="text-[#C0E6FF] data-[state=active]:bg-[#4DA2FF] data-[state=active]:text-white">Account</TabsTrigger>
          <TabsTrigger value="privacy" className="text-[#C0E6FF] data-[state=active]:bg-[#4DA2FF] data-[state=active]:text-white">Privacy</TabsTrigger>
          <TabsTrigger value="notifications" className="text-[#C0E6FF] data-[state=active]:bg-[#4DA2FF] data-[state=active]:text-white">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <DashboardProfiles />

          {/* Danger Zone */}
          <div className="mt-8">
            <div className="enhanced-card border-red-500/20">
              <div className="enhanced-card-content">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <h3 className="text-lg font-semibold text-red-500">Danger Zone</h3>
                  </div>
                  <p className="text-[#C0E6FF] text-sm">
                    Actions in this section can lead to permanent data loss. Please proceed with caution.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-[#C0E6FF]">
                      Deleting your account will permanently remove all your data, including your profile, settings, and trading history.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-red-500/20">
                  <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="bg-red-500 hover:bg-red-600">
                        Delete Account
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <span>Confirm Account Deletion</span>
                      </DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-sm text-muted-foreground">
                        Please type <span className="font-bold">DELETE</span> to confirm.
                      </p>
                      <Input
                        className="mt-2"
                        placeholder="Type DELETE to confirm"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        className="bg-red-500 hover:bg-red-600"
                        onClick={handleDeleteAccount}
                        disabled={!isDeleteConfirmed}
                      >
                        Delete Account
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="privacy">
          <div className="enhanced-card">
            <div className="enhanced-card-content">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-[#4DA2FF]" />
                  <h3 className="text-lg font-semibold text-white">Privacy Settings</h3>
                </div>
                <p className="text-[#C0E6FF] text-sm">Control who can see your profile and what information is displayed publicly.</p>
              </div>

              <div className="space-y-6">
                {/* Profile Visibility */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-[#4DA2FF]" />
                        <Label htmlFor="profile-visibility" className="text-white">Profile Visibility</Label>
                      </div>
                      <p className="text-sm text-[#C0E6FF]">Choose who can view your profile.</p>
                    </div>
                    <Select value={profileVisibility} onValueChange={(value: 'public' | 'private') => setProfileVisibility(value)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Public
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <EyeOff className="w-4 h-4" />
                            Private
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {profileVisibility === 'private' && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-yellow-400 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Private Profile</span>
                      </div>
                      <p className="text-sm text-yellow-300">
                        Your profile will not be visible to other users. Profile links will show a "Profile not found" message.
                      </p>
                    </div>
                  )}
                </div>

                {/* Search Visibility */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-[#4DA2FF]" />
                      <Label htmlFor="allow-search" className="text-white">Allow Profile Search</Label>
                    </div>
                    <p className="text-sm text-[#C0E6FF]">Allow other users to find your profile through search.</p>
                  </div>
                  <Switch
                    id="allow-search"
                    checked={allowProfileSearch}
                    onCheckedChange={setAllowProfileSearch}
                    disabled={profileVisibility === 'private'}
                  />
                </div>

                {/* Information Display Settings */}
                <div className="border-t border-[#C0E6FF]/20 pt-6">
                  <h4 className="text-white font-medium mb-4">Public Information Display</h4>
                  <p className="text-sm text-[#C0E6FF] mb-4">
                    Choose what information to show on your public profile. These settings only apply when your profile is public.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-achievements" className="text-white">Show Achievements</Label>
                        <p className="text-sm text-[#C0E6FF]">Display your claimed achievements on your profile.</p>
                      </div>
                      <Switch
                        id="show-achievements"
                        checked={showAchievements}
                        onCheckedChange={setShowAchievements}
                        disabled={profileVisibility === 'private'}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-level" className="text-white">Show Level & XP</Label>
                        <p className="text-sm text-[#C0E6FF]">Display your profile level and XP progress.</p>
                      </div>
                      <Switch
                        id="show-level"
                        checked={showLevel}
                        onCheckedChange={setShowLevel}
                        disabled={profileVisibility === 'private'}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-join-date" className="text-white">Show Join Date</Label>
                        <p className="text-sm text-[#C0E6FF]">Display when you joined the platform.</p>
                      </div>
                      <Switch
                        id="show-join-date"
                        checked={showJoinDate}
                        onCheckedChange={setShowJoinDate}
                        disabled={profileVisibility === 'private'}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-last-active" className="text-white">Show Last Active</Label>
                        <p className="text-sm text-[#C0E6FF]">Display when you were last active on the platform.</p>
                      </div>
                      <Switch
                        id="show-last-active"
                        checked={showLastActive}
                        onCheckedChange={setShowLastActive}
                        disabled={profileVisibility === 'private'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#C0E6FF]/20">
                <Button
                  onClick={saveGeneralSettings}
                  disabled={isSaving || isLoading}
                  className="bg-[#4da2ff] hover:bg-[#3d8ae6] text-white transition-colors duration-200"
                >
                  {isSaving ? "Saving Privacy Settings..." : "Save Privacy Settings"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="enhanced-card">
            <div className="enhanced-card-content">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-5 w-5 text-[#4DA2FF]" />
                  <h3 className="text-lg font-semibold text-white">Notification Settings</h3>
                </div>
                <p className="text-[#C0E6FF] text-sm">Configure how and when you receive notifications.</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="browser-notifications" className="text-white">Browser Notifications</Label>
                      <p className="text-sm text-[#C0E6FF]">Receive notifications in your browser while using AIONET.</p>
                      {notificationPermission === 'denied' && (
                        <p className="text-xs text-red-400 mt-1">Browser notifications are blocked. Please enable them in your browser settings.</p>
                      )}
                      {notificationPermission === 'granted' && (
                        <p className="text-xs text-green-400 mt-1">✅ Browser notifications are enabled and working.</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {notificationPermission === 'default' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={requestNotificationPermission}
                          className="text-xs bg-transparent border-slate-700 text-white hover:bg-[#4da2ff]/10 hover:border-[#4da2ff]"
                        >
                          Enable
                        </Button>
                      )}
                      <Switch
                        id="browser-notifications"
                        checked={notifications?.browser_enabled ?? true}
                        onCheckedChange={(checked) => updateNotificationSettings({ browser_enabled: checked })}
                        disabled={notificationPermission === 'denied'}
                      />
                    </div>
                  </div>



                  <div className="border-t border-[#C0E6FF]/20 pt-4">
                    <h3 className="text-lg font-medium mb-2 text-white">Notification Categories</h3>
                    <p className="text-sm text-[#C0E6FF] mb-4">
                      Choose which types of browser notifications you want to receive while using AIONET.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="platform-notifications" className="text-white">Platform Updates</Label>
                          <p className="text-sm text-[#C0E6FF]">
                            Notifications about platform updates, maintenance, and important announcements.
                          </p>
                        </div>
                      <Switch
                        id="platform-notifications"
                        checked={notifications?.platform_enabled ?? true}
                        onCheckedChange={(checked) => updateNotificationSettings({ platform_enabled: checked })}
                      />
                    </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="trade-notifications" className="text-white">Trading & Bots</Label>
                          <p className="text-sm text-[#C0E6FF]">
                            Notifications about bot status changes, trade executions, and trading alerts.
                          </p>
                        </div>
                      <Switch
                        id="trade-notifications"
                        checked={notifications?.trade_enabled ?? true}
                        onCheckedChange={(checked) => updateNotificationSettings({ trade_enabled: checked })}
                      />
                    </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="affiliate-notifications" className="text-white">Affiliate & Rewards</Label>
                          <p className="text-sm text-[#C0E6FF]">
                            Notifications about affiliate commissions, subscription renewals, and reward updates.
                          </p>
                        </div>
                        <Switch
                          id="affiliate-notifications"
                          checked={notifications?.system_enabled ?? true}
                          onCheckedChange={(checked) => updateNotificationSettings({ system_enabled: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Dashboard Link */}
          {isAdmin && (
            <div className="enhanced-card">
              <div className="enhanced-card-content p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#4da2ff]/20 p-3 rounded-full">
                    <Shield className="w-6 h-6 text-[#4da2ff]" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold">Admin Functions</h3>
                    <p className="text-gray-400 text-sm">Access admin dashboard for platform management</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link href="/admin-dashboard">
                    <Button className="bg-[#4da2ff] hover:bg-[#4da2ff]/80 text-white">
                      <Settings className="w-4 h-4 mr-2" />
                      Open Admin Dashboard
                    </Button>
                  </Link>
                  <Link href="/admin-reports">
                    <Button variant="outline" className="border-[#C0E6FF]/30 text-white hover:bg-[#C0E6FF]/10">
                      <Flag className="w-4 h-4 mr-2" />
                      View Reports
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
    </>
  )
}
