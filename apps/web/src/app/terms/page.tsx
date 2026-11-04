import React from 'react';
import Link from 'next/link';
import { Sparkles, FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | ReplySpark',
  description: 'Terms of Service for ReplySpark AI-Powered Google Review Management platform.'
};

export default function TermsOfServicePage() {
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

        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <FileText className="w-4 h-4" />
          Terms &amp; Conditions
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-xs text-slate-400 mb-8">Last Updated: November 4, 2026</p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing and using ReplySpark, you agree to comply with and be bound by these Terms of Service. If
              you do not agree to these terms, please do not use the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2. Human-in-the-Loop AI Responsibility</h2>
            <p>
              ReplySpark generates AI-proposed draft replies to customer reviews. You retain full control and
              responsibility for reviewing, editing, and approving any reply before it is published to your Google
              Business Profile listings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">3. Authorized Account Access</h2>
            <p>
              You represent that you are authorized to manage the Google Business Profile locations connected to your
              ReplySpark organization and that your use complies with Google&apos;s Business Profile policies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">4. Limitation of Liability</h2>
            <p>
              ReplySpark is provided &quot;as is&quot; without warranties of any kind. Advait Labs shall not be liable for any
              indirect, incidental, or consequential damages arising from the use of this service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">5. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact{' '}
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

