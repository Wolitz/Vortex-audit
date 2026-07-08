import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Terms of Service</h1>
            <p className="text-lg text-gray-500">WOB Analysis</p>
            <p className="text-sm text-gray-600 mt-4">Last Updated: [Insert Date]</p>
          </div>

          <div className="space-y-8 leading-relaxed">
            
            {/* Section 1 */}
            <section>
              <h3 className="text-xl font-bold text-white mb-3">1. Introduction and Acceptance of Terms</h3>
              <p>These Terms of Service ("Terms") govern your access to and use of the WOB Analysis website, application programming interface, and related services (collectively, the "Service"). The Service is operated by two individuals acting jointly as co-operators of WOB Analysis (referred to herein as "we," "us," or "the Operators"), based respectively in Greece and Serbia. WOB Analysis is not currently organized as a registered company; it is operated by its founders directly, and references in these Terms to "we" or "the Operators" refer to those individuals jointly and severally unless context requires otherwise.</p>
              <p className="mt-4">By creating an account, accessing, or using the Service, you ("User" or "you") agree to be bound by these Terms. If you do not agree, you must not access or use the Service. The Service is intended to be available to users worldwide, and by using it you agree that these Terms apply regardless of the country from which you access the Service, subject to Section 14 (Governing Law) and any mandatory local consumer protection laws that cannot be waived.</p>
              <p className="mt-4">If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization, and "you" refers to both you and that organization.</p>
            </section>

            {/* Section 2 */}
            <section>
              <h3 className="text-xl font-bold text-white mb-3">2. Description of Service</h3>
              <p>WOB Analysis provides automated analysis and advisory feedback regarding video and channel content, including but not limited to estimates, scoring, and recommendations related to platform monetization eligibility, content policy compliance, and related metrics for third-party platforms (including, without limitation, YouTube). The Service may use artificial intelligence models, automated scripts, and third-party infrastructure to generate this analysis.</p>
              <p className="mt-4"><strong className="text-gray-200">The Service is informational and advisory only.</strong> It does not perform official audits on behalf of any third-party platform and has no authority, affiliation, partnership, or integration with YouTube, Google, or any other platform beyond the use of publicly available guidelines and, where applicable, authorized API access.</p>
            </section>

            {/* Section 3 */}
            <section>
              <h3 className="text-xl font-bold text-white mb-3">3. No Guarantee of Platform Monetization or Outcomes</h3>
              <ul className="space-y-3 list-none pl-0">
                <li><strong className="text-gray-200">3.1. No Affiliation or Authority.</strong> WOB Analysis is an independent third-party tool. We are not affiliated with, endorsed by, or acting as an agent of YouTube, Google LLC, or any other platform referenced or analyzed by the Service.</li>
                <li><strong className="text-gray-200">3.2. Estimates Only.</strong> All outputs of the Service — including scores, risk assessments, compliance flags, monetization eligibility predictions, or recommendations — are estimates generated based on publicly available guidelines, heuristics, and/or AI-based inference. They do not constitute a determination, guarantee, or prediction of any decision that YouTube or any other platform will actually make.</li>
                <li><strong className="text-gray-200">3.3. Sole Discretion of Third Platforms.</strong> The final, sole, and exclusive authority over monetization status, demonetization, account strikes, content removal, or any other enforcement or eligibility decision rests entirely with the relevant third-party platform. Their internal review processes, human moderators, automated systems, and policies are entirely outside our knowledge, access, and control, and may differ from, or change independently of, the guidelines used by the Service.</li>
                <li><strong className="text-gray-200">3.4. No Liability for Platform Decisions.</strong> To the maximum extent permitted by law, we shall not be liable for any loss of revenue, demonetization, account suspension, strikes, content takedown, or any other adverse action taken by a third-party platform against you or your content, whether or not you relied on output from the Service. You acknowledge that use of the Service's advice does not insulate you from, and is not a substitute for, your own compliance with the applicable platform's terms of service and policies.</li>
                <li><strong className="text-gray-200">3.5. No Professional Advice.</strong> Output from the Service does not constitute legal, financial, tax, or professional advice. You should independently verify any material decision against the primary source and consult a qualified professional where appropriate.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h3 className="text-xl font-bold text-white mb-3">4. Third-Party AI Processing and Data Lifespan</h3>
              <ul className="space-y-3 list-none pl-0">
                <li><strong className="text-gray-200">4.1. Use of Third-Party Infrastructure.</strong> To perform analysis, content you upload or submit to the Service may be temporarily transmitted to and processed by third-party infrastructure providers (e.g., Google Cloud, Amazon Web Services) and third-party AI model providers (e.g., OpenAI, Anthropic).</li>
                <li><strong className="text-gray-200">4.2. Temporary Storage Only.</strong> Files and content you submit are held in temporary storage solely for the duration necessary to complete the requested analysis. Upon completion, submitted files are deleted from our active processing infrastructure.</li>
                <li><strong className="text-gray-200">4.3. No Permanent Content Storage.</strong> We do not permanently store, repurpose, sell, license, or use your uploaded video or channel content for any purpose beyond delivering the requested analysis.</li>
                <li><strong className="text-gray-200">4.4. Metadata and Results Retention.</strong> We may retain the results of an analysis and account-level usage metadata for the purposes of providing your account history and enforcing usage limits.</li>
                <li><strong className="text-gray-200">4.5. No Guarantee Against Sub-Processor Breach.</strong> While we select reputable Sub-Processors, we cannot guarantee against unauthorized access, breach, or failure occurring at the infrastructure level of a third-party provider.</li>
              </ul>
            </section>

            {/* Abridged Remaining Sections for styling purposes */}
            <section>
              <h3 className="text-xl font-bold text-white mb-3">5. Subscription, Free Trial, and Billing Terms</h3>
              <p>Except where required by applicable mandatory consumer protection law, all subscription fees are <strong className="text-gray-200">non-refundable</strong>, including for partial billing periods, unused audits, or early cancellation. This reflects the fact that each audit incurs real, non-recoverable third-party API and infrastructure costs at the time it is run.</p>
              <p className="mt-4">Each subscription tier includes a defined monthly allowance of audits or analyses. Upon reaching your Usage Limit, further audit requests may be blocked until your billing cycle renews.</p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-white mb-3">6. Acceptable Use, API Abuse, and Rate Limiting</h3>
              <p>You agree not to circumvent, disable, or attempt to bypass any usage limits; reverse-engineer the underlying prompts or algorithms; or send excessive volumes of requests intended to degrade our infrastructure.</p>
              <p className="mt-4">We reserve the right to throttle request rates, suspend API access, or terminate accounts if we reasonably believe you have violated these terms.</p>
            </section>

            <section className="bg-white/5 p-6 rounded-2xl border border-white/10 mt-8">
              <h3 className="text-lg font-bold text-white mb-2">Disclaimers & Limitation of Liability</h3>
              <p className="text-sm uppercase tracking-wider text-gray-400 leading-relaxed mb-4">
                The service is provided "as is" and "as available," without warranties of any kind. We do not warrant that the service will be uninterrupted or that any analysis will produce any particular outcome on any third-party platform.
              </p>
              <p className="text-sm uppercase tracking-wider text-gray-400 leading-relaxed">
                To the maximum extent permitted by law, the operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-white mb-3">7. Governing Law and Dispute Resolution</h3>
              <p>Given that the Service is operated jointly by individuals based in Greece and Serbia, these Terms shall be governed by the laws of Greece, without regard to conflict-of-law principles, except where mandatory local consumer protection laws in your country of residence provide otherwise.</p>
            </section>

            <div className="mt-12 pt-8 border-t border-white/10 text-sm text-gray-500 italic">
              *This document does not constitute legal advice. Because WOB Analysis is operated by individuals and serves users across multiple jurisdictions, we strongly recommend having these Terms reviewed by a qualified attorney.*
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}