import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import PageLoader from '../components/PageLoader';
import ErrorState from '../components/ErrorState';
import { ArrowLeft, Send, CheckCircle2, Sparkles, AlertCircle, RefreshCw, Eye, User, Box } from 'lucide-react';

export default function ChatPage() {
  const { conversationId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const currentUserId = currentUser?.id;
  // Chat page states
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);

  const loadConversationAndMessages = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: convData, error: convErr } = await chatService.getConversation(conversationId);
      if (convErr) throw convErr;
      setConversation(convData);

      const { data: msgData, error: msgErr } = await chatService.getMessages(conversationId);
      if (msgErr) throw msgErr;
      setMessages(msgData || []);
    } catch (err) {
      console.error('Error loading chat page:', err.message);
      setError(err.message || 'Failed to load conversation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!conversationId) return;

    loadConversationAndMessages();

    // Subscribe to realtime messages channel
    const unsubscribe = chatService.subscribeToMessages(conversationId, (newMsg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();

    // Safety check for inactive items
    const lostItemStatus = conversation?.lostItem?.status;
    const foundItemStatus = conversation?.foundItem?.status;
    const isItemInactive = (lostItemStatus && lostItemStatus !== 'active') || (foundItemStatus && foundItemStatus !== 'active');

    if (isItemInactive) {
      alert('Messaging is disabled because one of the related item reports is no longer active.');
      return;
    }

    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const { data, error: sendError } = await chatService.sendMessage(conversationId, messageText);
      if (sendError) throw sendError;

      setMessages(prev => {
        if (!data) return prev;
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
    } catch (err) {
      console.error('Error sending message:', err.message);
      alert(err.message || 'Failed to send message.');
      setNewMessage(messageText); // Restore input value if sending failed
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResolve = async () => {
    if (!window.confirm('Are you sure you want to mark this conversation as resolved? This will permanently resolve the match and close messages input.')) return;
    try {
      const { data, error: resError } = await chatService.resolveConversation(conversationId);
      if (resError) throw resError;
      setConversation(prev => ({
        ...prev,
        status: 'resolved'
      }));
    } catch (err) {
      console.error('Error resolving conversation:', err.message);
      alert('Failed to resolve conversation.');
    }
  };

  if (loading) {
    return <PageLoader text="Loading conversation..." />;
  }

  if (error || !conversation) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <ErrorState
          title="Conversation Access Failed"
          message={error || 'This conversation does not exist or you do not have permission to view it.'}
          onRetry={() => navigate('/conversations')}
          retryLabel="Back to Messages"
        />
      </div>
    );
  }
  if (!currentUserId) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">
          Loading user information...
        </p>
      </div>
    );
  }
  const isResolved = conversation.status === 'resolved';
  const isItemActive = (item) => item?.status === 'active';
  const conversationItemsActive = isItemActive(conversation?.lostItem) && isItemActive(conversation?.foundItem);
  const isItemInactive = !conversationItemsActive;

  const warningMessage = "Messaging is disabled because one of the related reports is no longer active.";

  const matchedItemTitle = conversation.lostItem?.title || conversation.foundItem?.title || 'Matching Trace';
  const oppositeType = conversation.lostItem?.reported_by === currentUserId ? 'found' : 'lost';
  const matchedItem = oppositeType === 'lost' ? conversation.lostItem : conversation.foundItem;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto bg-white border-x border-slate-100 shadow-xs animate-[fadeIn_0.2s_ease-out]">

      {/* 1. Header Toolbar */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0">

        {/* Left segment */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/conversations"
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-750"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0">
              {conversation.otherParticipant?.profile_image ? (
                <img
                  src={conversation.otherParticipant.profile_image}
                  alt={conversation.otherParticipant.full_name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-4 h-4 text-slate-400" />
              )}
            </div>

            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-xs font-bold text-slate-800 truncate">
                {conversation.otherParticipant?.full_name || 'Student'}
              </span>
              <span className="text-[9px] font-semibold text-slate-400">
                @{conversation.otherParticipant?.username || 'user'}
              </span>
            </div>
          </div>
        </div>

        {/* Right segment: Toggles resolved */}
        {!isResolved && (
          <button
            onClick={handleResolve}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors text-[10px] font-bold uppercase tracking-wider cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark Resolved
          </button>
        )}

      </div>

      {/* 2. Compact Match Details context banner */}
      {matchedItem && (
        <div className="p-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-4 shrink-0 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <div className="truncate">
              <span className="font-bold text-slate-800">{matchedItem.title}</span>
              <span className="mx-1.5">•</span>
              <span className="capitalize">{matchedItem.type}</span>
              <span className="mx-1.5">•</span>
              <span>{matchedItem.location}</span>
            </div>
          </div>

          <Link
            to={`/items/${matchedItem.id}`}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-600 bg-white border border-slate-200/50 hover:bg-slate-50 px-2 py-1 rounded-lg shrink-0 transition-colors shadow-3xs"
          >
            <Eye className="w-3 h-3" />
            View Item
          </Link>
        </div>
      )}

      {/* 3. Messages Window scroll feed */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-slate-50/20">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 bg-white/40 border border-dashed border-slate-150 rounded-2xl p-6">
            <div className="p-3 bg-slate-50 rounded-full text-slate-350">
              <Box className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-700 text-sm">No messages yet.</h4>
            <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
              Start the conversation! Coordinate secure handovers on SBJain campus parameters.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.sender_id === currentUserId;
            const msgTime = new Date(msg.created_at).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={msg.id}
                className={`flex w-full ${isSelf ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.15s_ease-out]`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl p-3 shadow-3xs space-y-1 ${isSelf
                    ? 'bg-primary-500 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                    }`}
                >
                  <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap break-words">
                    {msg.message}
                  </p>
                  <span className={`block text-[9px] text-right font-semibold select-none ${isSelf ? 'text-primary-100' : 'text-slate-400'
                    }`}>
                    {msgTime}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Bottom message composer input */}
      <div className="p-4 border-t border-slate-100 bg-white shrink-0">
        {isResolved ? (
          <div className="flex items-center justify-center gap-2 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-xs font-bold uppercase tracking-wider select-none animate-[scaleIn_0.2s_ease-out]">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Conversation resolved</span>
          </div>
        ) : isItemInactive ? (
          <div className="flex items-center justify-center gap-2 p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs font-bold uppercase tracking-wider select-none animate-[scaleIn_0.2s_ease-out]">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>{warningMessage}</span>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-2 items-end">
            <textarea
              disabled={sending}
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows="1"
              aria-label="Type your message"
              className="flex-grow max-h-24 px-4 py-2.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100/75 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200 text-slate-800 leading-snug resize-none font-medium"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              aria-label="Send message"
              className="p-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-40 transition-all duration-200 shrink-0 shadow-xs active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {sending ? (
                <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </form>
        )}
      </div>

    </div>
  );
}
