document.addEventListener('DOMContentLoaded', () => {
  const enableCheckbox = document.getElementById('enableConversion');
  const sourceSelect = document.getElementById('sourceCurrency');
  const currencySelect = document.getElementById('currency');
  const modeSelect = document.getElementById('conversionMode');
  const statusElement = document.getElementById('status');

  // Load saved currency
  chrome.storage.sync.get(['targetCurrency', 'sourceCurrency', 'conversionMode', 'isEnabled'], (result) => {
    if (result.targetCurrency) {
      currencySelect.value = result.targetCurrency;
    }
    if (result.sourceCurrency) {
      sourceSelect.value = result.sourceCurrency;
    }
    if (result.conversionMode) {
      modeSelect.value = result.conversionMode;
    }
    if (result.isEnabled !== undefined) {
      enableCheckbox.checked = result.isEnabled;
    }
  });

  function saveSettings() {
    const selectedTarget = currencySelect.value;
    const selectedSource = sourceSelect.value;
    const selectedMode = modeSelect.value;
    const isEnabled = enableCheckbox.checked;
    chrome.storage.sync.set({ targetCurrency: selectedTarget, sourceCurrency: selectedSource, conversionMode: selectedMode, isEnabled: isEnabled }, () => {
      statusElement.textContent = 'Saved!';
      setTimeout(() => {
        statusElement.textContent = '';
      }, 1500);
    });
  }

  // Save currency when changed
  enableCheckbox.addEventListener('change', saveSettings);
  currencySelect.addEventListener('change', saveSettings);
  sourceSelect.addEventListener('change', saveSettings);
  modeSelect.addEventListener('change', saveSettings);
});
