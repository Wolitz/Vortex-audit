"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Zap } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#060606] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2DD4BF]/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-[#A78BFA]/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md p-8 bg-black/80 border border-[#1A1A1A] rounded-3xl shadow-2xl backdrop-blur-md relative z-10">
        
        <div className="flex flex-col items-center text-center space-y-6 mb-10">
          <div className="w-16 h-16 bg-[#2DD4BF]/10 border border-[#2DD4BF]/20 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(45,212,191,0.2)]">
            <Sparkles className="text-[#2DD4BF]" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#E0E0E0] tracking-tight">Vortex Engine</h1>
            <p className="text-gray-500 text-sm mt-2 font-medium">Enterprise Monetization Compliance</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3 text-sm text-gray-400 p-3 bg-white/5 rounded-xl border border-white/5">
                <ShieldCheck className="text-[#A78BFA]" size={18} />
                <span>Secure access via Google Workspace</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-400 p-3 bg-white/5 rounded-xl border border-white/5">
                <Zap className="text-[#2DD4BF]" size={18} />
                <span>Instant global codices sync</span>
            </div>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full relative group overflow-hidden rounded-xl p-[1px]"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-[#2DD4BF] to-[#A78BFA] rounded-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300"></span>
          <div className="relative flex items-center justify-center space-x-3 bg-black px-6 py-4 rounded-xl transition-all duration-300 group-hover:bg-opacity-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="font-bold text-white tracking-wide">Continue with Google</span>
          </div>
        </button>

        {/* Updated Consent Disclaimer */}
        <p className="text-center text-xs text-gray-500 mt-6 leading-relaxed">
          By continuing, you agree to our <br/>
          <Link href="/terms" className="text-[#2DD4BF] hover:text-[#A78BFA] hover:underline transition-colors">
            Terms of Service
          </Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-[#2DD4BF] hover:text-[#A78BFA] hover:underline transition-colors">
            Privacy Policy
          </Link>.
        </p>
      </div>
    </div>
  );
}