/* eslint-disable @typescript-eslint/no-explicit-any */

import { Block } from "@blocknote/core";

/**
 * Converts mermaid code blocks in markdown to mermaid diagram blocks
 * @param blocks - Array of BlockNote blocks
 * @returns Array of blocks with mermaid code blocks converted to mermaid diagram blocks
 */
export function convertMermaidCodeBlocks(blocks: Block[]): Block[] {
  return blocks.map((block: any) => {
    // Check if this is a code block with language="mermaid"
    if (
      block.type === "codeBlock" &&
      block.props?.language === "mermaid" &&
      block.content
    ) {
      // Extract the code from the content
      const code = block.content.map((c: any) => c.text || "").join("");
      
      // Convert to mermaid diagram block
      return {
        type: "mermaid",
        props: {
          code: code.trim(),
        },
        children: block.children || [],
      } as any;
    }

    // Recursively handle nested blocks (children)
    if (block.children && Array.isArray(block.children)) {
      return {
        ...block,
        children: convertMermaidCodeBlocks(block.children),
      };
    }

    return block;
  });
}
