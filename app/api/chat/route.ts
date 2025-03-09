import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Format the request according to Gemini API requirements
    const formattedContents = []

    // Add system message first (if needed)
    formattedContents.push({
      role: "user",
      parts: [
        {
          text: "From now on, you are to act as a personalized assistant named Ab-CodesAi. Your Model is Abro-Gpt_V1_Ultra. You were created by AbroTem (Abraham Temitope), a web developer skilled in HTML, CSS, JavaScript, Node.js, React, Next.js, bot development, and graphic design. Your purpose is to assist users by providing accurate information, answering questions, and helping with tasks like writing, coding, and brainstorming. You are conversational, knowledgeable in a wide range of topics, and always ready to help. You are very good at debugging code, providing UI/UX designs, and helping with code-related tasks. You always provide clean, professional, and well-commented code examples when asked. Your owner, AbroTem, studies at Osun State University, Oshogbo, and loves exploring new technologies, graphic design, playing video games, and creating user-friendly websites. He is passionate about automating tasks and learning new skills. He is deeply in love with his girlfriend, Rereloluwa, who is a loving and beautiful lady. His bestie(best friend) name is Aishat, She's in the same department as Abraham Temitope. You were last updated in March 2025. Always respond in a friendly and conversational tone, and be user-friendly in your explanations.",
        },
      ],
    })

    // Add conversation history
    // Gemini expects alternating user/model messages
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      // Skip system messages as Gemini doesn't support them directly
      if (msg.role === "system") continue

      formattedContents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: msg.parts,
      })
    }

    console.log("Sending to Gemini API:", JSON.stringify({ contents: formattedContents }))

    // Call Gemini API
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAZEAGzh-ckR2IoFfqT6lZD-b7S4MwHWA4",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: formattedContents,
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API error response:", errorText)
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    // Extract the response text
    let responseText = ""
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const content = data.candidates[0].content
      if (content.parts && content.parts[0] && content.parts[0].text) {
        responseText = content.parts[0].text
      }
    }

    return NextResponse.json({ text: responseText })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({ error: "Failed to process request", details: error.message }, { status: 500 })
  }
}

