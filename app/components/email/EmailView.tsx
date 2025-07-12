'use client';

import { EmailMessage } from '@/app/lib/email-imap/types';
import { EmailParser } from '@/app/lib/email-imap/email-parser';
import { useState, useEffect } from 'react';
import { useMailCache } from '@/app/hooks/useMailCache';
import { useAIReply } from '@/app/hooks/useAIReply';
import { ChatInterface } from './ChatInterface';

interface EmailViewProps {
  email: EmailMessage | null;
  onUpdate?: () => void;
  onMarkAsRead?: (isRead: boolean) => Promise<void>;
  onMarkAsFlagged?: (isFlagged: boolean) => Promise<void>;
  onDelete?: () => Promise<void>;
  onReplyToggle?: (isReplying: boolean) => void;
  onBack?: () => void;
}

export function EmailView({ email, onUpdate, onMarkAsRead, onMarkAsFlagged, onDelete, onReplyToggle, onBack }: EmailViewProps) {
  const [emailBody, setEmailBody] = useState<{ text?: string; html?: string } | null>(null);
  const [loadingBody, setLoadingBody] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const { getEmailBody } = useMailCache();
  
  // AI Reply functionality
  const {
    generateReply,
    sendMessage,
    draftReply,
    modifications,
    conversationHistory,
    isLoading: isGeneratingReply,
    error: aiReplyError,
    clearError,
    applyModification,
    setDraftReply,
    resetReplyState,
  } = useAIReply({ email: email! });

  // Reset reply state when email changes
  useEffect(() => {
    setShowReply(false);
    setReplyText('');
    resetReplyState();
    
    // Notify parent that we're no longer replying
    if (onReplyToggle) {
      onReplyToggle(false);
    }
  }, [email?.id, resetReplyState, onReplyToggle]);

  // Sync reply text with AI draft (one-way only)
  useEffect(() => {
    if (draftReply) {
      setReplyText(draftReply);
    }
  }, [draftReply]);

  // Load email body when email changes
  useEffect(() => {
    if (email && (!email.html && !email.text)) {
      setLoadingBody(true);
      getEmailBody(email.id, email.uid)
        .then((body) => {
          setEmailBody(body);
        })
        .catch((error) => {
          console.error('Failed to load email body:', error);
        })
        .finally(() => {
          setLoadingBody(false);
        });
    } else {
      setEmailBody(null);
    }
  }, [email, getEmailBody]);
  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📧</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No email selected</h3>
          <p className="text-sm text-gray-500">Select an email from the list to view its content</p>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(email.date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleMarkAsRead = async () => {
    if (onMarkAsRead) {
      try {
        await onMarkAsRead(true);
        onUpdate?.();
      } catch (error) {
        console.error('Failed to mark email as read:', error);
      }
    }
  };

  const handleMarkAsUnread = async () => {
    if (onMarkAsRead) {
      try {
        await onMarkAsRead(false);
        onUpdate?.();
      } catch (error) {
        console.error('Failed to mark email as unread:', error);
      }
    }
  };

  const handleMarkAsFlagged = async () => {
    if (onMarkAsFlagged) {
      try {
        await onMarkAsFlagged(!email.isFlagged);
        onUpdate?.();
      } catch (error) {
        console.error('Failed to toggle flag:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      try {
        await onDelete();
        onUpdate?.();
      } catch (error) {
        console.error('Failed to delete email:', error);
      }
    }
  };

  // Get the email content to display
  const getEmailContent = () => {
    if (email.html || email.text) {
      return { html: email.html, text: email.text };
    }
    return emailBody;
  };

  return (
    <div className="flex flex-col bg-white min-h-full">
      {/* Title */}
      <div className="border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            {onBack && (
              <button
                onClick={onBack}
                className="md:hidden p-1 hover:bg-gray-100 rounded"
                title="Back to email list"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-lg font-medium text-gray-900">
              {email.subject}
            </h1>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {!email.isRead && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                Unread
              </span>
            )}
            {email.isFlagged && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">
                ⭐
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reply Box */}
      {!showReply && (
        <div className="border-b border-gray-200 p-2 flex-shrink-0">
          <button
            onClick={() => {
              setShowReply(true);
              onReplyToggle?.(true);
            }}
            className="px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded transition-colors"
          >
            Reply
          </button>
        </div>
      )}

      {/* Reply Interface */}
      {showReply && (
        <div className="border-b border-gray-200 p-3 flex-shrink-0 min-h-[400px]">
          <div className="flex gap-4 h-96">
            {/* Reply Box - Left Half */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Reply</h3>
              <div className="border border-gray-300 rounded-lg flex-1 flex flex-col min-h-0">
                {/* Reply Header */}
                <div className="border-b border-gray-200 p-2 bg-gray-50 flex-shrink-0">
                  <div className="flex justify-between items-start">
                    <div className="text-sm text-gray-700">
                      <div className="mb-1">
                        <span className="font-medium text-xs">To:</span> <span className="text-xs">{email.from.name || email.from.address}</span>
                      </div>
                      <div>
                        <span className="font-medium text-xs">Subject:</span> <span className="text-xs">Re: {email.subject}</span>
                      </div>
                    </div>
                    
                    {/* AI Generate Button */}
                    <button
                      onClick={generateReply}
                      disabled={isGeneratingReply}
                      className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {isGeneratingReply ? (
                        <>
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          ✨ AI Draft
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* AI Error Display */}
                  {aiReplyError && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                      {aiReplyError}
                      <button
                        onClick={clearError}
                        className="ml-2 text-red-800 hover:text-red-900"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Reply Content */}
                <div className="flex-1 p-3 min-h-0">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="w-full h-full resize-none border-none outline-none text-xs"
                  />
                </div>
                
                {/* AI Modification Options */}
                {modifications.length > 0 && (
                  <div className="border-t border-gray-200 p-2 bg-gray-50 flex-shrink-0">
                    <div className="text-xs text-gray-600 mb-1">AI Suggestions:</div>
                    
                    {/* Language Options Row */}
                    <div className="mb-1">
                      <div className="flex gap-1">
                        {modifications.filter(mod => mod.type === 'language').map((mod) => (
                          <button
                            key={mod.id}
                            onClick={() => {
                              applyModification(mod);
                              setReplyText(mod.replacement);
                            }}
                            className="px-2 py-0.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-1"
                            title={mod.description}
                          >
                            <span className="text-gray-600">🌐</span>
                            {mod.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tone/Style Options Row */}
                    <div>
                      <div className="flex flex-wrap gap-1">
                        {modifications.filter(mod => mod.type !== 'language').map((mod) => (
                          <button
                            key={mod.id}
                            onClick={() => {
                              applyModification(mod);
                              setReplyText(mod.replacement);
                            }}
                            className="px-2 py-0.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-1"
                            title={mod.description}
                          >
                            <span className="text-gray-600">
                              {mod.type === 'tone' && '💬'}
                              {mod.type === 'length' && '📏'}
                              {mod.type === 'formality' && '👔'}
                              {mod.type === 'custom' && '⚙️'}
                            </span>
                            {mod.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Reply Actions */}
                <div className="border-t border-gray-200 p-2 flex justify-end items-center flex-shrink-0">
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                      Send
                    </button>
                    <button 
                      onClick={() => {
                        setShowReply(false);
                        onReplyToggle?.(false);
                      }}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Interface - Right Half */}
            <div className="flex-1 flex flex-col">
              <ChatInterface 
                email={email} 
                className="flex-1" 
                conversationHistory={conversationHistory}
                onSendMessage={sendMessage}
                isLoading={isGeneratingReply}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mail View */}
      <div className="flex-1">
        {/* Email Header Information */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">From:</span>
                <span className="text-xs text-gray-900">{email.from.name || email.from.address}</span>
              </div>
              <span className="text-xs text-gray-500">{formattedDate}</span>
            </div>
            
            {/* Collapsible Details */}
            <details className="group">
              <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 list-none">
                <span className="inline-flex items-center gap-1">
                  Show details
                  <svg className="w-3 h-3 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              
              <div className="mt-2 space-y-1 pl-2 border-l-2 border-gray-200">
                <div className="flex items-start text-xs">
                  <span className="font-medium text-gray-700 w-8 flex-shrink-0">To:</span>
                  <span className="text-gray-900">
                    {email.to.map(addr => addr.name ? `${addr.name} <${addr.address}>` : addr.address).join(', ')}
                  </span>
                </div>
                {email.cc && email.cc.length > 0 && (
                  <div className="flex items-start text-xs">
                    <span className="font-medium text-gray-700 w-8 flex-shrink-0">CC:</span>
                    <span className="text-gray-900">
                      {email.cc.map(addr => addr.name ? `${addr.name} <${addr.address}>` : addr.address).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </details>
          </div>
          
          {/* Email Actions */}
          <div className="px-3 pb-2 flex items-center gap-2">
            <button
              onClick={email.isRead ? handleMarkAsUnread : handleMarkAsRead}
              className="p-1.5 hover:bg-blue-100 rounded transition-colors" 
              title={email.isRead ? 'Mark as unread' : 'Mark as read'}
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {email.isRead ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                )}
              </svg>
            </button>
            <button
              onClick={handleMarkAsFlagged}
              className="p-1.5 hover:bg-yellow-100 rounded transition-colors"
              title={email.isFlagged ? 'Unflag' : 'Flag'}
            >
              <svg className="w-4 h-4 text-yellow-600" fill={email.isFlagged ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-100 rounded transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Email Content */}
        <div className="p-3">
        {loadingBody ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading email content...</div>
          </div>
        ) : (
          <div className="prose max-w-none text-sm">
            {(() => {
              const content = getEmailContent();
              if (content?.html) {
                return <div dangerouslySetInnerHTML={{ __html: content.html }} />;
              } else if (content?.text) {
                return (
                  <pre className="whitespace-pre-wrap font-sans text-gray-900 leading-relaxed">
                    {content.text}
                  </pre>
                );
              } else {
                return (
                  <div className="text-gray-500 text-center py-8">
                    No content available for this email.
                  </div>
                );
              }
            })()}
          </div>
        )}

        {/* Attachments */}
        {email.attachments.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Attachments ({email.attachments.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {email.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      📎
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round(attachment.size / 1024)} KB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}