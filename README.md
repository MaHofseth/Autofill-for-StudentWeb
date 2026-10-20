# StudentWeb Default Institution

Firefox extension for [StudentWeb](https://fsweb.no/studentweb/) that remembers your institution and preferred login method.

- Preselects your institution on the "Choose institution" page (or skips it).
- Switches StudentWeb to your saved institution if it remembered a different one.
- Optional default login method: Feide or ID-porten is clicked for you; for fødselsnummer and PIN the cursor is placed in the field (nothing is stored or filled in).

Set everything from the toolbar icon.

## Run locally

Load temporarily via `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → `manifest.json`, or run with auto-reload:

```bash
npx web-ext run
```
