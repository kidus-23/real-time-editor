'use client';

import { useParams } from 'next/navigation';
import VersionHistory from '@/components/VersionHistory';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function VersionHistoryPage() {
  const params = useParams();
  const documentId = params.id as string;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-4">
        <Link href={`/doc/${documentId}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to document
          </Button>
        </Link>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <VersionHistory documentId={documentId} />
      </main>
    </div>
  );
}