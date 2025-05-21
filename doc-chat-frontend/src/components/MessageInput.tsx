import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, AlertCircle, AlertTriangle } from './icons/CustomIcons';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { 
    text, 
    isListening, 
    startListening, 
    stopListening, 
    hasRecognitionSupport,
    setText,
    errorMessage
  } = useSpeechRecognition();

  useEffect(() => {
    if (text) {
      setMessage(text);
    }
  }, [text]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleToggleDictation = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    if (isListening) {
      setText(e.target.value);
    }
  };

  const handleSendMessage = async () => {
    if (message.trim() && !isLoading) {
      if (isListening) {
        stopListening();
      }
      
      await onSendMessage(message.trim());
      setMessage('');
      
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 transition-colors duration-200">
      <div className="relative rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 transition focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-400 dark:focus-within:ring-blue-500">
        <textarea
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Dictating..." : "Type your message or click the microphone to dictate..."}
          className="max-h-32 min-h-[52px] w-full resize-none rounded-2xl py-3 pl-4 pr-[100px] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none bg-transparent"
          disabled={isLoading}
        />
        
        <div className="absolute bottom-1 right-1 flex space-x-1">
          {hasRecognitionSupport ? (
            <button
              onClick={handleToggleDictation}
              disabled={isLoading}
              className={`rounded-full p-2.5 transition-colors ${
                isListening 
                  ? 'bg-red-100 dark:bg-red-900/50 text-red-500 dark:text-red-400 animate-pulse' 
                  : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500'
              }`}
              aria-label={isListening ? "Stop dictation" : "Start dictation"}
              title={isListening ? "Stop dictation" : "Start dictation"}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          ) : (
            <button
              disabled
              className="rounded-full p-2.5 bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              title="Speech recognition is not supported in this browser"
            >
              <AlertCircle size={20} />
            </button>
          )}
          
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className={`rounded-full p-2.5 ${
              message.trim() && !isLoading
                ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                : 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            } transition-colors`}
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
      
      {/* Status and error messages */}
      {isListening && !errorMessage && (
        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 animate-pulse flex items-center">
          <Mic size={12} className="mr-1" />
          <span>Listening... (pause to edit)</span>
        </div>
      )}
      
      {errorMessage && (
        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center">
          <AlertTriangle size={12} className="mr-1" />
          <span>{errorMessage}</span>
        </div>
      )}
      
      {!hasRecognitionSupport && !errorMessage && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
          <AlertCircle size={12} className="mr-1" />
          <span>Speech recognition not supported in this browser. Try Chrome or Edge.</span>
        </div>
      )}
    </div>
  );
};

export default MessageInput