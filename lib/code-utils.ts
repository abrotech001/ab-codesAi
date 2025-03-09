export const parseCodeBlocks = (text: string) => {
  // Enhanced regex to better handle code blocks with or without language specification
  const codeBlockRegex = /```([\w-]*)\n?([\s\S]*?)```/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const language = match[1]?.trim() || ""
    const code = match[2]?.trim() || ""
    const codeBlockStartIndex = match.index

    if (codeBlockStartIndex > lastIndex) {
      parts.push({ type: "text", content: text.substring(lastIndex, codeBlockStartIndex) })
    }

    parts.push({ type: "code", language: language, content: code })
    lastIndex = codeBlockRegex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.substring(lastIndex) })
  }

  return parts
}

// Function to detect if a string is likely code without being in a code block
export const detectInlineCode = (text: string) => {
  // Patterns that suggest code
  const codePatterns = [
    /\b(function|const|let|var|if|else|for|while|return|import|export|class)\b/,
    /<\/?[a-z][\s\S]*>/i, // HTML tags
    /\$$$.*$$/, // jQuery
    /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\b/i, // SQL
  ]

  return codePatterns.some((pattern) => pattern.test(text))
}

