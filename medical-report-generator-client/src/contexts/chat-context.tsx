"use client";

import React, {createContext, useContext, useState, useCallback, useEffect, useRef} from "react";
import {v4 as uuidv4} from "uuid";
import api from "@/api/axios";
import {toast} from "sonner";

export type MessageType = "user" | "assistant";

export interface Message {
    id: string;
    type: MessageType;
    content: string;
    timestamp: Date;
}

export interface ReportApiResponse {
    id: number;
    prompt_text: string;
    generated_report_path: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ChatContextType {
    messages: Message[];
    isLoading: boolean;
    addMessage: (content: string) => Promise<void>;
    clearHistory: () => void;
    reports: ReportApiResponse[];
    fetchReports: () => Promise<void>;
    deleteReport: (reportId: number) => Promise<void>;
    deleteAllReports: () => Promise<void>;
    chatSessions: ChatSession[];
    currentChatId: string | null;
    createNewChat: () => void;
    switchChat: (chatId: string) => void;
    deleteChat: (chatId: string) => void;
    deleteAllChats: () => void;
    updateChatTitle: (chatId: string, title: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Helper function to parse dates in chat sessions from localStorage
const parseDate = (dateString: string): Date => {
    return new Date(dateString);
};

// Helper to serialize chat sessions for localStorage
const serializeChatSessions = (sessions: ChatSession[]): string => {
    return JSON.stringify(sessions, (key, value) => {
        if (key === 'timestamp' || key === 'createdAt' || key === 'updatedAt') {
            return value instanceof Date ? value.toISOString() : value;
        }
        return value;
    });
};

// Helper to deserialize chat sessions from localStorage
const deserializeChatSessions = (data: string): ChatSession[] => {
    return JSON.parse(data, (key, value) => {
        if (key === 'timestamp' || key === 'createdAt' || key === 'updatedAt') {
            return value ? new Date(value) : null;
        }
        return value;
    });
};

export function ChatProvider({children}: { children: React.ReactNode }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [reports, setReports] = useState<ReportApiResponse[]>([]);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    
    // Ref to track if we're in the middle of deleting chats
    const isDeletingRef = useRef(false);
    // Flag to prevent double chat creation
    const pendingNewChatCreation = useRef(false);
    // Ref to track if we need to create a new chat after loading
    const needsInitialChatRef = useRef(false);

    // Load chat sessions from localStorage on initial load
    useEffect(() => {
        const savedSessions = localStorage.getItem('chatSessions');
        const savedCurrentChatId = localStorage.getItem('currentChatId');
        
        if (savedSessions) {
            try {
                const parsedSessions = deserializeChatSessions(savedSessions);
                
                if (parsedSessions.length > 0) {
                    setChatSessions(parsedSessions);
                    
                    // Set current chat if it exists
                    if (savedCurrentChatId && parsedSessions.some(s => s.id === savedCurrentChatId)) {
                        setCurrentChatId(savedCurrentChatId);
                        const currentChat = parsedSessions.find(s => s.id === savedCurrentChatId);
                        if (currentChat) {
                            setMessages(currentChat.messages);
                        }
                    } else {
                        // Default to the most recent chat
                        const mostRecentChat = [...parsedSessions].sort((a, b) => 
                            b.updatedAt.getTime() - a.updatedAt.getTime()
                        )[0];
                        setCurrentChatId(mostRecentChat.id);
                        setMessages(mostRecentChat.messages);
                    }
                } else {
                    // Empty array in localStorage, create a new chat
                    needsInitialChatRef.current = true;
                }
            } catch (error) {
                console.error('Error loading chat sessions from localStorage:', error);
                // If there's an error, create a new chat
                needsInitialChatRef.current = true;
            }
        } else {
            // No saved sessions, create a new chat
            needsInitialChatRef.current = true;
        }
    }, []);

    // Create initial chat if needed (after state is set)
    useEffect(() => {
        if (needsInitialChatRef.current) {
            createNewChatInternal();
            needsInitialChatRef.current = false;
        }
    }, []);

    // Save chat sessions to localStorage whenever they change
    useEffect(() => {
        if (chatSessions.length > 0) {
            localStorage.setItem('chatSessions', serializeChatSessions(chatSessions));
            if (currentChatId) {
                localStorage.setItem('currentChatId', currentChatId);
            }
        } else {
            // Clear localStorage if there are no sessions
            localStorage.removeItem('chatSessions');
            localStorage.removeItem('currentChatId');
        }
    }, [chatSessions, currentChatId]);

    // Check if a chat is empty
    const isChatEmpty = useCallback((chatId: string) => {
        const chat = chatSessions.find(s => s.id === chatId);
        return !chat || chat.messages.length === 0;
    }, [chatSessions]);

    // Find an empty chat if one exists
    const findEmptyChat = useCallback(() => {
        console.log("Looking for empty chats in", chatSessions.length, "sessions");
        const emptyChat = chatSessions.find(chat => chat.messages.length === 0);
        if (emptyChat) {
            console.log("Found empty chat:", emptyChat.id);
        } else {
            console.log("No empty chats found");
        }
        return emptyChat;
    }, [chatSessions]);

    // Internal function to create a new chat
    const createNewChatInternal = useCallback(() => {
        console.log("Creating new chat internal");
        
        // If we're in the process of deleting, don't create a new chat
        if (isDeletingRef.current) {
            console.log("Not creating new chat - deletion in progress");
            return currentChatId;
        }
        
        const newChatId = uuidv4();
        console.log("Generated new chat ID:", newChatId);
        
        const newChat: ChatSession = {
            id: newChatId,
            title: "New Chat",
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Update state synchronously to avoid race conditions
        setChatSessions(prev => {
            // Check if this chat ID already exists to prevent duplicates
            if (prev.some(chat => chat.id === newChatId)) {
                return prev;
            }
            return [...prev, newChat];
        });
        
        setCurrentChatId(newChatId);
        setMessages([]);
        
        return newChatId;
    }, [currentChatId]);

    // Public function to create a new chat or navigate to an existing empty one
    const createNewChat = useCallback(() => {
        console.log("Creating new chat");
        
        // Check if we already have an empty chat we can reuse
        const existingEmptyChat = findEmptyChat();
        
        if (existingEmptyChat) {
            console.log("Reusing empty chat:", existingEmptyChat.id);
            
            // If the current chat is already this empty chat, no need to do anything
            if (currentChatId === existingEmptyChat.id) {
                console.log("Already on this empty chat, no action needed");
                return existingEmptyChat.id;
            }
            
            // Otherwise, switch to the existing empty chat
            setCurrentChatId(existingEmptyChat.id);
            setMessages(existingEmptyChat.messages);
            return existingEmptyChat.id;
        }
        
        // No empty chat found, create a new one
        console.log("No empty chat found, creating new one");
        const newChatId = createNewChatInternal();
        console.log("New chat created with ID:", newChatId);
        
        return newChatId;
    }, [createNewChatInternal, findEmptyChat, currentChatId]);

    // Switch to an existing chat
    const switchChat = useCallback((chatId: string) => {
        const chat = chatSessions.find(s => s.id === chatId);
        if (chat) {
            setCurrentChatId(chatId);
            setMessages(chat.messages);
        }
    }, [chatSessions]);

    // Delete a specific chat
    const deleteChat = useCallback((chatId: string) => {
        // Check if we're already in the process of creating a new chat
        if (pendingNewChatCreation.current) {
            return;
        }
        
        // Set deleting flag to prevent multiple chats being created
        isDeletingRef.current = true;
        
        // Check if this is the only chat and it's empty
        const isOnlyChat = chatSessions.length === 1;
        const isEmpty = isChatEmpty(chatId);
        
        // Set flag for pending new chat creation if we need to create one
        if (currentChatId === chatId && (chatSessions.length === 1)) {
            pendingNewChatCreation.current = true;
        }
        
        setChatSessions(prev => {
            const newSessions = prev.filter(s => s.id !== chatId);
            
            // If we're deleting the current chat, switch to another one
            if (currentChatId === chatId) {
                if (newSessions.length > 0) {
                    const nextChat = newSessions[0];
                    setCurrentChatId(nextChat.id);
                    setMessages(nextChat.messages);
                    // No need to create a new chat
                    isDeletingRef.current = false;
                    pendingNewChatCreation.current = false;
                } else {
                    // If no chats left, clear the current chat
                    setCurrentChatId(null);
                    setMessages([]);
                    
                    // Create a new chat only if this was the only chat in a single operation
                    if (isOnlyChat) {
                        setTimeout(() => {
                            createNewChatInternal();
                            isDeletingRef.current = false;
                            pendingNewChatCreation.current = false;
                        }, 100);
                    }
                }
            } else {
                // If we're not deleting the current chat, reset the flags
                isDeletingRef.current = false;
                pendingNewChatCreation.current = false;
            }
            
            return newSessions;
        });
        
        toast.success("Chat deleted", {
            description: "The chat has been removed from your history."
        });
    }, [currentChatId, chatSessions, isChatEmpty, createNewChatInternal]);

    // Delete all chats
    const deleteAllChats = useCallback(() => {
        // Check if we're already in the process of creating a new chat
        if (pendingNewChatCreation.current) {
            return;
        }
        
        // Set flags to prevent multiple chats being created
        isDeletingRef.current = true;
        pendingNewChatCreation.current = true;
        
        setChatSessions([]);
        setCurrentChatId(null);
        setMessages([]);
        
        // Create a new chat after a short delay
        setTimeout(() => {
            createNewChatInternal();
            isDeletingRef.current = false;
            pendingNewChatCreation.current = false;
        }, 100);
        
        toast.success("All chats deleted", {
            description: "Your chat history has been cleared."
        });
    }, [createNewChatInternal]);

    // Update chat title
    const updateChatTitle = useCallback((chatId: string, title: string) => {
        setChatSessions(prev => 
            prev.map(chat => 
                chat.id === chatId 
                    ? { ...chat, title, updatedAt: new Date() } 
                    : chat
            )
        );
    }, []);

    // Update the current chat session with new messages
    const updateCurrentChat = useCallback((newMessages: Message[]) => {
        // If there's no current chat ID but we're trying to update messages,
        // we might be in a race condition where multiple chat creations are happening
        if (!currentChatId) {
            // Check if we're already creating a chat
            if (pendingNewChatCreation.current) {
                // Wait for the pending chat creation to finish
                setTimeout(() => {
                    // After waiting, if we have a currentChatId, update it
                    if (currentChatId) {
                        updateCurrentChat(newMessages);
                    }
                }, 150);
                return;
            }
            
            // Create a new chat explicitly for these messages
            const newChatId = createNewChatInternal();
            
            // Update the new chat with messages after a short delay to ensure it's created
            setTimeout(() => {
                setChatSessions(prev => {
                    // Find the newly created chat if it exists
                    const chatToUpdate = prev.find(c => c.id === newChatId);
                    
                    if (!chatToUpdate) return prev;
                    
                    // Generate a title from the first user message
                    let title = chatToUpdate.title;
                    if (title === "New Chat" && newMessages.length > 0) {
                        const firstUserMsg = newMessages.find(m => m.type === "user");
                        if (firstUserMsg) {
                            title = firstUserMsg.content.substring(0, 30) + 
                                (firstUserMsg.content.length > 30 ? "..." : "");
                        }
                    }
                    
                    // Return updated session list with only one updated chat
                    return prev.map(chat => {
                        if (chat.id === newChatId) {
                            return {
                                ...chat,
                                messages: newMessages,
                                title,
                                updatedAt: new Date()
                            };
                        }
                        return chat;
                    });
                });
            }, 50);
            
            return;
        }
        
        // Normal flow when we have a current chat ID
        setChatSessions(prev => {
            // Check if the current chat exists in the sessions
            const chatExists = prev.some(chat => chat.id === currentChatId);
            
            if (!chatExists) {
                // If the current chat doesn't exist, don't update
                return prev;
            }
            
            return prev.map(chat => {
                if (chat.id === currentChatId) {
                    // Generate a title from the first user message if title is "New Chat"
                    let title = chat.title;
                    if (title === "New Chat" && newMessages.length > 0) {
                        const firstUserMsg = newMessages.find(m => m.type === "user");
                        if (firstUserMsg) {
                            title = firstUserMsg.content.substring(0, 30) + 
                                (firstUserMsg.content.length > 30 ? "..." : "");
                        }
                    }
                    
                    return {
                        ...chat,
                        messages: newMessages,
                        title,
                        updatedAt: new Date()
                    };
                }
                return chat;
            });
        });
    }, [currentChatId, createNewChatInternal]);

    const addMessage = useCallback(async (content: string) => {
        // If we're in the process of deleting or creating, don't add messages yet
        if (isDeletingRef.current || pendingNewChatCreation.current) {
            // Wait a bit and try again
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // If still deleting or creating, return
            if (isDeletingRef.current || pendingNewChatCreation.current) {
                toast.error("Please wait a moment before sending a message");
                return;
            }
        }
        
        // Check if we need to create a new chat
        if (!currentChatId || !chatSessions.some(chat => chat.id === currentChatId)) {
            // Create a new chat and get its ID
            const newChatId = createNewChatInternal();
            
            // We need to wait a bit to ensure the chat is created before continuing
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Create the message after ensuring we have a valid chat
            const userMessage: Message = {
                id: uuidv4(),
                type: "user",
                content,
                timestamp: new Date(),
            };
            
            const updatedMessages = [userMessage];
            setMessages(updatedMessages);
            
            // Put the message in the new chat
            setChatSessions(prev => {
                return prev.map(chat => {
                    if (chat.id === newChatId) {
                        // Generate a title from the user message
                        const title = content.substring(0, 30) + 
                            (content.length > 30 ? "..." : "");
                        
                        return {
                            ...chat,
                            messages: updatedMessages,
                            title,
                            updatedAt: new Date()
                        };
                    }
                    return chat;
                });
            });
            
            setIsLoading(true);
            
            try {
                const response = await api.post('/generate', null, {
                    params: {prompt_text: content}
                });
                
                if (response.status !== 200) {
                    throw new Error("Failed to generate report");
                }
                
                const data = await response.data;
                console.log("API response data:", data);
                
                // Create a more informative response message
                let assistantContent;
                if (data.generated_report_path) {
                    // Format as a special report message
                    assistantContent = `REPORT_PATH:${data.generated_report_path}:${data.id}`;
                } else {
                    assistantContent = "Report generation failed";
                }
                
                const assistantMessage: Message = {
                    id: uuidv4(),
                    type: "assistant",
                    content: assistantContent,
                    timestamp: new Date(),
                };
                
                const finalMessages = [...updatedMessages, assistantMessage];
                setMessages(finalMessages);
                
                // Update the chat with the assistant's response
                setChatSessions(prev => {
                    return prev.map(chat => {
                        if (chat.id === newChatId) {
                            return {
                                ...chat,
                                messages: finalMessages,
                                updatedAt: new Date()
                            };
                        }
                        return chat;
                    });
                });
                
                // Refresh reports list after generating a new report
                fetchReports();
                
            } catch (error) {
                console.error("Error generating report:", error);
                const errorMessage: Message = {
                    id: uuidv4(),
                    type: "assistant",
                    content:
                        "Sorry, there was an error generating the report. Please try again.",
                    timestamp: new Date(),
                };
                const finalMessages = [...updatedMessages, errorMessage];
                setMessages(finalMessages);
                
                // Update the chat with the error message
                setChatSessions(prev => {
                    return prev.map(chat => {
                        if (chat.id === newChatId) {
                            return {
                                ...chat,
                                messages: finalMessages,
                                updatedAt: new Date()
                            };
                        }
                        return chat;
                    });
                });
            } finally {
                setIsLoading(false);
            }
            
            return;
        }
        
        // Normal flow for existing chats
        const userMessage: Message = {
            id: uuidv4(),
            type: "user",
            content,
            timestamp: new Date(),
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        updateCurrentChat(updatedMessages);
        setIsLoading(true);

        try {
            const response = await api.post('/generate', null, {
                params: {prompt_text: content}
            });

            if (response.status !== 200) {
                throw new Error("Failed to generate report");
            }

            const data = await response.data;
            console.log("API response data:", data);

            // Create a more informative response message
            let assistantContent;
            if (data.generated_report_path) {
                // Format as a special report message
                assistantContent = `REPORT_PATH:${data.generated_report_path}:${data.id}`;
            } else {
                assistantContent = "Report generation failed";
            }

            const assistantMessage: Message = {
                id: uuidv4(),
                type: "assistant",
                content: assistantContent,
                timestamp: new Date(),
            };

            const finalMessages = [...updatedMessages, assistantMessage];
            setMessages(finalMessages);
            updateCurrentChat(finalMessages);
            
            // Refresh reports list after generating a new report
            fetchReports();
            
        } catch (error) {
            console.error("Error generating report:", error);
            const errorMessage: Message = {
                id: uuidv4(),
                type: "assistant",
                content:
                    "Sorry, there was an error generating the report. Please try again.",
                timestamp: new Date(),
            };
            const finalMessages = [...updatedMessages, errorMessage];
            setMessages(finalMessages);
            updateCurrentChat(finalMessages);
        } finally {
            setIsLoading(false);
        }
    }, [messages, currentChatId, chatSessions, updateCurrentChat, createNewChatInternal]);

    const clearHistory = useCallback(() => {
        if (currentChatId) {
            setMessages([]);
            updateCurrentChat([]);
        }
    }, [currentChatId, updateCurrentChat]);

    const fetchReports = async (): Promise<void> => {
        try {
            const response = await api.get('/reports');
            setReports(response.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        }
    };

    const deleteReport = useCallback(async (reportId: number) => {
        try {
            const response = await api.delete(`/reports/${reportId}`);
            if (response.status !== 204) {
                throw new Error("Failed to delete report");
            }
            toast.success("Report deleted successfully", {
                description: "The report has been deleted successfully.",
            });
            setReports((prev) => prev.filter((report) => report.id !== reportId));
        } catch {
            toast.error("Failed to delete report", {
                description: "There was an error deleting the report.",
            });
        }
    }, []);

    const deleteAllReports = useCallback(async () => {
        try {
            // Show loading toast
            const loadingToast = toast.loading("Deleting all reports...");
            
            const response = await api.delete("/reports");
            
            // Clear the loading toast
            toast.dismiss(loadingToast);
            
            if (response.status === 200 || response.status === 204) {
                setReports([]);
                toast.success("All reports deleted successfully", {
                    description: "Your reports have been deleted.",
                });
            } else {
                throw new Error(`Unexpected status code: ${response.status}`);
            }
        } catch (error) {
            console.error("Error deleting all reports:", error);
            toast.error("Failed to delete all reports", {
                description: "There was an error deleting your reports. Please try again.",
            });
        }
    }, []);

    return (
        <ChatContext.Provider
            value={{
                messages,
                isLoading,
                addMessage,
                clearHistory,
                reports,
                fetchReports,
                deleteReport,
                deleteAllReports,
                chatSessions,
                currentChatId,
                createNewChat,
                switchChat,
                deleteChat,
                deleteAllChats,
                updateChatTitle,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
}
