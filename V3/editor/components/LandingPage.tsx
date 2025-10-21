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
    <main className="min-h-screen bg-white text-black font-sans">

      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="text-3xl font-bold">KEN</div>
        <ul className="flex gap-6 items-center">
          <li className="hover:text-gray-600 cursor-pointer">About</li>
          <li className="hover:text-gray-600 cursor-pointer">Features</li>
          <li className="hover:text-gray-600 cursor-pointer">Docs</li>
          <li>
            <SignInButton mode="modal">
              <button className="hover:text-gray-600">Login</button>
            </SignInButton>
          </li>
          <li>
            <SignInButton mode="modal">
              <button className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition">
                Get Started
              </button>
            </SignInButton>
          </li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center py-36 px-6 overflow-hidden">
        <motion.h1
          className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          Collaborate. Create. Think<br/>
          <span className="bg-black text-white px-3 py-1 inline-block"> — in real time.</span>
        </motion.h1>
        <motion.p
          className="text-gray-600 text-lg max-w-xl mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          AI-powered, real-time collaborative document editor with advanced features for modern teams.
        </motion.p>
        <motion.div className="flex gap-4 mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          <SignInButton mode="modal">
            <button className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition">Start Editing</button>
          </SignInButton>
          <button onClick={() => router.push("/about")} className="border border-gray-400 px-6 py-3 rounded-md hover:border-black transition">
            See How It Works
          </button>
        </motion.div>

        {/* Collaborators mock */}
        <motion.div
          className="bg-gray-50 rounded-xl p-6 w-full max-w-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div className="flex items-center mb-2">
            <div className="flex -space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-300"></div>
              <div className="w-8 h-8 rounded-full bg-gray-400"></div>
              <div className="w-8 h-8 rounded-full bg-gray-500"></div>
            </div>
            <span className="ml-3 text-gray-600 text-sm">3 collaborators editing</span>
          </div>
          <div className="bg-white rounded-md border border-gray-200 p-3 text-left text-gray-700">
            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
            Alex is typing...
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

      {/* Footer */}
      <footer className="py-12 bg-white text-gray-500 text-center border-t border-gray-200">
        <div className="flex justify-center gap-6 mb-4">
          <a href="#" className="hover:text-black transition">About</a>
          <a href="#" className="hover:text-black transition">Docs</a>
          <a href="#" className="hover:text-black transition">Privacy</a>
          <a href="#" className="hover:text-black transition">Contact</a>
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
    <section className="py-24 px-6 text-center max-w-7xl mx-auto bg-white">
      <motion.h2 
        className="text-4xl font-bold mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        Features
      </motion.h2>
      <div className="grid md:grid-cols-4 gap-8">
        {features.map((f, i) => (
          <motion.div 
            key={i} 
            className="p-8 rounded-2xl cursor-pointer group bg-gradient-to-b from-white to-gray-50"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            whileHover={{ 
              backgroundColor: '#FAFAFA',
              scale: 1.02 
            }}
          >
            <div className="mb-6 flex justify-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-black transition-colors">
                <div className="text-xl text-black group-hover:text-white transition-colors">{f.icon}</div>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-black">{f.title}</h3>
            <p className="text-gray-600 leading-relaxed">{f.description}</p>
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