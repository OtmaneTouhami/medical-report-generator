import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Message, ChatContextType, ReportApiResponse } from '../types';
import api from '../api/axios';

// Get document file name from path
const getFileNameFromPath = (path: string): string => {
  const parts = path.split('/');
  return parts[parts.length - 1];
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [reports, setReports] = useState<ReportApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch reports on initial load
  useEffect(() => {
    void fetchReports();
  }, []);

  const fetchReports = async (): Promise<void> => {
    try {
      const response = await api.get('/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const addMessage = async (content: string): Promise<void> => {
    // Add user message
    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      type: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Call the API to generate a report
      const response = await api.post('/generate', null, { 
        params: { prompt_text: content } 
      });
      
      const reportData: ReportApiResponse = response.data;
      
      // Refresh reports list
      await fetchReports();
      
      // Add assistant message with document if available
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: reportData.generated_report_path 
          ? 'Here is your requested medical report:'
          : reportData.error_message || 'Sorry, there was an error generating your document.',
        timestamp: new Date()
      };
      
      // Add document info if the report was generated successfully
      if (reportData.generated_report_path) {
        assistantMessage.document = {
          id: reportData.id.toString(),
          filename: getFileNameFromPath(reportData.generated_report_path),
          url: `${api.defaults.baseURL}/reports/${reportData.id}/download`,
          createdAt: new Date(reportData.created_at)
        };
      }
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error('Error generating report:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, there was a technical issue while generating your document. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReport = async (reportId: number): Promise<void> => {
    try {
      await api.delete(`/reports/${reportId}`);
      
      // Refresh reports list
      await fetchReports();
      
      // Remove associated messages
      setMessages(prevMessages => 
        prevMessages.filter(msg => 
          !(msg.document && msg.document.id === reportId.toString())
        )
      );
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const deleteAllReports = async (): Promise<void> => {
    try {
      await api.delete('/reports');
      
      // Refresh reports list
      await fetchReports();
      
      // Remove all messages with documents
      setMessages(prevMessages => 
        prevMessages.filter(msg => !msg.document)
      );
    } catch (error) {
      console.error('Error deleting all reports:', error);
    }
  };

  const clearHistory = () => {
    setMessages([]);
  };

  return (
    <ChatContext.Provider value={{ 
      messages, 
      isLoading, 
      addMessage, 
      clearHistory, 
      reports, 
      fetchReports, 
      deleteReport, 
      deleteAllReports 
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
};