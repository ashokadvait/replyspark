'use client';

import React, { useState } from 'react';
import { X, Lightbulb, Sparkles, ThumbsDown, ThumbsUp, MapPin, Building2 } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftId: string;
  originalText: string;
  editedText?: string;
  locationName?: string;
  locationId?: string;
  onSubmit: (feedbackData: {
    category: string;
    feedbackText: string;
    correctedText?: string;
    teachAI: boolean;
    rating: number;
    scope: 'ORGANIZATION' | 'LOCATION';
  }) => void;
}

export function FeedbackModal({
  isOpen,
  onClose,
  draftId,
  originalText,
  editedText,
  locationName,
  locationId,
  onSubmit
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(2); // 1-2 = needs revision, 5 = good
  const [selectedCategory, setSelectedCategory] = useState('WRONG_TONE');
  const [feedbackText, setFeedbackText] = useState('');
  const [scope, setScope] = useState<'ORGANIZATION' | 'LOCATION'>(locationId ? 'LOCATION' : 'ORGANIZATION');
  const [teachAI, setTeachAI] = useState(true);

  if (!isOpen) return null;

  const categories = [
    { id: 'WRONG_TONE', label: 'Wrong tone' },
    { id: 'TOO_GENERIC', label: 'Too generic' },
    { id: 'TOO_LONG', label: 'Too long' },
    { id: 'TOO_SHORT', label: 'Too short' },
    { id: 'UNSUPPORTED_PROMISE', label: 'Unsupported promise' },
    { id: 'MISSES_COMPLAINT', label: 'Misses main complaint' },
    { id: 'INCORRECT_INFO', label: 'Incorrect info' },
    { id: 'UNWANTED_WORDING', label: 'Unwanted wording' },
    { id: 'OTHER', label: 'Other refinement' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      category: selectedCategory,
      feedbackText,
      correctedText: editedText && editedText.trim() !== originalText.trim() ? editedText : undefined,
      teachAI,
      rating,
      scope
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-left max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Feedback & Prompt Optimization</h3>
            <p className="text-[11px] text-slate-400">
              Calibrate future AI reply generations with direct feedback & human refinements.
            </p>
          </div>
        </div>

        {/* Rating Satisfaction Buttons */}
        <div className="my-3.5 flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 ml-1">Draft Quality:</span>
          <button
            type="button"
            onClick={() => setRating(2)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              rating <= 2
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" /> Needs Revision
          </button>
          <button
            type="button"
            onClick={() => setRating(5)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              rating >= 4
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" /> Good Direction
          </button>
        </div>

        {/* Original Draft vs Edited Preview */}
        {editedText && editedText.trim() !== originalText.trim() && (
          <div className="mb-3.5 p-3 rounded-xl bg-slate-900 border border-indigo-500/30 text-xs space-y-1.5">
            <div className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Human Correction Detected
            </div>
            <p className="text-slate-300 italic line-clamp-2">&ldquo;{editedText}&rdquo;</p>
            <span className="text-[10px] text-slate-500 block">
              This refined text will be stored as an in-context few-shot example to teach the AI.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick category chips */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-2">What should be improved?</label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scope Selector */}
          {locationName && (
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Scope of this Feedback</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScope('LOCATION')}
                  className={`p-2.5 rounded-xl text-xs text-left border transition cursor-pointer ${
                    scope === 'LOCATION'
                      ? 'bg-indigo-950/40 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1 text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> This Location Only
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{locationName}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setScope('ORGANIZATION')}
                  className={`p-2.5 rounded-xl text-xs text-left border transition cursor-pointer ${
                    scope === 'ORGANIZATION'
                      ? 'bg-indigo-950/40 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1 text-slate-200">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" /> All Locations
                  </div>
                  <div className="text-[10px] text-slate-500">Across entire organization</div>
                </button>
              </div>
            </div>
          )}

          {/* Optional Text input */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Specific Instruction / Note (Optional)
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="e.g., 'Do not mention brunch at this branch' or 'Be warmer in initial greetings'"
              className="w-full h-18 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Teach AI toggle */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <input
              type="checkbox"
              id="teachAI"
              checked={teachAI}
              onChange={(e) => setTeachAI(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="teachAI" className="text-xs text-slate-200 cursor-pointer">
              <span className="font-medium text-white">Extract candidate rule &amp; optimize prompts</span> for future replies
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
