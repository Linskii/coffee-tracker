# Coffee Tracker ☕

**To use the app, visit: https://linskii.github.io/coffee-tracker/**

A beautiful, minimalist web application for tracking coffee beans, machines, and brewing runs. Built as a Christmas present for coffee enthusiasts who want to perfect their brew.

## Features

- **Coffee Machine Management**: Create custom coffee machines with flexible parameter types (sliders, numbers, text, dropdowns)
- **Coffee Bean Tracking**: Track your coffee bean inventory with purchase dates and notes
- **Brewing Runs**: Record detailed brewing attempts with custom parameters per machine
- **Smart Ratings**: Rate each run from 1-10 and star your best settings per bean-machine combination
- **Bean Freshness**: Visual indicators showing how fresh your beans are
- **Responsive Design**: Beautiful coffee-themed dark UI that works on all devices
- **Offline-First**: All data stored locally in your browser with localStorage

## Getting Started

### Viewing the Site

1. The site is deployed on GitHub Pages at: `https://linskii.github.io/coffee-tracker/`
2. Or open `index.html` directly in your browser for local development

### First Time Setup

1. **Create Your First Coffee Machine** - Add parameters like grind size, temperature, pressure with custom input types
2. **Add Coffee Beans** - Track your beans with purchase dates and tasting notes
3. **Record Your Brews** - Create runs with your settings, rate them, and star the best ones!

## Tech Stack

- **Vanilla JavaScript** - No frameworks, no build tools, just clean modular code
- **HTML5 & CSS3** - Modern responsive design with coffee-themed dark mode
- **localStorage** - Client-side data persistence
- **GitHub Pages** - Free static hosting

## Data Model

The app tracks three main entities:

1. **Machines** - Coffee machines with customizable parameters (each parameter can be a slider, number, text, or dropdown)
2. **Beans** - Coffee beans with purchase date and freshness tracking
3. **Runs** - Brewing attempts linking a bean to a machine with specific parameter values, ratings, and notes

**Key Feature**: Only one run can be starred per bean-machine combination, making it easy to find your perfect brew!

## Development

No build step required! Just open `index.html` in your browser.

For local development with live reload:
```bash
python -m http.server 8000
# or
npx serve
```

## Architecture

Clean layered architecture:
```
UI Layer → Router → State Management → Repository → Models → Storage
```

- Observable state pattern for reactive updates
- Hash-based SPA routing for smooth navigation
- Comprehensive error handling and validation
- Mobile-first responsive design

## License

Personal project created as a gift. Feel free to fork and modify!

---

Built with ❤️ and ☕