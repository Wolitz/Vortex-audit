"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inter } from "next/font/google";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import { 
  BarChartBig, Clock3, LayoutDashboard, Target, Users, BookOpen, Settings, Search, 
  Mail, Calendar, ArrowLeft, UploadCloud, FileVideo, X, CheckCircle, Check,
  AlertTriangle, Sparkles, Zap, BrainCircuit, Mic, FileText, BotMessageSquare, ShieldCheck, Trash2, PlayCircle, Download, LogOut
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

// --- Global Functional Styles ---
const panelStyle = "bg-black/90 border border-[#1A1A1A] rounded-3xl p-6 shadow-neon-subtle overflow-hidden relative";
const innerCardStyle = "p-3 bg-black/90 border border-[#1A1A1A] rounded-2xl";
const accentText = "text-[#2DD4BF]"; 
const riskText = "text-[#A78BFA]"; 
const subtleText = "text-gray-500";

export default function Home() {
  // ==========================================
  // 1. ALL REACT HOOKS (State, Refs, Auth)
  // ==========================================
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [auditProfile, setAuditProfile] = useState("Standard");
  const [activeTab, setActiveTab] = useState("Audit Vortex");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [points, setPoints] = useState<{id: number, cx: string, cy: string, r: number}[]>([]);
  
  // Pricing Modal State
  const [showPricing, setShowPricing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null); 

  // FIX: Destructure the 'update' function to force session refreshes
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const currentTier = useMemo(() => session?.user?.planTier || "FREE", [session?.user?.planTier]);


  // ==========================================
  // 2. ALL USE-EFFECTS & MEMOS
  // ==========================================
  
// Instead of your current useEffect, use this cleaner version:
useEffect(() => {
    // If we are still loading, don't do anything yet
    if (status === "loading") return;

    // Only if loading is finished AND we are truly unauthenticated, redirect
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // FIX: Listen for Stripe Redirects and Refresh Session
// FIX: Listen for Stripe Redirects, Wait for Webhook, and Refresh Session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      
      if (urlParams.get("success") === "true") {
        // 1. Hide the pricing modal immediately
        setShowPricing(false);
        
        // 2. Clean up the URL so it looks professional
        window.history.replaceState(null, "", window.location.pathname);
        
        // 3. THE FIX: Wait 2.5 seconds to let the Stripe Webhook update the database
        // before forcing NextAuth to fetch the fresh data.
        setTimeout(() => {
          window.location.href = "/"; // This triggers a full page reload
        }, 1000);
      }
      
      if (urlParams.get("canceled") === "true") {
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, [update]);

  useEffect(() => {
    if (session?.user?.id) {
      setTimeout(() => {
        const savedHistory = localStorage.getItem(`wobAuditHistory_${session.user.id}`);
        if (savedHistory) {
          setAuditHistory(JSON.parse(savedHistory));
        }
        setIsLoadingHistory(false); 
      }, 600);
    }
  }, [session?.user?.id]);

  const videoUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return "";
  }, [file]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => {
    const p = [];
    for (let i = 0; i < 20; i++) {
        p.push({
            id: i,
            cx: `${Math.random() * 80 + 10}%`,
            cy: `${Math.random() * 80 + 10}%`,
            r: Math.random() * 2 + 1,
        });
    }
    setPoints(p);
  }, []);


  // ==========================================
  // 3. EARLY RETURNS (Must be after ALL hooks)
  // ==========================================
  if (status === "loading") {
    return (
      <div className="h-screen w-full bg-[#060606] flex items-center justify-center">
        <Sparkles className="text-[#2DD4BF] animate-pulse" size={40} />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="h-screen w-full bg-[#060606] flex items-center justify-center">
        <Sparkles className="text-[#2DD4BF] animate-pulse" size={40} />
      </div>
    );
  }

  // Get current tier with a safe fallback
  // This will now update automatically when session.user changes
  // ==========================================
  // 4. REGULAR FUNCTIONS (Audit & Stripe)
  // ==========================================
  
  const handleUpgrade = async (tier: "STARTER" | "PRO" | "MAX") => {
    try {
      setIsRedirecting(tier);
      const response = await fetch("/api/stripe/checkout", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }) 
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
      
    } catch (error: any) {
      console.error("Failed to redirect to checkout", error);
      alert(error.message || "Billing system is currently syncing. Please try again later.");
      setIsRedirecting(null);
    }
  };

  const handlePortal = async () => {
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("Failed to redirect to portal", error);
    }
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to purge your personal manifest logs?")) {
      setAuditHistory([]);
      if (session?.user?.id) {
        localStorage.removeItem(`wobAuditHistory_${session.user.id}`);
      }
    }
  };

  const jumpToTime = (timestamp: string) => {
    if (!videoRef.current) return;
    const [minutes, seconds] = timestamp.split(":").map(Number);
    const totalSeconds = (minutes * 60) + seconds;
    
    videoRef.current.currentTime = totalSeconds;
    videoRef.current.play(); 
  };

  const exportManifest = () => {
    if (!auditResult || !file) return;

    const reportContent = `
=========================================
      WOB COMPLIANCE MANIFEST
=========================================
Entity Scanned: ${file.name}
Audit Scope: ${auditProfile}
System Risk Factor: ${auditResult.riskScore}%
Status: ${auditResult.riskScore > 0 ? "FLAGGED FOR REVIEW" : "CLEARED FOR MONETIZATION"}

-----------------------------------------
ANOMALIES DETECTED
-----------------------------------------
${auditResult.issues && auditResult.issues.length > 0 
  ? auditResult.issues.map((issue: any) => `[${issue.timestamp}] ${issue.policy}\nDetails: ${issue.description}`).join('\n\n')
  : "No codex violations detected in this entity."
}

-----------------------------------------
AI DIRECTIVE / RECOMMENDATIONS
-----------------------------------------
${auditResult.recommendations || "No further action required. Ready for upload."}

=========================================
Generated by WOB Analysis Engine
=========================================
    `;

    const blob = new Blob([reportContent.trim()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `WOB_Manifest_${file.name.replace(/\.[^/.]+$/, "")}.txt`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalAudits = auditHistory.length;
  const risksDetected = auditHistory.filter((a) => a.status === "flagged").length;
  const compliantAudits = totalAudits - risksDetected;
  const avgCompliance = totalAudits > 0 
    ? Math.round(auditHistory.reduce((acc, curr) => acc + curr.compliance, 0) / totalAudits) 
    : 0;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("video/")) {
        setFile(droppedFile);
      } else {
        alert("Please upload a valid video file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    setAuditResult(null); 
  };

 const runAudit = async () => {
    // 1. Safety check
    if (!file) return;

    // 2. STRICT PAYWALL CHECK: Users must have at least the Starter tier
    if (currentTier === "FREE") {
      setShowPricing(true);
      return;
    }

    setIsAuditing(true);
    
    const formData = new FormData();
    // The ! tells TypeScript "I promise 'file' is not null"
    formData.append("video", file!); 
    formData.append("profile", auditProfile);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        body: formData, 
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setShowPricing(true);
          throw new Error(data.error || "Usage limit reached.");
        }
        throw new Error(data.error || "Audit failed");
      }

      setAuditResult(data);
      const newAuditRecord = {
        id: Date.now(),
        title: file.name,
        scope: auditProfile,
        status: data.riskScore > 0 ? "flagged" : "scanned",
        compliance: 100 - data.riskScore,
      };

      setAuditHistory((prev) => {
        const updatedHistory = [newAuditRecord, ...prev].slice(0, 20); 
        if (session?.user?.id) {
          localStorage.setItem(`wobAuditHistory_${session.user.id}`, JSON.stringify(updatedHistory));
        }
        return updatedHistory;
      });

    } catch (error: any) {
      console.error(error);
      alert(error.message || "There was an error processing the video.");
    } finally {
      setIsAuditing(false);
    }
  };


  // ==========================================
  // 5. MAIN RENDER
  // ==========================================
  return (
    <main className={`min-h-screen bg-[#060606] text-[#E0E0E0] ${inter.className}`}>
      
      {/* --- PRICING MODAL OVERLAY --- */}
      <AnimatePresence>
        {showPricing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
          >
            <div className="absolute inset-0" onClick={() => setShowPricing(false)}></div>
            
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-[#0a0a0a] border border-[#1A1A1A] rounded-3xl p-8 shadow-2xl z-10"
            >
              <button 
                onClick={() => setShowPricing(false)}
                className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white hover:bg-[#1A1A1A] rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-10 mt-4">
                <h2 className="text-3xl font-extrabold tracking-tight mb-3">Upgrade Your Engine</h2>
                <p className="text-gray-400">Select a tier to unlock the AI manifest and start scanning.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* STARTER TIER */}
                <div className="bg-[#111] border border-[#262626] rounded-2xl p-6 flex flex-col hover:border-[#2DD4BF]/50 transition-colors">
                  <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-extrabold">$10</span>
                    <span className="text-gray-500 ml-1">/mo</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-6 flex-grow">Perfect for growing creators making weekly videos.</p>
                  
                  <ul className="space-y-3 mb-8 text-sm text-gray-300">
                    <li className="flex items-center space-x-3"><Check size={16} className="text-[#2DD4BF]" /><span><strong>30</strong> AI Audits per month</span></li>
                    <li className="flex items-center space-x-3"><Check size={16} className="text-[#2DD4BF]" /><span>Standard Processing Speed</span></li>
                    <li className="flex items-center space-x-3"><Check size={16} className="text-[#2DD4BF]" /><span>7-Day Free Trial</span></li>
                  </ul>

                  <button 
                    onClick={() => handleUpgrade("STARTER")}
                    disabled={isRedirecting !== null}
                    className="w-full py-3 rounded-xl bg-[#1A1A1A] hover:bg-[#262626] border border-[#333] text-white font-medium transition-colors"
                  >
                    {isRedirecting === "STARTER" ? "Syncing..." : "Start Free Trial"}
                  </button>
                </div>

                {/* PRO TIER */}
                <div className="bg-gradient-to-b from-[#1A1A1A] to-[#0a0a0a] border border-[#A78BFA] rounded-2xl p-6 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_30px_rgba(167,139,250,0.15)]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#A78BFA] text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Most Popular</div>
                  <h3 className="text-xl font-bold text-[#A78BFA] mb-2 mt-2">Pro</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-extrabold text-white">$19</span>
                    <span className="text-gray-500 ml-1">/mo</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-6 flex-grow">The sweet spot for daily uploaders and serious channels.</p>
                  
                  <ul className="space-y-3 mb-8 text-sm text-gray-200">
                    <li className="flex items-center space-x-3"><Check size={16} className="text-[#A78BFA]" /><span><strong>60</strong> AI Audits per month</span></li>
                    <li className="flex items-center space-x-3"><Check size={16} className="text-[#A78BFA]" /><span>Fast Engine Processing</span></li>
                    <li className="flex items-center space-x-3"><Check size={16} className="text-[#A78BFA]" /><span>Export Manifest Data</span></li>
                  </ul>

                  <button 
                    onClick={() => handleUpgrade("PRO")}
                    disabled={isRedirecting !== null}
                    className="w-full py-3 rounded-xl bg-[#A78BFA] hover:bg-[#b8a1fa] text-black font-bold transition-colors shadow-lg"
                  >
                    {isRedirecting === "PRO" ? "Syncing..." : "Upgrade to Pro"}
                  </button>
                </div>

                {/* MAX TIER */}
                <div className="bg-[#111] border border-[#262626] rounded-2xl p-6 flex flex-col hover:border-[#2DD4BF]/50 transition-colors">
                  <h3 className="text-xl font-bold text-white mb-2">Max</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-extrabold">$45</span>
                    <span className="text-gray-500 ml-1">/mo</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-6 flex-grow">Agency volume. Audit multiple channels daily without limits.</p>
                  
                  <ul className="space-y-3 mb-8 text-sm text-gray-300">
                    <li className="flex items-center space-x-3"><Check size={16} className="text-[#2DD4BF]" /><span><strong>150</strong> AI Audits per month</span></li>
                    <li className="flex items-center space-x-3"><Check size={16} className="text-[#2DD4BF]" /><span>Priority Queueing</span></li>
                    <li className="flex items-center space-x-3"><Check size={16} className="text-[#2DD4BF]" /><span>Multi-Profile Strictness</span></li>
                  </ul>

                  <button 
                    onClick={() => handleUpgrade("MAX")}
                    disabled={isRedirecting !== null}
                    className="w-full py-3 rounded-xl bg-[#1A1A1A] hover:bg-[#262626] border border-[#333] text-white font-medium transition-colors"
                  >
                    {isRedirecting === "MAX" ? "Syncing..." : "Get Max"}
                  </button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen w-full relative overflow-hidden">
        
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
            {points.map(p => (
                <div key={p.id} className="absolute rounded-full bg-[#2DD4BF]" style={{ width: `${p.r}px`, height: `${p.r}px`, left: p.cx, top: p.cy, filter: 'blur(1px)' }}></div>
            ))}
        </div>

        <aside className="w-64 z-10 border-r border-[#1A1A1A] bg-black/90 p-8 flex flex-col space-y-12 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <Sparkles className={accentText} size={28} />
            <h1 className="text-2xl font-bold tracking-tight">WOB</h1>
          </div>

          <nav className="flex-grow space-y-4">
            <SidebarItem 
              icon={FileVideo} 
              label="Audit Engine" 
              active={activeTab === "Audit Vortex"} 
              onClick={() => setActiveTab("Audit Vortex")} 
            />
            <SidebarItem 
              icon={BookOpen} 
              label="Policy Codices" 
              badge="LIVE" 
              active={activeTab === "Policy Codices"} 
              onClick={() => setActiveTab("Policy Codices")} 
            />
          </nav>
        </aside>

        <div className="flex-grow grid grid-cols-3 gap-8 p-8 overflow-y-auto z-10">
          
          {activeTab === "Audit Vortex" && (
            <div className="col-span-2 space-y-8">
              <header className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight">Compliance Flow</h1>
                </div>
                
                <div className={`${innerCardStyle} flex items-center space-x-3 px-4 relative transition-colors duration-500`}>
                  <div className={`absolute inset-0 ${risksDetected > 0 ? 'bg-[#A78BFA]/10' : 'bg-[#2DD4BF]/10'} blur-xl opacity-20`}></div>
                  <div className="z-10">
                    <p className="text-sm text-gray-500">System Monetization Risk</p>
                    <p className={`text-3xl font-bold tracking-tighter ${risksDetected > 0 ? riskText : accentText}`}>
                      {risksDetected > 0 ? "Elevated" : "Minimal"} 
                      <span className="text-gray-600 text-lg font-normal ml-2">-</span>
                    </p>
                  </div>
                  <div className={`h-10 w-10 z-10 rounded-full flex items-center justify-center p-2.5 border ${
                    risksDetected > 0 
                      ? 'bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/20' 
                      : 'bg-[#2DD4BF]/10 text-[#2DD4BF] border-[#2DD4BF]/20'
                  }`}>
                      {risksDetected > 0 ? <AlertTriangle /> : <CheckCircle />}
                  </div>
                </div>
              </header>

              <div className={panelStyle}>
                <h2 className="text-xl font-semibold mb-6 flex items-center space-x-2">
                    <Clock3 />
                    <span>Audit Initiation Zone</span>
                </h2>
                
                <div className="relative group min-h-[300px]">
                  <AnimatePresence mode="wait">
                    {!file ? (
                      <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`relative flex flex-col items-center justify-center w-full h-72 border-2 rounded-3xl transition-colors cursor-pointer group ${
                          isDragging 
                            ? "border-[#A78BFA] bg-black/50" 
                            : "border-[#1A1A1A] bg-black group-hover:border-[#262626] group-hover:bg-[#060606]"
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                        
                        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full p-4 pointer-events-none group-hover:opacity-100 opacity-60">
                          <defs>
                            <radialGradient id="vortexGradient">
                              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.4"/>
                              <stop offset="50%" stopColor="#2DD4BF" stopOpacity="0"/>
                              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0"/>
                            </radialGradient>
                            <radialGradient id="dragGradient">
                                <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.4"/>
                                <stop offset="50%" stopColor="#A78BFA" stopOpacity="0"/>
                                <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0"/>
                            </radialGradient>
                          </defs>
                          <circle cx="50" cy="50" r="45" fill={isDragging ? 'url(#dragGradient)' : 'url(#vortexGradient)'} style={{ filter: 'blur(3px)' }}/>
                          <g>
                              {points.map(p => (
                                  <circle key={p.id} cx={p.cx} cy={p.cy} r={p.r} fill={isDragging ? "#A78BFA" : "#2DD4BF"} className={p.id % 2 === 0 ? "opacity-30" : "opacity-60"} />
                              ))}
                          </g>
                        </svg>
                        
                        <div className="flex flex-col items-center space-y-4 pointer-events-none text-center z-10 p-10">
                          <div className={`p-4 rounded-full border border-[#2DD4BF]/20 transition-colors ${
                            isDragging ? "bg-[#A78BFA]/10 text-[#A78BFA]" : "bg-[#2DD4BF]/10 text-[#2DD4BF] group-hover:bg-[#2DD4BF]/20 shadow-neon-subtle"
                          }`}>
                            <UploadCloud size={32} strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="text-lg font-medium text-[#E0E0E0]">
                              <span className={accentText}>Initiate upload</span> or drag video entity
                            </p>
                            <p className={`${subtleText} mt-1`}>MP4, MOV, WebM (Max 100MB)</p>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="file-preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full bg-black/50 border border-[#1A1A1A] rounded-3xl p-6 relative"
                      >
                        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full p-4 pointer-events-none opacity-20">
                            <defs>
                                <radialGradient id="previewGradient">
                                    <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.1"/>
                                    <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
                                </radialGradient>
                            </defs>
                            <circle cx="50" cy="50" r="45" fill="url(#previewGradient)"/>
                        </svg>

                        <div className="flex items-center justify-between mb-4 z-10 relative">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-black border border-[#262626] text-[#2DD4BF] rounded-xl shadow-neon-subtle">
                              <FileVideo size={20} />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-[#E0E0E0] truncate max-w-[200px]">
                                {file.name}
                              </h3>
                              <p className={`${subtleText} text-xs`}>
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={clearFile}
                            className="p-1.5 text-gray-600 hover:text-gray-400 hover:bg-black/80 rounded-full transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-[#1A1A1A] shadow-inner mb-6 z-10">
                          <video
                            ref={videoRef}
                            src={videoUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="mt-8 z-10 border-t border-[#1A1A1A] pt-6 relative">
                          
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Audit Profile</p>
                              <div className="flex space-x-2">
                                {['Standard', 'Strict (Kids)', 'Profanity Only'].map(profile => (
                                  <button
                                    key={profile}
                                    onClick={() => setAuditProfile(profile)}
                                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors border ${
                                      auditProfile === profile
                                        ? 'bg-[#2DD4BF]/10 border-[#2DD4BF]/30 text-[#2DD4BF]'
                                        : 'bg-black border-[#1A1A1A] text-gray-500 hover:border-[#262626] hover:text-gray-300'
                                    }`}
                                  >
                                    {profile}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {!auditResult && (
                              <button 
                                onClick={runAudit}
                                disabled={isAuditing}
                                className="flex items-center space-x-2.5 bg-[#E0E0E0] text-black px-6 py-3.5 rounded-xl font-medium hover:bg-white transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group h-fit"
                              >
                                {isAuditing && <div className="absolute inset-0 bg-[#A78BFA]/20 animate-pulse"></div>}
                                <BrainCircuit size={18} className={`relative z-10 ${isAuditing ? "animate-spin text-[#A78BFA]" : ""}`} />
                                <span className="relative z-10">{isAuditing ? "Analyzing Manifest..." : "Run Audit Manifest"}</span>
                              </button>
                            )}
                          </div>

                          {auditResult && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0, y: 10 }} 
                              animate={{ opacity: 1, height: "auto", y: 0 }}
                              className="bg-[#060606] border border-[#1A1A1A] rounded-2xl p-5 mt-6 shadow-neon-subtle overflow-hidden relative"
                            >
                              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1A1A1A]">
                                <div className="flex items-center space-x-4">
                                  <h4 className="font-semibold text-[#E0E0E0] flex items-center space-x-2">
                                    <ShieldCheck className={auditResult.riskScore > 0 ? riskText : accentText} size={20} />
                                    <span>System Audit Complete</span>
                                  </h4>
                                  
                                  <button 
                                    onClick={exportManifest}
                                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#262626] border border-[#262626] rounded-lg text-xs font-medium text-gray-300 transition-colors"
                                  >
                                    <Download size={14} />
                                    <span>Export Manifest</span>
                                  </button>
                                </div>
                                <div className="text-right">
                                    <span className={`text-3xl font-extrabold tracking-tight ${auditResult.riskScore > 0 ? riskText : accentText}`}>
                                      {auditResult.riskScore}%
                                    </span>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Risk Factor</p>
                                </div>
                              </div>
                              
                              {auditResult.issues && auditResult.issues.length > 0 ? (
                                <div className="space-y-3">
                                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Anomalies Detected</p>
                                  {auditResult.issues.map((issue: any, i: number) => (
                                    <div 
                                      key={i} 
                                      onClick={() => jumpToTime(issue.timestamp)}
                                      className="flex items-start space-x-4 p-3.5 bg-[#A78BFA]/5 border border-[#A78BFA]/20 rounded-xl relative overflow-hidden cursor-pointer hover:bg-[#A78BFA]/10 transition-colors group"
                                    >
                                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#A78BFA]"></div>
                                      <button className="flex items-center justify-center shrink-0 text-[#A78BFA] text-xs font-mono bg-black border border-[#A78BFA]/30 px-2 py-1.5 rounded-md shadow-sm group-hover:bg-[#A78BFA] group-hover:text-black transition-colors">
                                          <PlayCircle size={14} className="mr-1.5" />
                                          {issue.timestamp}
                                      </button>
                                      <div>
                                        <p className="text-sm font-medium text-[#E0E0E0] group-hover:text-white transition-colors">{issue.policy}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{issue.description}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-5 bg-[#2DD4BF]/5 border border-[#2DD4BF]/20 rounded-xl text-center">
                                  <div className="inline-flex p-3 bg-[#2DD4BF]/10 rounded-full mb-3">
                                      <CheckCircle className={accentText} size={24} />
                                  </div>
                                  <p className="text-[#2DD4BF] text-sm font-medium">No codex violations detected.</p>
                                  <p className="text-xs text-gray-500 mt-1">Entity is cleared for global monetization.</p>
                                </div>
                              )}
                              
                              {auditResult.recommendations && (
                                 <div className="mt-5 p-4 bg-white/5 rounded-xl border border-white/10 flex space-x-3">
                                    <BotMessageSquare size={18} className="text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">AI Directive</p>
                                        <p className="text-sm text-[#E0E0E0] leading-relaxed">{auditResult.recommendations}</p>
                                    </div>
                                 </div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className={`${panelStyle} h-80 overflow-y-auto`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Manifest Recents</h2>
                  {auditHistory.length > 0 && (
                    <button 
                      onClick={clearHistory}
                      className="flex items-center space-x-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors bg-[#1A1A1A]/50 px-3 py-1.5 rounded-lg border border-[#1A1A1A] hover:border-red-500/30"
                    >
                      <Trash2 size={14} />
                      <span>Purge Log</span>
                    </button>
                  )}
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="text-gray-600">
                    <tr>
                      <th className="p-3 pl-0">Entity Designation</th>
                      <th className="p-3">Audit Scope</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Compliance</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-[#1A1A1A]">
                    {isLoadingHistory ? (
                      <>
                        <SkeletonRow />
                        <SkeletonRow />
                        <SkeletonRow />
                      </>
                    ) : auditHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500 text-sm">
                          No entities logged in the current cycle.
                        </td>
                      </tr>
                    ) : (
                      auditHistory.map((audit) => (
                        <AuditRow 
                          key={audit.id} 
                          title={audit.title} 
                          scope={audit.scope} 
                          status={audit.status} 
                          compliance={audit.compliance} 
                        />
                      ))
                    )}
                  </tbody>

                </table>
              </div>
            </div>
          )}

          {activeTab === "Policy Codices" && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="col-span-2 space-y-8"
            >
              <header>
                <h1 className="text-3xl font-extrabold tracking-tight">Policy Codices Master</h1>
                <p className={`${subtleText} mt-2`}>Active rule sets currently injected into the AI auditing engine.</p>
              </header>

              <div className={panelStyle}>
                <h2 className="text-xl font-semibold mb-8 flex items-center space-x-2 text-[#2DD4BF]">
                    <ShieldCheck size={24} />
                    <span>YouTube Advertiser-Friendly Guidelines (Core 4)</span>
                </h2>

                <div className="space-y-6">
                  <div className="p-5 bg-black/40 border border-[#1A1A1A] rounded-xl hover:border-[#262626] transition-colors">
                      <h3 className="text-[#E0E0E0] font-bold mb-4 flex items-center text-lg">
                        <span className="bg-[#1A1A1A] text-gray-400 px-2 py-1 rounded text-xs mr-3 font-mono">1.0</span> 
                        Inappropriate Language
                      </h3>
                      <ul className="space-y-3 text-sm text-gray-400 pl-2 border-l-2 border-[#1A1A1A] ml-2">
                        <li className="flex flex-col"><strong className="text-[#2DD4BF] mb-1">Green Icon (Fully Monetized)</strong> Moderate profanity used after the first 7 seconds.</li>
                        <li className="flex flex-col"><strong className="text-yellow-500 mb-1">Yellow Icon (Limited Ads)</strong> Strong profanity in the first 7 seconds, or repeated heavily throughout.</li>
                        <li className="flex flex-col"><strong className="text-red-500 mb-1">Red Icon (Demonetized)</strong> Slurs, hate speech, or targeted harassment.</li>
                      </ul>
                  </div>

                  <div className="p-5 bg-black/40 border border-[#1A1A1A] rounded-xl hover:border-[#262626] transition-colors">
                      <h3 className="text-[#E0E0E0] font-bold mb-4 flex items-center text-lg">
                        <span className="bg-[#1A1A1A] text-gray-400 px-2 py-1 rounded text-xs mr-3 font-mono">2.0</span> 
                        Violence
                      </h3>
                      <ul className="space-y-3 text-sm text-gray-400 pl-2 border-l-2 border-[#1A1A1A] ml-2">
                        <li className="flex flex-col"><strong className="text-[#2DD4BF] mb-1">Green Icon</strong> Dramatized, animated, or comedic violence.</li>
                        <li className="flex flex-col"><strong className="text-yellow-500 mb-1">Yellow Icon</strong> Real-world non-graphic violence (standard altercations).</li>
                        <li className="flex flex-col"><strong className="text-red-500 mb-1">Red Icon</strong> Real-world graphic violence, gore, or violence involving minors.</li>
                      </ul>
                  </div>

                  <div className="p-5 bg-black/40 border border-[#1A1A1A] rounded-xl hover:border-[#262626] transition-colors">
                      <h3 className="text-[#E0E0E0] font-bold mb-4 flex items-center text-lg">
                        <span className="bg-[#1A1A1A] text-gray-400 px-2 py-1 rounded text-xs mr-3 font-mono">3.0</span> 
                        Controversial Issues & Sensitive Events
                      </h3>
                      <ul className="space-y-3 text-sm text-gray-400 pl-2 border-l-2 border-[#1A1A1A] ml-2">
                        <li className="flex flex-col"><strong className="text-[#2DD4BF] mb-1">Green Icon</strong> Objective, non-graphic reporting on news.</li>
                        <li className="flex flex-col"><strong className="text-yellow-500 mb-1">Yellow Icon</strong> Debates on highly polarizing political topics without graphic imagery.</li>
                        <li className="flex flex-col"><strong className="text-red-500 mb-1">Red Icon</strong> Denying well-documented tragedies or promoting terrorism.</li>
                      </ul>
                  </div>

                  <div className="p-5 bg-black/40 border border-[#1A1A1A] rounded-xl hover:border-[#262626] transition-colors">
                      <h3 className="text-[#E0E0E0] font-bold mb-4 flex items-center text-lg">
                        <span className="bg-[#1A1A1A] text-gray-400 px-2 py-1 rounded text-xs mr-3 font-mono">4.0</span> 
                        Synthetic & Altered Content (AI)
                      </h3>
                      <ul className="space-y-3 text-sm text-gray-400 pl-2 border-l-2 border-[#1A1A1A] ml-2">
                        <li className="flex flex-col"><strong className="text-[#2DD4BF] mb-1">Green Icon</strong> Obvious AI use or properly disclosed realistic AI.</li>
                        <li className="flex flex-col"><strong className="text-red-500 mb-1">Red Icon</strong> Undisclosed realistic AI depicting real people doing things they never did.</li>
                      </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="space-y-8 col-span-1">
            
            {/* --- DYNAMIC USER PROFILE HEADER --- */}
            <header className="flex items-center justify-end space-x-4 border-b border-[#1A1A1A] pb-6 mb-8">
              <div className="flex items-center space-x-3">
                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center space-x-2">
                    
                    {currentTier !== "FREE" && (
                      <span className="bg-[#A78BFA] text-black text-[10px] px-2 py-0.5 rounded-full font-bold shadow-[0_0_10px_rgba(167,139,250,0.4)] uppercase">
                        {currentTier}
                      </span>
                    )}

                    <p className="text-sm font-semibold">{session?.user?.name || "Authorized User"}</p>
                  </div>
                  <button 
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="text-[#A78BFA] hover:text-red-400 text-xs font-medium transition-colors flex items-center space-x-1 mt-0.5"
                  >
                    <span>End Session</span>
                    <LogOut size={10} />
                  </button>
                </div>
                {session?.user?.image ? (
                  <img src={session.user.image} alt="Profile" className="w-10 h-10 rounded-full border border-[#2DD4BF]/30 shadow-neon-subtle" />
                ) : (
                  <div className="w-10 h-10 rounded-full border border-[#1A1A1A] bg-black flex items-center justify-center p-2.5 shadow-sm text-[#A78BFA] font-bold">
                    {session?.user?.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
            </header>

            {/* --- SUBSCRIPTION MANAGEMENT CARD --- */}
            {currentTier !== "FREE" ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden mb-8 shadow-inner">
                <div className="relative z-10">
                  <div className="flex items-center space-x-2 mb-2">
                    <ShieldCheck className="text-[#2DD4BF]" size={18} />
                    <h3 className="font-bold text-[#E0E0E0] capitalize">WOB {currentTier.toLowerCase()} Active</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                    Your expanded AI manifest access and deep codex logging are fully enabled.
                  </p>
                  <div className="flex space-x-3">
                    <button 
                      onClick={handlePortal}
                      className="flex-1 bg-[#1A1A1A] hover:bg-[#262626] border border-[#262626] text-white font-bold py-3 rounded-xl text-xs transition-colors"
                    >
                      Manage Plan
                    </button>
                    {currentTier !== "MAX" && (
                      <button 
                        onClick={() => setShowPricing(true)}
                        className="flex-1 bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 border border-[#A78BFA]/30 text-[#A78BFA] font-bold py-3 rounded-xl text-xs transition-colors"
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#A78BFA]/10 to-[#2DD4BF]/5 border border-[#A78BFA]/20 rounded-3xl p-6 relative overflow-hidden mb-8 group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#A78BFA]/20 blur-2xl rounded-full group-hover:bg-[#A78BFA]/30 transition-colors"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="text-[#A78BFA]" size={18} fill="currentColor" />
                    <h3 className="font-bold text-[#E0E0E0]">Account Limited</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                    You must select a billing plan to unlock the AI manifest. All plans include a 7-day free trial.
                  </p>
                  <button 
                    onClick={() => setShowPricing(true)}
                    className="w-full bg-[#A78BFA] hover:bg-[#b8a1fa] text-black font-bold py-3 rounded-xl text-sm transition-colors shadow-[0_0_15px_rgba(167,139,250,0.3)]"
                  >
                    View Upgrade Plans
                  </button>
                </div>
              </div>
            )}

            <StatGauge 
              title="Global Monetization Manifest" 
              percentage={avgCompliance} 
              description={totalAudits > 0 ? "Real-time compliance status" : "Awaiting first scan"} 
              risks={risksDetected} 
              compliant={compliantAudits} 
            />
            <CircularMeters weekly={totalAudits * 14} scanTime={2} policyFocus={avgCompliance > 0 ? avgCompliance - 5 : 0} />
            
            <div className="grid grid-cols-2 gap-6">
                <MonthlyStats number={risksDetected.toString()} label="High-Risk Vectors Logged" />
                <MonthlyStats number={totalAudits.toString()} label="Total Manifests Scanned" active />
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}

// --- Component Helpers ---

function SidebarItem({ icon: Icon, label, active, badge, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-colors relative ${active ? `bg-[#2DD4BF]/5 text-[#2DD4BF]` : `text-gray-400 hover:bg-[#1A1A1A]`}`}
    >
        {active && <div className="absolute inset-0 bg-[#2DD4BF]/10 blur-lg opacity-20 z-0"></div>}
      <div className="flex items-center space-x-3.5 z-10">
        <Icon size={18} />
        <span className="font-medium">{label}</span>
      </div>
      {badge && <span className="bg-[#A78BFA] text-black text-[10px] px-2 py-0.5 rounded-full font-bold z-10">{badge}</span>}
      {!badge && <ArrowLeft size={16} className={`text-gray-600 transition-colors z-10 ${active ? 'text-[#2DD4BF]' : 'group-hover:text-[#2DD4BF]'}`} />}
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-[#1A1A1A] last:border-0">
      <td className="p-3 pl-0 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-[#1A1A1A]"></div>
        <div className="h-4 w-32 bg-[#1A1A1A] rounded"></div>
      </td>
      <td className="p-3">
        <div className="h-4 w-20 bg-[#1A1A1A] rounded"></div>
      </td>
      <td className="p-3">
        <div className="h-6 w-24 bg-[#1A1A1A] rounded-full"></div>
      </td>
      <td className="p-3">
        <div className="h-4 w-12 bg-[#1A1A1A] rounded"></div>
      </td>
    </tr>
  );
}

function AuditRow({ title, scope, status, compliance }: any) {
    const statusText: { [key: string]: { text: string; bg: string; textCol: string; icon: any } } = {
        flagged: { text: "Risks Detected", bg: "bg-[#A78BFA]/10", textCol: riskText, icon: AlertTriangle },
        scanned: { text: "Scanned", bg: "bg-[#2DD4BF]/10", textCol: accentText, icon: CheckCircle },
        pending: { text: "Pending", bg: "bg-black/50", textCol: "text-gray-500", icon: Clock3 },
    };

    const { text, bg, textCol, icon: Icon } = statusText[status];

    return (
        <tr>
            <td className="p-3 pl-0 flex items-center space-x-3 font-medium">
                <div className={`p-2 rounded-xl border ${status === "flagged" ? "border-[#A78BFA]/20" : "border-[#1A1A1A]"}`}>
                    <FileVideo size={16} className={textCol} />
                </div>
                <span className="truncate max-w-sm">{title}</span>
            </td>
            <td className={`${subtleText} p-3`}>{scope}</td>
            <td className="p-3">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold ${bg} ${textCol}`}>
                    <Icon size={14} />
                    <span>{text}</span>
                </div>
            </td>
            <td className={`p-3 font-semibold ${textCol}`}>
                {compliance ? `${compliance}%` : "--"}
            </td>
        </tr>
    );
}

function StatGauge({ title, percentage, description, risks, compliant }: any) {
    return (
        <div className={panelStyle}>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-4xl font-extrabold tracking-tighter mt-2">{percentage}% <span className={`${subtleText} text-sm font-medium`}>Codices Manifest</span></p>
            <p className="text-xs text-gray-500">{description}</p>
            
            <div className="relative h-28 mt-6 overflow-hidden">
                <svg viewBox="0 0 100 50" className="absolute top-0 w-full h-full p-2">
                    <defs>
                        <linearGradient id="gaugBaseGradient">
                            <stop offset="0%" stopColor="#262626" stopOpacity="0.8"/>
                            <stop offset="100%" stopColor="#1A1A1A" stopOpacity="0"/>
                        </linearGradient>
                        <linearGradient id="gaugeEmeraldHoloGradient">
                            <stop offset="0%" stopColor="#2DD4BF"/>
                            <stop offset="100%" stopColor="#1A1A1A"/>
                        </linearGradient>
                    </defs>
                    <path d="M10,50 a40,40 0 1,1 80,0" fill="none" stroke="url(#gaugBaseGradient)" strokeWidth="8" strokeLinecap="round" />
                    <path d="M10,50 a40,40 0 1,1 80,0" fill="none" stroke="url(#gaugeEmeraldHoloGradient)" strokeWidth="8" strokeDasharray={`${(percentage / 100) * 126} 126`} strokeLinecap="round" />
                </svg>
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-black/80 rounded-full flex items-center justify-center border-2 border-[#1A1A1A] shadow-neon-subtle p-2">
                    <FileVideo className={accentText} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 z-10">
                <GaugeSubStat number={compliant} label="Codices Compliant" accent="emerald" />
                <GaugeSubStat number={risks} label="Risks Logged" accent="amethyst" />
            </div>
        </div>
    );
}

function GaugeSubStat({ number, label, accent }: any) {
    const accentCol = accent === "emerald" ? accentText : riskText;
    const accentBg = accent === "emerald" ? "bg-[#2DD4BF]/5" : "bg-[#A78BFA]/5";
    const accentBorder = accent === "emerald" ? "border-[#2DD4BF]/10" : "border-[#A78BFA]/10";
    return (
        <div className={`p-3 ${accentBg} rounded-2xl border ${accentBorder} text-center`}>
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold ${accentCol}`}>{number}</p>
        </div>
    );
}

function CircularMeters({ weekly, scanTime, policyFocus }: any) {
    return (
        <div className={panelStyle}>
            <h3 className="text-xl font-semibold mb-6">Manifest Progress</h3>
            <div className="grid grid-cols-3 gap-4">
                <CircularStat label="Manifest Usage (Wk)" percentage={weekly} color="amethyst" icon={Mic} />
                <CircularStat label="Avg. Manifest Time" percentage={scanTime * 30} format={`0${scanTime}:43`} color="emerald" icon={Target} />
                <CircularStat label="Codices Focus (Thumb/Title)" percentage={policyFocus} color="emerald" icon={FileText} />
            </div>
        </div>
    );
}

function CircularStat({ percentage, label, icon: Icon, format, color }: any) {
    const strokeCol = color === "emerald" ? "#2DD4BF" : "#A78BFA";
    const bgCol = color === "emerald" ? "bg-[#2DD4BF]/5" : "bg-[#A78BFA]/5";
    const textCol = color === "emerald" ? accentText : riskText;

    return (
        <div className="flex flex-col items-center text-center space-y-2">
            <div className="relative h-20 w-20">
                <svg viewBox="0 0 36 36" className="w-full h-full p-1 opacity-80">
                    <defs>
                        <radialGradient id="holoCircularBaseGradient">
                            <stop offset="0%" stopColor="#1A1A1A" stopOpacity="0.8"/>
                            <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
                        </radialGradient>
                    </defs>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#holoCircularBaseGradient)" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={strokeCol} strokeWidth="3" strokeDasharray={`${percentage}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-lg text-[#E0E0E0]">{format || `${percentage}%`}</div>
            </div>
            <div className={`p-2.5 ${bgCol} ${textCol} rounded-xl shadow-neon-subtle border border-[#2DD4BF]/10`}>
                <Icon size={16} />
            </div>
            <p className="text-xs text-gray-500 mt-2 leading-tight">{label}</p>
        </div>
    );
}

function MonthlyStats({ number, label, active }: any) {
    const panelCol = active ? "bg-[#E0E0E0] text-black shadow-lg" : `${panelStyle} bg-black`;
    const textCol = active ? "text-black" : "text-[#E0E0E0]";
    const barCol = active ? "bg-black" : `bg-[#E0E0E0]`;
    const arrowCol = active ? "text-[#2DD4BF]" : "text-gray-600";

    return (
        <div className={`${panelCol} p-6 relative`}>
            {active && <div className="absolute inset-0 bg-white/20 blur-xl opacity-20"></div>}
            <div className="flex items-center justify-between z-10 relative">
                <div>
                    <p className="text-xs text-gray-500">Log Manifests</p>
                    <p className={`text-4xl font-extrabold ${textCol}`}>{number}</p>
                </div>
                <ArrowLeft size={16} className={`${arrowCol} rotate-90 z-10 relative`} />
            </div>
            <p className={`${subtleText} mt-1 max-w-[100px] z-10 relative`}>{label}</p>
            <div className="h-10 mt-6 flex items-end space-x-1 justify-end z-10 relative">
                <Bar barColor={barCol} percentage={30} />
                <Bar barColor={barCol} percentage={60} />
                <Bar barColor={barCol} percentage={90} />
                <Bar barColor={barCol} percentage={active ? 100 : 70} active={active} />
            </div>
        </div>
    );
}

function Bar({ barColor, percentage, active }: any) {
    const opacity = active ? "" : "opacity-10";
    return (
        <div className={`w-3 ${barColor} ${opacity} rounded-full`} style={{ height: `${percentage}%` }} />
    );
}