import { parseCodeBlocks } from "./code-utils"
import { CodeBlock } from "@/components/code-block"
import { MarkdownRenderer } from "@/components/markdown-renderer"

export const renderMessageContent = (content: string) => {
  const parts = parseCodeBlocks(content)

  return parts.map((part, i) => {
    if (part.type === "code") {
      return (
        <div key={i} className="my-4">
          <CodeBlock code={part.content} language={part.language} />
        </div>
      )
    } else {
      return <MarkdownRenderer key={i} content={part.content} />
    }
  })
}

