"use client"

import { Check, Copy } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Prism from "prismjs"
import "prismjs/components/prism-markup-templating" // Add this line before language imports
import "prismjs/components/prism-markup"
import "prismjs/components/prism-css"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-tsx"
import "prismjs/components/prism-python"
import "prismjs/components/prism-java"
import "prismjs/components/prism-c"
import "prismjs/components/prism-cpp"
import "prismjs/components/prism-csharp"
import "prismjs/components/prism-ruby"
import "prismjs/components/prism-php"
import "prismjs/components/prism-go"
import "prismjs/components/prism-rust"
import "prismjs/components/prism-swift"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-json"
import "prismjs/components/prism-yaml"
import "prismjs/components/prism-markdown"
import "prismjs/components/prism-sql"

interface CodeBlockProps {
  code: string
  language: string
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [highlightedCode, setHighlightedCode] = useState("")

  // Map common language aliases to Prism's language names
  const languageMap: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    rb: "ruby",
    sh: "bash",
    shell: "bash",
    yml: "yaml",
    md: "markdown",
  }

  const normalizedLanguage = languageMap[language.toLowerCase()] || language.toLowerCase() || "plaintext"

  useEffect(() => {
    // Highlight the code when component mounts or code/language changes
    try {
      if (Prism.languages[normalizedLanguage]) {
        const highlighted = Prism.highlight(code, Prism.languages[normalizedLanguage], normalizedLanguage)
        setHighlightedCode(highlighted)
      } else {
        setHighlightedCode(code)
      }
    } catch (error) {
      console.error(`Error highlighting code for language ${normalizedLanguage}:`, error)
      setHighlightedCode(code) // Fallback to plain text if highlighting fails
    }
  }, [code, normalizedLanguage])

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayLanguage =
    normalizedLanguage === "plaintext"
      ? "text"
      : normalizedLanguage.charAt(0).toUpperCase() + normalizedLanguage.slice(1)

  return (
    <div className="relative rounded-md overflow-hidden bg-zinc-950 text-zinc-50 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <span className="text-sm font-medium text-zinc-400">{displayLanguage}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          onClick={copyToClipboard}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy code
            </>
          )}
        </Button>
      </div>
      <div className="relative">
        <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
          <code className={`language-${normalizedLanguage}`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
        <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none"></div>
      </div>
    </div>
  )
}

