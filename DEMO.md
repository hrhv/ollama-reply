# 🚀 Ollama Reply Extension Demo

## Testing the LinkedIn Integration

### Prerequisites
1. **Ollama Running**: Make sure you have Ollama running locally with a model
   ```bash
   ollama run llama3.2:1b
   ```

2. **Extension Loaded**: Load the extension in Chrome from the `dist/` folder

### Step-by-Step Demo

#### 1. Navigate to LinkedIn
- Go to [LinkedIn](https://www.linkedin.com)
- Navigate to your feed or any post

#### 2. Look for AI Reply Buttons
- **Posts**: You should see an "AI Reply" button next to Like, Comment, Repost buttons
- **Comments**: AI Reply buttons appear in comment action areas
- The buttons have a distinctive blue styling that matches LinkedIn's design

#### 3. Test Post Reply Generation
1. Find a post with substantial content (not just images)
2. Click the "AI Reply" button
3. Watch the button show "Generating..." state
4. A blue reply box will appear below the post content
5. Copy the generated reply using the "Copy Reply" button

#### 4. Test Comment Reply Generation
1. Find a post with comments
2. Look for AI Reply buttons in comment sections
3. Click on a comment's AI Reply button
4. The AI will consider both the original post and the comment context
5. Generate a contextual reply

#### 5. Verify Context Awareness
- **Post replies**: Should be relevant to the post content
- **Comment replies**: Should consider both the post and the specific comment
- **Professional tone**: Responses should be suitable for LinkedIn networking

### Expected Behavior

✅ **What Should Work:**
- AI Reply buttons appear automatically on posts and comments
- Buttons are properly positioned in LinkedIn's UI
- Loading states show during generation
- Generated replies are contextually relevant
- Copy functionality works correctly
- Reply display matches LinkedIn's design language

❌ **What to Check if Issues Occur:**
- Console errors in browser DevTools
- Ollama connection (localhost:11434)
- Extension permissions
- LinkedIn page structure changes

### Troubleshooting

#### No AI Reply Buttons Appearing
1. Check browser console for errors
2. Ensure extension is loaded and enabled
3. Refresh the LinkedIn page
4. Check if Ollama is running

#### Generation Fails
1. Verify Ollama is running: `curl http://localhost:11434/api/tags`
2. Check browser console for error messages
3. Ensure the model is downloaded: `ollama list`

#### Styling Issues
1. Check if CSS is loading properly
2. LinkedIn may have updated their CSS classes
3. Check browser console for CSS errors

### Performance Notes

- **Initial Load**: May take a few seconds to scan and inject buttons
- **Dynamic Content**: New posts/comments get buttons automatically
- **Debounced Scanning**: Prevents excessive DOM manipulation
- **Memory Management**: Proper cleanup prevents memory leaks

### Browser Compatibility

- ✅ Chrome/Chromium-based browsers
- ✅ Edge
- ✅ Brave
- ❌ Firefox (requires different manifest format)

---

**Need Help?** Check the console logs for detailed error information and ensure Ollama is running locally.
