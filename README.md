# Local Price Converter

A lightweight Chrome Extension that intelligently converts foreign prices on websites to your local currency. 

## Features
- **On Selection Conversion (Default):** Simply highlight any number on a webpage with your cursor, and a neat tooltip will instantly appear showing you its converted price in your local currency.
- **Smart Hover Mode:** If enabled, the extension will automatically detect prices across the website (e.g. `$395.92`, `KWD 100`, or contextually placed numbers inside containers labeled with `price` or `amount`). Hovering over these highlighted numbers will reveal the converted cost.
- **Aggressive Hover Mode:** Instantly converts any number detected on the page when you hover over it. 
- **13+ Global Currencies:** Easily pick your source and target currencies directly from the extension popup. Support includes USD, EUR, GBP, INR, CAD, AUD, SGD, AED, KWD, SAR, QAR, OMR, and BHD.
- **Automatic Exchange Rates:** Pulls live, daily exchange rates efficiently in the background without slowing down your browser.

## Installation Instructions (Developer Mode)

To install this extension manually:
1. Download and extract the `PriceConverter` folder (if it was sent to you as a `.zip` file).
2. Open Google Chrome and type `chrome://extensions/` into the URL address bar.
3. In the top right corner, toggle the switch for **Developer mode** so that it turns blue.
4. Three buttons will appear in the top left. Click **Load unpacked**.
5. A file browser window will appear. Navigate to the extracted `PriceConverter` folder, select it, and click **Select**.
6. The extension is now installed! 

## Usage
- Click the **Extensions puzzle piece** icon in Chrome's top right toolbar and pin "Local Price Converter".
- Click the extension icon to open the settings popup.
- Select your **Source Currency** (the currency currently shown on the webpage you are browsing).
- Select your **Target Currency** (the local currency you want to convert the price into).
- Choose your **Conversion Mode** (On Selection or On Hover).
- Highlight or hover over numbers on shopping sites like Amazon, Noon, etc., to see instant conversions!
