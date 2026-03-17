"use client"

import { useSidebarLayout } from "@/hooks/use-sidebar-layout"
import { AppSidebarRail } from "@/components/app-sidebar-rail"
import { AppSidebarHorizontal } from "@/components/app-sidebar-horizontal"

export function SidebarSwitcher() {
  const { layout } = useSidebarLayout()
  if (layout === "horizontal") return <AppSidebarHorizontal />
  return <AppSidebarRail />
}
