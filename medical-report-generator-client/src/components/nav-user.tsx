"use client"

import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavUser() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center px-3 py-2">
          <div className="text-sm font-medium">MedReport AI</div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
