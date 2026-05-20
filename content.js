let targetCurrency = 'inr';
let sourceCurrency = 'usd';
let conversionMode = 'selection';
let isEnabled = true;
let exchangeRates = null;
let priceRegex = /\$\s?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)/;
const numberRegex = /\b((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\b/i;
const priceKeywords = /price|amount|cost|total|subtotal/i;

const currencySymbols = {
  usd: '\\$|usd',
  eur: '€|eur',
  gbp: '£|gbp',
  inr: '₹|Rs\\.?|inr',
  cad: 'CA\\$|\\$|cad',
  aud: 'AU\\$|\\$|aud',
  sgd: 'SG\\$|\\$|sgd',
  aed: 'AED|د\\.إ',
  kwd: 'KWD|د\\.ك',
  sar: 'SAR|ر\\.س',
  qar: 'QAR|ر\\.ق',
  omr: 'OMR|ر\\.ع\\.',
  bhd: 'BHD|د\\.ب'
};

function hasPriceContext(element) {
  let current = element;
  let depth = 0;
  while (current && depth < 3 && current !== document.body) {
    const className = current.className || '';
    const id = current.id || '';
    if (typeof className === 'string' && priceKeywords.test(className)) return true;
    if (typeof id === 'string' && priceKeywords.test(id)) return true;
    current = current.parentElement;
    depth++;
  }
  return false;
}

function updateRegex() {
  if (conversionMode === 'hover_all') {
    priceRegex = new RegExp(`\\b((?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?)\\b`, 'i');
  } else {
    const symbol = currencySymbols[sourceCurrency] || '\\$';
    priceRegex = new RegExp(`(?:(?:${symbol})\\s*((?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?))|(?:((?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?)\\s*(?:${symbol}))`, 'i');
  }
}

// Initialize
function init() {
  chrome.storage.sync.get(['targetCurrency', 'sourceCurrency', 'conversionMode', 'isEnabled'], (result) => {
    if (result.targetCurrency) targetCurrency = result.targetCurrency;
    if (result.sourceCurrency) sourceCurrency = result.sourceCurrency;
    if (result.conversionMode) conversionMode = result.conversionMode;
    if (result.isEnabled !== undefined) isEnabled = result.isEnabled;
    updateRegex();
  });

  chrome.runtime.sendMessage({ action: 'getRates' }, (response) => {
    if (response && response.rates) {
      exchangeRates = response.rates;
      processTextNodes(document.body);
    }
  });

  // Listen for DOM changes to catch dynamically loaded prices
  const observer = new MutationObserver((mutations) => {
    if (!isEnabled || conversionMode === 'selection') return;
    for (let mutation of mutations) {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            processTextNodes(node);
          } else if (node.nodeType === Node.TEXT_NODE) {
            processTextNode(node);
          }
        });
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function processTextNodes(element) {
  if (!isEnabled || conversionMode === 'selection') return;
  // Avoid replacing inside scripts, styles, or editable areas
  const ignoreTags = ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT'];
  if (ignoreTags.includes(element.tagName) || element.isContentEditable) return;

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) {
    nodes.push(node);
  }

  nodes.forEach(processTextNode);
}

function processTextNode(node) {
  if (!node.nodeValue) return;
  // If parent is already our wrapper, ignore
  if (node.parentElement && node.parentElement.classList.contains('price-converter-wrapper')) return;

  let match = priceRegex.exec(node.nodeValue);
  let regexUsed = priceRegex;

  if (!match && conversionMode === 'hover_smart') {
    match = numberRegex.exec(node.nodeValue);
    if (match) {
      if (hasPriceContext(node.parentElement)) {
        regexUsed = numberRegex;
      } else {
        match = null;
      }
    }
  }

  if (match) {
    wrapPrice(node, match, regexUsed);
  }
}

function wrapPrice(textNode, match, regexUsed) {
  const text = textNode.nodeValue;

  const priceString = match[0];
  const priceValue = parseFloat((match[1] || match[2]).replace(/,/g, ''));
  const matchIndex = match.index;

  const wrapper = document.createElement('span');
  wrapper.className = 'price-converter-wrapper';
  wrapper.textContent = priceString;
  wrapper.dataset.value = priceValue;

  const preText = document.createTextNode(text.substring(0, matchIndex));
  const postText = document.createTextNode(text.substring(matchIndex + priceString.length));

  const parent = textNode.parentNode;
  parent.insertBefore(preText, textNode);
  parent.insertBefore(wrapper, textNode);
  parent.insertBefore(postText, textNode);
  parent.removeChild(textNode);

  wrapper.addEventListener('mouseenter', handleMouseEnter);
  wrapper.addEventListener('mouseleave', handleMouseLeave);

  // process the rest of the text node in case there are multiple prices
  if (regexUsed.test(postText.nodeValue)) {
    processTextNode(postText);
  }
}

let tooltip = null;

function createTooltip() {
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'price-converter-tooltip';
    document.body.appendChild(tooltip);
  }
}

// Global selection logic
document.addEventListener('mouseup', handleSelection);
document.addEventListener('mousedown', (e) => {
  if (tooltip && e.target !== tooltip && conversionMode === 'selection') {
    tooltip.style.opacity = '0';
  }
});

function handleSelection() {
  if (!isEnabled || conversionMode !== 'selection') return;
  
  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (!text) {
      if (tooltip) tooltip.style.opacity = '0';
      return;
    }

    const match = numberRegex.exec(text);
    if (match) {
      const priceValue = parseFloat(match[1].replace(/,/g, ''));
      
      if (!exchangeRates) return;
      const targetRate = exchangeRates[targetCurrency.toLowerCase()];
      const sourceRate = exchangeRates[sourceCurrency.toLowerCase()];
      if (!targetRate || !sourceRate) return;

      const convertedValue = priceValue * (targetRate / sourceRate);
      createTooltip();
      
      tooltip.textContent = formatCurrency(convertedValue, targetCurrency);
      tooltip.style.opacity = '1';
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      tooltip.style.top = `${rect.top + window.scrollY - 35}px`;
      tooltip.style.left = `${rect.left + window.scrollX + (rect.width / 2)}px`;
      tooltip.style.transform = 'translateX(-50%)';
    } else {
      if (tooltip) tooltip.style.opacity = '0';
    }
  }, 10);
}

