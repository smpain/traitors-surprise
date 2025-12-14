# Traitors Surprise

A self-contained static mini-site for a birthday surprise themed around "The Traitors: Live Experience". This interactive quiz reveals a birthday voucher upon completion.

## Features

- Interactive quiz with Traitors-themed questions
- Beautiful, dark-themed UI with gold accents
- Confetti animation on voucher reveal
- Fully static - no backend required
- Mobile-responsive design

## Contents

- `index.html` — Main page with quiz game
- `voucher.html` — Direct link to voucher page with confetti
- `assets/css/style.css` — Traitors-inspired styling
- `assets/js/app.js` — Quiz game logic

## Local Development

### Quick Start

Simply open `index.html` in a browser, or serve the folder with a simple HTTP server:

```bash
# From inside the traitors-surprise directory
python3 -m http.server 8081
```

Then open `http://localhost:8081` in your browser.

## Deployment

This site can be deployed to any static hosting service:

- **GitHub Pages**: Enable in repository settings
- **Netlify**: Drag and drop the folder
- **Vercel**: Deploy via CLI or dashboard
- **Any static host**: Upload the files to your web server

### Deployment Tips

- Generate a QR code pointing to the deployed URL for easy mobile access
- The site works offline once loaded (no external dependencies except Google Fonts)

## Project Structure

```
traitors-surprise/
├── index.html          # Main quiz page
├── voucher.html        # Voucher reveal page
├── assets/
│   ├── css/
│   │   └── style.css   # All styles
│   └── js/
│       └── app.js      # Quiz logic
└── README.md           # This file
```

## License

Private project - all rights reserved.
