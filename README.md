# Splunk Event Social Card Studio

An entirely browser-based pilot for personal event cards, multi-speaker event promotions, webinar promotions and webinar-series graphics. Hosted as a static GitHub Pages site; no server or account is needed to create artwork.

## What it does

- Uses the supplied concentric-circle artwork for Square and Landscape exports, with the skyline-free glow/grid background as an alternate option and the default for unsupported vertical masters.
- Applies the official Splunk by Cisco logo as a separate layer to every card and the portal header. The concentric-circle background files have no embedded logo; the standalone Square and Landscape graphics also carry the current lockup.
- Lets a user select a post message, enter event details, upload a profile photo, adjust its crop, and export a PNG.
- Provides platform-aware placements for LinkedIn, Facebook, Instagram, X, WhatsApp, and other use: Square (1080 × 1080), Landscape (1200 × 627), Portrait Feed (1080 × 1350), and Story / Status (1080 × 1920).
- Lets an event owner upload an approved event background that matches the chosen output size.
- Generates a copyable social caption, and provides the LinkedIn handoff when LinkedIn is selected.
- Keeps all user-selected photos and event backgrounds in the current browser session. Nothing is uploaded or saved by the app.

## Multi-speaker event mode

- Choose **Multi-speaker event** in the first dropdown, then select **2 or 3 speakers** and a **Horizontal or Vertical** layout. The vertical layout follows the approved rebalanced preview, with a larger event title and the CTA alongside the final speaker row.
- Use a standard event name or custom text. City, venue, date or date range, local time and booth are optional. Blank fields disappear rather than showing replacement sample text.
- **On-card caption / event theme** is optional and editable, including manual line breaks. A suggestion is available only when requested; clearing it removes it. The separate social-post caption remains editable and is not overwritten by subsequent event/profile changes once edited.
- Light and dark glow styles use the supplied artwork and current official Splunk by Cisco logo. Each selected speaker can have an optional photograph with independent zoom and reposition controls. Use PNG, JPEG or WebP up to 20 MB.
- Switching from 3 to 2 speakers retains the third profile in memory; selecting 3 restores it. Profiles and photos are independent of the webinar workflow.
- PNG exports use the selected social format. Length and space checks block overlapping exports and explain how to adjust. Dense content is not guaranteed to fit landscape; use a taller format, vertical layout or shorter optional text.
- The layout example uses illustrative details and speaker labels only; no employee portraits are bundled or uploaded.

## Webinar / webinar-series mode

- Choose Webinar for one session or Webinar series for up to three dated sessions. Sessions can share a topic or have different topics; duplicate, reorder and remove entries.
- Add zero to four speakers, with independent optional photos, crop controls, job titles, organisations and moderator labels. Assign speakers to sessions. An empty lineup produces an event-led graphic; no headshot placeholders are exported.
- Five reference-derived styles: light/dark glow and signal curves, light angular, light soft glow, and dark glass hero. All use the current official Splunk by Cisco lockup. Decorative assets are cropped from the supplied artwork; no employee photographs are bundled.
- Arrange agenda topics as rows or columns and speakers as an automatic layout, horizontal row, vertical side panel or 2 × 2 grid. Compact names and full professional details are separate choices.
- Preview a programme overview, individual session or assigned personal speaker card. Blank fields are omitted, without sample-text substitution.
- Optional dates and same-day start/end times use date/time pickers. Select an IANA source time zone and up to two additional display zones. Conversions respect the date and daylight saving; next/previous-day shifts are labelled. A date is required for conversions. Overnight time ranges are not supported.
- Fixed artwork labels support English, Korean, Simplified/Traditional Chinese, Thai and Japanese. User-entered content is not machine-translated. Suggested captions use English connective wording with the entered content and localised dates/times; edit them for your audience.
- Export the current PNG or a ZIP pack containing the overview, session cards, optional assigned speaker/session cards (maximum 16 PNGs), and suggested captions. The ZIP's captions are newly generated; it does not replace the edited caption in the studio.
- The renderer checks text length and vertical space. Overfull cards cannot be downloaded; change layout, choose compact details, shorten the text, choose a taller format or create an individual session card. Dense three-session/four-speaker content is not guaranteed to fit landscape.
- The PNG call-to-action is visual, not a clickable button. Registration URLs are added to captions, with per-session URLs overriding the programme URL for individual cards.

Drafts are held only in memory. Reloading the page clears uploaded photos and webinar entries. No analytics, form submissions, cloud image processing, API keys or backend are included. Language fonts may be requested from Google Fonts; Inter and decorative assets are served with the site.

## Run locally

From this folder, start a basic local server:

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Production next step

Deploy the folder to approved static hosting. Add authenticated event administration and LinkedIn OAuth only after the internal team has validated the card content and partner co-branding rules.
