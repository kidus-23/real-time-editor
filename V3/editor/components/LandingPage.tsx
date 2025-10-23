'use client'

import { motion } from "framer-motion"
import { SignInButton } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useInView } from "react-intersection-observer"
import Link from "next/link"
import Image from "next/image"
import TextType from "./TextType"

export default function LandingPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-white dark:bg-[#0f0f0f] text-[#1a1a1a] dark:text-[#f5f5f5] font-['Recursive','Inter',system-ui]">

      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto bg-white dark:bg-[#0f0f0f]">
        <div className="text-3xl font-bold">KEN</div>
        <ul className="flex gap-6 items-center">
          <li><a href="#features" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer">Features</a></li>
          <li><a href="#testimonials" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer">Testimonials</a></li>
          <li><Link href="/Documentation.pdf" target="_blank" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer">Docs</Link></li>
          <li>
            <SignInButton mode="modal">
              <button className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Login</button>
            </SignInButton>
          </li>
          <li>
            <SignInButton mode="modal">
              <button className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                Get Started
              </button>
            </SignInButton>
          </li>
        </ul>
      </nav>

      {/* Hero Section - Campsite style */}
      <section className="relative flex flex-col items-center justify-center text-center py-32 px-6 bg-white dark:bg-[#0f0f0f]">
        <motion.h1
          className="text-6xl md:text-8xl font-bold mb-6 leading-[1.05] tracking-tight max-w-5xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[#0f172a] dark:text-white inline-block">
            <TextType
              text="Collaborate Create Think — in real time."
              typingSpeed={90}
              pauseDuration={2000}
              showCursor={true}
              cursorCharacter="_"
              loop={true}
              deletingSpeed={50}
            />
          </span>
        </motion.h1>
        <motion.p
          className="text-2xl text-[#64748b] dark:text-[#94a3b8] max-w-3xl mb-14 leading-relaxed font-normal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          The new standard for thoughtful team collaboration — AI-powered real-time editing, organized and effortless.
        </motion.p>
        <motion.div className="flex flex-col sm:flex-row gap-5 mb-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <SignInButton mode="modal">
            <button className="bg-[#0f172a] hover:bg-[#1e293b] dark:bg-white dark:hover:bg-[#f1f5f9] text-white dark:text-[#0f172a] px-8 py-4 rounded-lg transition-colors font-semibold text-base">Start for free</button>
          </SignInButton>
          <button onClick={() => router.push("/about")} className="text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-white px-8 py-4 transition-colors font-semibold text-base">
            Watch demo →
          </button>
        </motion.div>

        {/* Live presence indicator */}
        <motion.div
          className="inline-flex items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#3b82f6] dark:bg-[#60a5fa]"></div>
            <div className="w-8 h-8 rounded-full bg-[#10b981] dark:bg-[#34d399]"></div>
            <div className="w-8 h-8 rounded-full bg-[#f59e0b] dark:bg-[#fbbf24]"></div>
          </div>
          <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">
            <strong className="text-[#0f172a] dark:text-white font-semibold">3 people</strong> editing now
          </span>
        </motion.div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <footer className="py-20 bg-white dark:bg-[#0f0f0f] text-[#6b7280] dark:text-[#9ca3af] text-center">
        <div className="flex justify-center gap-8 mb-8 text-sm">
          <a href="#" className="hover:text-[#1a1a1a] dark:hover:text-[#f5f5f5] transition-colors font-medium">About</a>
          <Link href="/Documentation.pdf" target="_blank" className="hover:text-[#1a1a1a] dark:hover:text-[#f5f5f5] transition-colors font-medium">Docs</Link>
          <a href="#" className="hover:text-[#1a1a1a] dark:hover:text-[#f5f5f5] transition-colors font-medium">Privacy</a>
          <a href="#" className="hover:text-[#1a1a1a] dark:hover:text-[#f5f5f5] transition-colors font-medium">Contact</a>
        </div>
        <div className="text-xs">&copy; 2025 KEN. All rights reserved.</div>
      </footer>
    </main>
  )
}

