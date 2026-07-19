"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import Link from "next/link"
import { User, Bell, Shield, Palette, Save, Camera, Check, Globe, Clock, Mail, Monitor, Moon, Sun, Loader2, Trash2, KeyRound, FileText, ExternalLink, Upload, X, Search, ChevronDown, AlertTriangle, BellOff } from "lucide-react"
import { updateProfile, changePassword, updateEmail, deleteAccount } from "@/app/actions/profile"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import { authClient } from "@/lib/auth-client"
import { toast } from "@/lib/toast"
import { ISO_COUNTRIES, FALLBACK_TIMEZONES } from "@/lib/regions"

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

// Map a detected region fragment (including deprecated / ambiguous ones) to a
// 2-letter ISO country code we actually store.
const COUNTRY_ALIASES: Record<string, string> = {
  IN: "IN", INDIA: "IN", KOLKATA: "IN", CALCUTTA: "IN", BENGALURU: "IN", MUMBAI: "IN", DELHI: "IN",
  US: "US", USA: "US", "UNITED STATES": "US",
  GB: "GB", UK: "GB", "UNITED KINGDOM": "GB", ENGLAND: "GB", LONDON: "GB",
  CA: "CA", CANADA: "CA", TORONTO: "CA",
  AU: "AU", AUSTRALIA: "AU", SYDNEY: "AU",
  DE: "DE", GERMANY: "DE", BERLIN: "DE",
  FR: "FR", FRANCE: "FR", PARIS: "FR",
  JP: "JP", JAPAN: "JP", TOKYO: "JP",
  SG: "SG", SINGAPORE: "SG",
  AE: "AE", "UNITED ARAB EMIRATES": "AE", DUBAI: "AE",
}

