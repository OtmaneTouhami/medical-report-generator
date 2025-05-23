"use client"

import * as React from "react"
import {
    Heart,
    SquareTerminal,
    ChevronRight
} from "lucide-react"
import { useRouter } from "next/navigation"

import { useChat } from "@/contexts/chat-context"
import { NavChatHistory } from "@/components/nav-chat-history"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenuAction,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import Image from "next/image"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { createNewChat } = useChat()
    const router = useRouter()

    const handlePlayground = (e: React.MouseEvent) => {
        e.preventDefault()
        console.log("Playground button clicked");
        
        // Navigate to the home page
        router.push("/");
    }

    const handleNewReport = (e: React.MouseEvent) => {
        e.preventDefault()
        console.log("New Report button clicked");
        
        // Create a new chat or reuse an empty one, then navigate to home page
        createNewChat();
        
        // Navigate to the chat page
        router.push("/");
    }
    
    const handleViewReports = (e: React.MouseEvent) => {
        e.preventDefault()
        router.push("/reports")
    }

    return (
        <Sidebar
            className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
            {...props}
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="#">
                                <div
                                    className="bg-white flex aspect-square size-8 items-center justify-center rounded-lg shadow-sm">
                                    <Image
                                        src="/medical-report-logo.svg"
                                        alt="Medical Report Logo"
                                        width={20}
                                        height={20}
                                    />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">MedReport AI</span>
                                    <span className="truncate text-xs">For Healthcare Professionals</span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {/* Platform Navigation */}
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarMenu>
                        <Collapsible defaultOpen={true} asChild>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Playground" onClick={handlePlayground}>
                                    <a href="#">
                                        <SquareTerminal className="h-4 w-4" />
                                        <span>Playground</span>
                                    </a>
                                </SidebarMenuButton>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                                        <ChevronRight className="h-4 w-4" />
                                        <span className="sr-only">Toggle</span>
                                    </SidebarMenuAction>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild onClick={handleNewReport}>
                                                <a href="#">
                                                    <span>New Report</span>
                                                </a>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild onClick={handleViewReports}>
                                                <a href="#">
                                                    <span>Reports</span>
                                                </a>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    </SidebarMenu>
                </SidebarGroup>
                <NavChatHistory />
            </SidebarContent>
            <SidebarFooter>
                <div className="mt-auto pt-2 pb-1.5 border-t border-slate-200/50">
                    <div className="flex items-center justify-center gap-1.5">
                        <span className="text-[10px] text-slate-400">Made with</span>
                        <Heart className="h-2.5 w-2.5 text-red-400 fill-red-400 flex-shrink-0" />
                        <span className="text-[10px] text-slate-400">by The Three Wise Clowns</span>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}   
