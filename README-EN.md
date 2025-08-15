# Peach Blossom Paper (桃花笺)

[中文](README.md) | **English**

An elegant personal memory journaling application that allows you to securely record and cherish precious moments in life.

## ✨ Features

### 🔒 Secure Encryption
- End-to-end encryption to protect your private memories
- Local storage with complete data control
- Support for password-protected memory entries

### 📝 Rich Memory Types
- **Text Memories**: Record thoughts, insights, and daily life
- **Image Memories**: Preserve precious visual moments
- **Audio Memories**: Capture sound fragments and recollections
- **Mixed Memories**: Combine multiple media types

### 💫 Emotion Tag System
Add emotional colors to each memory:
- 🌟 **Joy** - Happy moments
- 💙 **Sadness** - Melancholic instances
- 🌸 **Nostalgia** - Cherished memories
- 🌱 **Hope** - Moments filled with anticipation
- 🍂 **Regret** - Reflective records
- 💝 **Attachment** - Precious bonds
- 🔥 **Persistence** - Determined beliefs

### 🌙 Dream Echoes
- Randomly display past memory fragments
- Unexpectedly revisit beautiful moments
- Intelligent memory review mechanism

## 🛠️ Tech Stack

- **Frontend**: Preact + TypeScript + Vite
- **Backend**: Tauri (Rust)
- **Encryption**: AES-GCM + Argon2
- **UI**: Custom CSS + Lucide Icons
- **State Management**: Preact Signals

## 🚀 Development Setup

### Prerequisites
- Node.js (18+ recommended)
- Rust (latest stable)
- pnpm

### Install Dependencies
```bash
pnpm install
```

### Development Mode
```bash
pnpm tauri dev
```

### Build Application
```bash
pnpm tauri build
```

## 📁 Project Structure

```
src/
├── components/
│   ├── DreamEchoes/     # Dream Echo components
│   └── MemorySeal/      # Memory Seal components
├── hooks/               # Custom Hooks
├── stores/              # State management
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
│   └── crypto/          # Encryption related
└── App.tsx              # Main application component

src-tauri/
├── src/
│   ├── commands.rs      # Tauri commands
│   ├── crypto.rs        # Encryption implementation
│   ├── models.rs        # Data models
│   └── storage.rs       # Storage management
└── Cargo.toml           # Rust dependencies
```

## 🎨 Design Philosophy

Peach Blossom Paper adopts an elegant classical design style, inspired by the traditional Chinese "桃花笺" (Peach Blossom Paper) - a type of exquisite paper used for writing emotions and memories. The application interface blends modern minimalism with classical aesthetics, providing users with an immersive memory recording experience.

## 🔐 Privacy Protection

- All sensitive data is encrypted and stored locally
- Uses industrial-grade AES-GCM encryption algorithm
- Passwords are securely hashed with Argon2
- No network transmission, completely offline operation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Issues and Pull Requests are welcome to help improve this project.

## 💝 Acknowledgments

Thanks to all developers who have contributed code and ideas to this project.

---

*"Time flows like water, memories bloom like flowers. May every precious memory forever blossom in Peach Blossom Paper."*