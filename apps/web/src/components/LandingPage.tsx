'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  Zap,
  MapPin,
  RefreshCw,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { ApiClient } from '../lib/api';

interface LandingPageProps {
  onOpenAuthModal?: () => void;
}

export function LandingPage({ onOpenAuthModal }: LandingPageProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const res = await ApiClient.getGoogleLoginUrl();
      if (res.url) {
        window.location.href = res.url;
      } else {
        throw new Error('Could not generate Google authorization link');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start Google sign in.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight font-['Outfit']">
                Reply<span className="text-emerald-400">Spark</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-medium">
                Google Review AI Suite
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hidden sm:inline text-xs text-slate-400 hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hidden sm:inline text-xs text-slate-400 hover:text-white transition">
              Terms of Service
            </Link>
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
              >
                Email Sign In
              </button>
            )}
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-700" />
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Login with Gmail</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI-Powered Google Business Profile Review Management</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight font-['Outfit'] leading-tight">
            AI proposes. Humans decide.{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Every customer review answered.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            ReplySpark connects directly to your Google Business Profile locations to sync customer reviews, draft
            on-brand AI responses tailored to your past replies, and publish approved responses in one click.
          </p>

          {error && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Call to Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 text-sm font-bold shadow-xl shadow-indigo-500/10 transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Sign in with Google (Gmail)</span>
              <ArrowRight className="w-4 h-4 text-slate-600" />
            </button>

            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold transition cursor-pointer"
              >
                Sign in with Email &amp; Password
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-slate-300 underline hover:text-emerald-400">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-slate-300 underline hover:text-emerald-400">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-white">Multi-Location Google Sync</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect your Google Business Profile account via OAuth 2.0 to discover locations and synchronize customer
              reviews into a unified inbox.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-white">Style-Aware AI Reply Drafts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatically learns from your existing replies and active tone rules to generate context-aware draft
              responses for every new review.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-base font-semibold text-white">Human-in-the-Loop Approval</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No reply is ever published without your explicit approval. Edit drafts, teach the AI new rules from your
              corrections, and publish with full audit logs.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-6 bg-[#090d16]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">ReplySpark</span>
            <span>— AI-Powered Google Review Management SaaS</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms of Service
            </Link>
            <a href="mailto:tools@advaitlabs.com" className="hover:text-white transition">
              Contact Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