function normalizeCountry(raw: string): string {
  if (!raw) return ""
  const key = raw.trim().toUpperCase()
  if (COUNTRY_ALIASES[key]) return COUNTRY_ALIASES[key]
  if (/^[A-Z]{2}$/.test(key)) return key
  return ""
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative h-7 w-11 shrink-0 rounded-full transition-colors duration-300 ${checked ? "bg-gold" : "bg-foreground/15"}`}>
      <motion.div animate={{ x: checked ? 20 : 2 }} transition={{ type: "spring", stiffness: 400, damping: 22 }} className="absolute top-1.5 h-4 w-4 rounded-full bg-background shadow-md" />
    </button>
  )
}

function SaveButton({ onSave, busy, disabled, label = "Save changes" }: { onSave: () => void; busy: boolean; disabled?: boolean; label?: string }) {
  const isDisabled = disabled || busy
  return (
    <motion.button onClick={onSave} disabled={isDisabled} whileHover={{ scale: isDisabled ? 1 : 1.03 }} whileTap={{ scale: isDisabled ? 1 : 0.97 }}
      className="lm-btn lm-btn--gold flex items-center gap-2 px-5 py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-40">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
      {busy ? "Saving…" : label}
    </motion.button>
  )
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="dm-meta mb-1.5 flex items-center gap-1.5">
        <Icon className="h-3 w-3" />{label}
      </label>
      {children}
    </div>
  )
}

function SearchSelect({
  value,
  onChange,
  options,
  getLabel,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; search?: string }[]
  getLabel: (v: string) => string
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return options
    return options.filter((o) => o.label.toLowerCase().includes(query) || o.value.toLowerCase().includes(query) || (o.search?.toLowerCase().includes(query) ?? false))
  }, [options, q])

  const selectedLabel = value ? getLabel(value) : ""

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="glass-input flex w-full items-center justify-between text-left"
      >
        <span className={value ? "" : "text-muted-foreground/60"}>{value ? selectedLabel : placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="glass-dialog absolute z-50 mt-1.5 max-h-60 w-full overflow-hidden rounded-xl shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground/60">No matches</p>
              ) : (
                filtered.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => { onChange(o.value); setOpen(false); setQ("") }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-foreground/[0.04] ${o.value === value ? "text-gold" : "text-foreground"}`}
                  >
                    <span className="truncate">{o.label}</span>
                    {o.value === value && <Check className="h-3.5 w-3.5 shrink-0 text-gold" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AvatarUpload({ image, onChange }: { image: string; onChange: (v: string) => void }) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const MAX_BYTES = 4 * 1024 * 1024

  function handleFile(file?: File | null) {
    setError(null)
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG, WEBP, GIF).")
      return
    }
    if (file.size > MAX_BYTES) {
      setError("Image is too large. Please use a file under 4 MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : "")
    reader.onerror = () => setError("Could not read the selected file.")
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <label className="dm-meta mb-1.5 flex items-center gap-1.5">
        <Camera className="h-3 w-3" />Profile photo
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]) }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-5 text-center transition-colors ${dragOver ? "border-gold bg-gold/5" : "border-border hover:border-gold/50"}`}
      >
        {image ? (
          <img src={image} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground/[0.06]">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-gold">Click to upload</span> or drag &amp; drop
        </p>
        <p className="text-[10px] text-muted-foreground/60">PNG, JPG, WEBP or GIF · max 4 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="mt-1.5 text-xs text-neg">{error}</p>}
      {image && (
        <div className="mt-2 flex gap-3">
          <button type="button" onClick={() => inputRef.current?.click()} className="dm-meta text-xs text-gold hover:underline">
            Replace
          </button>
          <button type="button" onClick={() => onChange("")} className="dm-meta flex items-center gap-1 text-xs text-muted-foreground hover:text-neg">
            <X className="h-3 w-3" />Remove
          </button>
        </div>
      )}
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
  const { setTheme: applyTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "appearance" | "privacy" | "legal">("profile")
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(user.name)
  const [image, setImage] = useState(user.image)
  const [timezone, setTimezone] = useState(user.timezone)
  const [country, setCountry] = useState(user.country)
  const [bio, setBio] = useState(user.bio)
  const [notif, setNotif] = useState<NotifPrefs>(user.notificationPrefs)
  const normalizedInitialTheme = (["light", "dark", "system"].includes(user.theme) ? user.theme : "light") as ThemeMode
  const [theme, setTheme] = useState<ThemeMode>(normalizedInitialTheme)

  const [busy, setBusy] = useState(false)

  // Baseline of persisted values, captured once, so we can disable Save Changes
  // until the user actually modifies something.
  const initialRef = useRef({
    name: user.name,
    image: user.image,
    timezone: user.timezone,
    country: user.country,
    bio: user.bio,
    notif: user.notificationPrefs,
    theme: normalizedInitialTheme,
  })

  const [curPw, setCurPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confPw, setConfPw] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [delPw, setDelPw] = useState("")

  // Auto-detect timezone / country on first load when empty (never overwrite existing values).
  useEffect(() => {
    if (!timezone) {
      try {
        let tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""
        if (tz === "Asia/Calcutta") tz = "Asia/Kolkata"
        setTimezone(tz)
      } catch { /* noop */ }
    }
    if (!country) {
      // Prefer the timezone signal — it is the most reliable indicator of the
      // user's actual region (e.g. Asia/Kolkata -> IN) and is not skewed by an
      // OS language set to en-US. Locale region is only a fallback.
      let detected = ""
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""
        if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") detected = "IN"
        else if (tz) {
          const region = tz.split("/")[1]
          if (region) detected = region.replace(/_/g, " ")
        }
      } catch { /* noop */ }
      if (!detected) {
        try {
          const locale = new Intl.Locale((navigator.language || "en-US"))
          detected = locale.region || ""
        } catch { /* noop */ }
      }
      if (!detected) {
        const m = (navigator.language || "").match(/[-_]([A-Za-z]{2})/)
        detected = m ? m[1].toUpperCase() : ""
      }
      const normalized = normalizeCountry(detected)
      if (normalized) setCountry(normalized)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Browser notification permission state.
  const [notifSupport, setNotifSupport] = useState<"unknown" | "granted" | "denied" | "default" | "unsupported">("unknown")
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifSupport("unsupported")
    } else {
      setNotifSupport(Notification.permission as "granted" | "denied" | "default")
    }
  }, [])

  function flashSaved() { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  // Refresh the better-auth client session cache so the header avatar, account
  // dropdown avatar, name, theme, etc. update everywhere without a manual reload.
  async function refreshSessionCache() {
    try {
      // Re-fetch the session from the server to refresh better-auth's client cache.
      await authClient.getSession()
    } catch { /* noop */ }
    try { router.refresh() } catch { /* noop */ }
  }

  async function ensureNotificationPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifSupport("unsupported")
      return false
    }
    if (Notification.permission === "granted") return true
    if (Notification.permission === "denied") {
      setNotifSupport("denied")
      return false
    }
    try {
      const result = await Notification.requestPermission()
      setNotifSupport(result)
      return result === "granted"
    } catch {
      setNotifSupport("denied")
      return false
    }
  }

  async function saveProfile() {
    setBusy(true); setError(null)
    try {
      await updateProfile({ name, image: image || null, timezone, country, bio })
      // Keep better-auth session (avatar/name) in sync and refresh caches.
      await authClient.updateUser({ name: name || undefined, image: image || null }).catch(() => {})
      await refreshSessionCache()
      // Update the dirty baseline so Save disables again until a new change.
      initialRef.current = { ...initialRef.current, name, image, timezone, country, bio }
      toast("Profile saved", "success")
    } catch (e: any) {
      setError(e?.message || "Failed to save")
      toast(e?.message || "Failed to save", "error")
    } finally { setBusy(false) }
  }

  async function saveNotif() {
    setBusy(true); setError(null)
    try {
      await updateProfile({ notificationPrefs: notif })
      await refreshSessionCache()
      initialRef.current = { ...initialRef.current, notif }
      toast("Notification preferences saved", "success")
    } catch (e: any) {
      setError(e?.message || "Failed to save")
      toast(e?.message || "Failed to save", "error")
    } finally { setBusy(false) }
  }

  async function saveTheme() {
    setBusy(true); setError(null)
    try {
      await updateProfile({ theme })
      applyTheme(theme)
      await refreshSessionCache()
      initialRef.current = { ...initialRef.current, theme }
      toast("Theme updated", "success")
    } catch (e: any) {
      setError(e?.message || "Failed to save")
      toast(e?.message || "Failed to save", "error")
    } finally { setBusy(false) }
  }

  async function handleChangePw() {
    setError(null)
    if (newPw !== confPw) { setError("New passwords do not match"); return }
    if (newPw.length < 8) { setError("New password must be at least 8 characters"); return }
    setBusy(true)
    try {
      await changePassword(curPw, newPw)
      setCurPw(""); setNewPw(""); setConfPw(""); toast("Password changed", "success")
    } catch (e: any) { setError(e?.message || "Failed to change password"); toast(e?.message || "Failed to change password", "error") } finally { setBusy(false) }
  }

  async function handleUpdateEmail() {
    setError(null)
    if (!newEmail.trim()) { setError("Enter a new email"); return }
    setBusy(true)
    try {
      await updateEmail(newEmail.trim())
      setNewEmail(""); toast("Verification email sent. Check your inbox.", "info")
    } catch (e: any) { setError(e?.message || "Failed to update email"); toast(e?.message || "Failed to update email", "error") } finally { setBusy(false) }
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

  // Build the timezone list (prefer Intl, fall back to a static IANA subset so
  // it is never empty). Each option carries a searchable string so users can
  // find zones by name, region, offset (e.g. "GMT+5:30") or the legacy
  // "Asia/Calcutta" alias.
  const timezones = useMemo<{ value: string; label: string; search: string }[]>(() => {
    // Always start from the complete IANA list so the dropdown is never missing
    // a zone, then merge in any extra zones the browser exposes via Intl.
    let list: string[] = [...FALLBACK_TIMEZONES]
    try {
      const intl = (Intl as any).supportedValuesOf?.("timeZone") as string[] | undefined
      if (intl && intl.length) {
        const known = new Set(list)
        for (const z of intl) if (!known.has(z)) list.push(z)
      }
    } catch { /* noop */ }

    const offsetFor = (tz: string): string => {
      try {
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: tz, timeZoneName: "shortOffset",
        }).formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value || ""
        return parts
      } catch { return "" }
    }

    // Map a few well-known countries to their IANA zones so users can search by
    // country name (e.g. "India" -> Asia/Kolkata, Asia/Calcutta, Asia/Colombo).
    const COUNTRY_TZ_KEYWORDS: Record<string, string[]> = {
      india: ["Asia/Kolkata", "Asia/Calcutta", "Asia/Colombo"],
      "united states": ["America/"],
      usa: ["America/"],
      uk: ["Europe/London"],
      "united kingdom": ["Europe/London"],
      japan: ["Asia/Tokyo"],
      china: ["Asia/Shanghai", "Asia/Hong_Kong"],
      germany: ["Europe/Berlin"],
      france: ["Europe/Paris"],
      australia: ["Australia/"],
      canada: ["America/Toronto", "America/Vancouver"],
      singapore: ["Asia/Singapore"],
      "united arab emirates": ["Asia/Dubai"],
      uae: ["Asia/Dubai"],
    }

    const seen = new Set<string>()
    const out: { value: string; label: string; search: string }[] = []
    const add = (tz: string, value: string) => {
      if (seen.has(value)) return
      seen.add(value)
      const offset = offsetFor(tz)
      const region = tz.split("/")[0]
      const countryHits = Object.entries(COUNTRY_TZ_KEYWORDS)
        .filter(([, zones]) => zones.some((z) => tz === z || (z.endsWith("/") && tz.startsWith(z))))
        .map(([country]) => country)
      const label = offset ? `${tz} (${offset})` : tz
      const search = [tz, tz.toLowerCase().replace(/_/g, " "), offset, region, ...countryHits].filter(Boolean).join(" ")
      out.push({ value, label, search })
    }

    list.forEach((tz) => add(tz, tz))
    // Legacy alias Asia/Calcutta -> Asia/Kolkata.
    add("Asia/Kolkata", "Asia/Calcutta")

    return out.sort((a, b) => a.value.localeCompare(b.value))
  }, [])

  const countryNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([navigator.language || "en"], { type: "region" })
    } catch { return null }
  }, [])

  const countries = useMemo<{ value: string; label: string }[]>(() => {
    // Always show the complete ISO-3166 list. Intl.DisplayNames is used only for
    // nicer localized display names when available; the full list is the
    // authoritative source so it never depends on the browser's Intl support.
    return ISO_COUNTRIES
      .map((c) => ({ value: c.code, label: countryNames ? countryNames.of(c.code) || c.name : c.name }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [countryNames])

  const tzLabel = (v: string) => (timezones.find((t) => t.value === v)?.label || v || "Select timezone")
  const countryLabel = (v: string) => (countries.find((c) => c.value === v)?.label || v || "Select country")

  // Disable Save Changes unless the active tab actually has unsaved changes.
  const init = initialRef.current
  const dirtyProfile =
    name !== init.name || image !== init.image || timezone !== init.timezone ||
    country !== init.country || bio !== init.bio
  const dirtyNotif = JSON.stringify(notif) !== JSON.stringify(init.notif)
  const dirtyTheme = theme !== init.theme
  const isDirty =
    (activeTab === "profile" && dirtyProfile) ||
    (activeTab === "notifications" && dirtyNotif) ||
    (activeTab === "appearance" && dirtyTheme)

  return (
    <div className="p-6 lg:p-8">
      <hr className="dm-rule dm-rule--gold dm-animate" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="dm-heading dm-animate">Settings</h1>
          <p className="dm-body dm-animate dm-animate--delay-1">Manage your profile, preferences, and account settings.</p>
        </div>
        {activeTab !== "privacy" && (
          <SaveButton onSave={activeTab === "profile" ? saveProfile : activeTab === "notifications" ? saveNotif : saveTheme} busy={busy} disabled={!isDirty} />
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.06 }} className="mb-6 flex gap-2 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <motion.button key={tab.key} onClick={() => { setActiveTab(tab.key); setError(null) }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm capitalize transition-colors ${isActive ? "bg-gold/10 text-gold font-medium" : "glass-card text-muted-foreground hover:text-foreground"}`}>
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-gold" : "text-muted-foreground/60"}`} />{tab.label}
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
            <div className="dm-card dm-card--inset dm-animate dm-animate--delay-1">
              <div className="space-y-6 p-6">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  <div className="relative shrink-0">
                    <div className="h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-gold via-gold/50 to-gold/30 p-[2px] shadow-xl">
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
                    <h2 className="dm-heading">{name || "Unnamed"}</h2>
                    <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" /><span className="truncate">{user.email}</span></div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground/50"><Clock className="h-3 w-3" /><span>Member since {new Date(user.createdAt).toLocaleDateString()}</span></div>
                  </div>
                </div>
                <hr className="dm-rule" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full Name" icon={User}><input value={name} onChange={(e) => setName(e.target.value)} className="glass-input w-full" /></Field>
                  <div className="sm:col-span-2">
                    <AvatarUpload image={image} onChange={setImage} />
                  </div>
                  <Field label="Timezone" icon={Clock}>
                    {timezones.length ? (
                      <SearchSelect value={timezone} onChange={setTimezone} options={timezones} getLabel={tzLabel} placeholder="Select timezone" />
                    ) : (
                      <input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="America/New_York" className="glass-input w-full" />
                    )}
                  </Field>
                  <Field label="Country" icon={Globe}>
                    {countries.length ? (
                      <SearchSelect value={country} onChange={setCountry} options={countries} getLabel={countryLabel} placeholder="Select country" />
                    ) : (
                      <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="US" className="glass-input w-full" />
                    )}
                  </Field>
                </div>
                <Field label="Bio" icon={User}>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell us about yourself…" className="glass-input w-full resize-none" />
                </Field>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "notifications" && (
          <motion.div key="notifications" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
            <div className="dm-card dm-card--inset dm-animate dm-animate--delay-1">
              <div className="space-y-1 p-6">
                {notifSupport === "unsupported" && (
                  <p className="mb-3 flex items-center gap-2 rounded-xl bg-neg/10 px-4 py-2.5 text-xs text-neg">
                    <BellOff className="h-3.5 w-3.5 shrink-0" />
                    Browser notifications aren&apos;t supported in this browser. You can still manage your in-app preferences below.
                  </p>
                )}
                {notifSupport === "denied" && (
                  <p className="mb-3 flex items-center gap-2 rounded-xl bg-neg/10 px-4 py-2.5 text-xs text-neg">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Notifications are blocked. Enable them in your browser site settings to receive browser alerts.
                  </p>
                )}
                {NOTIF_KEYS.map((item, i) => (
                  <motion.div key={item.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between rounded-xl px-4 py-3.5 transition-colors hover:bg-foreground/[0.02]">
                    <div>
                      <p className="dm-body font-medium">{item.label}</p>
                      <p className="dm-meta mt-0.5">{item.desc}</p>
                    </div>
                    <ToggleSwitch
                      checked={!!notif[item.key]}
                      onChange={async (v) => {
                        if (v) {
                          const ok = await ensureNotificationPermission()
                          if (!ok && notifSupport !== "granted") {
                            setError(notifSupport === "denied" ? "Notifications are blocked in your browser settings." : "Could not enable browser notifications.")
                          }
                        }
                        setNotif((p) => ({ ...p, [item.key]: v }))
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "appearance" && (
          <motion.div key="appearance" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
            <div className="dm-card dm-card--inset dm-animate dm-animate--delay-1">
              <div className="space-y-6 p-6">
                <div>
                  <p className="dm-body mb-3 flex items-center gap-1.5 font-medium"><Monitor className="h-4 w-4 text-muted-foreground" />Theme</p>
                  <div className="flex gap-3">
                    {([{ mode: "dark" as ThemeMode, icon: Moon, label: "Dark", desc: "Easy on the eyes" },
                      { mode: "light" as ThemeMode, icon: Sun, label: "Light", desc: "Classic bright" },
                      { mode: "system" as ThemeMode, icon: Monitor, label: "System", desc: "Match device" }]).map((t) => {
                      const Icon = t.icon
                      const active = theme === t.mode
                      return (
                        <motion.button key={t.mode} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setTheme(t.mode); applyTheme(t.mode) }}
                          className={`flex flex-1 items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm transition-colors ${active ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-border/60 hover:text-foreground"}`}>
                          <div className={`rounded-xl p-2 ${active ? "bg-gold/10" : "bg-foreground/5"}`}><Icon className="h-4 w-4" /></div>
                          <div className="text-left">
                            <p className="text-sm font-medium">{t.label}</p>
                            <p className="dm-meta">{t.desc}</p>
                          </div>
                          {active && <Check className="ml-auto h-4 w-4 text-gold" />}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "privacy" && (
          <motion.div key="privacy" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="space-y-4">
            <div className="dm-card dm-card--inset dm-animate dm-animate--delay-1">
              <div className="space-y-4 p-6">
                <p className="dm-body flex items-center gap-1.5 font-medium"><KeyRound className="h-4 w-4 text-muted-foreground" />Change password</p>
                <Field label="Current password" icon={KeyRound}><input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} className="glass-input w-full" /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="New password" icon={KeyRound}><input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="glass-input w-full" /></Field>
                  <Field label="Confirm new password" icon={KeyRound}><input type="password" value={confPw} onChange={(e) => setConfPw(e.target.value)} className="glass-input w-full" /></Field>
                </div>
                <button onClick={handleChangePw} disabled={busy} className="lm-btn lm-btn--gold px-4 py-2.5 text-xs disabled:opacity-60">Update password</button>
              </div>
            </div>

            <div className="dm-card dm-card--inset dm-animate dm-animate--delay-2">
              <div className="space-y-4 p-6">
                <p className="dm-body flex items-center gap-1.5 font-medium"><Mail className="h-4 w-4 text-muted-foreground" />Change email</p>
                <Field label="New email" icon={Mail}><input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder={user.email} className="glass-input w-full" /></Field>
                <button onClick={handleUpdateEmail} disabled={busy} className="lm-btn lm-btn--gold px-4 py-2.5 text-xs disabled:opacity-60">Send verification</button>
              </div>
            </div>

            <div className="dm-card dm-card--inset dm-animate dm-animate--delay-3">
              <div className="space-y-4 p-6">
                <p className="dm-body flex items-center gap-1.5 font-medium text-neg"><Trash2 className="h-4 w-4" />Delete account</p>
                <p className="dm-body text-muted-foreground">Permanently remove your account and all associated data. This cannot be undone.</p>
                <Field label="Confirm password" icon={KeyRound}><input type="password" value={delPw} onChange={(e) => setDelPw(e.target.value)} className="glass-input w-full" /></Field>
                <button onClick={handleDelete} disabled={busy} className="lm-btn flex items-center gap-2 bg-neg/15 px-4 py-2.5 text-xs text-neg hover:bg-neg/25 disabled:opacity-60">
                  <Trash2 className="h-3.5 w-3.5" />Delete account
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "legal" && (
          <motion.div key="legal" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
            <div className="dm-card dm-card--inset dm-animate dm-animate--delay-1">
              <div className="space-y-4 p-6">
                <p className="dm-body flex items-center gap-1.5 font-medium"><FileText className="h-4 w-4 text-muted-foreground" />Legal</p>
                <p className="dm-body text-muted-foreground">
                  Review the legal agreements that govern your use of Lumora.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/terms"
                    target="_blank"
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-foreground/[0.06]"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">Terms &amp; Conditions</p>
                      <p className="dm-meta mt-0.5">Acceptable use, disclaimers, and legal agreements</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground/50" />
                  </Link>
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-foreground/[0.06]"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">Privacy Policy</p>
                      <p className="dm-meta mt-0.5">How we collect, use, and protect your data</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground/50" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
