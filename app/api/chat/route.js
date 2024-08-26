import {NextResponse} from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'

const systemPrompt = 
`You are a Rate My Professor assistant, designed to help students find the top professors based on their specific queries. You access a database of professor reviews and use Retrieval-Augmented Generation (RAG) to provide the most relevant results. 

### Your Objectives:
1. **Understand the Student's Query:** Determine the subject, teaching style, or any other specific preferences mentioned by the student.
2. **Retrieve Relevtant Professors:** Use RAG to search the database and retrieve the top 3 professors that best match the student's query.
3. **Provide Concise Recommendations:** For each professor, include their name, subject taught, star rating, and a brief summary of the most relevant review.
4. **Answer Follow-up Questions:** Be prepared to refine your search or provide additional details based on further questions from the student.

### Example Interaction:

**Student Query:**  
"I'm looking for a great professor who teaches Cognitive Science."

**Response:**  
"Here are the top 3 professors for Cognitive Science based on student reviews:

1. **Dr. Emily Johnson**  
   - **Subject:** Introduction to Cognitive Science  
   - **Rating:** 5 stars  
   - **Review:** 'Dr. Johnson is an outstanding professor. Her lectures are clear and engaging, and she really cares about her students.'

2. **Dr. Jessica Taylor**  
   - **Subject:** Cognitive Neuroscience  
   - **Rating:** 5 stars  
   - **Review:** 'Dr. Taylor is incredibly knowledgeable and passionate about the subject. Highly recommend her class.'

3. **Dr. Kevin Martinez**  
   - **Subject:** Computational Linguistics  
   - **Rating:** 4 stars  
   - **Review:** 'Dr. Martinez is a great professor, but the workload is intense. Be prepared to work hard.'

If you have any more specific preferences or need information on another subject, feel free to ask!"
`

export async function POST(req) {
    const data = await req.json()
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    })
    const index = pc.index('rag').namespace('ns1')
    const openai = new OpenAI()

    const text = data[data.length - 1].content
    const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input:text,
        encoding_format:'float',
    })

    const results = await index.query({
        topK:3,
        includeMetadata:true,
        vector:embedding.data[0].embedding
    })

    let resultString='Returned results from vector db (done automatically): '
    results.matches.forEach((match) => {
        resultString+=`\n
        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n
        `
    })

    const lastMessage = data[data.length-1]
    const lastMessageContent = lastMessage.content + resultString
    const cleanedText=lastMessageContent.replace('#', '').replace('*', '')
    const lastDataWithoutLastMessage = data.slice(0,data.length-1)
    const completion = await openai.chat.completions.create({
        messages:[
            {role: 'system', content: systemPrompt},
            ...lastDataWithoutLastMessage,
            {role: 'user', content: cleanedText},
        ],
        model: 'gpt-4o-mini',
        stream: true,
    })

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content
                    if(content) {
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            }
            catch (err) {
                controller.error(err)
            } finally {
                controller.close()
            }
        },
    })

    return new NextResponse(stream)
}