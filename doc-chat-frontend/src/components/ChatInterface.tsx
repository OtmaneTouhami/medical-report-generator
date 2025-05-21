import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ReportsList from './ReportsList';
import Modal from './Modal';
import { Stethoscope, Loader2, LayoutList, Trash2, Sun, Moon, X, RefreshCw } from './icons/CustomIcons';
import { ReportApiResponse } from '../types';

const ChatInterface: React.FC = () => {
  const { messages, isLoading, addMessage, clearHistory, reports, fetchReports, deleteAllReports, deleteReport } = useChat();
  const { theme, toggleTheme } = useTheme();
  const [showHistory, setShowHistory] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showDeleteAllReportsModal, setShowDeleteAllReportsModal] = useState(false);
  const [showDeleteReportModal, setShowDeleteReportModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<number | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportApiResponse | null>(null);

  const handleSendMessage = async (content: string) => {
    await addMessage(content);
  };

  const handleRefreshReports = async () => {
    setIsRefreshing(true);
    await fetchReports();
    setIsRefreshing(false);
  };

  const handleDeleteAllReports = async () => {
    await deleteAllReports();
    setShowDeleteAllReportsModal(false);
  };

  const handleClearHistory = () => {
    clearHistory();
    setShowClearHistoryModal(false);
  };

  const handleDeleteReportClick = (reportId: number) => {
    setReportToDelete(reportId);
    setShowDeleteReportModal(true);
  };

  const handleViewPrompt = (report: ReportApiResponse) => {
    setSelectedReport(report);
    setShowPromptModal(true);
  };

  const handleDeleteReport = async () => {
    if (reportToDelete !== null) {
      await deleteReport(reportToDelete);
      setShowDeleteReportModal(false);
      setReportToDelete(null);
    }
  };

  // Auto-refresh reports when history panel is opened
  useEffect(() => {
    if (showHistory) {
      handleRefreshReports();
    }
  }, [showHistory]);

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-sm transition-colors duration-200">
        <div className="flex items-center">
          <div className="mr-3 text-blue-600 dark:text-blue-400">
            <Stethoscope size={24} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Medical Documentation</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Voice-to-document assistant</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`rounded-full p-2 transition-colors ${
              showHistory 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700' 
            }`}
            title="View history"
          >
            <LayoutList size={20} />
          </button>
          
          <button 
            onClick={() => setShowClearHistoryModal(true)}
            className="rounded-full p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Clear history"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>
      
      <div className="relative flex flex-1 overflow-hidden">
        {/* Main chat area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${showHistory ? 'lg:mr-96' : ''}`}>
          {/* Messages - use overflow-y-auto here to enable scrolling */}
          <div className="relative flex-1 overflow-y-auto">
            <MessageList messages={messages} />
          </div>
          
          {/* Input */}
          <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
        
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ pointerEvents: 'none' }}>
            <div className="flex flex-col items-center bg-white/95 dark:bg-gray-800/95 p-6 rounded-lg shadow-xl" style={{ pointerEvents: 'auto' }}>
              <Loader2 className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-400">Generating document...</p>
            </div>
          </div>
        )}
        
        {/* History panel (sidebar) */}
        <div 
          className={`absolute top-0 right-0 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 w-full md:w-96 transform transition-transform duration-300 ease-in-out flex flex-col ${
            showHistory ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Report History</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleRefreshReports}
                disabled={isRefreshing}
                className={`p-2 rounded-full transition-colors ${
                  isRefreshing
                    ? 'text-gray-400 dark:text-gray-500 animate-spin' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Refresh reports"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={() => setShowDeleteAllReportsModal(true)}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Delete all reports"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Close history panel"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {isRefreshing ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
            ) : (
              <ReportsList reports={reports} onRefresh={handleRefreshReports} onDeleteReport={handleDeleteReportClick} onViewPrompt={handleViewPrompt} />
            )}
          </div>
        </div>
      </div>

      {/* Clear Chat History Modal */}
      <Modal
        isOpen={showClearHistoryModal}
        onClose={() => setShowClearHistoryModal(false)}
        title="Clear Chat History"
        actions={
          <>
            <button
              onClick={() => setShowClearHistoryModal(false)}
              className="px-4 py-2 rounded text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleClearHistory}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Clear History
            </button>
          </>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to clear the chat history? This will only remove the messages from your current view and won't affect any saved reports.
        </p>
      </Modal>

      {/* Delete All Reports Modal */}
      <Modal
        isOpen={showDeleteAllReportsModal}
        onClose={() => setShowDeleteAllReportsModal(false)}
        title="Delete All Reports"
        actions={
          <>
            <button
              onClick={() => setShowDeleteAllReportsModal(false)}
              className="px-4 py-2 rounded text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAllReports}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Delete All
            </button>
          </>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete all reports? This action cannot be undone and will permanently remove all generated documents.
        </p>
      </Modal>
      
      {/* Delete Report Modal */}
      <Modal
        isOpen={showDeleteReportModal}
        onClose={() => setShowDeleteReportModal(false)}
        title="Delete Report"
        actions={
          <>
            <button
              onClick={() => setShowDeleteReportModal(false)}
              className="px-4 py-2 rounded text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteReport}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this report? This action cannot be undone.
        </p>
      </Modal>

      {/* Prompt View Modal */}
      <Modal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title={selectedReport ? `Report - ${new Date(selectedReport.created_at).toLocaleDateString()}` : "Report Prompt"}
        actions={
          <button
            onClick={() => setShowPromptModal(false)}
            className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Close
          </button>
        }
        customWidth="max-w-4xl"
      >
        {selectedReport && (
          <div className="text-gray-700 dark:text-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-1">
                <p className="font-semibold text-gray-600 dark:text-gray-400">Date & Time:</p>
              </div>
              <div className="md:col-span-3">
                <p>{new Date(selectedReport.created_at).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <p className="font-semibold text-gray-600 dark:text-gray-400">Prompt:</p>
              </div>
              <div className="md:col-span-3">
                <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-md whitespace-pre-wrap break-words text-lg">
                  {selectedReport.prompt_text}
                </div>
              </div>
            </div>
            
            {selectedReport.error_message && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="md:col-span-1">
                  <p className="font-semibold text-red-500">Error:</p>
                </div>
                <div className="md:col-span-3">
                  <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-md text-red-600 dark:text-red-400">
                    {selectedReport.error_message}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChatInterface;