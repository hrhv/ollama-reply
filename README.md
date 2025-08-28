# 🦙 Ollama Reply

An open-source browser extension that leverages the power of AI to generate engaging replies for social media growth.

## ✨ Features

### 🚀 **NEW: Automatic LinkedIn Integration**
- **AI Reply buttons automatically appear on every LinkedIn post and comment**
- **Context-aware replies**: For comments, the AI considers both the original post and the comment
- **No manual triggering needed** - just click the AI Reply button that appears on each post
- **Professional LinkedIn styling** that matches the platform's design

### 🐦 **Twitter Support**
- Manual tweet analysis and reply generation
- Click the extension popup to analyze current tweet and generate a reply

### 🤖 **AI-Powered Responses**
- Uses Ollama local models for privacy and speed
- Context-aware responses that consider the full conversation
- Professional tone suitable for LinkedIn networking
- Engaging and relevant content generation

## 🎯 How It Works

### LinkedIn (Automatic Mode)
1. Navigate to LinkedIn feed
2. **AI Reply buttons automatically appear** on every post and comment
3. Click any "AI Reply" button to generate a contextual response
4. Copy the generated reply and use it to engage with the content

### Twitter (Manual Mode)
1. Navigate to a tweet
2. Click the extension icon in your browser toolbar
3. Click "Generate Twitter reply" button
4. Copy the generated reply

## 🛠️ Installation

### Prerequisites
- [Ollama](https://ollama.ai/) installed and running locally
- Chrome/Edge/Brave browser (or any Chromium-based browser)

### Setup
1. **Install Ollama** and run a model:
   ```bash
   ollama run llama3.2:1b
   ```

2. **Load the extension**:
   - Download or clone this repository
   - Run `npm install` and `npm run build`
   - Load the `dist/` folder as an unpacked extension in Chrome
   - Or use `npm run dev` for development mode

3. **Ensure Ollama is running** on `localhost:11434`

## 🔧 Configuration

The extension uses the following default settings:
- **Model**: `llama3.2:1b` (configurable in `src/entries/background/main.ts`)
- **System Prompt**: Optimized for professional social media engagement
- **Context Handling**: Automatically extracts post and comment context

## 🎨 Customization

### Changing the AI Model
Edit `src/entries/background/main.ts`:
```typescript
const MODEL = "your-preferred-model:version";
```

### Modifying System Prompts
Update the `SYSTEM_PROMPT` constant in the background script to change the AI's behavior and response style.

### Styling
Customize the appearance by modifying `src/entries/contentScript/primary/styles.css`.

## 🚀 Development

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Watch mode for development
npm run watch
```

## 📁 Project Structure

```
src/
├── entries/
│   ├── background/          # Background service worker
│   ├── contentScript/       # LinkedIn content injection
│   └── popup/              # Extension popup interface
├── components/              # Reusable UI components
└── lib/                    # Utility functions
```

## 🔍 How LinkedIn Integration Works

1. **Content Detection**: Automatically scans LinkedIn feed for posts and comments
2. **CTA Injection**: Injects "AI Reply" buttons into the social action bars
3. **Context Extraction**: Captures post text, author, and comment context
4. **AI Processing**: Sends context to Ollama for reply generation
5. **Response Display**: Shows generated reply with copy functionality

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/) and [React](https://reactjs.org/)
- Powered by [Ollama](https://ollama.ai/) for local AI inference
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Note**: Make sure Ollama is running locally before using the extension. The extension will show helpful error messages if Ollama is not accessible.
