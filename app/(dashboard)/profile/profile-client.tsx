"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { User, Bell, Shield, Palette, Save, Camera, Sun, Moon, Check, Globe, Clock, Mail, Type, Monitor, ChevronRight } from "lucide-react"

function ToggleSwitch({ defaultChecked = false, onChange }: { defaultChecked?: boolean; onChange?: (v: boolean) => void }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <button onClick={() => { setOn(!on); onChange?.(!on) }}
      className={`relative h-7 w-11 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-primary shadow-sm shadow-primary/30" : "bg-white/15"}`}
    >
      <motion.div
        animate={{ x: on ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="absolute top-1.5 h-4 w-4 rounded-full bg-white shadow-md"
      />
    </button>
  )
}

function GlowCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.004 }}
      transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.6 }}
      className="group relative transform-gpu"
    >
      <div className="relative glass-card overflow-hidden rounded-3xl">{children}</div>
    </motion.div>
  )
}

const TABS = [
  { key: "profile" as const, label: "Profile", icon: User },
  { key: "notifications" as const, label: "Notifications", icon: Bell },
  { key: "appearance" as const, label: "Appearance", icon: Palette },
  { key: "privacy" as const, label: "Privacy", icon: Shield },
]

export function ProfileClient() {
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "appearance" | "privacy">("profile")
  const [saved, setSaved] = useState(false)
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your profile, preferences, and account settings.</p>
        </div>
        <motion.button onClick={handleSave} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="premium-btn premium-btn-primary flex items-center gap-2 px-5 py-2.5 text-xs"
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.span key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />Saved!
              </motion.span>
            ) : (
              <motion.span key="save" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-1.5">
                <Save className="h-3.5 w-3.5" />Save changes
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.06 }}
        className="mb-6 flex gap-2 overflow-x-auto"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <motion.button key={tab.key} onClick={() => setActiveTab(tab.key)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm capitalize transition-colors ${
                isActive ? "bg-primary/10 text-primary font-medium shadow-sm" : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-muted-foreground/60"}`} />
              {tab.label}
              {isActive && (
                <motion.div layoutId="settings-tab-indicator" className="absolute inset-0 -z-10 rounded-full bg-primary/10" />
              )}
            </motion.button>
          )
        })}
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === "profile" && (
          <motion.div key="profile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
            <GlowCard>
              <div className="p-6 space-y-6">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  <div className="relative shrink-0">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue via-violet to-emerald p-[2px] shadow-xl shadow-violet/20">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-background font-heading text-2xl font-semibold text-foreground">
                        JD
                      </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      className="absolute -bottom-1 -right-1 rounded-full bg-foreground p-1.5 text-background shadow-lg transition-colors hover:bg-foreground/80"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </motion.button>
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-medium">John Doe</h2>
                    <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span>john@example.com</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground/50">
                      <Clock className="h-3 w-3" />
                      <span>Member since July 2026</span>
                    </div>
                  </div>
                </div>
                <div className="h-px bg-gradient-to-r from-border/40 via-border/20 to-transparent" />
                <div className="grid gap-5 sm:grid-cols-2">
                  {[
                    { label: "Full Name", value: "John Doe", icon: User },
                    { label: "Email", value: "john@example.com", icon: Mail },
                    { label: "Language", value: "English", icon: Globe },
                    { label: "Timezone", value: "America/New_York", icon: Clock },
                  ].map((f) => {
                    const Icon = f.icon
                    return (
                      <div key={f.label}>
                        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          <Icon className="h-3 w-3" />
                          {f.label}
                        </label>
                        <input defaultValue={f.value} className="premium-input w-full" />
                      </div>
                    )
                  })}
                </div>
              </div>
            </GlowCard>
          </motion.div>
        )}

        {activeTab === "notifications" && (
          <motion.div key="notifications" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
            <GlowCard>
              <div className="p-6 space-y-1">
                {[
                  { label: "Price Alerts", desc: "Get notified when stocks hit your target prices", enabled: true },
                  { label: "AI Insights", desc: "Daily AI-generated market intelligence and portfolio tips", enabled: true },
                  { label: "Portfolio Updates", desc: "Weekly portfolio performance summary", enabled: false },
                  { label: "Earnings Reports", desc: "Notifications for upcoming earnings calls", enabled: true },
                  { label: "Market News", desc: "Breaking news and market-moving events", enabled: false },
                ].map((item, i) => (
                  <motion.div key={item.label}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between rounded-xl px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">{item.desc}</p>
                    </div>
                    <ToggleSwitch defaultChecked={item.enabled} />
                  </motion.div>
                ))}
              </div>
            </GlowCard>
          </motion.div>
        )}

        {activeTab === "appearance" && (
          <motion.div key="appearance" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
            <GlowCard>
              <div className="p-6 space-y-6">
                <div>
                  <p className="mb-3 flex items-center gap-1.5 text-sm font-medium">
                    <Monitor className="h-4 w-4 text-muted-foreground" />Theme
                  </p>
                  <div className="flex gap-3">
                    {[
                      { icon: Moon, label: "Dark", active: true, desc: "Easy on the eyes" },
                      { icon: Sun, label: "Light", active: false, desc: "Classic bright" },
                    ].map((t) => {
                      const Icon = t.icon
                      return (
                        <motion.button key={t.label} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          className={`flex flex-1 items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm transition-colors ${
                            t.active
                              ? "border-primary bg-primary/10 text-primary shadow-sm"
                              : "border-border text-muted-foreground hover:border-border/60 hover:text-foreground"
                          }`}
                        >
                          <div className={`rounded-xl p-2 ${t.active ? "bg-primary/10" : "bg-white/5"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium">{t.label}</p>
                            <p className="text-xs text-muted-foreground/60">{t.desc}</p>
                          </div>
                          {t.active && <Check className="ml-auto h-4 w-4 text-primary" />}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
                <div className="h-px bg-gradient-to-r from-border/40 via-border/20 to-transparent" />
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                    <Type className="h-4 w-4 text-muted-foreground" />Font Size
                  </p>
                  <select className="premium-input w-full">
                    <option>Small</option>
                    <option selected>Medium</option>
                    <option>Large</option>
                  </select>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        )}

        {activeTab === "privacy" && (
          <motion.div key="privacy" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
            <GlowCard>
              <div className="p-6 space-y-1">
                {[
                  { label: "Show portfolio publicly", desc: "Allow others to see your portfolio performance" },
                  { label: "Share analytics data", desc: "Help us improve by sharing anonymous usage data" },
                  { label: "Email notifications", desc: "Receive marketing and product update emails" },
                ].map((item, i) => (
                  <motion.div key={item.label}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    className="flex items-center justify-between rounded-xl px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">{item.desc}</p>
                    </div>
                    <ToggleSwitch defaultChecked={false} />
                  </motion.div>
                ))}
              </div>
            </GlowCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
