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
- For posts: Respond in a way that adds value to the conversation`;

browser.runtime.onInstalled.addListener(() => {
	console.log("Extension installed");
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "fetchResponse") {
		fetchResponse(request.context || request.tweet, request.type).then((response) => {
			sendResponse({ response: response });
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
	const data = await response.json();
	return data.message.content;
}
