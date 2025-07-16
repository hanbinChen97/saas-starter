'use client';

import { EmailMessage } from '@/app/lib/email-service/mail-imap/types';
import { EmailParser } from '@/app/lib/email-service/mail-imap/email-parser';
import { useState, useEffect } from 'react';
import { useMailCache } from '@/app/hooks/useMailCache';
import { useAIReply } from '@/app/hooks/useAIReply';
import { ChatInterface } from './ChatInterface';
import { sendEmailAction } from '@/app/lib/email-service/mail-smtp/actions';
import type { SMTPAuthRequest, SMTPSendOptions } from '@/app/lib/email-service/mail-smtp/types';

interface EmailViewProps {
  email: EmailMessage | null;
  onUpdate?: () => void;
  onMarkAsRead?: (isRead: boolean) => Promise<void>;
  onMarkAsFlagged?: (isFlagged: boolean) => Promise<void>;
  onDelete?: () => Promise<void>;
  onReplyToggle?: (isReplying: boolean) => void;
  onBack?: () => void;
  userCredentials?: {
    username: string;
    emailAddress: string;
  };
}

export function EmailView({ email, onUpdate, onMarkAsRead, onMarkAsFlagged, onDelete, onReplyToggle, onBack, userCredentials }: EmailViewProps) {
  const [emailBody, setEmailBody] = useState<{ text?: string; html?: string } | null>(null);
  const [loadingBody, setLoadingBody] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyStatus, setReplyStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authCredentials, setAuthCredentials] = useState({ username: '', password: '', senderEmail: '' });
  const [needPassword, setNeedPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
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
  } = useAIReply({ email: email as EmailMessage });

  // Reset reply state when email changes
  useEffect(() => {
    setShowReply(false);
    setReplyText('');
    setReplyStatus(null);
    setShowAuthForm(false);
    setNeedPassword(false);
    setTempPassword('');
    setAuthCredentials({ username: '', password: '', senderEmail: '' });
    resetReplyState();
    
    // Notify parent that we're no longer replying
    if (onReplyToggle) {
      onReplyToggle(false);
    }
  }, [email?.id]);

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

  const handleSendReply = async () => {
    if (!email || !replyText.trim()) {
      setReplyStatus({ type: 'error', message: 'Please enter a reply message' });
      return;
    }

    // If user credentials are available, ask for password only
    if (userCredentials) {
      setNeedPassword(true);
    } else {
      // Show auth form to collect credentials
      setShowAuthForm(true);
    }
  };

  const handleSendWithUserCredentials = async () => {
    if (!email || !replyText.trim() || !userCredentials || !tempPassword.trim()) {
      setReplyStatus({ type: 'error', message: 'Missing required information' });
      return;
    }

    setSendingReply(true);
    setReplyStatus(null);

    try {
      const smtpConfig: SMTPAuthRequest = {
        username: userCredentials.username,
        password: tempPassword,
        host: 'mail.rwth-aachen.de',
        port: 587,
        secure: false,
        senderEmail: userCredentials.emailAddress,
      };

      const emailOptions: SMTPSendOptions = {
        password: tempPassword,
        to: [email.from.address],
        subject: `Re: ${email.subject}`,
        text: replyText,
      };

      const result = await sendEmailAction(smtpConfig, emailOptions);

      if (result.success) {
        setReplyStatus({ type: 'success', message: 'Reply sent successfully!' });
        setTempPassword('');
        setNeedPassword(false);
        // Auto-close reply after successful send
        setTimeout(() => {
          setShowReply(false);
          setReplyStatus(null);
          onReplyToggle?.(false);
        }, 2000);
      } else {
        setReplyStatus({ type: 'error', message: result.error || 'Failed to send reply' });
      }
    } catch (error) {
      console.error('Error sending reply with user credentials:', error);
      setReplyStatus({ type: 'error', message: 'Failed to send reply' });
    } finally {
      setSendingReply(false);
    }
  };

  const handleSendWithAuth = async () => {
    if (!email || !replyText.trim() || !authCredentials.username || !authCredentials.password || !authCredentials.senderEmail) {
      setReplyStatus({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    setSendingReply(true);
    setReplyStatus(null);

    try {
      const smtpConfig: SMTPAuthRequest = {
        username: authCredentials.username,
        password: authCredentials.password,
        host: 'mail.rwth-aachen.de',
        port: 587,
        secure: false,
        senderEmail: authCredentials.senderEmail,
      };

      const emailOptions: SMTPSendOptions = {
        password: authCredentials.password,
        to: [email.from.address],
        subject: `Re: ${email.subject}`,
        text: replyText,
      };

      const result = await sendEmailAction(smtpConfig, emailOptions);

      if (result.success) {
        setReplyStatus({ type: 'success', message: 'Reply sent successfully!' });
        setAuthCredentials({ username: '', password: '', senderEmail: '' });
        setShowAuthForm(false);
        // Auto-close reply after successful send
        setTimeout(() => {
          setShowReply(false);
          setReplyStatus(null);
          onReplyToggle?.(false);
        }, 2000);
      } else {
        setReplyStatus({ type: 'error', message: result.error || 'Failed to send reply' });
      }
    } catch (error) {
      console.error('Error sending reply with auth:', error);
      setReplyStatus({ type: 'error', message: 'Failed to send reply' });
    } finally {
      setSendingReply(false);
    }
  };

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
    <div className="h-full w-full flex flex-col bg-white overflow-hidden">
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
            <h1 className="text-lg font-medium text-gray-900 line-clamp-2">
              {email.subject}
            </h1>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
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
              // Combine both operations: show reply section AND collapse email list
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
        <div className="border-b border-gray-200 flex-shrink-0" style={{ height: '400px' }}>
          <div className="p-3 h-full">
            <div className="flex gap-4 h-full">
              {/* Reply Box - Left Half */}
              <div className="flex-1 flex flex-col h-full">
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

                    {/* Reply Status Display */}
                    {replyStatus && (
                      <div className={`mt-2 text-xs p-2 rounded ${
                        replyStatus.type === 'success' 
                          ? 'text-green-600 bg-green-50' 
                          : 'text-red-600 bg-red-50'
                      }`}>
                        {replyStatus.message}
                        <button
                          onClick={() => setReplyStatus(null)}
                          className={`ml-2 ${
                            replyStatus.type === 'success' 
                              ? 'text-green-800 hover:text-green-900' 
                              : 'text-red-800 hover:text-red-900'
                          }`}
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
                    <div className="border-t border-gray-200 p-2 flex-shrink-0">
                      <div className="text-xs text-gray-600 mb-1">AI Suggestions:</div>
                      <div className="flex flex-wrap gap-1">
                        {modifications.map((mod, index) => (
                          <button
                            key={index}
                            onClick={() => applyModification(mod)}
                            className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
                          >
                            {mod.type}: {mod.description}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Send/Cancel Buttons */}
                  <div className="border-t border-gray-200 p-2 flex justify-end items-center flex-shrink-0">
                    <div className="flex gap-2">
                      <button 
                        onClick={handleSendReply}
                        disabled={sendingReply || !replyText.trim()}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {sendingReply ? (
                          <>
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            Sending...
                          </>
                        ) : (
                          'Send'
                        )}
                      </button>
                      <button 
                        onClick={() => {
                          setShowReply(false);
                          setReplyStatus(null);
                          onReplyToggle?.(false);
                        }}
                        disabled={sendingReply}
                        className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>

                {/* Auth forms for when user credentials are needed */}
                {showAuthForm && (
                  <div className="border-t border-gray-200 p-3 bg-gray-50 flex-shrink-0">
                    <div className="text-xs text-gray-600 mb-2">Enter your email credentials to send:</div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="email"
                        value={authCredentials.username}
                        onChange={(e) => setAuthCredentials(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Login: ab123456@rwth-aachen.de"
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="password"
                        value={authCredentials.password}
                        onChange={(e) => setAuthCredentials(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Password"
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mb-2">
                      <input
                        type="email"
                        value={authCredentials.senderEmail}
                        onChange={(e) => setAuthCredentials(prev => ({ ...prev, senderEmail: e.target.value }))}
                        placeholder="Your real email: max.mustermann@rwth-aachen.de (required)"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setShowAuthForm(false)}
                        className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendWithAuth}
                        disabled={!authCredentials.username || !authCredentials.password || !authCredentials.senderEmail}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Send Reply
                      </button>
                    </div>
                  </div>
                )}

                {needPassword && (
                  <div className="border-t border-gray-200 p-3 bg-blue-50 flex-shrink-0">
                    <div className="text-xs text-gray-600 mb-2">
                      Sending as: {userCredentials?.emailAddress}
                    </div>
                    <div className="mb-2">
                      <input
                        type="password"
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        placeholder="Enter your password to send"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendWithUserCredentials()}
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setNeedPassword(false)}
                        className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendWithUserCredentials}
                        disabled={!tempPassword.trim()}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Send Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Interface - Right Half */}
              <div className="flex-1 flex flex-col h-full">
                <ChatInterface 
                  email={email} 
                  className="h-full" 
                  conversationHistory={conversationHistory}
                  onSendMessage={sendMessage}
                  isLoading={isGeneratingReply}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mail View - Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {/* Email Header Information */}
        <div className="border-b border-gray-200 bg-gray-50 flex-shrink-0">
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
              <div className="mt-2 p-2 bg-white rounded border text-xs space-y-1">
                <div><span className="font-medium">To:</span> {email.to.map(addr => addr.name ? `${addr.name} <${addr.address}>` : addr.address).join(', ')}</div>
                {email.cc && email.cc.length > 0 && (
                  <div><span className="font-medium">CC:</span> {email.cc.map(addr => addr.name ? `${addr.name} <${addr.address}>` : addr.address).join(', ')}</div>
                )}
                {email.bcc && email.bcc.length > 0 && (
                  <div><span className="font-medium">BCC:</span> {email.bcc.map(addr => addr.name ? `${addr.name} <${addr.address}>` : addr.address).join(', ')}</div>
                )}
              </div>
            </details>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-b border-gray-200 p-3 bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAsUnread}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Mark as unread"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 3.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={handleMarkAsFlagged}
              className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${email.isFlagged ? 'text-yellow-600' : 'text-gray-600'}`}
              title={email.isFlagged ? "Remove flag" : "Add flag"}
            >
              <svg className="w-4 h-4" fill={email.isFlagged ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2H21l-3 6 3 6h-8.5l-1-2H5a2 2 0 00-2 2zm9-13.5V9" />
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

        {/* Email Content - Scrollable */}
        <div className="p-4">
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