# Autofill for StudentWeb

Firefox extension for [StudentWeb](https://fsweb.no/studentweb/) that remembers your institution and preferred login method.

- Preselects your institution on the "Choose institution" page (or skips it).
- Switches StudentWeb to your saved institution if it remembered a different one.
- Optional default login method: Feide or ID-porten is clicked for you; for fødselsnummer and PIN the cursor is placed in the field (nothing is stored or filled in). The popup only offers the methods your institution shows.
- Preselects your institution on Feide's "choose affiliation" page, and can continue automatically.
- Works with the University of Oslo's own StudentWeb at `studentweb.uio.no`.
- Runs in Firefox and Chrome.
- English or Norwegian, following the browser's language.

Set everything from the toolbar icon.

## Run locally

Load temporarily via `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → `manifest.json`, or run with auto-reload:

```bash
npx web-ext run
```

## Translations

Texts live in `_locales/<lang>/messages.json`. `nb` is the Norwegian source; `no` (Chrome's code for Norwegian) and `nn` (nynorsk users get bokmål) are copies of it, so update all three together.
