'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronRight, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Heading {
  id: string;
  text: string;
  level: number;
  element: HTMLElement;
  preview?: string;
}

interface TableOfContentsProps {
  containerSelector?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function TableOfContents({
  containerSelector = '.notion-editor',
  isOpen = true,
  onToggle
}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const tocRef = useRef<HTMLElement>(null);

  // Extract headings from the editor
  const extractHeadings = useCallback(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const headingElements = container.querySelectorAll('h1, h2, h3');
    const newHeadings: Heading[] = [];

    headingElements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      const level = parseInt(element.tagName.charAt(1));
      const text = htmlElement.textContent?.trim() || '';
      
      // Generate or use existing ID
      let id = htmlElement.id;
      if (!id) {
        id = `heading-${text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}-${index}`;
        htmlElement.id = id;
      }

      // Get preview text (next sibling paragraph or first 100 chars)
      let preview = '';
      const nextElement = htmlElement.nextElementSibling;
      if (nextElement && nextElement.tagName === 'P') {
        preview = nextElement.textContent?.slice(0, 100) || '';
      }

      newHeadings.push({
        id,
        text,
        level,
        element: htmlElement,
        preview
      });
    });

    setHeadings(newHeadings);
  }, [containerSelector]);

  // Setup IntersectionObserver for scroll spy
  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0
      }
    );

    headings.forEach((heading) => {
      if (heading.element && observerRef.current) {
        observerRef.current.observe(heading.element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [headings, containerSelector]);

  // Re-extract headings when content changes
  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    extractHeadings();

    // Use MutationObserver to detect content changes
    const observer = new MutationObserver(() => {
      extractHeadings();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => observer.disconnect();
  }, [containerSelector, extractHeadings]);

  // Smooth scroll to heading
  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Add ripple effect
      element.style.transition = 'background-color 0.3s ease';
      element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      setTimeout(() => {
        element.style.backgroundColor = '';
      }, 600);
    }
  }, []);

  // Handle hover for preview
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLLIElement>, heading: Heading) => {
    setHoveredId(heading.id);
    const rect = e.currentTarget.getBoundingClientRect();
    setPreviewPosition({
      top: rect.top,
      left: rect.left - 320 // Position to the left of TOC
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToHeading(id);
    }
  }, [scrollToHeading]);

  if (headings.length === 0) return null;

  return (
    <>
      {/* TOC Container */}
      <nav
        ref={tocRef}
        className={`fixed right-6 top-24 z-20 w-[300px] max-h-[calc(100vh-120px)] transition-all duration-300 ease-out ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-[320px] opacity-0'
        }`}
        aria-label="Table of Contents"
        role="navigation"
      >
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg p-6 overflow-y-auto max-h-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200/30 dark:border-gray-700/30">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                Table of Contents
              </h2>
            </div>
          </div>

          {/* Headings List */}
          <ul className="space-y-0" role="list">
            {headings.map((heading) => (
              <li
                key={heading.id}
                className="group"
                onMouseEnter={(e) => handleMouseEnter(e, heading)}
                onMouseLeave={handleMouseLeave}
                style={{
                  paddingLeft: `${(heading.level - 1) * 16}px`
                }}
              >
                <button
                  onClick={() => scrollToHeading(heading.id)}
                  onKeyDown={(e) => handleKeyDown(e, heading.id)}
                  className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 relative ${
                    activeId === heading.id
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                  }`}
                  aria-current={activeId === heading.id ? 'location' : undefined}
                >
                  {/* Indent indicator */}
                  {heading.level > 1 && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-700" />
                  )}
                  
                  <ChevronRight
                    className={`w-3 h-3 flex-shrink-0 transition-transform ${
                      activeId === heading.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                    }`}
                  />
                  
                  <span className="line-clamp-2 leading-tight">{heading.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      </nav>

      {/* Hover Preview Popover */}
      <AnimatePresence>
        {hoveredId && headings.find(h => h.id === hoveredId)?.preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed z-30 w-[280px] pointer-events-none"
            style={{
              top: `${previewPosition.top}px`,
              left: `${previewPosition.left}px`
            }}
          >
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                {headings.find(h => h.id === hoveredId)?.text}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                {headings.find(h => h.id === hoveredId)?.preview}...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed right-6 top-20 z-30 md:hidden bg-white dark:bg-[#1a1a1a] border border-gray-200/50 dark:border-gray-700/50 rounded-full p-2 shadow-lg hover:scale-105 active:scale-95 transition-transform"
        aria-label="Toggle Table of Contents"
      >
        <List className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>
    </>
  );
}
