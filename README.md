:warning: This plugin is almost entirely vibecoded. Take its results with a grain of salt.

# Studentweb Pro
Firefox and Chrome extension for adding quality of life features to Studentweb [StudentWeb](https://fsweb.no/studentweb/) and FEIDE. 

- Choose a default institution for Studentweb and Feide.
- Choose a default login method on Studentweb and Feide.
- Calculates average grade based on information in [StudentWebs resultater page] (https://fsweb.no/studentweb/resultater.jsf) 
- Runs in Firefox and Chrome.
- English or Norwegian, following the browser's language.

Settings are set in the toolbar icon.


## How to install the plugin locally

### Firefox
1. Download the latest .xpi file from [Releases](https://github.com/MaHofseth/Autofill-for-StudentWeb/releases)
2. Drag the file into firefox
3. Install

### Chrome
1. Download the .zip from [Releases](https://github.com/MaHofseth/Autofill-for-StudentWeb/releases) and unzip it.
2. Open chrome://extensions
3. Turn on Developer mode (top right)
4. Click Load unpacked and select the unzipped folder

## Translations
Texts live in `_locales/<lang>/messages.json`. `nb` is the Norwegian source; `no` (Chrome's code for Norwegian) and `nn` (nynorsk users get bokmål) are copies of it, so update all three together.
