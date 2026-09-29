import React from "react";
import { FileText, Shield, CheckCircle2, AlertTriangle, Scale, Lock, RefreshCw } from "lucide-react";

export const TermsSection: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 text-zinc-200">
      {/* Top Banner */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-white border border-white/20 text-xs font-semibold mb-3 backdrop-blur-xs">
            <Scale className="w-3.5 h-3.5" />
            <span>Legal &amp; Policy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Terms of Service
          </h1>
          <p className="text-amber-100 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            Welcome to VenkateshBhaiya AI Assistant — Website Version 1.0. Please review the rules,
            responsibilities, and usage boundaries governing your access.
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 sm:p-6 shadow-lg backdrop-blur-xl space-y-3">
        <div className="flex items-center gap-2 text-amber-400 text-xs sm:text-sm font-bold uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4" />
          <span>At a Glance</span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          By accessing or using VenkateshBhaiya AI Assistant, you agree to comply with these terms.
          The website provides automated conversational artificial intelligence for educational,
          creative, and technical productivity purposes.
        </p>
      </div>

      {/* Terms Sections */}
      <div className="space-y-4">
        {/* 1. Nature of the AI Service */}
        <section className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-2.5">
          <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">
              1
            </span>
            Nature of the AI Assistant
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            VenkateshBhaiya AI Assistant utilizes state-of-the-art server-side generative artificial intelligence.
            While designed to be polite, accurate, and helpful, AI-generated responses can occasionally contain
            minor inaccuracies or hallucinations. Outputs are for informational and conceptual purposes and
            must not be treated as certified professional, legal, medical, or financial advice.
          </p>
        </section>

        {/* 2. Acceptable Use Policy */}
        <section className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-2.5">
          <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">
              2
            </span>
            Acceptable Use &amp; Community Conduct
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            You agree not to use this service to:
          </p>
          <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1 pl-2">
            <li>Generate abusive, hateful, defamatory, or unlawful material.</li>
            <li>Attempt unauthorized automated scraping, denial-of-service, or server exploitation.</li>
            <li>Impersonate Venkatesh Bhaiya or any other individual or entity.</li>
            <li>Transmit malware, harmful scripts, or automated spambots.</li>
          </ul>
        </section>

        {/* 3. Accounts & Authentication */}
        <section className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-2.5">
          <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">
              3
            </span>
            User Accounts &amp; Verified Identity
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Registered accounts are authenticated via verified identity providers (Google, Microsoft, or verified Email).
            You are responsible for safeguarding your login credentials. Guest mode provides temporary, non-permanent access
            that does not persist across different devices or browser sessions.
          </p>
        </section>

        {/* 4. Data Ownership & Deletion */}
        <section className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-2.5">
          <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">
              4
            </span>
            Your Data Ownership &amp; Account Deletion
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            You retain ownership of your user queries. Your chat history is scoped strictly to your authenticated account ID
            and is never shared with other users. You may permanently delete your conversations or your entire account at any
            time directly from the Settings or Profile menus.
          </p>
        </section>

        {/* 5. Limitation of Liability */}
        <section className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-2.5">
          <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">
              5
            </span>
            Limitation of Liability
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The website and AI services are provided "as is" and "as available". In no event shall the creators,
            Venkatesh Bhaiya, or affiliated maintainers be liable for any indirect, incidental, or consequential damages
            arising from the use or inability to use this service.
          </p>
        </section>
      </div>

      {/* Footer info */}
      <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-center text-xs text-zinc-500">
        Website Version 1.0 • Last updated September 2026 • VenkateshBhaiya AI Assistant
      </div>
    </div>
  );
};
