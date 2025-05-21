import React, { useEffect, useRef } from 'react';
import { FileText } from './icons/CustomIcons';
import { Message } from '../types';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
    
    // Multiple attempts to scroll to handle any rendering delays
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    // One more attempt for any delayed content loading or animations
    const longTimeoutId = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 300);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(longTimeoutId);
    };
  }, [messages]);

  return (
    <div className="h-full px-4 py-2 overflow-y-auto" ref={containerRef}>
      {messages.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
          <div className="mb-4">
            <FileText size={64} strokeWidth={1} />
          </div>
          <p className="text-center text-lg">Enter text or use voice input to generate medical documentation</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-4 pb-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default MessageList;