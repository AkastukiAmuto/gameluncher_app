# Game Launcher App (Ver.3)

A modern, Electron-based game launcher application designed to manage and launch your Steam and manually added games.

## Features

- **Steam Integration**: Automatically detects installed Steam games.
- **Manual Game Management**: Add non-Steam games with custom cover art and executable paths.
- **Dynamic Backgrounds**: Displays video backgrounds for supported games (via Steam Store API).
- **View Modes**: Toggle between a Grid view and a PlayStation-style XMB view.
- **Auto-Update**: Automatically checks for and installs updates.
- **Customizable**: Change themes (Default/Monotone) and view settings.

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/gameluncher_app_ver3.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
   *Note: You may need to run `npm install --prefix renderer` as well if dependencies are not linked automatically.*

### Running Locally

```bash
npm start
```

### Building for Production

```bash
npm run dist
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
