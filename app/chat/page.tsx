'use client';

import { useEffect, useState, useRef } from 'react';
import { MatrixTokenManager } from '@/app/lib/matrix/client';

// Use any types to avoid conflicts with dynamic imports
type MatrixClient = any;
type Room = any;
type MatrixEvent = any;

interface RoomData {
  roomId: string;
  name: string;
  unreadCount: number;
  lastActivity: number;
}

interface MessageData {
  id: string;
  sender: string;
  body: string;
  timestamp: number;
  type: string;
}

export default function ChatPage() {
  const [client, setClient] = useState<MatrixClient | null>(null);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');
  const [encryptionStatus, setEncryptionStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [skipEncryption, setSkipEncryption] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize Matrix client
  useEffect(() => {
    const initClient = async () => {
      try {
        // Only run on client side
        if (typeof window === 'undefined') return;

        const auth = MatrixTokenManager.getToken();
        if (!auth) {
          window.location.href = '/login';
          return;
        }

        // Dynamic import to avoid SSR issues
        const { createClient, ClientEvent, RoomEvent } = await import('matrix-js-sdk');

        const matrixClient = createClient({
          baseUrl: auth.homeserverUrl,
          accessToken: auth.accessToken,
          userId: auth.userId,
          deviceId: auth.deviceId,
        });

        // Set up event listeners
        matrixClient.on(ClientEvent.Sync, async (state: string) => {
          if (state === 'PREPARED') {
            setConnectionStatus('Connected');
            
            // Give the client a moment to fully initialize
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if encryption should be skipped
            if (skipEncryption) {
              setEncryptionStatus('Encryption disabled (by user)');
              loadRooms(matrixClient);
              setLoading(false);
              return;
            }
            
            // Initialize encryption after sync is ready
            try {
              console.log('Initializing encryption...');
              setEncryptionStatus('Initializing encryption...');
              
              // Validate that we have required credentials
              const userId = matrixClient.getUserId();
              const deviceId = matrixClient.getDeviceId();
              
              if (!userId || !deviceId) {
                throw new Error('Missing required credentials for encryption');
              }
              
              console.log('User ID:', userId);
              console.log('Device ID:', deviceId);
              
              // Validate user ID format (should be @username:domain.com)
              if (!userId.match(/^@[^:]+:[^:]+\.[^:]+$/)) {
                console.warn('User ID format may be invalid:', userId);
                throw new Error('Invalid user ID format for encryption');
              }
              
              // Try to initialize with specific options
              await matrixClient.initRustCrypto({
                useIndexedDB: true,
              });
              
              console.log('Encryption initialized successfully');
              setEncryptionStatus('Encryption enabled');
            } catch (error) {
              console.error('Failed to initialize encryption:', error);
              console.error('Error details:', error);
              
              // If WASM initialization fails, skip encryption entirely
              console.log('Skipping encryption due to initialization failure');
              setEncryptionStatus('Encryption disabled (initialization failed)');
              
              // Check if it's a specific error we can handle
              const errorMsg = (error as any)?.message || '';
              
              if (errorMsg.includes('IndexedDB')) {
                setEncryptionStatus('Encryption disabled (storage not available)');
              } else if (errorMsg.includes('crypto')) {
                setEncryptionStatus('Encryption disabled (not supported)');
              } else if (errorMsg.includes('UserId') || errorMsg.includes('userid')) {
                setEncryptionStatus('Encryption disabled (invalid credentials)');
              } else if (errorMsg.includes('wasm') || errorMsg.includes('WASM')) {
                setEncryptionStatus('Encryption disabled (WASM error)');
              }
            }
            
            loadRooms(matrixClient);
            setLoading(false);
          } else if (state === 'SYNCING') {
            setConnectionStatus('Syncing...');
          } else if (state === 'ERROR') {
            setConnectionStatus('Connection Error');
          }
        });

        // Listen for new messages
        matrixClient.on(RoomEvent.Timeline, async (event: any, room: any, toStartOfTimeline?: boolean) => {
          if (toStartOfTimeline || !room) return; // Don't process paginated results or undefined rooms
          if (event.getType() !== 'm.room.message') return; // Only process messages
          
          const content = event.getContent();
          if (content.msgtype !== 'm.text') return; // Only text messages

          // Trigger API call for new messages
          await triggerMessage(event, room);

          // Update UI if this is the selected room
          if (selectedRoom && room.roomId === selectedRoom.roomId) {
            const messageData: MessageData = {
              id: event.getId() || '',
              sender: event.getSender() || '',
              body: content.body || '',
              timestamp: event.getTs(),
              type: content.msgtype || 'm.text',
            };
            setMessages(prev => [...prev, messageData]);
          }

          // Update room list with new activity
          loadRooms(matrixClient);
        });

        await matrixClient.startClient({ initialSyncLimit: 20 });
        setClient(matrixClient);

      } catch (error) {
        console.error('Failed to initialize Matrix client:', error);
        setConnectionStatus('Failed to connect');
        // Clear invalid token and redirect to login
        MatrixTokenManager.clearToken();
        window.location.href = '/login';
      }
    };

    initClient();

    return () => {
      if (client) {
        client.stopClient();
      }
    };
  }, []);

  // Load rooms list
  const loadRooms = (matrixClient: any) => {
    const clientRooms = matrixClient.getRooms();
    const roomData: RoomData[] = clientRooms
      .map((room: any) => ({
        roomId: room.roomId,
        name: room.name || room.roomId,
        unreadCount: room.getUnreadNotificationCount(),
        lastActivity: room.getLastActiveTimestamp(),
      }))
      .sort((a: any, b: any) => b.lastActivity - a.lastActivity); // Sort by most recent activity

    setRooms(roomData);
  };

  // Select a room and load its messages
  const selectRoom = (roomId: string) => {
    if (!client) return;

    const room = client.getRoom(roomId);
    if (!room) return;

    setSelectedRoom(room);
    
    // Load existing messages from the room
    const timeline = room.getLiveTimeline();
    const events = timeline.getEvents();
    
    const messageData: MessageData[] = events
      .filter((event: any) => 
        event.getType() === 'm.room.message' && 
        event.getContent().msgtype === 'm.text'
      )
      .map((event: any) => ({
        id: event.getId() || '',
        sender: event.getSender() || '',
        body: event.getContent().body || '',
        timestamp: event.getTs(),
        type: event.getContent().msgtype || 'm.text',
      }));

    setMessages(messageData);
  };

  // Trigger API call for new messages
  const triggerMessage = async (event: any, room: any) => {
    try {
      const payload = {
        id: event.getId(),
        roomId: room.roomId,
        sender: event.getSender(),
        body: event.getContent().body,
        ts: event.getTs(),
      };

      const response = await fetch('/api/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Failed to trigger API:', response.statusText);
      }
    } catch (error) {
      console.error('Error triggering API:', error);
    }
  };

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Get display name for sender
  const getSenderName = (sender: string) => {
    if (!selectedRoom) return sender;
    const member = selectedRoom.getMember(sender);
    return member?.name || sender.split(':')[0].substring(1);
  };

  // Send message function
  const sendMessage = async () => {
    if (!client || !selectedRoom || !messageInput.trim() || sending) return;

    setSending(true);
    setSendError(null);
    
    try {
      const content = {
        body: messageInput.trim(),
        msgtype: 'm.text',
      };

      await client.sendEvent(selectedRoom.roomId, 'm.room.message' as any, content);
      setMessageInput(''); // Clear input after successful send
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = '40px';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      let errorMessage = 'Failed to send message';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific encryption errors
        if (error.message.includes('encryption') || error.message.includes('crypto')) {
          if (encryptionStatus.includes('disabled')) {
            errorMessage = 'This room requires encryption, but encryption is disabled. Please refresh to retry enabling encryption.';
          } else {
            errorMessage = 'Encryption error. Please refresh the page to reinitialize encryption support.';
          }
        } else if (error.message.includes('not support encryption')) {
          errorMessage = 'This room requires encryption. Current client configuration does not support encryption.';
        } else if (error.message.includes('Unknown session')) {
          errorMessage = 'Encryption session not found. This may resolve after refreshing or waiting for sync.';
        }
      }
      
      setSendError(errorMessage);
      
      // Clear error after 8 seconds for encryption errors (more time to read)
      const clearTime = errorMessage.includes('encryption') ? 8000 : 5000;
      setTimeout(() => setSendError(null), clearTime);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    setSendError(null); // Clear error when user starts typing
    
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = '40px';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600">Connecting to Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar - Rooms List */}
      <div className="w-1/3 bg-white border-r border-gray-300 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Matrix Chat</h1>
            <div className="flex flex-col items-end">
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${
                  connectionStatus === 'Connected' ? 'bg-green-500' : 
                  connectionStatus === 'Syncing...' ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`} />
                <span className="text-xs text-gray-600">{connectionStatus}</span>
              </div>
              {encryptionStatus && (
                <div className="flex items-center mt-1">
                  <div className={`h-2 w-2 rounded-full mr-2 ${
                    encryptionStatus.includes('Encryption enabled') ? 'bg-blue-500' :
                    encryptionStatus === 'Initializing encryption...' ? 'bg-yellow-500' :
                    encryptionStatus.includes('disabled') ? 'bg-gray-500' :
                    encryptionStatus.includes('failed') || encryptionStatus.includes('not') || encryptionStatus.includes('Invalid') ? 'bg-red-500' :
                    'bg-orange-500'
                  }`} />
                  <span className="text-xs text-gray-500">{encryptionStatus}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto">
          {rooms.map((room) => (
            <div
              key={room.roomId}
              onClick={() => selectRoom(room.roomId)}
              className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedRoom?.roomId === room.roomId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{room.name}</h3>
                  <p className="text-xs text-gray-500">
                    {formatTime(room.lastActivity)}
                  </p>
                </div>
                {room.unreadCount > 0 && (
                  <div className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {room.unreadCount > 9 ? '9+' : room.unreadCount}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Chat View */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedRoom.name || selectedRoom.roomId}
              </h2>
              <p className="text-sm text-gray-600">
                {selectedRoom.getJoinedMemberCount()} members
              </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {getSenderName(message.sender).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {getSenderName(message.sender)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{message.body}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              {encryptionStatus && encryptionStatus.includes('disabled') && (
                <div className="mb-3 p-3 bg-blue-100 border border-blue-300 text-blue-800 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Encryption is disabled</div>
                      <div className="text-xs text-blue-700 mt-1">
                        You can view and send messages in unencrypted rooms only.
                      </div>
                    </div>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-blue-800 underline hover:text-blue-900 text-sm font-medium"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
              {sendError && (
                <div className="mb-3 p-2 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                  {sendError}
                </div>
              )}
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                    className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={1}
                    style={{
                      minHeight: '40px',
                      maxHeight: '120px',
                      height: '40px',
                    }}
                    disabled={sending}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || sending || !selectedRoom}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-1">Welcome to Matrix Chat</p>
              <p className="text-gray-600">Select a room from the sidebar to start viewing messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}