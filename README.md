# Card Face Generator

A web editor that builds **1536 × 969 px PNG card faces** — the exact size
Apple Wallet renders for payment cards. Made for applying custom card skins
with tools like [AirCard](https://github.com/Mak5er/AirCard).

## Features

- Import a background photo, pan it by dragging, zoom with the mouse wheel
- Fixed-position chip drawn to the payment-card standard (ISO 7810 ID-1:
  13 × 10 mm plate, 10.2 mm from the left edge)
- Elements: card number, cardholder name, free text, contactless indicator,
  logos — all freely movable
- Built-in logo library: Visa (white, gold, blue, classic, Debit, Infinite
  Privilege lockup, brandmark), Mastercard, Amex, Discover, UnionPay, JCB,
  Diners Club
- Text in **Visa Dialect** (Light / Regular), the official Visa brand
  typeface, plus monospace / sans / serif; bold on every family
- WYSIWYG export: the preview renderer and the exported PNG are the same code
- Work auto-saves in the browser (localStorage)

## Run

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Deploy

Pushing to `main` builds and publishes to GitHub Pages via the included
workflow. The live site is served from `/card-face-generator/`.

## Trademark note

The bundled logos and Visa Dialect fonts are trademarks/assets of their
owners (Visa Inc. and other payment networks). Extracted from publicly
available brand-standards PDFs and public logo collections. For personal
card skins only — do not redistribute.

## Privacy

Everything runs in your browser. No network calls, no analytics, no uploads.
Images stay on your machine.