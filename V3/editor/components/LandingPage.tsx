'use client'

import { motion } from "framer-motion"
import { Zap, Cpu, Globe, Lock, Users, MessageSquare, Play, BookOpen, MessageCircle } from "lucide-react"
import Image from "next/image"
import { SignInButton } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useInView } from "react-intersection-observer"

export default function LandingPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-100 font-['Recursive','Inter',system-ui] transition-colors duration-300">

      {/* Navbar - Enhanced with glassmorphism */}
      <nav className="sticky top-0 z-50 bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-[12px] border-b border-gray-200/20 dark:border-gray-800/20">
        <div className="flex justify-between items-center p-5 max-w-7xl mx-auto">
          <div className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">KEN</div>
          <ul className="flex gap-8 items-center">
            <li className="hover:text-primary cursor-pointer transition-colors font-medium text-sm">About</li>
            <li className="hover:text-primary cursor-pointer transition-colors font-medium text-sm">Features</li>
            <li className="hover:text-primary cursor-pointer transition-colors font-medium text-sm">Docs</li>
            <li>
              <SignInButton mode="modal">
                <button className="hover:text-primary transition-colors font-medium text-sm">Login</button>
              </SignInButton>
            </li>
            <li>
              <SignInButton mode="modal">
                <button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all font-semibold shadow-sm">
                  Get Started
                </button>
              </SignInButton>
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero Section - Enhanced with gradient and glass */}
      <section className="relative flex flex-col items-center justify-center text-center py-32 px-6 overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-[#0a0a0a] dark:to-[#0f0f0f]">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 dark:from-blue-600/10 dark:via-transparent dark:to-purple-600/10"></div>
        <motion.h1
          className="relative z-10 text-5xl md:text-7xl font-bold mb-8 leading-[1.1] tracking-tight"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
            Collaborate. Create. Think
          </span>
          <br/>
          <span className="inline-block mt-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-white px-6 py-3 rounded-2xl shadow-lg"> — in real time.</span>
        </motion.h1>
        <motion.p
          className="relative z-10 text-gray-600 dark:text-gray-300 text-xl max-w-2xl mb-10 leading-relaxed font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{ lineHeight: 1.8 }}
        >
          AI-powered, real-time collaborative document editor with advanced features for modern teams.
        </motion.p>
        <motion.div className="relative z-10 flex gap-5 mb-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }}>
          <SignInButton mode="modal">
            <button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-xl hover:scale-105 active:scale-95 transition-all font-semibold text-base shadow-md">Start Editing</button>
          </SignInButton>
          <button onClick={() => router.push("/about")} className="border-2 border-gray-300 dark:border-gray-700 px-8 py-4 rounded-xl hover:border-gray-900 dark:hover:border-white hover:scale-105 active:scale-95 transition-all font-semibold text-base">
            See How It Works
          </button>
        </motion.div>

        {/* Collaborators mock - Enhanced glass card */}
        <motion.div
          className="relative z-10 bg-white/50 dark:bg-[#1a1a1a]/50 backdrop-blur-[10px] border border-gray-200/20 dark:border-gray-700/20 rounded-2xl p-8 w-full max-w-2xl shadow-sm"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <div className="flex items-center mb-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white dark:border-gray-900"></div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white dark:border-gray-900"></div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white dark:border-gray-900"></div>
            </div>
            <span className="ml-4 text-gray-700 dark:text-gray-300 text-sm font-medium">3 collaborators editing</span>
          </div>
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200/30 dark:border-gray-700/30 p-4 text-left text-gray-800 dark:text-gray-200">
            <span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
            <span className="font-medium">Alex is typing...</span>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Document Management */}
      <DocumentManagementSection />

      {/* AI & Collaboration Section */}
      <AISection />

      {/* Demo / Editor Preview */}
      <DemoSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer - Enhanced */}
      <footer className="py-16 bg-white dark:bg-[#0a0a0a] text-gray-500 dark:text-gray-400 text-center border-t border-gray-200/30 dark:border-gray-800/30">
        <div className="flex justify-center gap-8 mb-6">
          <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors font-medium">About</a>
          <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors font-medium">Docs</a>
          <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors font-medium">Privacy</a>
          <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors font-medium">Contact</a>
        </div>
        <div className="text-sm">&copy; 2025 KEN. All rights reserved.</div>
      </footer>
    </main>
  )
}

