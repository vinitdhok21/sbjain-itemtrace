import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Check, Box } from 'lucide-react';
import { chatService } from '../services/chatService';

export default function MatchCard({ match, originalItem }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { 
    matchedItem, 
    score, 
    titleScore, 
    descriptionScore, 
    locationScore, 
    dateScore, 
    matchLevel 
  } = match;

  // Level specific color themes
  const getLevelTheme = (pct) => {
    if (pct >= 90) return { bg: 'bg-emerald-500 text-white', border: 'border-emerald-100', text: 'text-emerald-650', textLight: 'bg-emerald-50 text-emerald-700' };
    if (pct >= 75) return { bg: 'bg-primary-500 text-white', border: 'border-primary-100', text: 'text-primary-650', textLight: 'bg-primary-50 text-primary-700' };
    if (pct >= 60) return { bg: 'bg-indigo-500 text-white', border: 'border-indigo-100', text: 'text-indigo-650', textLight: 'bg-indigo-50 text-indigo-700' };
    return { bg: 'bg-slate-500 text-white', border: 'border-slate-100', text: 'text-slate-650', textLight: 'bg-slate-50 text-slate-700' };
  };

  const theme = getLevelTheme(score);

  // Compile list of checked reasons
  const getMatchReasons = () => {
    const reasons = [];
    reasons.push('Same category');
    if (titleScore >= 50) reasons.push('Similar title');
    if (descriptionScore >= 50) reasons.push('Similar description');
    if (locationScore === 100) reasons.push('Same location');
    if (dateScore >= 70) reasons.push('Similar date');
    return reasons;
  };

  const reasons = getMatchReasons();

  const isItemActive = (item) => item?.status === 'active';
  const isSelf = Boolean(originalItem && originalItem.reported_by === matchedItem.reported_by);
  const isInactive = !isItemActive(matchedItem) || (originalItem && !isItemActive(originalItem));

  const handleContactClick = async (e) => {
    e.preventDefault(); // Stop Link propagation
    if (!originalItem || isInactive || isSelf) return;

    setLoading(true);
    try {
      const lostId = originalItem.type === 'lost' ? originalItem.id : matchedItem.id;
      const foundId = originalItem.type === 'found' ? originalItem.id : matchedItem.id;
      const reporterLost = originalItem.type === 'lost' ? originalItem.reported_by : matchedItem.reported_by;
      const reporterFound = originalItem.type === 'found' ? originalItem.reported_by : matchedItem.reported_by;

      const { data, error } = await chatService.createOrGetConversation(lostId, foundId, reporterLost, reporterFound);
      if (error) throw error;

      navigate(`/chat/${data.id}`);
    } catch (err) {
      console.error('Error starting conversation:', err.message);
      alert(err.message || 'Could not start conversation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      to={`/items/${matchedItem.id}`}
      className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer"
    >
      
      {/* Top Banner: Score & Visual status */}
      <div className={`px-4 py-3 flex justify-between items-center shrink-0 border-b border-slate-50 ${theme.textLight}`}>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-extrabold">{score}% Match</span>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">{matchLevel}</span>
        </div>
        <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-white rounded-full shadow-2xs capitalize">
          {matchedItem.type}
        </span>
      </div>

      {/* Body Section */}
      <div className="p-4 flex gap-3.5 items-start flex-grow">
        
        {/* Left: Thumbnail preview */}
        <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
          {matchedItem.image_url ? (
            <img src={matchedItem.image_url} alt={matchedItem.title} className="w-full h-full object-cover" />
          ) : (
            <Box className="w-6 h-6 text-slate-300" />
          )}
        </div>

        {/* Right: Info feed */}
        <div className="space-y-0.5 flex-grow">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{matchedItem.category}</span>
          <h4 className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors text-sm line-clamp-1 leading-snug">
            {matchedItem.title}
          </h4>
          <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
            <span className="capitalize">{matchedItem.type}</span>
            <span>•</span>
            <span>{matchedItem.location}</span>
          </p>
        </div>

      </div>

      {/* Checklist reasons why it matched */}
      <div className="px-4 pb-4 space-y-1.5 shrink-0 text-slate-500">
        {reasons.map((reason, idx) => (
          <div 
            key={idx}
            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-650"
          >
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{reason}</span>
          </div>
        ))}
      </div>

      {/* Action Footer Section */}
      {originalItem ? (
        isSelf ? (
          <div className="px-4 pb-4 shrink-0">
            <div className="w-full py-1.5 text-center text-[10px] text-slate-400 font-bold bg-slate-50 rounded-xl border border-slate-100">
              You cannot start a conversation with yourself.
            </div>
          </div>
        ) : isInactive ? (
          <div className="px-4 pb-4 shrink-0">
            <div className="w-full py-1.5 text-center text-[10px] text-rose-500 font-bold bg-rose-50 rounded-xl border border-rose-100">
              This item is no longer active.
            </div>
          </div>
        ) : (
          <div className="px-4 pb-4 shrink-0 flex gap-2">
            <div className="flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all duration-200 border border-slate-100 text-slate-700 bg-white shadow-2xs group-hover:bg-slate-50">
              View Item
            </div>
            <button
              onClick={handleContactClick}
              disabled={loading}
              className="flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all duration-200 bg-primary-500 text-white border border-primary-500 shadow-2xs hover:bg-primary-650 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Starting...' : 'Contact Student'}
            </button>
          </div>
        )
      ) : (
        <div className="px-4 pb-4 shrink-0">
          <div className="w-full py-2 text-center text-xs font-bold rounded-xl transition-all duration-200 border border-slate-100 group-hover:bg-primary-500 group-hover:text-white group-hover:border-primary-500 text-slate-700 bg-white shadow-2xs">
            View Item
          </div>
        </div>
      )}

    </Link>
  );
}
