'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Check,
  Trash2,
  Sparkles,
  MapPin,
  Building2,
  ThumbsUp,
  ThumbsDown,
  Layers,
  MessageSquare,
  TrendingUp,
  FileText,
  AlertCircle,
  Copy,
  ChevronRight
} from 'lucide-react';
import { ApiClient } from '../lib/api';

interface PreferencesViewProps {
  selectedLocationId?: string;
  locations?: Array<{ id: string; displayName: string; address?: string }>;
}

export function PreferencesView({
  selectedLocationId = 'ALL',
  locations = []
}: PreferencesViewProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'templates' | 'feedback'>('rules');

  const [preferences, setPreferences] = useState<{
    activeRules: any[];
    locationTemplates: any[];
    candidateRules: any[];
    disabledRules: any[];
  }>({
    activeRules: [],
    locationTemplates: [],
    candidateRules: [],
    disabledRules: []
  });

  const [feedbackData, setFeedbackData] = useState<{
    feedbacks: any[];
    stats: {
      totalCount: number;
      positiveCount: number;
      negativeCount: number;
      correctedCount: number;
      categoryCounts: Record<string, number>;
      satisfactionRate: number;
    };
  }>({
    feedbacks: [],
    stats: {
      totalCount: 0,
      positiveCount: 0,
      negativeCount: 0,
      correctedCount: 0,
      categoryCounts: {},
      satisfactionRate: 100
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // New Rule Modal/Form State
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRuleText, setNewRuleText] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState('TONE_STYLE');
  const [newRuleLocationId, setNewRuleLocationId] = useState<string>(
    selectedLocationId !== 'ALL' ? selectedLocationId : 'ALL'
  );

  // New Template Modal/Form State
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateText, setTemplateText] = useState('');
  const [templateLocationId, setTemplateLocationId] = useState<string>(
    selectedLocationId !== 'ALL' ? selectedLocationId : (locations[0]?.id || 'ALL')
  );
  const [templateRating, setTemplateRating] = useState('ALL');

  const fetchPreferences = async () => {
    try {
      const data = await ApiClient.getPreferences(selectedLocationId);
      setPreferences({
        activeRules: data.activeRules || [],
        locationTemplates: data.locationTemplates || [],
        candidateRules: data.candidateRules || [],
        disabledRules: data.disabledRules || []
      });
    } catch (err) {
      console.error('Failed to load preferences', err);
    }
  };

  const fetchFeedbackLog = async () => {
    try {
      const data = await ApiClient.getFeedbackLog(selectedLocationId);
      setFeedbackData(data);
    } catch (err) {
      console.error('Failed to load feedback log', err);
    }
  };

  const loadAll = async () => {
    setIsLoading(true);
    await Promise.all([fetchPreferences(), fetchFeedbackLog()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAll();
    if (selectedLocationId !== 'ALL') {
      setNewRuleLocationId(selectedLocationId);
      setTemplateLocationId(selectedLocationId);
    }
  }, [selectedLocationId]);

  const handleApproveCandidate = async (id: string) => {
    await ApiClient.approvePreference(id);
    await fetchPreferences();
  };

  const handleDisableRule = async (id: string) => {
    await ApiClient.disablePreference(id);
    await fetchPreferences();
  };

  const handleDeletePreference = async (id: string) => {
    await ApiClient.deletePreference(id);
    await fetchPreferences();
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleText.trim()) return;
    await ApiClient.createPreference({
      ruleText: newRuleText.trim(),
      ruleCategory: newRuleCategory,
      businessLocationId: newRuleLocationId !== 'ALL' ? newRuleLocationId : undefined
    });
    setNewRuleText('');
    setIsAddingRule(false);
    await fetchPreferences();
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateText.trim()) return;
    await ApiClient.createPreference({
      ruleText: templateText.trim(),
      ruleCategory: 'LOCATION_TEMPLATE',
      templateName: templateName.trim() || 'Location Response Template',
      targetRating: templateRating,
      businessLocationId: templateLocationId !== 'ALL' ? templateLocationId : undefined
    });
    setTemplateName('');
    setTemplateText('');
    setIsAddingTemplate(false);
    await fetchPreferences();
  };

  // Preset Template Helpers
  const insertTemplatePreset = (presetText: string, presetName: string, target = 'ALL') => {
    setTemplateText(presetText);
    setTemplateName(presetName);
    setTemplateRating(target);
  };

  const insertVariable = (variable: string) => {
    setTemplateText((prev) => prev + variable);
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'POLICY_SAFETY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Safety & Policy</span>;
      case 'CONCISENESS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Conciseness</span>;
      case 'ESCALATION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Escalation</span>;
      case 'LOCATION_TEMPLATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">Location Template</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Tone & Style</span>;
    }
  };

  const getRatingBadge = (target: string) => {
    switch (target) {
      case '5_STAR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">5★ Reviews</span>;
      case '1_2_STAR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/25">1★–2★ Critical</span>;
      case '3_STAR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25">3★ Neutral</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">All Ratings</span>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-16 text-xs text-slate-400">Loading AI preferences & learning history...</div>;
  }

  return (
    <div className="space-y-6 text-left max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" /> AI Learned Rules &amp; Optimization
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage brand tone rules, location-specific reply templates, and human feedback learning pipeline.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Rules &amp; Policies ({preferences.activeRules.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'templates'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Location Templates ({preferences.locationTemplates.length})
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'feedback'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Feedback &amp; Prompt Learning ({feedbackData.stats.totalCount})
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: RULES & POLICIES
      ========================================================================= */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Active Learned Rules</h3>
              <p className="text-xs text-slate-400">
                Injected into every generation context to maintain consistency and brand safety.
              </p>
            </div>
            <button
              onClick={() => setIsAddingRule(!isAddingRule)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Rule
            </button>
          </div>

          {/* Add Rule Form */}
          {isAddingRule && (
            <form onSubmit={handleCreateRule} className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
              <h4 className="text-xs font-semibold text-slate-200">Create New Business Rule</h4>
              <textarea
                value={newRuleText}
                onChange={(e) => setNewRuleText(e.target.value)}
                placeholder="e.g. 'Never apologize for strict reservation cancellation policies' or 'Always highlight our dedicated weekend client support team'"
                className="w-full h-18 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Rule Category</label>
                  <select
                    value={newRuleCategory}
                    onChange={(e) => setNewRuleCategory(e.target.value)}
                    className="w-full bg-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 border border-slate-700"
                  >
                    <option value="TONE_STYLE">Tone &amp; Style</option>
                    <option value="POLICY_SAFETY">Safety &amp; Policy</option>
                    <option value="CONCISENESS">Conciseness</option>
                    <option value="ESCALATION">Escalation</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Applicable Location</label>
                  <select
                    value={newRuleLocationId}
                    onChange={(e) => setNewRuleLocationId(e.target.value)}
                    className="w-full bg-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 border border-slate-700"
                  >
                    <option value="ALL">Entire Organization (All Locations)</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRule(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm"
                >
                  Save Rule
                </button>
              </div>
            </form>
          )}

          {/* Candidate Rules Awaiting Confirmation */}
          {preferences.candidateRules.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Sparkles className="w-4 h-4" /> Candidate Rules Awaiting Your Confirmation ({preferences.candidateRules.length})
              </div>
              <div className="space-y-2">
                {preferences.candidateRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(rule.ruleCategory)}
                        <span className="text-[10px] text-amber-400 font-medium">Extracted from user feedback</span>
                        {rule.businessLocation && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-indigo-400" /> {rule.businessLocation.displayName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-200">{rule.ruleText}</p>
                    </div>
                    <button
                      onClick={() => handleApproveCandidate(rule.id)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" /> Activate Rule
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Rules List */}
          <div className="space-y-2">
            {preferences.activeRules.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                No active learned rules configured yet. Click &quot;Add Rule&quot; to define brand preferences.
              </div>
            ) : (
              preferences.activeRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(rule.ruleCategory)}
                      {rule.businessLocation ? (
                        <span className="text-[10px] text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          <MapPin className="w-3 h-3 text-indigo-400" /> {rule.businessLocation.displayName}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded">
                          <Building2 className="w-3 h-3 text-slate-400" /> Organization-wide
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200">{rule.ruleText}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDisableRule(rule.id)}
                      className="text-xs text-slate-500 hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                      title="Disable Rule"
                    >
                      Disable
                    </button>
                    <button
                      onClick={() => handleDeletePreference(rule.id)}
                      className="text-xs text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: LOCATION REPLY TEMPLATES
      ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-400" /> Location Response Blueprints &amp; Templates
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Define how AI replies should be structured for specific branches, locations, or ratings.
              </p>
            </div>
            <button
              onClick={() => setIsAddingTemplate(!isAddingTemplate)}
              className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-md shadow-violet-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Location Template
            </button>
          </div>

          {/* Add Template Modal/Form */}
          {isAddingTemplate && (
            <form onSubmit={handleCreateTemplate} className="p-5 rounded-2xl bg-slate-900 border border-violet-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-violet-400" /> New Location Reply Template
                </h4>
                <div className="text-[11px] text-slate-400">The AI will follow this structure during draft generation</div>
              </div>

              {/* Starter Presets */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-[11px] font-medium text-slate-300 block">Quick Preset Blueprints (Click to Load):</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      insertTemplatePreset(
                        'Hi {reviewer_name}, thank you for visiting us at {location_name}! Our team is thrilled you enjoyed your experience. We truly appreciate your support and look forward to welcoming you back soon. Warm regards, The {business_name} Team',
                        'Warm Local Hospitality',
                        '5_STAR'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/40 transition cursor-pointer"
                  >
                    + 5★ Local Hospitality
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertTemplatePreset(
                        'Dear {reviewer_name}, thank you for sharing your feedback regarding your visit to {location_name}. We take these concerns seriously and regret that your experience fell short. Please reach out to our team privately at our office so we can look into this matter directly.',
                        'Service Recovery & Escalation',
                        '1_2_STAR'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-900/40 transition cursor-pointer"
                  >
                    + 1–2★ Critical Recovery
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertTemplatePreset(
                        'Thank you for the five-star rating, {reviewer_name}! The team at {location_name} truly appreciates your support.',
                        'Concise Star Gratitude',
                        '5_STAR'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-950/40 text-blue-300 border border-blue-500/30 hover:bg-blue-900/40 transition cursor-pointer"
                  >
                    + Concise Star Gratitude
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Target Location</label>
                  <select
                    value={templateLocationId}
                    onChange={(e) => setTemplateLocationId(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 border border-slate-700"
                  >
                    <option value="ALL">All Locations / Org-wide</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Target Sentiment / Rating</label>
                  <select
                    value={templateRating}
                    onChange={(e) => setTemplateRating(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 border border-slate-700"
                  >
                    <option value="ALL">All Ratings &amp; Reviews</option>
                    <option value="5_STAR">5-Star Reviews (Positive)</option>
                    <option value="1_2_STAR">1-Star &amp; 2-Star (Critical)</option>
                    <option value="3_STAR">3-Star (Neutral / Mixed)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Template Name</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. Whitefield Branch 5-Star Format"
                    className="w-full bg-slate-950 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Template Blueprint TextArea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] text-slate-400">Response Template &amp; Flow Blueprint</label>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span>Insert Variable:</span>
                    <button
                      type="button"
                      onClick={() => insertVariable('{reviewer_name}')}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono text-[10px] cursor-pointer"
                    >
                      {'{reviewer_name}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable('{location_name}')}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono text-[10px] cursor-pointer"
                    >
                      {'{location_name}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable('{business_name}')}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono text-[10px] cursor-pointer"
                    >
                      {'{business_name}'}
                    </button>
                  </div>
                </div>
                <textarea
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  placeholder="e.g. Hi {reviewer_name}, thank you for choosing {location_name}! We are delighted to hear you had a great experience. Warmly, The {business_name} Team"
                  className="w-full h-24 bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 leading-relaxed resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingTemplate(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg shadow-sm"
                >
                  Save Location Template
                </button>
              </div>
            </form>
          )}

          {/* List of Configured Location Templates */}
          <div className="space-y-3">
            {preferences.locationTemplates.length === 0 ? (
              <div className="p-10 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-2">
                <Layers className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-xs font-semibold text-slate-300">No Location Templates Created Yet</h4>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Add templates to specify exact reply formats, greeting patterns, and sign-offs customized for each of your business branches.
                </p>
                <button
                  onClick={() => setIsAddingTemplate(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition cursor-pointer"
                >
                  Create Your First Location Template
                </button>
              </div>
            ) : (
              preferences.locationTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-white">
                        {template.templateName || 'Location Response Template'}
                      </span>
                      {getRatingBadge(template.targetRating || 'ALL')}
                      {template.businessLocation ? (
                        <span className="text-[10px] text-violet-300 flex items-center gap-1 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                          <MapPin className="w-3 h-3 text-violet-400" /> {template.businessLocation.displayName}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded">
                          <Building2 className="w-3 h-3 text-slate-400" /> All Locations
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeletePreference(template.id)}
                        className="text-xs text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                        title="Delete Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Template Text preview */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed">
                    &ldquo;{template.ruleText}&rdquo;
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: FEEDBACK & PROMPT OPTIMIZATION
      ========================================================================= */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* Optimization Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Total Feedbacks</span>
              <span className="text-xl font-bold text-white">{feedbackData.stats.totalCount}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Satisfaction Rate</span>
              <span className="text-xl font-bold text-emerald-400">{feedbackData.stats.satisfactionRate}%</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Human Refinements</span>
              <span className="text-xl font-bold text-indigo-400">{feedbackData.stats.correctedCount}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Active Rules Learned</span>
              <span className="text-xl font-bold text-violet-400">{preferences.activeRules.length}</span>
            </div>
          </div>

          {/* Prompt Optimization Engine Explanation */}
          <div className="p-4 rounded-xl bg-indigo-950/25 border border-indigo-500/30 text-xs space-y-1.5">
            <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> Continuous Prompt Optimization Pipeline Active
            </div>
            <p className="text-slate-300 leading-relaxed">
              Whenever you rate a draft, edit response wording, or flag an issue, ReplySpark captures the before &amp; after comparison.
              Recent human corrections are dynamically fed as in-context few-shot learning directly into the AI prompt so the model continuously avoids past mistakes and mirrors your true brand voice.
            </p>
          </div>

          {/* Feedback Log Entries */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Captured Feedback &amp; Refinements ({feedbackData.feedbacks.length})
              </h4>
            </div>

            {feedbackData.feedbacks.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900/30 border border-slate-800 text-center text-xs text-slate-500">
                No feedback recorded yet. Review AI drafts in the Review Inbox and click Thumbs Up/Down or edit text to start teaching the AI.
              </div>
            ) : (
              feedbackData.feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      {fb.rating && fb.rating >= 4 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" /> High Quality
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/25 flex items-center gap-1">
                          <ThumbsDown className="w-3 h-3" /> Needed Refinement
                        </span>
                      )}
                      {getCategoryBadge(fb.feedbackCategory)}
                      {fb.businessLocation && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-indigo-400" /> {fb.businessLocation.displayName}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(fb.createdAt).toLocaleDateString()} by {fb.user?.displayName || 'User'}
                    </span>
                  </div>

                  {fb.feedbackText && (
                    <p className="text-xs text-slate-200 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      <span className="font-semibold text-slate-400">User Note: </span>{fb.feedbackText}
                    </p>
                  )}

                  {/* Before / After comparison if human edit happened */}
                  {fb.correctedText && fb.correctedText !== fb.generatedTextSnapshot ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/20 text-slate-300">
                        <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider block mb-1">
                          Original AI Draft
                        </span>
                        <p className="line-clamp-3 text-[11px] text-slate-300 italic">&ldquo;{fb.generatedTextSnapshot}&rdquo;</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-slate-200">
                        <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                          Human Refinement (Trained into Prompt)
                        </span>
                        <p className="line-clamp-3 text-[11px] text-slate-200 italic">&ldquo;{fb.correctedText}&rdquo;</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Draft Snapshot
                      </span>
                      <p className="text-[11px] text-slate-300 italic">&ldquo;{fb.generatedTextSnapshot}&rdquo;</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
