'use client'

import { useUser } from "@clerk/nextjs";
import { Input } from "./ui/input";
import { useCollection } from "react-firebase-hooks/firestore";
import { collectionGroup, DocumentData, query, where, orderBy, limit, Timestamp, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, FileText, Clock, PlusCircle } from "lucide-react";
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
    <div className="min-w-[240px] h-[160px] bg-gray-50 dark:bg-neutral-800/30 rounded-lg p-4 flex items-center justify-center">
      <div className="animate-pulse h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded"></div>
    </div>
  );

  if (!data) return null;

  return (
    <Link
      href={`/doc/${id}`}
      onMouseEnter={handleMouseEnter}
      prefetch={true}
      className="min-w-[240px] h-[160px] bg-white dark:bg-neutral-800/50 rounded-lg p-5 border border-gray-100 dark:border-neutral-800 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900/40 transition-all duration-200 flex flex-col justify-between group"
    >
      <div className="flex items-start justify-between">
        <FileText className="w-6 h-6 text-blue-500 dark:text-blue-400" />
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          <span className="text-xs text-gray-400 dark:text-gray-500">{t("homePage.badges.recent")}</span>
        </div>
      </div>
      <div>
        <h3 className="font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-lg">
          {data.data()?.title || t("document.placeholders.title")}
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
  const [data, loading, error] = useCollection(
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#090e19] dark:to-[#070b14] p-6 md:p-10">
      {/* Personalized greeting */}
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            {user ? t("homePage.greeting", { name: user.firstName || '' }) || t("homePage.greetingDefault") : t("homePage.greetingDefault")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {t("homePage.subtitle")}
          </p>
        </div>

        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-10 mb-12 shadow-xl">
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {t("homePage.hero.title")}
            </h2>
            <p className="text-blue-100 dark:text-blue-200 max-w-lg text-lg mb-6">
              {t("homePage.hero.description")}
            </p>
            <div className="bg-white rounded-md inline-block">
              <NewDocumentButton />
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10">
            <svg width="300" height="300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.5 3H4.5C3.67157 3 3 3.67157 3 4.5V19.5C3 20.3284 3.67157 21 4.5 21H19.5C20.3284 21 21 20.3284 21 19.5V4.5C21 3.67157 20.3284 3 19.5 3Z" stroke="currentColor" strokeWidth="2" />
              <path d="M7 7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M7 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-12">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder={t("homePage.search.placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-12 py-3 h-14 bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700 w-full max-w-3xl shadow-sm rounded-xl text-lg"
          />
          <Button
            onClick={handleSearch}
            className="absolute right-2 top-2 bottom-2 h-10"
            disabled={isSearching}
          >
            {isSearching ? t("homePage.search.searching") : t("homePage.search.button")}
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {t("homePage.sections.searchResults")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => router.push(`/doc/${result.roomId}`)}
                  className="min-w-[240px] h-[160px] bg-white dark:bg-neutral-800/50 rounded-lg p-5 border border-gray-100 dark:border-neutral-800 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900/40 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <FileText className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                    <div className="flex items-center space-x-1">
                      <Search className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                      <span className="text-xs text-gray-400 dark:text-gray-500">{t("homePage.badges.result")}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-lg">
                      {result.title}
                    </h3>
                    {result.content && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {t("homePage.sections.recentlyOpened")}
            </h2>
            <Button variant="ghost" className="text-blue-600 dark:text-blue-400 font-medium">
              {t("homePage.sections.viewAll")}
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[160px] bg-gray-100 dark:bg-neutral-800/30 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : recentDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4">
              {recentDocs.map((doc) => (
                <DocumentCard key={doc.id} id={doc.roomId} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-800/30 rounded-xl p-8 text-center border border-gray-100 dark:border-neutral-800">
              <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">{t("homePage.empty.noRecent")}</p>
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