import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#060606] text-gray-300 py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#2DD4BF] selection:text-black">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation */}
        <Link 
          href="/" 
          className="inline-flex items-center space-x-2 text-[#2DD4BF] hover:text-[#A78BFA] transition-colors duration-300 mb-10 font-medium"
        >
          <ArrowLeft size={20} />
          <span>Back to Login</span>
        </Link>

        {/* Document Container */}
        <div className="bg-black/50 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-sm">
          
          <div className="border-b border-white/10 pb-8 mb-8">
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Privacy Policy</h1>
            <p className="text-lg text-gray-500">WOB Analysis</p>
            <p className="text-sm text-gray-600 mt-4">Last Updated: [Insert Date]</p>
          </div>

          <div className="space-y-8 leading-relaxed">
            
            {/* Section 1 & 2 */}
            <section>
              <h3 className="text-xl font-bold text-white mb-3">1. Introduction</h3>
              <p>This Privacy Policy explains how WOB Analysis ("we," "us," "the Operators") collects, uses, stores, shares, and protects information when you use our website, application, and API services (the "Service"). WOB Analysis is operated jointly by two individuals based in Greece and Serbia, and is offered to users globally. This Policy should be read together with our Terms of Service.</p>
              <p className="mt-4">Because we serve users worldwide, including residents of the European Union/European Economic Area, we have designed this Policy to align with the principles of the EU General Data Protection Regulation ("GDPR") as a general baseline, in addition to complying with other applicable data protection laws where they apply to you.</p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-white mb-3">2. Who Is Responsible for Your Data</h3>
              <p>WOB Analysis is not currently a registered legal entity; it is run directly by its two founders, jointly and severally responsible for data handling decisions described in this Policy. For any privacy inquiry, data request, or complaint, contact: <strong className="text-gray-200">[Insert contact email]</strong>.</p>
            </section>

            {/* Section 3 */}
            <section>
              <h3 className="text-xl font-bold text-white mb-3">3. Information We Collect</h3>
              
              <h4 className="text-lg font-semibold text-gray-200 mt-4 mb-2">3.1 Information You Provide Directly</h4>
              <ul className="list-disc pl-5 space-y-2 text-gray-400">
                <li><strong className="text-gray-300">Account information:</strong> name, email address, password (hashed), country of residence, billing details.</li>
                <li><strong className="text-gray-300">Payment information:</strong> processed by our third-party payment processor — we do not store full card numbers ourselves.</li>
                <li><strong className="text-gray-300">Content you submit for analysis:</strong> videos, video links, thumbnails, titles, descriptions, transcripts, channel metadata, or other content you upload or connect for auditing ("Submitted Content").</li>
                <li><strong className="text-gray-300">Communications:</strong> messages you send us via support channels, email, or in-app forms.</li>
              </ul>

              <h4 className="text-lg font-semibold text-gray-200 mt-6 mb-2">3.2 Information Collected Automatically</h4>
              <ul className="list-disc pl-5 space-y-2 text-gray-400">
                <li><strong className="text-gray-300">Usage data:</strong> pages visited, features used, audit history, timestamps, session duration.</li>
                <li><strong className="text-gray-300">Device and technical data:</strong> IP address, browser type, operating system, device identifiers.</li>
                <li><strong className="text-gray-300">Cookies and similar technologies:</strong> used for authentication, session persistence, analytics, and marketing.</li>
              </ul>
            </section>

            {/* Section 4 & 5 */}
            <section>
              <h3 className="text-xl font-bold text-white mb-3">4. How We Use Your Information</h3>
              <p className="mb-4">We use the information described above to create and manage your account, perform the audits you request, process payments, enforce usage limits, communicate with you, and secure the Service.</p>
              <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                <p className="text-gray-200 font-medium">
                  We do <strong className="text-[#2DD4BF]">not</strong> use your Submitted Content (e.g., your video files) to train our own AI models or to train third-party AI models beyond what is strictly required to return your requested analysis, and we do not sell your Submitted Content to third parties.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-white mb-3">5. Legal Basis for Processing (GDPR)</h3>
              <p>Where GDPR applies to you, we rely on the following legal bases: Performance of a contract, Legitimate interests, Consent (which you may withdraw at any time), and Legal obligation.</p>
            </section>

            {/* Section 6 - Crucial Section */}
            <section>
              <h3 className="text-xl font-bold text-white mb-3">6. Third-Party Processing & Data Lifespan</h3>
              <ul className="space-y-4 list-none pl-0">
                <li>
                  <strong className="text-gray-200 block mb-1">6.1 Sub-Processors.</strong> 
                  To deliver the Service, we route certain data through third-party infrastructure (e.g., Google Cloud Platform) and AI providers (e.g., OpenAI, Anthropic). Each Sub-Processor only receives the minimum data necessary.
                </li>
                <li>
                  <strong className="text-gray-200 block mb-1">6.2 Temporary Processing of Submitted Content.</strong> 
                  Video files and other Submitted Content are held only for the duration necessary to complete the analysis and are deleted from our active systems once the audit is complete.
                </li>
                <li>
                  <strong className="text-gray-200 block mb-1">6.3 No Permanent Storage of Raw Content.</strong> 
                  We do not permanently store your raw video files after an audit completes, and we do not use them to build a searchable library.
                </li>
                <li>
                  <strong className="text-gray-200 block mb-1">6.4 Retained Results and Metadata.</strong> 
                  We retain the <em>output</em> of your audits (scores, flagged issues) and usage metadata as part of your account history until you delete your account.
                </li>
              </ul>
            </section>

            {/* Abridged Remaining Sections */}
            <section>
              <h3 className="text-xl font-bold text-white mb-3">7. Your Rights</h3>
              <p>Depending on your location, you may have rights regarding your personal data, including the right to access, rectify, erase, restrict processing, or port your data. To exercise any of these rights, contact us at <strong className="text-gray-200">[Insert contact email]</strong>.</p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-white mb-3">8. Data Retention & Security</h3>
              <p>Account data is retained for as long as your account is active. Submitted Content is processed temporarily and deleted after analysis. We implement reasonable technical and organizational measures to protect your data, though no method of transmission or storage is 100% secure.</p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-white mb-3">9. Third-Party Platform Connections</h3>
              <p>If you connect a third-party account (such as YouTube via Google OAuth), your use of that connection is also governed by that platform's own privacy policy. We only request the scope of access necessary to perform the analysis you request.</p>
            </section>

            <div className="mt-12 pt-8 border-t border-white/10 text-sm text-gray-500 italic">
              *This document does not constitute legal advice. Given that WOB Analysis is operated by individuals and serves a global user base, we strongly recommend having this Policy reviewed by a qualified attorney.*
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}