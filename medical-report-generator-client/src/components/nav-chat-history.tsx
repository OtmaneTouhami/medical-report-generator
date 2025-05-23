"use client"

import { useState } from "react"
import { MessageSquare, PlusCircle, Trash2, Edit, MoreHorizontal } from "lucide-react"
import { format } from "date-fns"

import { useChat } from "@/contexts/chat-context"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

export function NavChatHistory() {
  const { 
    chatSessions, 
    currentChatId, 
    createNewChat, 
    switchChat, 
    deleteChat, 
    deleteAllChats,
    updateChatTitle
  } = useChat()
  
  const router = useRouter()
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false)
  const [isEditTitleDialogOpen, setIsEditTitleDialogOpen] = useState(false)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")

  const handleAddChat = () => {
    console.log("Add Chat button clicked");
    
    // Create a new chat or reuse an existing empty chat
    createNewChat();
    
    // Navigate to the chat page to ensure the UI shows the chat
    router.push("/");
  }

  const handleEditTitle = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId)
    setNewTitle(currentTitle)
    setIsEditTitleDialogOpen(true)
  }

  const handleSaveTitle = () => {
    if (editingChatId && newTitle.trim()) {
      updateChatTitle(editingChatId, newTitle.trim())
      setIsEditTitleDialogOpen(false)
    }
  }

  const handleSwitchChat = (chatId: string) => {
    console.log("Switching to chat:", chatId);
    
    // First switch to the chat in the context
    switchChat(chatId);
    
    // Then navigate to the home page to show the chat interface
    router.push("/");
  }

  if (chatSessions.length === 0) {
    return null
  }

  // Sort sessions by updatedAt (most recent first)
  const sortedSessions = [...chatSessions].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  )

  return (
    <>
      <SidebarGroup>
        <div className="flex items-center justify-between px-3 py-2">
          <SidebarGroupLabel>Chat History</SidebarGroupLabel>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={handleAddChat}
              title="New Chat"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
            {chatSessions.length > 1 && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" 
                onClick={() => setIsDeleteAllDialogOpen(true)}
                title="Delete All Chats"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <SidebarMenu>
          {sortedSessions.map((session) => (
            <SidebarMenuItem key={session.id} className={currentChatId === session.id ? "bg-accent" : ""}>
              <SidebarMenuButton 
                asChild 
                tooltip={session.title}
                onClick={() => handleSwitchChat(session.id)}
              >
                <div className="flex items-center w-full cursor-pointer">
                  <MessageSquare className="h-4 w-4" />
                  <span className="flex-1 truncate">{session.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground mr-2">
                    {format(session.updatedAt, "MMM d")}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        handleEditTitle(session.id, session.title)
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600" 
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteChat(session.id)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      {/* Delete All Chats Dialog */}
      <Dialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete All Chats</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all chats? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteAllDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                deleteAllChats()
                setIsDeleteAllDialogOpen(false)
              }}
            >
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Title Dialog */}
      <Dialog open={isEditTitleDialogOpen} onOpenChange={setIsEditTitleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription>
              Enter a new name for this chat.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Chat name"
            className="mt-2"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveTitle()
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTitleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTitle}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}