// ------------------ Feature Cards ------------------
function FeaturesSection() {
  const features = [
    { icon: <Zap />, title: "Real-Time Collaboration", description: "Multiple users editing simultaneously with live presence and avatars." },
    { icon: <Cpu />, title: "AI Copilot", description: "Summarize, translate, generate content and Q&A." },
    { icon: <Globe />, title: "Knowledge Graph", description: "Visualize document concepts and relationships." },
    { icon: <Lock />, title: "Secure & Fast", description: "Role-based access control and encrypted storage." }
  ]

  return (
    <section className="py-28 px-6 text-center max-w-7xl mx-auto bg-white dark:bg-[#0f0f0f]">
      <motion.h2 
        className="text-5xl font-bold mb-20 tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        Features
      </motion.h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <motion.div 
            key={i} 
            className="p-8 rounded-2xl cursor-pointer group bg-white/50 dark:bg-[#1a1a1a]/50 backdrop-blur-[8px] border border-gray-200/20 dark:border-gray-700/20 hover:border-gray-300/40 dark:hover:border-gray-600/40 transition-all"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            whileHover={{ 
              scale: 1.03,
              y: -4
            }}
          >
            <div className="mb-6 flex justify-center">
              <div className="w-14 h-14 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl flex items-center justify-center group-hover:bg-gray-900 dark:group-hover:bg-white transition-colors">
                <div className="text-2xl text-gray-900 dark:text-gray-100 group-hover:text-white dark:group-hover:text-gray-900 transition-colors">{f.icon}</div>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{f.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed" style={{ lineHeight: 1.7 }}>{f.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ------------------ Document Management ------------------
function DocumentManagementSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 })
  return (
    <section ref={ref} className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        {/* Left: Text Content */}
        <motion.div className="flex-1 text-left" initial={{ opacity: 0, x: -50 }} animate={inView ? { opacity: 1, x: 0 } : {}}>
          <h2 className="text-4xl font-bold mb-6 leading-tight">Experience the future of collaboration</h2>
          <p className="text-gray-600 text-lg max-w-lg mb-8">
            Our editor adapts to your workflow with intelligent organization, real-time presence, and seamless integrations.
          </p>
          <ul className="space-y-4 mb-0">
            <li className="flex items-center">
              <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs mr-3">✓</span>
              <span className="text-gray-700">Version history for every change</span>
            </li>
            <li className="flex items-center">
              <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs mr-3">✓</span>
              <span className="text-gray-700">Comments and threaded discussions</span>
            </li>
            <li className="flex items-center">
              <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs mr-3">✓</span>
              <span className="text-gray-700">Automatically generated summaries</span>
            </li>
          </ul>
        </motion.div>

        {/* Right: Visual Mockup */}
        <motion.div className="flex-1 relative" initial={{ opacity: 0, x: 50 }} animate={inView ? { opacity: 1, x: 0 } : {}}>
          <div className="relative bg-white rounded-2xl p-8 max-w-md mx-auto bg-gradient-to-b from-white to-gray-50">
            {/* Mock editor area */}
            <div className="h-64 bg-gray-100 rounded-xl mb-6 flex items-center justify-center">
              <div className="relative">
                <Play className="w-12 h-12 text-gray-400 absolute z-10" />
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg"></div>
              </div>
            </div>
            {/* Bottom UI elements (toggles/sliders) */}
            <div className="flex justify-end space-x-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ------------------ AI & Collaboration Section ------------------
function AISection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 })
  return (
    <section ref={ref} className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        {/* Left: Video */}
        <motion.div className="flex-1 relative" initial={{ opacity: 0, x: -50 }} animate={inView ? { opacity: 1, x: 0 } : {}}>
          <video
            src="/smartai.mp4"
            className="rounded-2xl w-full h-auto object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        </motion.div>

        {/* Right: Content */}
        <motion.div className="flex-1 text-left" initial={{ opacity: 0, x: 50 }} animate={inView ? { opacity: 1, x: 0 } : {}}>
          <h2 className="text-4xl font-bold mb-6">Smart AI Integration</h2>
          <p className="text-gray-600 text-lg max-w-lg mb-8">
            Leverage cutting-edge AI models to enhance your workflow instantly. KEN integrates multiple AI models including GPT-4 Turbo, Claude 2, Gemini Pro, and open-source models.
          </p>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Document Summarization</h3>
                <p className="text-gray-600">Get concise summaries instantly</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Multi-language Translation</h3>
                <p className="text-gray-600">Seamless document translation</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Smart Q&A</h3>
                <p className="text-gray-600">Answers from your content</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ------------------ Demo Section ------------------
function DemoSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 })
  return (
    <section ref={ref} className="py-24 px-6 text-center bg-gray-50">
      <motion.h2 className="text-4xl font-bold mb-12" initial={{ opacity: 0, y: 50 }} animate={inView ? { opacity: 1, y: 0 } : {}}>
        Live Editor Demo
      </motion.h2>
      <motion.div className="relative max-w-5xl mx-auto rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 50 }} animate={inView ? { opacity: 1, y: 0 } : {}}>
        <Image src="/demo-editor.png" alt="Editor Demo" width={1200} height={600} className="rounded-xl" />
      </motion.div>
    </section>
  )
}

