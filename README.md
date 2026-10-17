# ✨ ListCraft AI

> AI-powered product listing generator for Etsy, eBay, and Amazon — runs locally, costs nothing, keeps your data private.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Hacktoberfest](https://img.shields.io/badge/Hacktoberfest-2026-orange.svg)
![Open Source](https://img.shields.io/badge/AI-Open_Source-green.svg)

---

## 🎯 What is ListCraft AI?

ListCraft AI is a **free, open-source tool** that generates optimized product listings for online sellers. Paste in your product details, pick your marketplace, and get a ready-to-publish listing with:

- **Optimized titles** — keyword-rich, platform-specific character limits
- **Compelling descriptions** — storytelling for Etsy, structured for eBay, SEO-heavy for Amazon
- **Tags & search terms** — maximize visibility in marketplace search
- **Bullet points** — key selling features that convert browsers to buyers

All powered by **open-weight AI models** running locally on your machine via [Ollama](https://ollama.com).

---

## 🔐 Why Open-Source AI?

| Benefit | How ListCraft Delivers |
|---|---|
| **Privacy** | Your product data (pricing, suppliers, unreleased items) never leaves your laptop |
| **Zero cost** | No per-token API fees — generate hundreds of listings for free |
| **Customizable** | Swap models (Llama 3.1, Mistral, Gemma), fine-tune for your niche |
| **Offline** | Works without internet once the model is downloaded |
| **No vendor lock-in** | You own the tool and the models |

### Where Open Beats Closed

A closed-API approach (GPT-4, Claude) would cost $0.01–0.05 per listing. For a seller generating 50 listings/day, that's **$15–75/month**. With ListCraft AI running Llama 3.1 locally, it's **$0/month forever**.

More importantly: your product research, pricing strategy, and supplier details are **trade secrets**. Sending them to a third-party API is a risk. ListCraft keeps everything on your machine.

---

## 🚀 Quick Start

### Prerequisites

- [Ollama](https://ollama.com) installed on your machine
- Any modern web browser (Chrome, Firefox, Edge, Safari)
- A downloaded model (see step 2)

### Setup (2 minutes)

1. **Install Ollama**
   ```bash
   # Visit https://ollama.com and download for your OS
   ```

2. **Pull a model** (recommended: Llama 3.1 8B)
   ```bash
   ollama pull llama3.1
   ```

3. **Start Ollama** (if not already running)
   ```bash
   ollama serve
   ```

4. **Open ListCraft AI**
   - Simply open `index.html` in your browser
   - The status badge should show "Ollama Connected" in green
   - Select your model from the dropdown
   - Start generating listings!

> **Note:** No Node.js, npm, or build tools needed. It's just HTML, CSS, and JavaScript.

---

## 📸 Features

### 🧶 Multi-Platform Support
Generate listings optimized for:
- **Etsy** — storytelling descriptions, 13 tags max, handmade focus
- **eBay** — structured item specifics, concise bullet format
- **Amazon** — SEO-heavy titles (200 chars), 5 bullet points, backend search terms

### 🎨 Writing Tone Control
Choose from Professional, Casual, Luxurious, Playful, or Minimalist tones to match your brand voice.

### ⚡ Real-Time Streaming
Watch your listing generate in real-time with streaming text output.

### 📋 One-Click Copy
Copy any section (title, description, tags, bullets) to your clipboard instantly.

### 🕐 Listing History
All generated listings are saved locally. Browse, revisit, and reuse past generations.

### 🔌 Model Flexibility
Use any model available in Ollama — Llama 3.1, Mistral, Gemma, Phi, or any custom model you've fine-tuned.

---

## 🏗️ Project Structure

```
├── index.html          # Main application (open this in your browser)
├── css/
│   └── styles.css      # Design system — dark glassmorphism theme
├── js/
│   ├── app.js          # Application logic, UI orchestration
│   ├── ollama.js       # Ollama REST API client
│   └── templates.js    # Platform-specific prompt engineering
├── README.md           # You are here
└── LICENSE             # MIT License
```

---

## 🤝 Contributing

This is a **Hacktoberfest 2026** project! Contributions are welcome.

### Ideas for Contributions

- 🌍 **Add more platforms** — Shopify, Walmart Marketplace, Mercari, Poshmark
- 🖼️ **Image-to-listing** — Use multimodal models (LLaVA) to generate listings from product photos
- 🌐 **Multi-language** — Generate listings in different languages
- 📊 **SEO scoring** — Rate listing quality and suggest improvements
- 🎨 **Theme options** — Light mode, custom accent colors
- 📱 **PWA support** — Make it installable as a Progressive Web App
- 🔧 **Custom prompts** — Let users edit/save their own prompt templates

### How to Contribute

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

[MIT License](LICENSE) — free to use, modify, and distribute.

---

## 🙏 Acknowledgments

- [Ollama](https://ollama.com) — Run open-weight models locally
- [Meta Llama](https://llama.meta.com/) — Open-weight language models
- [Hacktoberfest](https://hacktoberfest.com/) — Celebrating open source

---

<p align="center">
  <strong>Built with ❤️ for open-source AI</strong><br>
  <sub>Your data stays yours. Your costs stay zero. Your listings stay fire. 🔥</sub>
</p>
