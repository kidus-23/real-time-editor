'use client'

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from './ui/input';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { collectionGroup, query, where, orderBy, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SearchResult extends DocumentData {
  id: string;
  roomId: string;
  title?: string;
  content?: string;
}

function SearchDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Reset search when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Calculate relevance score for a document based on matches
  const calculateRelevance = (title: string, content: string, searchTerms: string[]) => {
    let score = 0;
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();

    for (const term of searchTerms) {
      // Title matches are weighted more heavily
      if (lowerTitle.includes(term)) {
        score += 10;
        // Exact title match gets bonus points
        if (lowerTitle === term) score += 5;
      }

      if (lowerContent.includes(term)) {
        score += 5;
        // Count number of occurrences in content
        const occurrences = (lowerContent.match(new RegExp(term, 'g')) || []).length;
        score += Math.min(occurrences, 5); // Cap bonus points for occurrences
      }
    }

    return score;
  };

  // Extract relevant snippet around match
  const extractSnippet = (content: string, searchTerms: string[], maxLength: number = 200) => {
    const lowerContent = content.toLowerCase();
    let bestStart = 0;
    let bestLength = Math.min(maxLength, content.length);

    // Find the best snippet containing the most search terms
    for (const term of searchTerms) {
      const index = lowerContent.indexOf(term);
      if (index !== -1) {
        const start = Math.max(0, index - maxLength / 4);
        const end = Math.min(content.length, index + term.length + maxLength / 4);
        const snippet = content.substring(start, end);
        
        // Count matches in this snippet
        const matchCount = searchTerms.reduce((count, term) => 
          count + (snippet.toLowerCase().match(new RegExp(term, 'g')) || []).length, 0);
        
        if (matchCount > 0) {
          bestStart = start;
          bestLength = end - start;
        }
      }
    }

    let snippet = content.substring(bestStart, bestStart + bestLength);
    if (bestStart > 0) snippet = '...' + snippet;
    if (bestStart + bestLength < content.length) snippet = snippet + '...';

    // Highlight search terms
    for (const term of searchTerms) {
      const regex = new RegExp(`(${term})`, 'gi');
      snippet = snippet.replace(regex, '**$1**');
    }

    return snippet;
  };

  // Search function
  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;
    
    setIsSearching(true);
    setResults([]);
    
    try {
      // Split search query into terms for better matching
      const searchTerms = searchQuery.toLowerCase()
        .split(' ')
        .filter(term => term.length > 1);
      
      // Get all user's documents
      const roomsQuery = query(
        collectionGroup(db, 'rooms'),
        where('userId', '==', user.emailAddresses[0].toString())
      );
      
      const roomsSnapshot = await getDocs(roomsQuery);
      const roomDocs = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        roomId: doc.data().roomId,
      }));
      
      // For each room, get the document content and check if it matches the search query
      const searchResults = [];
      
      for (const roomDoc of roomDocs) {
        const docRef = doc(db, 'documents', roomDoc.roomId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const docData = docSnap.data();
          const title = docData.title || 'Untitled';
          const content = docData.content || '';
          
          // Calculate relevance score
          const score = calculateRelevance(title, content, searchTerms);
          
          if (score > 0) {
            searchResults.push({
              id: roomDoc.id,
              roomId: roomDoc.roomId,
              title,
              content: extractSnippet(content, searchTerms),
              score: score
            });
          }
        }
      }
      
      // Sort results by relevance score
      searchResults.sort((a, b) => b.score - a.score);
      setResults(searchResults);
    } catch (error) {
      console.error('Error searching documents:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleResultClick = (roomId: string) => {
    router.push(`/doc/${roomId}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Documents</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search by title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 py-2"
            autoFocus
          />
          <Button 
            onClick={handleSearch} 
            className="absolute right-0 top-0 bottom-0 rounded-l-none"
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>
        
        <div className="mt-4 max-h-[300px] overflow-y-auto">
          {results.length === 0 && searchQuery && !isSearching ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No documents found matching your search.
            </p>
          ) : (
            <div className="space-y-2">
              {results.map((result) => (
                <div 
                  key={result.id}
                  onClick={() => handleResultClick(result.roomId)}
                  className="p-3 rounded-lg border border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">{result.title}</h3>
                  {result.content && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {result.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {isSearching && (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SearchDialog;