import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { chatService } from '../services/chatService';
import { MessageSquare, Calendar, User, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error: fetchError } = await chatService.getUserConversations();
        if (fetchError) throw fetchError;
        setConversations(data || []);
      } catch (err) {
        console.error('Error fetching conversations:', err.message);
        setError('Failed to load conversations.');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center bg-slate-50">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 tracking-wider uppercase animate-pulse">
          Loading messages...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-[fadeIn_0.3s_ease-out]">
      
      {/* Page Heading */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Messages</h1>
          <p className="text-sm text-slate-500 font-medium">
            Private conversations about matching lost and found traces.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
          {error}
        </div>
      )}

      {/* Conversations List */}
      <div className="space-y-4">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-white border border-slate-100 rounded-3xl p-8 shadow-xs">
            <div className="p-4 bg-slate-50 rounded-full text-slate-400">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">No conversations yet</h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              When you or another student initiates contact from a possible match card, conversations will be listed here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => {
              const matchedItemTitle = conv.lostItem?.title || conv.foundItem?.title || 'Matching Item';
              const latestText = conv.latestMessage?.message || 'No messages yet. Start the conversation.';
              const latestTime = formatMessageTime(conv.latestMessage?.created_at || conv.created_at);
              const isResolved = conv.status === 'resolved';

              return (
                <Link
                  key={conv.id}
                  to={`/chat/${conv.id}`}
                  className="block bg-white border border-slate-100 hover:border-slate-205 hover:bg-slate-50/30 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all duration-200 group relative"
                >
                  <div className="flex justify-between items-start gap-4">
                    
                    {/* User profile details info */}
                    <div className="flex items-start gap-3 flex-grow min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-150 border border-slate-200 flex items-center justify-center shrink-0">
                        {conv.otherParticipant?.profile_image ? (
                          <img 
                            src={conv.otherParticipant.profile_image} 
                            alt={conv.otherParticipant.full_name} 
                            className="w-full h-full object-cover rounded-full" 
                          />
                        ) : (
                          <User className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0 flex-grow">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-sm leading-none">
                            {conv.otherParticipant?.full_name || 'SBJain Student'}
                          </span>
                          <span className="text-[10px] text-slate-450 font-bold leading-none">
                            @{conv.otherParticipant?.username || 'student'}
                          </span>
                          {isResolved && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                              <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                              Resolved
                            </span>
                          )}
                        </div>

                        {/* Matched item detail contextual trace */}
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-primary-500 leading-none">
                          <Sparkles className="w-3 h-3 shrink-0" />
                          <span className="truncate">Context: {matchedItemTitle}</span>
                        </div>

                        {/* Message Preview text */}
                        <p className="text-xs font-semibold text-slate-450 truncate pt-1 pr-6 leading-tight group-hover:text-slate-700 transition-colors">
                          {latestText}
                        </p>
                      </div>
                    </div>

                    {/* Right aligned metadata parameters */}
                    <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                      <span className="text-[10px] font-bold text-slate-400">{latestTime}</span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-200" />
                    </div>

                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
