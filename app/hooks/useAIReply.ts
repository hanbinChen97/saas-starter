'use client';

import { useState, useCallback, useRef } from 'react';
import { EmailMessage } from '@/app/lib/email-imap/types';
import { EmailReplyResponse, EmailModification, ConversationMessage, validateEmailReplyResponse } from '@/app/lib/email-ai/ai-prompt';

interface UseAIReplyProps {
  email: EmailMessage;
}

interface UseAIReplyReturn {
  generateReply: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  draftReply: string;
  modifications: EmailModification[];
  conversationHistory: ConversationMessage[];
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  applyModification: (modification: EmailModification) => void;
  setDraftReply: (draft: string) => void;
  resetReplyState: () => void;
}

export function useAIReply({ email }: UseAIReplyProps): UseAIReplyReturn {
  const [draftReply, setDraftReply] = useState<string>('');
  const [modifications, setModifications] = useState<EmailModification[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to avoid dependency issues in useCallback
  const draftReplyRef = useRef(draftReply);
  draftReplyRef.current = draftReply;

  const callAPI = useCallback(async (userMessage?: string) => {
    if (!email) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const emailContent = email.text || email.html || '';
      const requestBody: any = {
        emailContent,
        emailSubject: email.subject,
        emailFrom: email.from.address,
        emailTo: email.to.map(addr => addr.address).join(', '),
      };

      // If this is a follow-up message, include conversation history and current draft
      if (userMessage) {
        requestBody.userFeedback = userMessage;
        requestBody.currentDraft = draftReplyRef.current;
        
        // Include conversation history if it exists
        if (conversationHistory.length > 0) {
          requestBody.conversationHistory = conversationHistory;
        }
      }

      const response = await fetch('/api/email-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate reply: ${response.statusText}`);
      }

      const rawData = await response.json();
      
      // Validate the response data on client side as well
      let data: EmailReplyResponse;
      try {
        data = validateEmailReplyResponse(rawData);
      } catch (validationError) {
        throw new Error(`Invalid response format: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
      }
      
      setDraftReply(data.draftReply);
      setModifications(data.modifications);

      // Update conversation history - only add AI response (user message already added in sendMessage)
      if (userMessage) {
        // Create a more specific default response if aiResponse is missing
        let aiResponseContent = data.aiResponse;
        if (!aiResponseContent || aiResponseContent.trim() === '') {
          aiResponseContent = `I've updated the email draft based on your request: "${userMessage}". Please review the changes above.`;
        }
        
        const aiMessage: ConversationMessage = {
          role: 'assistant',
          content: aiResponseContent,
          timestamp: new Date().toISOString(),
        };
        setConversationHistory(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate AI reply';
      setError(errorMessage);
      console.error('AI reply generation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [email, conversationHistory]);

  const generateReply = useCallback(async () => {
    await callAPI();
  }, [callAPI]);

  const sendMessage = useCallback(async (message: string) => {
    // Add user message to conversation immediately
    const userMessage: ConversationMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    setConversationHistory(prev => [...prev, userMessage]);
    
    await callAPI(message);
  }, [callAPI]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const applyModification = useCallback((modification: EmailModification) => {
    setDraftReply(modification.replacement);
  }, []);

  const resetReplyState = useCallback(() => {
    setDraftReply('');
    setModifications([]);
    setConversationHistory([]);
    setError(null);
  }, []);

  return {
    generateReply,
    sendMessage,
    draftReply,
    modifications,
    conversationHistory,
    isLoading,
    error,
    clearError,
    applyModification,
    setDraftReply,
    resetReplyState,
  };
}