function formatCurrency(value, currency) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(value);
}

function handleMouseEnter(e) {
  if (!isEnabled || conversionMode === 'selection') return;
  if (!exchangeRates) return;

  const value = parseFloat(e.target.dataset.value);
  const targetRate = exchangeRates[targetCurrency.toLowerCase()];
  const sourceRate = exchangeRates[sourceCurrency.toLowerCase()];
  
  if (!targetRate || !sourceRate) return;

  // The exchange rates are relative to USD.
  // Example: 1 USD = sourceRate Source = targetRate Target. 
  // Thus, 1 Source = (targetRate / sourceRate) Target
  const convertedValue = value * (targetRate / sourceRate);
  createTooltip();
  
  tooltip.textContent = formatCurrency(convertedValue, targetCurrency);
  tooltip.style.opacity = '1';
  
  // Position tooltip above the text
  const rect = e.target.getBoundingClientRect();
  tooltip.style.top = `${rect.top + window.scrollY - 35}px`;
  tooltip.style.left = `${rect.left + window.scrollX}px`;
  tooltip.style.transform = '';
}

function handleMouseLeave() {
  if (tooltip) {
    tooltip.style.opacity = '0';
  }
}

function unwrapPrices() {
  document.querySelectorAll('.price-converter-wrapper').forEach(wrapper => {
    const parent = wrapper.parentNode;
    while (wrapper.firstChild) {
      parent.insertBefore(wrapper.firstChild, wrapper);
    }
    parent.removeChild(wrapper);
  });
}

// Listen for updates from popup
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    let shouldUpdateRegex = false;
    
    if (changes.targetCurrency) {
      targetCurrency = changes.targetCurrency.newValue;
    }
    if (changes.sourceCurrency) {
      sourceCurrency = changes.sourceCurrency.newValue;
      shouldUpdateRegex = true;
    }
    if (changes.conversionMode) {
      conversionMode = changes.conversionMode.newValue;
      shouldUpdateRegex = true;
      if (conversionMode === 'selection') {
        unwrapPrices();
        if (tooltip) tooltip.style.opacity = '0';
      }
    }
    
    if (changes.isEnabled) {
      isEnabled = changes.isEnabled.newValue;
      if (isEnabled) {
        if (conversionMode !== 'selection') processTextNodes(document.body);
      } else {
        unwrapPrices();
        if (tooltip) tooltip.style.opacity = '0';
      }
    }
    
    if (shouldUpdateRegex) {
      updateRegex();
      // Re-process body to catch prices in new currency immediately
      if (isEnabled && conversionMode !== 'selection') processTextNodes(document.body);
    }
  }
});

init();
