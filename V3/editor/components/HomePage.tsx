'use client'

import { useUser } from "@clerk/nextjs";
import { Input } from "./ui/input";
import { useCollection } from "react-firebase-hooks/firestore";
import { collectionGroup, DocumentData, query, where, orderBy, limit, Timestamp, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, FileText, Clock } from "lucide-react";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "./ui/button";
import NewDocumentButton from "./NewDocumentButton";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

interface RecentDocument extends DocumentData {
  id: string;
  roomId: string;
  title?: string;
  createdAt: string;
  lastOpened?: Timestamp;
}

interface SearchResult extends DocumentData {
  id: string;
  roomId: string;
  title?: string;
  content?: string;
}
function DocumentCard({ id }: { id: string }) {
  const [data, loading] = useDocument(doc(db, "documents", id));
  const router = useRouter();
  const { t } = useTranslation();

  // Prefetch document on hover for instant navigation
  const handleMouseEnter = () => {
    router.prefetch(`/doc/${id}`);
  };

  if (loading) return (
    <div className="min-w-[240px] h-[160px] glass rounded-2xl p-5 flex items-center justify-center">
      <div className="animate-pulse h-4 w-24 bg-gray-200/50 dark:bg-gray-700/50 rounded-full"></div>
    </div>
  );

  if (!data) return null;

  return (
    <Link
      href={`/doc/${id}`}
      onMouseEnter={handleMouseEnter}
      prefetch={true}
      className="min-w-[240px] h-[160px] glass rounded-2xl p-6 hover-lift hover-scale transition-all duration-300 flex flex-col justify-between group cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 group-hover:bg-blue-500/20 dark:group-hover:bg-blue-400/20 transition-colors">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex items-center space-x-1.5 px-2 py-1 rounded-full bg-gray-100/50 dark:bg-gray-800/50">
          <Clock className="w-3 h-3 text-gray-500 dark:text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("homePage.badges.recent")}</span>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-lg mb-1">
          {data.data()?.title || t("document.placeholders.title")}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {t("homePage.empty.lastEdited")}
        </p>
      </div>
    </Link>
  );
}

function HomePage() {
  const { user } = useUser();
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch user's documents
  const [data, loading] = useCollection(
    user &&
    query(
      collectionGroup(db, 'rooms'),
      where('userId', '==', user.emailAddresses[0].toString()),
      // Order by lastOpened to show most recently accessed documents first
      orderBy('lastOpened', 'desc'),
      limit(10)
    )
  );

  useEffect(() => {
    if (!data) return;

    const docs = data.docs.map(doc => ({
      id: doc.id,
      roomId: doc.data().roomId,
      createdAt: doc.data().createdAt,
      lastOpened: doc.data().lastOpened || null,
    }));

    setRecentDocs(docs);
  }, [data]);

  // Search function
  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
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
      const results = [];

      for (const roomDoc of roomDocs) {
        const docRef = doc(db, 'documents', roomDoc.roomId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const docData = docSnap.data();
          const title = docData.title || 'Untitled';
          const content = docData.content || '';

          // Check if title or content contains the search query (case insensitive)
          const lowerQuery = searchQuery.toLowerCase();
          if (
            title.toLowerCase().includes(lowerQuery) ||
            content.toLowerCase().includes(lowerQuery)
          ) {
            results.push({
              id: roomDoc.id,
              roomId: roomDoc.roomId,
              title,
              // Include a snippet of content around the match
              content: content.length > 100 ? content.substring(0, 100) + '...' : content,
            });
          }
        }
      }

      setSearchResults(results);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0f0f0f] dark:via-[#1a1a2e] dark:to-[#0f0f0f] p-6 md:p-12 transition-colors duration-300">
      {/* Personalized greeting */}
      <div className="max-w-6xl mx-auto">
        <div className="mb-14 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent mb-4 tracking-tight leading-tight">
            {user ? t("homePage.greeting", { name: user.firstName || '' }) || t("homePage.greetingDefault") : t("homePage.greetingDefault")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-xl font-light">
            {t("homePage.subtitle")}
          </p>
        </div>

        {/* Hero banner - Glassmorphism with subtle gradient */}
        <div className="relative overflow-hidden rounded-3xl glass p-12 mb-14 group animate-scale-in border border-blue-500/20 dark:border-blue-400/20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-600/20 dark:via-indigo-600/20 dark:to-purple-600/20"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-5 tracking-tight">
              {t("homePage.hero.title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 max-w-2xl text-lg mb-8 leading-relaxed font-light">
              {t("homePage.hero.description")}
            </p>
            <div className="inline-block">
              <NewDocumentButton />
            </div>
          </div>
          <div className="absolute right-8 bottom-8 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-500">
            <svg width="200" height="200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.5 3H4.5C3.67157 3 3 3.67157 3 4.5V19.5C3 20.3284 3.67157 21 4.5 21H19.5C20.3284 21 21 20.3284 21 19.5V4.5C21 3.67157 20.3284 3 19.5 3Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 7H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M7 12H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M7 17H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Search bar - Floating glass design */}
        <div className="relative mb-14">
          <div className="glass-intense rounded-2xl p-2 max-w-3xl mx-auto hover-lift">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <Input
                type="text"
                placeholder={t("homePage.search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-14 pr-32 py-4 h-14 bg-transparent border-0 w-full focus-visible:ring-0 text-lg placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <Button
                onClick={handleSearch}
                className="absolute right-2 top-2 bottom-2 h-10 rounded-xl hover-scale"
                disabled={isSearching}
              >
                {isSearching ? t("homePage.search.searching") : t("homePage.search.button")}
              </Button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-14 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                {t("homePage.sections.searchResults")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => router.push(`/doc/${result.roomId}`)}
                  className="min-w-[240px] h-[160px] glass rounded-2xl p-6 hover-lift hover-scale transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-xl bg-green-500/10 dark:bg-green-400/10 group-hover:bg-green-500/20 dark:group-hover:bg-green-400/20 transition-colors">
                      <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex items-center space-x-1.5 px-2 py-1 rounded-full bg-green-100/50 dark:bg-green-900/30">
                      <Search className="w-3 h-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">{t("homePage.badges.result")}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors text-lg mb-1">
                      {result.title}
                    </h3>
                    {result.content && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 font-medium">
                        {result.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently opened notes carousel */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {t("homePage.sections.recentlyOpened")}
            </h2>
            <Button variant="ghost" className="text-blue-600 dark:text-blue-400 font-semibold hover-scale rounded-xl">
              {t("homePage.sections.viewAll")}
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[160px] glass rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : recentDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4">
              {recentDocs.map((doc) => (
                <DocumentCard key={doc.id} id={doc.roomId} />
              ))}
            </div>
          ) : (
            <div className="glass-intense rounded-3xl p-12 text-center animate-fade-in">
              <div className="p-4 rounded-2xl bg-gray-100/50 dark:bg-gray-800/50 w-fit mx-auto mb-6">
                <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-xl mb-6 font-light">{t("homePage.empty.noRecent")}</p>
              <div className="inline-block">
                <NewDocumentButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;