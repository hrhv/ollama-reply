import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Star } from "lucide-react";
import { useState } from "react";
import browser from "webextension-polyfill";
import CopyButton from "~/components/CopyButton";
import { Skeleton } from "~/components/ui/skeleton";

function App() {
	const [response, setResponse] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	return (
		<main className="min-w-[300px] min-h-[300px] bg-zinc-900 text-white p-4">
			<nav className="flex justify-between items-center">
				<p className="text-white text-lg font-bold">🦙 ollama-reply</p>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<a
								href="https://github.com/jose-donato/ollama-reply"
								target="_blank"
								rel="noreferrer"
							>
								<Button
									variant="ghost"
									size="sm"
									className="flex gap-1 items-center"
								>
									<Star size={12} />
									Star me
								</Button>
							</a>
						</TooltipTrigger>
						<TooltipContent>
							<p>Settings</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</nav>
			<div className="mt-4">
				<p className="text-lg">Welcome to ollama-reply</p>
				<p className="text-sm text-zinc-400">
					AI Reply buttons are now automatically injected on LinkedIn posts and comments! 🚀
				</p>
				<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
					<p className="text-sm text-blue-800 mb-2">
						<strong>New Feature:</strong> Automatic LinkedIn Integration
					</p>
					<ul className="text-xs text-blue-700 space-y-1">
						<li>• AI Reply buttons appear on every LinkedIn post</li>
						<li>• Context-aware replies for posts and comments</li>
						<li>• No need to manually trigger - just click the AI Reply button!</li>
					</ul>
				</div>
				<div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
					<p className="text-sm text-gray-700 mb-2">
						<strong>Manual Mode:</strong> Still available for Twitter
					</p>
					<Button
						className="mt-2"
						onClick={async () => {
							setIsLoading(true);
							const tabs = await browser.tabs.query({
								active: true,
								currentWindow: true,
							});
							const results = await browser.scripting.executeScript({
								target: { tabId: tabs[0].id },
								function: analyzeCurrentTweet,
							});
							const tweet = results[0].result; // Get the result from the injected script
							const response = await browser.runtime.sendMessage({
								action: "fetchResponse",
								context: tweet,
								type: 'post'
							});
							setResponse(response.response);
							setIsLoading(false);
						}}
					>
						{response ? "Generate another reply" : "Generate Twitter reply"}
					</Button>
				</div>
				{isLoading || response ? (
					<div className="mt-4">
						<p className="text-lg mb-2">Generated reply</p>
						{isLoading && <Skeleton className="h-[125px] w-full rounded-md" />}
						{response && !isLoading && (
							<code className="text-xs group bg-zinc-800 p-2 rounded-md block border border-zinc-800 relative whitespace-pre-wrap">
								<CopyButton response={response} />
								{response}
							</code>
						)}
					</div>
				) : null}
			</div>
			<p className="text-xs text-zinc-400 mt-4 text-center">
				Developed by{" "}
				<a
					href="https://jose-donato.deno.dev"
					className="underline hover:text-white"
					target="_blank"
					rel="noreferrer"
				>
					Jose Donato
				</a>
				. Code open source on{" "}
				<a
					href="https://github.com/jose-donato/ollama-reply"
					target="_blank"
					rel="noreferrer"
					className="underline hover:text-white"
				>
					GitHub
				</a>
				.
			</p>
		</main>
	);
}

export default App;

function analyzeCurrentTweet() {
	const hostname = window.location.hostname;

	if (hostname.includes("twitter.com")) {
		const tweet = document.querySelector('[data-testid="tweetText"]')?.innerText;
		return tweet || "No tweet text found";
	}
	if (hostname.includes("linkedin.com")) {
		// Try multiple selectors for LinkedIn posts
		const postText = document.querySelector(
			".feed-shared-update-v2__description, .feed-shared-inline-show-more-text, .update-components-text, .update-components-update-v2__commentary"
		)?.innerText;
		return postText || "No LinkedIn post text found";
	}
	console.error("Unsupported site");
	return "Unsupported site - please use on Twitter or LinkedIn";
}
