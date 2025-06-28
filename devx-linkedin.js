console.log('✅ content.js loaded!');

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getElementBySelector(selector, timeout = 10000) {
    let waited = 0;
    while (waited < timeout) {
        const el = document.querySelector(selector);
        if (el) return el;
        await sleep(500);
        waited += 500;
    }
    throw new Error('Could not find selector: ' + selector);
}

const readLocalStorage = async (key) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], function (result) {
            if (result[key] === undefined) {
                reject();
            } else {
                resolve(result[key]);
            }
        });
    });
};

(async function () {
    const getNameAndProfileURL = async () => {
        const nameEl = await getElementBySelector('h1');
        const name = nameEl ? nameEl.innerText.trim() : '';
        const profileURL = window.location.href.split('?')[0];
        return { name, profileURL };
    };

    const addButton = async (text, disabled = false, onClick = null) => {
        const actionBar = await getElementBySelector(
            '#profile-content > div > div.scaffold-layout.scaffold-layout--breakpoint-xl.scaffold-layout--main-aside.scaffold-layout--reflow.pv-profile.pvs-loader-wrapper__shimmer--animate > div > div > main > section:nth-child(1) > div.ph5 > div:nth-child(4)'
        );
        if (!actionBar || document.querySelector('#devx-airtable-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'devx-airtable-btn';
        btn.disabled = disabled;

        btn.setAttribute('class', 'devx-button');

        const icon = document.createElement('img');
        icon.src = chrome.runtime.getURL('icons/icon-white.png');
        icon.alt = 'icon';
        icon.setAttribute('class', 'devx-button-icon');
        icon.style.width = '15px';
        icon.style.paddingRight = '5px';
        btn.appendChild(icon);

        const textEl = document.createElement('span');
        textEl.textContent = text;
        textEl.setAttribute('class', 'devx-button-text');
        btn.appendChild(textEl);

        if (onClick && !disabled) btn.addEventListener('click', onClick);

        actionBar.appendChild(btn);
    };

    const { name, profileURL } = await getNameAndProfileURL();
    console.log('🔍 Name:', name);
    console.log('🔗 Profile URL:', profileURL);
    if (name && profileURL) {
        console.log('🔄 Checking Airtable for:', name, profileURL);
        const devxApiKey = await readLocalStorage('devxApiKey');
        const devxBaseID = await readLocalStorage('devxBaseID');
        const devxBaseName = await readLocalStorage('devxBaseName');
        const formula = `OR({Name}="${name}",{LinkedIn Profile}="${profileURL}")`;
        const baseUrl = `https://api.airtable.com/v0/${devxBaseID}/${encodeURIComponent(
            devxBaseName
        )}`;

        try {
            const checkUrl = `${baseUrl}?filterByFormula=${encodeURIComponent(
                formula
            )}&maxRecords=3&view=Chrome%20Extension`;
            console.log('🔄 Checking Airtable for:', checkUrl);

            const checkResponse = await fetch(checkUrl, {
                headers: {
                    Authorization: 'Bearer ' + devxApiKey,
                },
            });

            console.log('🔄 Checking Airtable response:', checkResponse.status);

            const checkData = await checkResponse.json();

            if (checkData.records && checkData.records.length > 0) {
                await addButton('In Airtable', true);
            } else {
                await addButton('Add to Airtable', false, async () => {
                    await fetch(
                        baseUrl,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: 'Bearer ' + devxApiKey,
                            },
                            body: JSON.stringify({
                                fields: {
                                    Name: name,
                                    'LinkedIn Profile': profileURL,
                                },
                            }),
                        }
                    );
                    const btn = document.getElementById('devx-airtable-btn');
                    // remove btn from dom
                    btn.remove();
                    addButton('Added!', true);
                });
            }
        } catch (err) {
            console.error(
                '❌ Error checking or sending to Airtable:',
                err.message
            );
        }
    }
})();
