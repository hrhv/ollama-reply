import browser from "webextension-polyfill";

const MODEL = "llama3.2:1b";

const SYSTEM_PROMPT = `You are an AI assistant that generates engaging responses to social media posts and comments. Based on the context you receive, you must generate a response that is engaging, relevant, and appropriate for the platform.

Guidelines:
- Keep responses concise (1-2 sentences for comments, 2-3 for posts)
- Be engaging and relevant to the content
- Use one or two emojis max
- Be friendly, respectful, and professional
- Don't use hashtags
- For LinkedIn: Maintain a professional tone while being personable
- For comments: Consider the context of both the original post and the comment
- For posts: Respond in a way that adds value to the conversation
- In the response, don't include any other text than the reply itself. No explanations like "Here's a LinkedIn response that adds value to the conversation" or "Here's a reply to the post" or anything like that.`;

browser.runtime.onInstalled.addListener(() => {
	console.log("Extension installed");
});

browser.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
	if (request.action === "fetchResponse") {
		fetchResponse(request.context || request.tweet, request.type).then((response) => {
			sendResponse({ response: response });
		}).catch((error) => {
			sendResponse({ error: error.message });
		});
		return true; // Indicates asynchronous response
	}
});

async function fetchResponse(context: string, type?: string): Promise<string> {
	// Enhance context based on type
	let enhancedContext = context;
	if (type === 'comment') {
		enhancedContext = `This is a comment on a LinkedIn post. Please generate a thoughtful reply to this comment that considers the context of both the original post and the comment.\n\nContext:\n${context}`;
	} else if (type === 'post') {
		enhancedContext = `This is a LinkedIn post. Please generate an engaging reply that adds value to the conversation.\n\nPost:\n${context}`;
	}

	try {
		const response = await fetch("http://localhost:11434/api/chat", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				stream: false,
				model: MODEL,
				messages: [
					{
						role: "system",
						content: SYSTEM_PROMPT,
					},
					{ role: "user", content: enhancedContext },
				],
			}),
		});

		if (!response.ok) {
			if (response.status === 403) {
				throw new Error(`Ollama rejected the request (403). This usually means:\n1. Ollama is not running\n2. Ollama needs to be started with CORS enabled\n3. Try running: OLLAMA_ORIGINS=* ollama serve`);
			} else {
				throw new Error(`Ollama returned error ${response.status}: ${response.statusText}`);
			}
		}

		const data = await response.json();
		if (!data.message || !data.message.content) {
			throw new Error('Invalid response format from Ollama');
		}
		
		return data.message.content;
	} catch (error) {
		if (error instanceof TypeError && error.message.includes('fetch')) {
			throw new Error('Cannot connect to Ollama. Please ensure:\n1. Ollama is running on localhost:11434\n2. Run: OLLAMA_ORIGINS=* ollama serve');
		}
		throw error;
	}
}
