"use client"

// Lightweight imperative toast that reuses the existing `.toast` design tokens.
// Append-only container, auto-dismiss. Safe to call from any client component.

type ToastType = "success" | "error" | "info"

function container(): HTMLDivElement {
  let el = document.getElementById("lumora-toast-root") as HTMLDivElement | null
  if (!el) {
    el = document.createElement("div")
    el.id = "lumora-toast-root"
    el.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483646;"
    document.body.appendChild(el)
  }
  return el
}

export function toast(message: string, type: ToastType = "success", duration = 3200) {
  if (typeof document === "undefined") return
  const root = container()
  const node = document.createElement("div")
  node.className = `toast toast--${type}`
  node.textContent = message
  node.style.pointerEvents = "auto"
  node.style.margin = "0.5rem 0 0 auto"
  root.appendChild(node)
  window.setTimeout(() => {
    node.style.transition = "opacity 0.3s ease, transform 0.3s ease"
    node.style.opacity = "0"
    node.style.transform = "translateY(12px)"
    window.setTimeout(() => node.remove(), 320)
  }, duration)
}
