import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | ReplySpark',
  description: 'Privacy Policy for ReplySpark AI-Powered Google Review Management platform.'
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-200 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              Reply<span className="text-emerald-400">Spark</span>
            </span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4" />
          Legal &amp; Compliance
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-xs text-slate-400 mb-8">Last Updated: November 4, 2026</p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">1. Information We Collect</h2>
            <p>
              ReplySpark collects basic account profile information (name and email address) and, when authorized by
              you via Google OAuth 2.0, access tokens required to read your Google Business Profile locations, reviews,
              and publish owner replies that you explicitly approve.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2. How We Use Google User Data</h2>
            <p>
              We use your Google Business Profile data strictly to synchronize customer reviews into your ReplySpark
              workspace, generate AI-assisted reply drafts based on your organization&apos;s tone preferences, and post
              approved replies back to Google Business Profile on your behalf. We do not sell or share your Google data
              with third-party advertisers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">3. Google API Limited Use Disclosure</h2>
            <p>
              ReplySpark&apos;s use and transfer to any other app of information received from Google APIs will adhere to
              the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">4. Data Security &amp; Revocation</h2>
            <p>
              All OAuth tokens and review data are stored securely in encrypted databases. You may disconnect your
              Google Business Profile connection at any time from the ReplySpark dashboard or revoke access directly in
              your Google Account Security settings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">5. Contact Us</h2>
            <p>
              For questions regarding this Privacy Policy or your data, contact us at{' '}
              <a href="mailto:tools@advaitlabs.com" className="text-indigo-400 hover:underline">
                tools@advaitlabs.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

