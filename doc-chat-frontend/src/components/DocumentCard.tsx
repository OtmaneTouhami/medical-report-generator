import React, { useState } from 'react';
import { DocumentResponse } from '../types';
import { FileText, Download, Trash2 } from './icons/CustomIcons';
import { useChat } from '../context/ChatContext';

interface DocumentCardProps {
  document: DocumentResponse;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  const { deleteReport } = useChat();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteReport(parseInt(document.id));
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm p-3 transition-colors duration-200">
      <div className="flex items-start">
        <div className="mr-3 text-blue-600 dark:text-blue-400">
          <FileText size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {document.filename}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {document.createdAt.toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-1">
          <a
            href={document.url}
            download={document.filename}
            className="flex-shrink-0 p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors"
            title="Download document"
          >
            <Download size={18} />
          </a>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`flex-shrink-0 p-2 rounded-full transition-colors ${
              isDeleting
                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50'
            }`}
            title="Delete document"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;