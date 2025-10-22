'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: number;
  element: HTMLElement;
}

interface InlineTableOfContentsProps {
  containerSelector?: string;
}

export default function InlineTableOfContents({
  containerSelector = '.bn-container'
}: InlineTableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

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
        // Add scroll offset for smooth navigation
        htmlElement.style.scrollMarginTop = '80px';
      }

      newHeadings.push({
        id,
        text,
        level,
        element: htmlElement
      });
    });

    setHeadings(newHeadings);
  }, [containerSelector]);

  // Setup IntersectionObserver for active section tracking
  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container || headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -50% 0px',
        threshold: [0, 0.5, 1]
      }
    );

    headings.forEach((heading) => {
      if (heading.element) {
        observer.observe(heading.element);
      }
    });

    return () => observer.disconnect();
  }, [headings, containerSelector]);

  // Re-extract headings when content changes (with debouncing)
  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) {
      // Retry after a delay if container not found yet
      const retryTimeout = setTimeout(() => extractHeadings(), 500);
      return () => clearTimeout(retryTimeout);
    }

    // Initial extraction with delay to let BlockNote render
    const initialTimeout = setTimeout(() => extractHeadings(), 300);

    let debounceTimeout: NodeJS.Timeout;
    const observer = new MutationObserver(() => {
      // Debounce to avoid excessive re-renders
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        extractHeadings();
      }, 300);
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: false // Don't observe every text change
    });

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(debounceTimeout);
      observer.disconnect();
    };
  }, [containerSelector, extractHeadings]);

  // Smooth scroll to heading
  const scrollToHeading = useCallback((heading: Heading, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use the stored element reference for more reliable scrolling
    const element = heading.element || document.getElementById(heading.id);
    
    if (element) {
      // Calculate position with offset for sticky header
      const elementTop = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementTop - 140; // 140px offset for sticky header and padding
      
      // Scroll to position
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      console.log('Scrolling to:', heading.text, 'at position:', offsetPosition);
    } else {
      console.warn('Element not found for heading:', heading.text, heading.id);
    }
  }, []);

  // Toggle collapse for nested sections
  const toggleCollapse = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Check if heading has children
  const hasChildren = (index: number): boolean => {
    if (index >= headings.length - 1) return false;
    return headings[index + 1].level > headings[index].level;
  };

  // Check if heading should be hidden due to parent collapse
  const isHidden = (index: number): boolean => {
    for (let i = index - 1; i >= 0; i--) {
      if (headings[i].level < headings[index].level) {
        if (collapsedSections.has(headings[i].id)) {
          return true;
        }
      }
    }
    return false;
  };

  return (
    <nav 
      className="fixed right-0 top-36 z-20 w-[280px] max-h-[calc(100vh-180px)] py-4 px-5 rounded-lg border border-gray-200/60 dark:border-gray-700/60 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-sm shadow-sm overflow-y-auto mr-4"
      aria-label="Table of Contents"
      role="navigation"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
      }}
    >
      <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Table of Contents
      </h3>
      {headings.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          No headings found. Add H1, H2, or H3 headings to see them here.
        </p>
      ) : (
        <ul className="space-y-0.5" role="list">
          {headings.map((heading, index) => {
          if (isHidden(index)) return null;
          
          const isActive = activeId === heading.id;
          const hasChild = hasChildren(index);
          const isCollapsed = collapsedSections.has(heading.id);
          const indent = (heading.level - 1) * 20;

          return (
            <li
              key={heading.id}
              className="relative"
              style={{ paddingLeft: `${indent}px` }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
              )}

              <div className="flex items-center gap-1 group">
                {/* Collapse/expand chevron for nested items */}
                {hasChild && (
                  <button
                    onClick={(e) => toggleCollapse(heading.id, e)}
                    className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                  >
                    <ChevronRight 
                      className={`w-3 h-3 text-gray-400 transition-transform ${
                        isCollapsed ? '' : 'rotate-90'
                      }`}
                    />
                  </button>
                )}

                {/* Heading link */}
                <a
                  href={`#${heading.id}`}
                  onClick={(e) => scrollToHeading(heading, e)}
                  className={`flex-1 py-1.5 px-2 text-sm rounded transition-all ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-950/30'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:underline hover:underline-offset-2'
                  }`}
                  style={{ marginLeft: hasChild ? '0' : '20px' }}
                >
                  {/* Bullet point for non-parent items */}
                  {!hasChild && heading.level > 1 && (
                    <span className="inline-block w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 mr-2" />
                  )}
                  {heading.text}
                </a>
              </div>
            </li>
          );
        })}
        </ul>
      )}
    </nav>
  );
}
