import React from 'react';
import { Message } from '../types';
import DocumentCard from './DocumentCard';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.type === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[75%] rounded-2xl p-4 transition-colors ${
          isUser
            ? 'bg-blue-600 dark:bg-blue-500 text-white rounded-tr-none'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none'
        }`}
      >
        <p className="text-sm mb-1 opacity-75">
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        <div className="text-base">{message.content}</div>
        
        {message.document && <DocumentCard document={message.document} />}
      </div>
    </div>
  );
};

export default MessageBubble