import { useEffect, useState } from "react";
import { MessageCircle, Sparkles } from "lucide-react";

interface LinkedInPost {
  id: string;
  text: string;
  author: string;
  type: 'post' | 'comment';
  parentPost?: LinkedInPost;
}

function App() {
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.hostname.includes('linkedin.com')) {
      // Initial scan
      scanLinkedInContent();
      
      // Debounced scan function
      let scanTimeout: NodeJS.Timeout;
      const debouncedScan = () => {
        clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => {
          scanLinkedInContent();
        }, 500); // Wait 500ms after last mutation
      };
      
      // Set up observer for dynamic content
      const observer = new MutationObserver(debouncedScan);
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Add scroll event listener for better post detection
      const handleScroll = () => {
        debouncedScan();
      };

      window.addEventListener('scroll', handleScroll, { passive: true });

      // Add periodic scan to catch missed posts
      const periodicScan = setInterval(() => {
        scanLinkedInContent();
      }, 10000); // Scan every 10 seconds

      return () => {
        observer.disconnect();
        clearTimeout(scanTimeout);
        window.removeEventListener('scroll', handleScroll);
        clearInterval(periodicScan);
      };
    }
  }, []);

  const scanLinkedInContent = async () => {
    const newPosts: LinkedInPost[] = [];
    
    // Scan for main posts - using multiple selectors for better coverage
    const postElements = document.querySelectorAll('[data-urn^="urn:li:activity:"], .feed-shared-update-v2, .occludable-update, .feed-shared-update-v2--minimal-padding, [class*="feed-shared"], [class*="update-v2"]');
    
    for (const postEl of postElements) {
      // Get URN from various possible attributes
      const urn = postEl.getAttribute('data-urn') || 
                  postEl.getAttribute('data-finite-scroll-hotkey-item') || 
                  `post-${Date.now()}-${Math.random()}`;
      
      if (posts.some(p => p.id === urn)) continue;
      
      // Try multiple selectors for post text with fallbacks
      let textElement = postEl.querySelector('.feed-shared-update-v2__description, .feed-shared-inline-show-more-text, .update-components-text, .update-components-update-v2__commentary');
      let authorElement = postEl.querySelector('.update-components-actor__title, .update-components-actor__single-line-truncate');
      
      // Check if post is truncated and expand it
      const expandButton = postEl.querySelector('.feed-shared-inline-show-more-text__see-more-less-toggle');
      if (expandButton && expandButton.textContent?.includes('…more')) {
        try {
          // Click the expand button to show full content
          (expandButton as HTMLElement).click();
          // Wait a bit for the content to expand
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // After expansion, try to get the full text again
          textElement = postEl.querySelector('.feed-shared-update-v2__description, .feed-shared-inline-show-more-text, .update-components-text, .update-components-update-v2__commentary');
        } catch (error) {
          console.log('Could not expand post:', error);
        }
      }
      
      // Also check for other truncation patterns
      const moreTextButton = postEl.querySelector('[aria-label*="see more"], [class*="see-more"], [class*="show-more"]');
      if (moreTextButton && !textElement) {
        try {
          (moreTextButton as HTMLElement).click();
          await new Promise(resolve => setTimeout(resolve, 200));
          textElement = postEl.querySelector('.feed-shared-update-v2__description, .feed-shared-inline-show-more-text, .update-components-text, .update-components-update-v2__commentary');
        } catch (error) {
          console.log('Could not expand post with alternative button:', error);
        }
      }
      
      // Fallback: try to find text content in any readable element
      if (!textElement) {
        const fallbackTextElement = postEl.querySelector('p, div, span');
        if (fallbackTextElement && fallbackTextElement.textContent && fallbackTextElement.textContent.length > 20) {
          textElement = fallbackTextElement;
        }
      }
      
      // Fallback: try to find author in any actor-related element
      if (!authorElement) {
        const fallbackAuthorElement = postEl.querySelector('[class*="actor"], [class*="author"], [class*="name"]');
        if (fallbackAuthorElement && fallbackAuthorElement.textContent && fallbackAuthorElement.textContent.length > 2) {
          authorElement = fallbackAuthorElement;
        }
      }
      
      if (textElement && authorElement) {
        const text = textElement.textContent?.trim() || '';
        const author = authorElement.textContent?.trim() || '';
        
        if (text.length > 10 && author.length > 1) { // Only consider posts with substantial content
          newPosts.push({
            id: urn,
            text,
            author,
            type: 'post'
          });
        }
      }
    }

    // Scan for comments - LinkedIn comments are often in different structures
    const commentElements = document.querySelectorAll('.feed-shared-comment, .comments-comment-item, .update-v2-social-activity .social-details-social-counts + div, [class*="comment"], [class*="reply"]');
    commentElements.forEach((commentEl) => {
      const commentId = commentEl.getAttribute('data-comment-id') || 
                       commentEl.getAttribute('data-urn') || 
                       `comment-${Date.now()}-${Math.random()}`;
      if (posts.some(p => p.id === commentId)) return;
      
      // Try multiple selectors for comment text
      const textElement = commentEl.querySelector('.feed-shared-comment__content, .comments-comment-item__main-content, .update-components-text, [class*="content"], [class*="text"]');
      const authorElement = commentEl.querySelector('.feed-shared-comment__actor-name, .comments-comment-item__actor-name, .update-components-actor__title, [class*="actor"], [class*="author"], [class*="name"]');
      
      if (textElement && authorElement) {
        const text = textElement.textContent?.trim() || '';
        const author = authorElement.textContent?.trim() || '';
        
        if (text.length > 5) { // Comments can be shorter
          // Find parent post - try multiple selectors
          const parentPost = commentEl.closest('[data-urn^="urn:li:activity:"], .feed-shared-update-v2, .occludable-update');
          const parentPostData = parentPost ? posts.find(p => p.id === parentPost.getAttribute('data-urn') || p.id === parentPost.getAttribute('data-finite-scroll-hotkey-item')) : undefined;
          
          newPosts.push({
            id: commentId,
            text,
            author,
            type: 'comment',
            parentPost: parentPostData
          });
        }
      }
    });

    if (newPosts.length > 0) {
      setPosts(prev => [...prev, ...newPosts]);
      injectCTAs(newPosts);
    }
  };

  const injectCTAs = (newPosts: LinkedInPost[]) => {
    newPosts.forEach(post => {
      if (post.type === 'post') {
        injectPostCTA(post);
      } else if (post.type === 'comment') {
        injectCommentCTA(post);
      }
    });
  };

  const injectPostCTA = (post: LinkedInPost) => {
    // Try multiple selectors to find the post element
    const postElement = document.querySelector(`[data-urn="${post.id}"]`) || 
                       document.querySelector(`[data-finite-scroll-hotkey-item="${post.id}"]`);
    
    if (!postElement) return;
    
    // Check if CTA already exists
    if (postElement.querySelector('.ollama-reply-cta')) return;
    
    // Try multiple selectors for the social action bar
    const socialActionBar = postElement.querySelector('.feed-shared-social-action-bar, .social-actions-container');
    if (!socialActionBar) return;
    
    const ctaButton = document.createElement('button');
    ctaButton.className = 'ollama-reply-cta artdeco-button artdeco-button--muted artdeco-button--3 artdeco-button--tertiary social-actions-button flex-wrap';
    ctaButton.innerHTML = `
      <svg role="none" aria-hidden="true" class="artdeco-button__icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
        <path d="M8 1a7 7 0 107 7 7 7 0 00-7-7zM3 8a5 5 0 011-3l.55.55A1.5 1.5 0 015 6.62v1.07a.75.75 0 00.22.53l.56.56a.75.75 0 00.53.22H7v.69a.75.75 0 00.22.53l.56.56a.75.75 0 01.22.53V13a5 5 0 01-5-5zm6.24 4.83l2-2.46a.75.75 0 00.09-.8l-.58-1.16A.76.76 0 0010 8H7v-.19a.51.51 0 01.28-.45l.38-.19a.74.74 0 01.68 0L9 7.5l.38-.7a1 1 0 00.12-.48v-.85a.78.78 0 01.21-.53l1.07-1.09a5 5 0 01-1.54 9z" fill="currentColor"/>
      </svg>
      <span class="artdeco-button__text">AI Reply</span>
    `;
    
    ctaButton.addEventListener('click', () => {
      if (isGenerating === post.id) return; // Prevent multiple clicks
      generateReply(post);
    });
    
    // Try to insert after the comment button, or append to the end
    const commentButton = socialActionBar.querySelector('.comment-button, [aria-label*="Comment"]');
    if (commentButton) {
      commentButton.parentElement?.parentElement?.insertBefore(ctaButton, commentButton.parentElement.nextSibling);
    } else {
      socialActionBar.appendChild(ctaButton);
    }
  };

  const injectCommentCTA = (comment: LinkedInPost) => {
    // Try multiple selectors to find the comment element
    const commentElement = document.querySelector(`[data-comment-id="${comment.id}"]`) || 
                          document.querySelector(`[data-urn="${comment.id}"]`);
    
    if (!commentElement || commentElement.querySelector('.ollama-reply-cta')) return;
    
    // Try multiple selectors for comment actions
    let commentActions = commentElement.querySelector('.feed-shared-comment__actions, .comments-comment-item__actions, .social-actions');
    
    // If no actions container found, try to create one or find alternative locations
    if (!commentActions) {
      // Look for any action-like elements
      commentActions = commentElement.querySelector('[class*="action"], [class*="button"], [class*="toolbar"]');
      
      // If still not found, try to append to the comment element itself
      if (!commentActions) {
        commentActions = commentElement;
      }
    }
    
    const ctaButton = document.createElement('button');
    ctaButton.className = 'ollama-reply-cta artdeco-button artdeco-button--muted artdeco-button--2 artdeco-button--tertiary';
    ctaButton.innerHTML = `
      <svg role="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
        <path d="M8 1a7 7 0 107 7 7 7 0 00-7-7zM3 8a5 5 0 011-3l.55.55A1.5 1.5 0 015 6.62v1.07a.75.75 0 00.22.53l.56.56a.75.75 0 00.53.22H7v.69a.75.75 0 00.22.53l.56.56a.75.75 0 01.22.53V13a5 5 0 01-5-5zm6.24 4.83l2-2.46a.75.75 0 00.09-.8l-.58-1.16A.76.76 0 0010 8H7v-.19a.51.51 0 01.28-.45l.38-.19a.74.74 0 01.68 0L9 7.5l.38-.7a1 1 0 00.12-.48v-.85a.78.78 0 01.21-.53l1.07-1.09a5 5 0 01-1.54 9z" fill="currentColor"/>
      </svg>
      AI Reply
    `;
    
    ctaButton.addEventListener('click', () => {
      if (isGenerating === comment.id) return; // Prevent multiple clicks
      generateReply(comment);
    });
    
    // Add some spacing and insert the button
    ctaButton.style.marginLeft = '8px';
    commentActions.appendChild(ctaButton);
  };

  const generateReply = async (post: LinkedInPost) => {
    setIsGenerating(post.id);
    
    // Add loading state to the button
    const ctaButton = document.querySelector(`[data-urn="${post.id}"] .ollama-reply-cta, [data-comment-id="${post.id}"] .ollama-reply-cta`);
    if (ctaButton) {
      ctaButton.classList.add('loading');
      ctaButton.textContent = 'Generating...';
    }
    
    try {
      // Prepare context for the model
      let context = '';
      if (post.type === 'post') {
        context = `Post by ${post.author}: ${post.text}`;
      } else if (post.type === 'comment' && post.parentPost) {
        context = `Post by ${post.parentPost.author}: ${post.parentPost.text}\n\nComment by ${post.author}: ${post.text}`;
      }
      
      console.log('Generating reply for:', { type: post.type, author: post.author, context: context.substring(0, 100) + '...' });
      
      const response = await chrome.runtime.sendMessage({
        action: "fetchResponse",
        context: context,
        type: post.type
      });
      
      if (response && response.response) {
        // Show the generated reply in a modal or tooltip
        showGeneratedReply(post.id, response.response);
        console.log('Reply generated successfully');
      } else if (response && response.error) {
        throw new Error(response.error);
      } else {
        throw new Error('No response received from background script');
      }
    } catch (error) {
      console.error('Error generating reply:', error);
      // Show a more user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('403') || errorMessage.includes('CORS')) {
        alert(`Ollama Connection Error:\n\n${errorMessage}\n\nTo fix this:\n1. Stop Ollama if it's running\n2. Run: OLLAMA_ORIGINS=* ollama serve\n3. In another terminal: ollama run llama3.2:1b`);
      } else if (errorMessage.includes('Cannot connect')) {
        alert(`Ollama Not Running:\n\n${errorMessage}\n\nPlease start Ollama first:\n1. Run: OLLAMA_ORIGINS=* ollama serve\n2. In another terminal: ollama run llama3.2:1b`);
      } else {
        alert(`Failed to generate reply: ${errorMessage}`);
      }
    } finally {
      setIsGenerating(null);
      
      // Remove loading state from the button
      const ctaButton = document.querySelector(`[data-urn="${post.id}"] .ollama-reply-cta, [data-comment-id="${post.id}"] .ollama-reply-cta`);
      if (ctaButton) {
        ctaButton.classList.remove('loading');
        ctaButton.innerHTML = `
          <svg role="none" aria-hidden="true" class="artdeco-button__icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 1a7 7 0 107 7 7 7 0 00-7-7zM3 8a5 5 0 011-3l.55.55A1.5 1.5 0 015 6.62v1.07a.75.75 0 00.22.53l.56.56a.75.75 0 00.53.22H7v.69a.75.75 0 00.22.53l.56.56a.75.75 0 01.22.53V13a5 5 0 01-5-5zm6.24 4.83l2-2.46a.75.75 0 00.09-.8l-.58-1.16A.76.76 0 0010 8H7v-.19a.51.51 0 01.28-.45l.38-.19a.74.74 0 01.68 0L9 7.5l.38-.7a1 1 0 00.12-.48v-.85a.78.78 0 01.21-.53l1.07-1.09a5 5 0 01-1.54 9z" fill="currentColor"/>
          </svg>
          <span class="artdeco-button__text">AI Reply</span>
        `;
      }
    }
  };

  const showGeneratedReply = (postId: string, reply: string) => {
    // Remove existing reply display
    const existingReply = document.querySelector(`[data-urn="${postId}"] .ollama-reply-display, [data-comment-id="${postId}"] .ollama-reply-display`);
    if (existingReply) existingReply.remove();
    
    // Create reply display with LinkedIn-compatible styling
    const replyDisplay = document.createElement('div');
    replyDisplay.className = 'ollama-reply-display mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md';
    replyDisplay.style.cssText = `
      margin-top: 12px;
      padding: 12px;
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    replyDisplay.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="color: #2563eb;">
          <path d="M8 1a7 7 0 107 7 7 7 0 00-7-7zM3 8a5 5 0 011-3l.55.55A1.5 1.5 0 015 6.62v1.07a.75.75 0 00.22.53l.56.56a.75.75 0 00.53.22H7v.69a.75.75 0 00.22.53l.56.56a.75.75 0 01.22.53V13a5 5 0 01-5-5zm6.24 4.83l2-2.46a.75.75 0 00.09-.8l-.58-1.16A.76.76 0 0010 8H7v-.19a.51.51 0 01.28-.45l.38-.19a.74.74 0 01.68 0L9 7.5l.38-.7a1 1 0 00.12-.48v-.85a.78.78 0 01.21-.53l1.07-1.09a5 5 0 01-1.54 9z"/>
        </svg>
        <span style="font-size: 14px; font-weight: 500; color: #1e40af;">AI Generated Reply</span>
        <button class="close-reply-btn" style="margin-left: auto; color: #2563eb; font-size: 14px; background: none; border: none; cursor: pointer; font-weight: bold;">×</button>
      </div>
      <p style="font-size: 14px; color: #1e40af; margin-bottom: 8px; line-height: 1.4;">${reply}</p>
      <div style="display: flex; gap: 8px;">
        <button class="copy-reply-btn" style="font-size: 12px; background-color: #2563eb; color: white; padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; font-weight: 500;">
          Copy Reply
        </button>
        <button class="retry-reply-btn" style="font-size: 12px; background-color: #059669; color: white; padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; font-weight: 500;">
          Retry
        </button>
      </div>
    `;
    
    // Add event listeners for the buttons
    const closeBtn = replyDisplay.querySelector('.close-reply-btn');
    const copyBtn = replyDisplay.querySelector('.copy-reply-btn');
    const retryBtn = replyDisplay.querySelector('.retry-reply-btn');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => replyDisplay.remove());
    }
    
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(reply);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy Reply';
        }, 2000);
      });
    }
    
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        replyDisplay.remove();
        // Find the post and regenerate
        const post = posts.find(p => p.id === postId);
        if (post) {
          generateReply(post);
        }
      });
    }
    
    // Find the post element and insert the reply
    const postElement = document.querySelector(`[data-urn="${postId}"]`) || 
                       document.querySelector(`[data-comment-id="${postId}"]`) ||
                       document.querySelector(`[data-finite-scroll-hotkey-item="${postId}"]`);
    
    if (postElement) {
      // For comments, try to insert near the comment input box
      if (postElement.querySelector('[class*="comment"]')) {
        const commentInput = postElement.querySelector('[class*="input"], [class*="editor"], [class*="textarea"]');
        if (commentInput) {
          commentInput.parentElement?.insertBefore(replyDisplay, commentInput);
        } else {
          // Fallback: insert after the comment content
          const commentContent = postElement.querySelector('[class*="content"], [class*="text"]');
          if (commentContent) {
            commentContent.parentElement?.appendChild(replyDisplay);
          } else {
            postElement.appendChild(replyDisplay);
          }
        }
      } else {
        // For posts, insert after the social action bar
        const socialBar = postElement.querySelector('.feed-shared-social-action-bar, .social-actions-container');
        if (socialBar) {
          socialBar.parentElement?.insertBefore(replyDisplay, socialBar.nextSibling);
        } else {
          // Fallback: insert after the post content
          const postContent = postElement.querySelector('.feed-shared-update-v2__description, .update-components-text');
          if (postContent) {
            postContent.parentElement?.appendChild(replyDisplay);
          } else {
            postElement.appendChild(replyDisplay);
          }
        }
      }
    }
  };

  // Don't render anything visible - this is a background content script
  return null;
}

export default App;
