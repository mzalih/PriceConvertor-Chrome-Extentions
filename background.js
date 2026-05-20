const API_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

chrome.runtime.onInstalled.addListener(() => {
  fetchExchangeRates();
  // Set default currencies
  chrome.storage.sync.get(['targetCurrency', 'sourceCurrency', 'conversionMode', 'isEnabled'], (result) => {
    const defaults = {};
    if (!result.targetCurrency) defaults.targetCurrency = 'inr';
    if (!result.sourceCurrency) defaults.sourceCurrency = 'usd';
    if (!result.conversionMode) defaults.conversionMode = 'selection';
    if (result.isEnabled === undefined) defaults.isEnabled = true;
    if (Object.keys(defaults).length > 0) {
      chrome.storage.sync.set(defaults);
    }
  });
});

async function fetchExchangeRates() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    
    // store rate and timestamp
    chrome.storage.local.set({
      exchangeRates: data.usd,
      ratesTimestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
  }
}

// Check and update rates periodically or on request from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getRates') {
    chrome.storage.local.get(['exchangeRates', 'ratesTimestamp'], (result) => {
      const now = Date.now();
      if (result.exchangeRates && result.ratesTimestamp && (now - result.ratesTimestamp < CACHE_DURATION)) {
        sendResponse({ rates: result.exchangeRates });
      } else {
        // Fetch new rates
        fetchExchangeRates().then(() => {
          chrome.storage.local.get(['exchangeRates'], (newResult) => {
            sendResponse({ rates: newResult.exchangeRates });
          });
        });
        return true; // indicates asynchronous response
      }
    });
    return true; // indicates asynchronous response
  }
});
