import { redirect } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/app-sidebar"
import { CommandPalette } from "@/components/command-palette"
import { TabProvider } from "@/lib/stores/tab-store"
import { TabContainer } from "@/components/tab-container"
import { getSession } from "@/lib/auth/middleware"
import { CustomCssInjector } from "@/components/custom-css-injector"
import { ConflictResolver } from "@/components/conflict-resolver"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <TooltipProvider>
      <TabProvider>
        <SidebarProvider>
          <AppSidebar />
          {/* min-w-0 + overflow-hidden: prevents horizontal overflow when
              sidebar is open + split view is active. Without this, the two
              split panes size for full viewport width and overflow past the
              sidebar. Do not remove these classes. */}
          <SidebarInset className="min-w-0 overflow-hidden">
            <TabContainer />
            {/* children renders TabActivator (invisible) or the notes list page */}
            <div className="hidden">{children}</div>
          </SidebarInset>
          <CommandPalette />
          <CustomCssInjector />
          <ConflictResolver />
        </SidebarProvider>
      </TabProvider>
    </TooltipProvider>
  )
}
