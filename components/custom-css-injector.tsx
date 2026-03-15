"use client"

import * as React from "react"

const STORAGE_KEY = "openvlt:custom-css"

export function getCustomCss(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(STORAGE_KEY) || ""
}

export function setCustomCss(css: string) {
  localStorage.setItem(STORAGE_KEY, css)
  window.dispatchEvent(new Event("openvlt:custom-css-change"))
}

export function CustomCssInjector() {
  const [css, setCss] = React.useState("")

  React.useEffect(() => {
    setCss(getCustomCss())

    const handler = () => setCss(getCustomCss())
    window.addEventListener("openvlt:custom-css-change", handler)
    return () =>
      window.removeEventListener("openvlt:custom-css-change", handler)
  }, [])

  if (!css) return null

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