// ------------------ Testimonials Section ------------------
function TestimonialsSection() {
  const testimonials = [
    { name: "Alice W.", role: "Product Manager", feedback: "KEN transformed how our team collaborates. It's lightning fast and intuitive." },
    { name: "John D.", role: "Developer", feedback: "The AI copilot is incredible. It saves hours of work every week." },
    { name: "Sofia L.", role: "Designer", feedback: "Finally a clean editor that just works. No clutter, just creativity." }
  ]

  return (
    <section className="py-24 px-6 text-center max-w-6xl mx-auto bg-white">
      <h2 className="text-4xl font-bold mb-12">What Our Users Say</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((t, i) => (
          <motion.div key={i} className="p-6 rounded-2xl bg-gradient-to-b from-white to-gray-50 transition-colors"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            whileHover={{ backgroundColor: '#FAFAFA' }}>
            <p className="text-gray-700 mb-4">"{t.feedback}"</p>
            <p className="font-semibold">{t.name}</p>
            <p className="text-gray-500 text-sm">{t.role}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ------------------ CTA Section ------------------
function CTASection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 })
  return (
    <section ref={ref} className="py-24 px-6 text-center bg-gradient-to-b from-gray-50 to-white">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={inView ? { opacity: 1, scale: 1 } : {}}>
        <h2 className="text-4xl font-bold mb-6">Ready to experience KEN?</h2>
        <p className="text-gray-600 max-w-xl mx-auto mb-8">Start your free journey and collaborate smarter today.</p>
        <SignInButton mode="modal">
          <button className="bg-black text-white px-8 py-4 rounded-md hover:bg-gray-800 transition">
            Get Started
          </button>
        </SignInButton>
      </motion.div>
    </section>
  )
}

// ------------------ FeatureCard Component ------------------
function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div className="p-6 rounded-2xl bg-gradient-to-b from-white to-gray-50 transition-colors cursor-pointer" whileHover={{ backgroundColor: '#FAFAFA', scale: 1.02 }}>
      <div className="mb-4 text-black">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  )
}