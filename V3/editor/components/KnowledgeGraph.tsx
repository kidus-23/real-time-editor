'use client'

import { useEffect, useRef, useState, memo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useUser } from '@clerk/nextjs';
import ForceGraph2D from 'react-force-graph-2d';
import { useTheme } from 'next-themes';

interface GraphNode {
  id: string;
  name: string;
  val: number; // Size of node
  color?: string;
}

interface GraphLink {
  source: string;
  target: string;
  value: number; // Strength of connection
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const KnowledgeGraph = memo(function KnowledgeGraph() {
  const { user } = useUser();
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const graphRef = useRef<any>(null);
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  useEffect(() => {
    if (!user) return;

    const fetchDocumentsAndBuildGraph = async () => {
      setLoading(true);
      try {
        // Get all user's documents
        const roomsQuery = query(
          collection(db, 'users', user.emailAddresses[0].toString(), 'rooms')
        );

        const roomsSnapshot = await getDocs(roomsQuery);
        const roomIds = roomsSnapshot.docs.map(doc => doc.data().roomId);

        // Fetch document data including tags
        const documents: Array<{ id: string; title: string; tags: string[] }> = [];

        for (const roomId of roomIds) {
          const docRef = collection(db, 'documents');
          const docQuery = query(docRef, where('__name__', '==', roomId));
          const docSnapshot = await getDocs(docQuery);

          docSnapshot.forEach(doc => {
            const data = doc.data();
            documents.push({
              id: doc.id,
              title: data.title || 'Untitled',
              tags: data.tags || []
            });
          });
        }

        // Build graph data
        const nodes: GraphNode[] = [];
        const links: GraphLink[] = [];
        const tagMap: Record<string, string[]> = {}; // Maps tags to document IDs

        // Add document nodes
        documents.forEach(doc => {
          nodes.push({
            id: doc.id,
            name: doc.title,
            val: 5, // Document nodes are larger
            color: '#4f46e5' // Indigo for documents
          });

          // Process tags
          doc.tags.forEach(tag => {
            if (!tagMap[tag]) {
              tagMap[tag] = [];
            }
            tagMap[tag].push(doc.id);
          });
        });

        // Add tag nodes and create links
        Object.entries(tagMap).forEach(([tag, docIds]) => {
          const tagId = `tag-${tag}`;

          // Only add tags that connect multiple documents
          if (docIds.length > 0) {
            nodes.push({
              id: tagId,
              name: tag,
              val: 3, // Tag nodes are smaller
              color: isDarkMode ? '#10b981' : '#059669' // Green for tags
            });

            // Create links between tags and documents
            docIds.forEach(docId => {
              links.push({
                source: tagId,
                target: docId,
                value: 1
              });
            });

            // Create links between documents that share tags
            if (docIds.length > 1) {
              for (let i = 0; i < docIds.length; i++) {
                for (let j = i + 1; j < docIds.length; j++) {
                  // Check if this link already exists
                  const existingLink = links.find(
                    link =>
                      (link.source === docIds[i] && link.target === docIds[j]) ||
                      (link.source === docIds[j] && link.target === docIds[i])
                  );

                  if (existingLink) {
                    existingLink.value += 1; // Strengthen existing link
                  } else {
                    links.push({
                      source: docIds[i],
                      target: docIds[j],
                      value: 1
                    });
                  }
                }
              }
            }
          }
        });

        setGraphData({ nodes, links });
      } catch (error) {
        console.error('Error building knowledge graph:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentsAndBuildGraph();
  }, [user, isDarkMode]);

  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      // Center and zoom the graph for better visibility
      setTimeout(() => {
        graphRef.current.zoomToFit(400, 50);
      }, 500);
    }
  }, [graphData]);

  return (
    <div className="h-screen w-screen">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : graphData.nodes.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>No connections found</p>
        </div>
      ) : (
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeLabel="name"
          nodeColor="color"
          nodeVal="val"
          linkWidth={link => Math.sqrt(link.value)}
          linkColor={() => isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
          backgroundColor={isDarkMode ? "#090e19" : "#ffffff"}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name as string;
            const fontSize = 14 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;

            ctx.fillStyle = node.color as string;
            ctx.beginPath();
            ctx.arc(node.x as number, node.y as number, node.val as number, 0, 2 * Math.PI);
            ctx.fill();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isDarkMode ? 'white' : 'black';
            ctx.fillText(label, node.x as number, (node.y as number) + node.val as number + fontSize);
          }}
          onNodeClick={(node) => {
            // Navigate to document if it's a document node
            if (!node.id.toString().startsWith('tag-')) {
              window.open(`/doc/${node.id}`, '_blank');
            }
          }}
        />
      )}
    </div>
  );
})

export default KnowledgeGraph;