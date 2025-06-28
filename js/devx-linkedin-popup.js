document.getElementById('saveDevxSettings').addEventListener('click', () => {
    const devxApiKey = document.getElementById('devxApiKeyField').value;
    const devxBaseName = document.getElementById('devxBaseNameField').value;
    const devxBaseID = document.getElementById('devxBaseIDField').value;

    chrome.storage.local.set({ devxApiKey, devxBaseName, devxBaseID }, () => {
        console.log('✅ Settings saved');
    });
});

window.addEventListener('load', () => {
    chrome.storage.local.get(['devxApiKey', 'devxBaseName', 'devxBaseID'], (result) => {
        document.getElementById('devxApiKeyField').value = result?.devxApiKey || '';
        document.getElementById('devxBaseNameField').value = result?.devxBaseName || '';
        document.getElementById('devxBaseIDField').value = result?.devxBaseID || '';
    });
});