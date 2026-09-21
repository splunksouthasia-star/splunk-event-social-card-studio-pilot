# Splunk Event Social Card Studio

An entirely browser-based MVP for generating responsive, single-speaker event social cards from approved dark Splunk masters.

## What it does

- Uses the approved Signal Trails treatment by default, with the skyline-free glow/grid background as an alternate option.
- Lets a user select a post message, enter event details, upload a profile photo, adjust its crop, and export a PNG.
- Provides platform-aware placements for LinkedIn, Facebook, Instagram, X, WhatsApp, and other use: Square (1080 × 1080), Landscape (1200 × 627), Portrait Feed (1080 × 1350), and Story / Status (1080 × 1920).
- Lets an event owner upload an approved event background that matches the chosen output size.
- Generates a copyable social caption, and provides the LinkedIn handoff when LinkedIn is selected.
- Keeps all user-selected photos and event backgrounds in the current browser session. Nothing is uploaded or saved by the app.

## Run locally

From this folder, start a basic local server:

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Production next step

Deploy the folder to approved static hosting. Add authenticated event administration and LinkedIn OAuth only after the internal team has validated the card content and partner co-branding rules.
