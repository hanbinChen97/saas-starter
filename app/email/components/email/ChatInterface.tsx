'use client';

import { useState } from 'react';
import { EmailMessage } from '@/app/email/lib/email-service/mail-imap/types';
import { ConversationMessage } from '@/app/email/lib/email-ai/ai-prompt';

interface ChatInterfaceProps {
  email: EmailMessage;
  className?: string;
  conversationHistory: ConversationMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export function ChatInterface({ 
  email, 
  className = '', 
  conversationHistory, 
  onSendMessage, 
  isLoading 
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    await onSendMessage(message);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">AI Assistant</h3>
        <div className="text-xs text-gray-500">
          {conversationHistory.length} messages
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 border border-gray-300 rounded-lg bg-white flex flex-col">
        <div className="flex-1 p-3 overflow-y-auto space-y-2 min-h-0">
          {conversationHistory.length === 0 && (
            <div className="text-xs text-gray-500 text-center py-4">
              Click "✨ AI Draft" to generate an initial reply, then chat with AI to refine it.
            </div>
          )}
          {conversationHistory.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-xs ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse delay-100"></div>
                  <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Chat Input */}
        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-2">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI to modify the draft..."
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}