"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import Link from "next/link"
import { User, Bell, Shield, Palette, Save, Camera, Check, Globe, Clock, Mail, Type, Monitor, Moon, Sun, Loader2, Trash2, KeyRound, FileText, ExternalLink } from "lucide-react"
import { updateProfile, changePassword, updateEmail, deleteAccount } from "@/app/actions/profile"
import { useRouter } from "next/navigation"

type ThemeMode = "dark" | "light" | "system"
type NotifPrefs = Record<string, boolean>

const NOTIF_KEYS = [
  { key: "priceAlerts", label: "Price Alerts", desc: "Get notified when stocks hit your target prices" },
  { key: "aiInsights", label: "AI Insights", desc: "Daily AI-generated market intelligence and portfolio tips" },
  { key: "portfolioUpdates", label: "Portfolio Updates", desc: "Weekly portfolio performance summary" },
  { key: "earningsReports", label: "Earnings Reports", desc: "Notifications for upcoming earnings calls" },
  { key: "marketNews", label: "Market News", desc: "Breaking news and market-moving events" },
]

const TABS = [
  { key: "profile" as const, label: "Profile", icon: User },
  { key: "notifications" as const, label: "Notifications", icon: Bell },
  { key: "appearance" as const, label: "Appearance", icon: Palette },
  { key: "privacy" as const, label: "Privacy", icon: Shield },
  { key: "legal" as const, label: "Legal", icon: FileText },
]

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative h-7 w-11 shrink-0 rounded-full transition-colors duration-300 ${checked ? "bg-primary shadow-sm shadow-primary/30" : "bg-white/15"}`}>
      <motion.div animate={{ x: checked ? 20 : 2 }} transition={{ type: "spring", stiffness: 400, damping: 22 }} className="absolute top-1.5 h-4 w-4 rounded-full bg-white shadow-md" />
    </button>
  )
}

function GlowCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div whileHover={{ y: -2, scale: 1.004 }} transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.6 }} className="group relative transform-gpu">
      <div className="relative glass-card overflow-hidden rounded-3xl">{children}</div>
    </motion.div>
  )
}

function SaveButton({ onSave, busy, label = "Save changes" }: { onSave: () => void; busy: boolean; label?: string }) {
  return (
    <motion.button onClick={onSave} disabled={busy} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      className="glass-btn glass-btn-primary flex items-center gap-2 px-5 py-2.5 text-xs disabled:opacity-60">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
      {label}
    </motion.button>
  )
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />{label}
      </label>
      {children}
    </div>
  )
}

export function ProfileClient({ user }: {
  user: {
    id: string; name: string; email: string; image: string; timezone: string; country: string;
    theme: string; bio: string; notificationPrefs: NotifPrefs; createdAt: string
  }
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "appearance" | "privacy" | "legal">("profile")
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(user.name)
  const [image, setImage] = useState(user.image)
  const [timezone, setTimezone] = useState(user.timezone)
  const [country, setCountry] = useState(user.country)
  const [bio, setBio] = useState(user.bio)
  const [notif, setNotif] = useState<NotifPrefs>(user.notificationPrefs)
  const [theme, setTheme] = useState<ThemeMode>((user.theme as ThemeMode) || "system")

  const [busy, setBusy] = useState(false)

  // privacy
  const [curPw, setCurPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confPw, setConfPw] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [delPw, setDelPw] = useState("")

  function flashSaved() { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  async function saveProfile() {
    setBusy(true); setError(null)
    try {
      await updateProfile({ name, image: image || undefined, timezone, country, bio })
      flashSaved()
    } catch (e: any) { setError(e?.message || "Failed to save") } finally { setBusy(false) }
  }

  async function saveNotif() {
    setBusy(true); setError(null)
    try {
      await updateProfile({ notificationPrefs: notif })
      flashSaved()
    } catch (e: any) { setError(e?.message || "Failed to save") } finally { setBusy(false) }
  }

  async function saveTheme() {
    setBusy(true); setError(null)
    try {
      await updateProfile({ theme })
      flashSaved()
    } catch (e: any) { setError(e?.message || "Failed to save") } finally { setBusy(false) }
  }

  async function handleChangePw() {
    setError(null)
    if (newPw !== confPw) { setError("New passwords do not match"); return }
    if (newPw.length < 8) { setError("New password must be at least 8 characters"); return }
    setBusy(true)
    try {
      await changePassword(curPw, newPw)
      setCurPw(""); setNewPw(""); setConfPw(""); flashSaved()
    } catch (e: any) { setError(e?.message || "Failed to change password") } finally { setBusy(false) }
  }

  async function handleUpdateEmail() {
    setError(null)
    if (!newEmail.trim()) { setError("Enter a new email"); return }
    setBusy(true)
    try {
      await updateEmail(newEmail.trim())
      setNewEmail(""); setError("Verification email sent. Check your inbox.")
    } catch (e: any) { setError(e?.message || "Failed to update email") } finally { setBusy(false) }
  }

  async function handleDelete() {
    setError(null)
    if (!delPw) { setError("Enter your password to confirm deletion"); return }
    if (!confirm("This permanently deletes your account and all data. Continue?")) return
    setBusy(true)
    try {
      await deleteAccount(delPw)
      router.push("/")
    } catch (e: any) { setError(e?.message || "Failed to delete account"); setBusy(false) }
  }

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your profile, preferences, and account settings.</p>
        </div>
        {activeTab !== "privacy" && (
          <SaveButton onSave={activeTab === "profile" ? saveProfile : activeTab === "notifications" ? saveNotif : saveTheme} busy={busy} />
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.06 }} className="mb-6 flex gap-2 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <motion.button key={tab.key} onClick={() => { setActiveTab(tab.key); setError(null) }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm capitalize transition-colors ${isActive ? "bg-primary/10 text-primary font-medium shadow-sm" : "glass-card text-muted-foreground hover:text-foreground"}`}>
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-muted-foreground/60"}`} />{tab.label}
            </motion.button>
          )
        })}
      </motion.div>

      {error && (
        <p className={`mb-4 rounded-xl px-4 py-2.5 text-xs ${error.includes("sent") ? "bg-emerald/10 text-emerald" : "bg-neg/10 text-neg"}`}>{error}</p>
      )}
      {saved && (
        <p className="mb-4 flex items-center gap-1.5 rounded-xl bg-emerald/10 px-4 py-2.5 text-xs text-emerald">
          <Check className="h-3.5 w-3.5" />Saved!
        </p>
      )}

      <AnimatePresence mode="wait">
        {activeTab === "profile" && (
          <motion.div key="profile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
            <GlowCard>
              <div className="space-y-6 p-6">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  <div className="relative shrink-0">
                    <div className="h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-blue via-violet to-emerald p-[2px] shadow-xl shadow-violet/20">
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-background">
                        {image ? <img src={image} alt="" className="h-full w-full object-cover" /> :
                          <span className="font-heading text-2xl font-semibold text-foreground">{(name || user.email || "U").slice(0, 1).toUpperCase()}</span>}
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-foreground p-1.5 text-background">
                      <Camera className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-heading text-lg font-medium">{name || "Unnamed"}</h2>
                    <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" /><span className="truncate">{user.email}</span></div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground/50"><Clock className="h-3 w-3" /><span>Member since {new Date(user.createdAt).toLocaleDateString()}</span></div>
                  </div>
                </div>
                <div className="h-px bg-gradient-to-r from-border/40 via-border/20 to-transparent" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full Name" icon={User}><input value={name} onChange={(e) => setName(e.target.value)} className="glass-input w-full" /></Field>
                  <Field label="Avatar URL" icon={Camera}><input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" className="glass-input w-full" /></Field>
                  <Field label="Timezone" icon={Clock}><input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="America/New_York" className="glass-input w-full" /></Field>
                  <Field label="Country" icon={Globe}><input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="US" className="glass-input w-full" /></Field>
                </div>
                <Field label="Bio" icon={User}>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell us about yourself…" className="glass-input w-full resize-none" />
                </Field>
              </div>
            </GlowCard>
          </motion.div>
        )}

        {activeTab === "notifications" && (
          <motion.div key="notifications" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
            <GlowCard>
              <div className="space-y-1 p-6">
                {NOTIF_KEYS.map((item, i) => (
                  <motion.div key={item.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between rounded-xl px-4 py-3.5 transition-colors hover:bg-white/[0.02]">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground/70">{item.desc}</p>
                    </div>
                    <ToggleSwitch checked={!!notif[item.key]} onChange={(v) => setNotif((p) => ({ ...p, [item.key]: v }))} />
                  </motion.div>
                ))}
              </div>
            </GlowCard>
          </motion.div>
        )}

        {activeTab === "appearance" && (
          <motion.div key="appearance" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
            <GlowCard>
              <div className="space-y-6 p-6">
                <div>
                  <p className="mb-3 flex items-center gap-1.5 text-sm font-medium"><Monitor className="h-4 w-4 text-muted-foreground" />Theme</p>
                  <div className="flex gap-3">
                    {([{ mode: "dark" as ThemeMode, icon: Moon, label: "Dark", desc: "Easy on the eyes" },
                      { mode: "light" as ThemeMode, icon: Sun, label: "Light", desc: "Classic bright" },
                      { mode: "system" as ThemeMode, icon: Monitor, label: "System", desc: "Match device" }]).map((t) => {
                      const Icon = t.icon
                      const active = theme === t.mode
                      return (
                        <motion.button key={t.mode} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setTheme(t.mode)}
                          className={`flex flex-1 items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm transition-colors ${active ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border text-muted-foreground hover:border-border/60 hover:text-foreground"}`}>
                          <div className={`rounded-xl p-2 ${active ? "bg-primary/10" : "bg-white/5"}`}><Icon className="h-4 w-4" /></div>
                          <div className="text-left">
                            <p className="text-sm font-medium">{t.label}</p>
                            <p className="text-xs text-muted-foreground/60">{t.desc}</p>
                          </div>
                          {active && <Check className="ml-auto h-4 w-4 text-primary" />}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        )}

        {activeTab === "privacy" && (
          <motion.div key="privacy" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="space-y-4">
            <GlowCard>
              <div className="space-y-4 p-6">
                <p className="flex items-center gap-1.5 text-sm font-medium"><KeyRound className="h-4 w-4 text-muted-foreground" />Change password</p>
                <Field label="Current password" icon={KeyRound}><input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} className="glass-input w-full" /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="New password" icon={KeyRound}><input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="glass-input w-full" /></Field>
                  <Field label="Confirm new password" icon={KeyRound}><input type="password" value={confPw} onChange={(e) => setConfPw(e.target.value)} className="glass-input w-full" /></Field>
                </div>
                <button onClick={handleChangePw} disabled={busy} className="glass-btn glass-btn-primary px-4 py-2.5 text-xs disabled:opacity-60">Update password</button>
              </div>
            </GlowCard>

            <GlowCard>
              <div className="space-y-4 p-6">
                <p className="flex items-center gap-1.5 text-sm font-medium"><Mail className="h-4 w-4 text-muted-foreground" />Change email</p>
                <Field label="New email" icon={Mail}><input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder={user.email} className="glass-input w-full" /></Field>
                <button onClick={handleUpdateEmail} disabled={busy} className="glass-btn glass-btn-primary px-4 py-2.5 text-xs disabled:opacity-60">Send verification</button>
              </div>
            </GlowCard>

            <GlowCard>
              <div className="space-y-4 p-6">
                <p className="flex items-center gap-1.5 text-sm font-medium text-neg"><Trash2 className="h-4 w-4" />Delete account</p>
                <p className="text-xs text-muted-foreground">Permanently remove your account and all associated data. This cannot be undone.</p>
                <Field label="Confirm password" icon={KeyRound}><input type="password" value={delPw} onChange={(e) => setDelPw(e.target.value)} className="glass-input w-full" /></Field>
                <button onClick={handleDelete} disabled={busy} className="glass-btn flex items-center gap-2 bg-neg/15 px-4 py-2.5 text-xs text-neg hover:bg-neg/25 disabled:opacity-60">
                  <Trash2 className="h-3.5 w-3.5" />Delete account
                </button>
              </div>
            </GlowCard>
          </motion.div>
        )}

        {activeTab === "legal" && (
          <motion.div key="legal" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
            <GlowCard>
              <div className="space-y-4 p-6">
                <p className="flex items-center gap-1.5 text-sm font-medium"><FileText className="h-4 w-4 text-muted-foreground" />Legal</p>
                <p className="text-xs text-muted-foreground">
                  Review the legal agreements that govern your use of Lumora.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/terms"
                    target="_blank"
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.06]"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">Terms &amp; Conditions</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">Acceptable use, disclaimers, and legal agreements</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground/50" />
                  </Link>
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.06]"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">Privacy Policy</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">How we collect, use, and protect your data</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground/50" />
                  </Link>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
