"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { User, Bell, Shield, Palette, Save, Camera } from "lucide-react"

export function ProfileClient() {
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "appearance" | "privacy">("profile")
  const [saved, setSaved] = useState(false)
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, preferences, and account settings.</p>
      </motion.div>

      <div className="mb-6 flex gap-2 flex-wrap">
        {(["profile", "notifications", "appearance", "privacy"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm capitalize transition-colors ${activeTab === tab ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab === "profile" && <User className="h-3.5 w-3.5" />}
            {tab === "notifications" && <Bell className="h-3.5 w-3.5" />}
            {tab === "appearance" && <Palette className="h-3.5 w-3.5" />}
            {tab === "privacy" && <Shield className="h-3.5 w-3.5" />}
            {tab}
          </button>
        ))}
        <button onClick={handleSave} className="premium-btn premium-btn-primary ml-auto px-4 py-2 text-xs">
          <Save className="h-3.5 w-3.5" />{saved ? "Saved!" : "Save changes"}
        </button>
      </div>

      {activeTab === "profile" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-violet flex items-center justify-center font-heading text-2xl font-semibold text-white">JD</div>
              <button className="absolute -bottom-1 -right-1 rounded-full bg-foreground p-1.5 text-background"><Camera className="h-3.5 w-3.5" /></button>
            </div>
            <div><h2 className="font-heading text-lg font-medium">John Doe</h2><p className="text-sm text-muted-foreground">john@example.com</p><p className="text-xs text-muted-foreground mt-1">Member since July 2026</p></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[{ label: "Full Name", value: "John Doe" }, { label: "Email", value: "john@example.com" }, { label: "Language", value: "English" }, { label: "Timezone", value: "America/New_York" }].map((f) => (
              <div key={f.label}>
                <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{f.label}</label>
                <input defaultValue={f.value} className="premium-input mt-1.5" />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === "notifications" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-6 space-y-4">
          {[
            { label: "Price Alerts", desc: "Get notified when stocks hit your target prices", enabled: true },
            { label: "AI Insights", desc: "Daily AI-generated market intelligence and portfolio tips", enabled: true },
            { label: "Portfolio Updates", desc: "Weekly portfolio performance summary", enabled: false },
            { label: "Earnings Reports", desc: "Notifications for upcoming earnings calls", enabled: true },
            { label: "Market News", desc: "Breaking news and market-moving events", enabled: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3">
              <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" defaultChecked={item.enabled} className="peer sr-only" />
                <div className="h-5 w-9 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-foreground after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
              </label>
            </div>
          ))}
        </motion.div>
      )}

      {activeTab === "appearance" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-6 space-y-6">
          <div><p className="text-sm font-medium mb-3">Theme</p>
            <div className="flex gap-3">
              {[{ icon: MoonIcon, label: "Dark", active: true }, { icon: SunIcon, label: "Light", active: false }].map((t) => (
                <button key={t.label} className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${t.active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  <t.icon className="h-4 w-4" />{t.label}
                </button>
              ))}
            </div>
          </div>
          <div><p className="text-sm font-medium mb-2">Font Size</p>
            <select className="premium-input"><option>Small</option><option selected>Medium</option><option>Large</option></select>
          </div>
        </motion.div>
      )}

      {activeTab === "privacy" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-6 space-y-4">
          {[
            { label: "Show portfolio publicly", desc: "Allow others to see your portfolio performance" },
            { label: "Share analytics data", desc: "Help us improve by sharing anonymous usage data" },
            { label: "Email notifications", desc: "Receive marketing and product update emails" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3">
              <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked={false} />
                <div className="h-5 w-9 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-foreground after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
              </label>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

function MoonIcon(p: { className?: string }) { return <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg> }
function SunIcon(p: { className?: string }) { return <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg> }