// Features Section - Full-width sections with subtle tints
function FeaturesSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <>
      {/* Feature 1: Real-time */}
      <section id="features" ref={ref} className="py-32 px-6 bg-[#fafafa] dark:bg-[#0a0a0a]">
        <motion.div 
          className="max-w-[1400px] mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-base font-semibold text-[#3b82f6] dark:text-[#60a5fa] mb-6 uppercase tracking-wider">Real-time collaboration</h3>
          <h2 className="text-5xl md:text-7xl font-bold text-[#0f172a] dark:text-white mb-8 max-w-4xl leading-[1.1]">
            Write together, see changes instantly
          </h2>
          <p className="text-xl text-[#64748b] dark:text-[#94a3b8] max-w-2xl leading-relaxed mb-16">
            Multiple cursors, live presence indicators, and seamless sync. Every keystroke updates instantly across all devices.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <video
              src="/smartai.mp4"
              className="w-full h-auto"
              autoPlay
              loop
              muted
              playsInline
            >
              Your browser does not support the video tag.
            </video>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature 2: AI */}
      <section className="py-32 px-6 bg-white dark:bg-[#0f0f0f]">
        <motion.div 
          className="max-w-[1400px] mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-base font-semibold text-[#8b5cf6] dark:text-[#a78bfa] mb-6 uppercase tracking-wider">AI-powered</h3>
          <h2 className="text-5xl md:text-7xl font-bold text-[#0f172a] dark:text-white mb-16 max-w-4xl leading-[1.1]">
            Smart features that enhance your workflow
          </h2>
          <div className="grid md:grid-cols-3 gap-16">
            <div>
              <h4 className="text-2xl font-bold text-[#0f172a] dark:text-white mb-3">Summarize</h4>
              <p className="text-lg text-[#64748b] dark:text-[#94a3b8] leading-relaxed">Get instant document summaries with key takeaways</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-[#0f172a] dark:text-white mb-3">Translate</h4>
              <p className="text-lg text-[#64748b] dark:text-[#94a3b8] leading-relaxed">50+ languages, instant translation in your editor</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-[#0f172a] dark:text-white mb-3">Chat</h4>
              <p className="text-lg text-[#64748b] dark:text-[#94a3b8] leading-relaxed">Ask questions, get answers from your documents</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature 3: Organization */}
      <section className="py-32 px-6 bg-[#f5f5f5] dark:bg-[#0d0d0d]">
        <motion.div 
          className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-16 items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="w-full h-auto rounded-lg overflow-hidden shadow-2xl"
          >
            <Image
              src="/graph.gif"
              alt="Knowledge Graph Visualization"
              className="w-full h-auto object-cover"
              width={1200}
              height={675}
              priority
            />
          </motion.div>
          <div>
            <h3 className="text-base font-semibold text-[#10b981] dark:text-[#34d399] mb-6 uppercase tracking-wider">Stay organized</h3>
            <h2 className="text-5xl md:text-7xl font-bold text-[#0f172a] dark:text-white mb-8 leading-[1.1]">
              Knowledge graph connects your ideas
            </h2>
            <p className="text-xl text-[#64748b] dark:text-[#94a3b8] max-w-2xl leading-relaxed">
              Visualize relationships between documents and concepts. Never lose track of your knowledge again.
            </p>
          </div>
        </motion.div>
      </section>
    </>
  )
}

// Testimonials - Full-width with subtle tint
function TestimonialsSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 })

  const testimonials = [
    { quote: "KEN is the perfect tool for async collaboration. Our distributed team stays in sync without constant meetings.", name: "Elon Musk", role: "Product Lead", image: "/testpro2.jpg" },
    { quote: "The AI features are game-changing. Summarization and translation save us hours every week.", name: "Kidus Mesfin", role: "Backend Developer", image: "/testpro.jpg" },
    { quote: "Real-time editing that actually works. No conflicts, no confusion, just seamless collaboration.", name: "Emily Rodriguez", role: "Engineering Manager", image: "/testpro3.jpg" }
  ]

  return (
    <section id="testimonials" ref={ref} className="py-32 px-6 bg-white dark:bg-[#0f0f0f]">
      <div className="max-w-[1400px] mx-auto">
        <motion.div 
          className="mb-24"
          initial={{ opacity: 0 }} 
          animate={inView ? { opacity: 1 } : {}} 
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold text-[#0f172a] dark:text-white mb-4">
            Loved by teams everywhere
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-20">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex flex-col items-center text-center"
            >
              <motion.div 
                className="w-20 h-20 rounded-full overflow-hidden mb-8 ring-4 ring-[#3b82f6] dark:ring-[#60a5fa] shadow-lg"
                initial={{ scale: 0 }}
                animate={inView ? { scale: 1 } : {}}
                transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
              >
                <Image
                  src={t.image}
                  alt={`${t.name}'s profile picture`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <p className="text-xl text-[#0f172a] dark:text-white mb-10 leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <p className="font-semibold text-[#0f172a] dark:text-white text-lg">{t.name}</p>
                <p className="text-[#64748b] dark:text-[#94a3b8]">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// CTA Section - Campsite style
function CTASection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 })
  return (
    <section ref={ref} className="py-32 px-6 bg-[#fafafa] dark:bg-[#0a0a0a]">
      <motion.div 
        className="max-w-[1000px] mx-auto text-center"
        initial={{ opacity: 0, y: 20 }} 
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-6xl md:text-7xl font-bold mb-8 text-[#0f172a] dark:text-white leading-[1.05]">
          Ready to start?
        </h2>
        <p className="text-xl text-[#64748b] dark:text-[#94a3b8] mb-12 max-w-2xl mx-auto">
          Join teams using KEN to collaborate better, think clearer, and ship faster.
        </p>
        <SignInButton mode="modal">
          <button className="bg-[#0f172a] hover:bg-[#1e293b] dark:bg-white dark:hover:bg-[#f1f5f9] text-white dark:text-[#0f172a] px-8 py-4 rounded-lg transition-colors font-semibold text-base">
            Start for free
          </button>
        </SignInButton>
        <p className="mt-6 text-sm text-[#94a3b8]">Free forever · No credit card required</p>
      </motion.div>
    </section>
  )
}