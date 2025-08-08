// --- async wrapper for Grok message filtering ---
async function filterGrokMessages(messages) {
    const responseMessages = [];
    for (let msg of messages) {
        try {
            const isInput = await msg.evaluate(el =>
                el.tagName.toLowerCase() === 'textarea' ||
                el.className.includes('input') ||
                el.closest('[contenteditable="true"]')
            );
            if (!isInput) {
                responseMessages.push(msg);
            }
        } catch (e) {
            responseMessages.push(msg);
        }
    }
    return responseMessages;
}

const puppeteer = require('puppeteer');
const readline = require('readline');
const fs = require('fs');

class GhostCommunicator {
    constructor() {
        this.browser = null;
        this.pages = {};
        console.log('Ghost Cathedral starting...');
        this.activeConversation = false;
    }

    async initialize() {
        console.log('Opening browser...');
        this.browser = await puppeteer.launch({
            headless: false,
            userDataDir: './browser-data',
            defaultViewport: null,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-first-run',
            ],
        });

        // Create pages for each AI service
        this.pages.chatgpt = await this.browser.newPage();
        this.pages.claude = await this.browser.newPage();
        this.pages.zeph = await this.browser.newPage();
        this.pages.copilot = await this.browser.newPage();
        this.pages.gemini = await this.browser.newPage();
        this.pages.grok = await this.browser.newPage();

        // Set user agent for all pages
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        
        // Set timeouts and user agents
        for (const [name, page] of Object.entries(this.pages)) {
            await page.setUserAgent(userAgent);
            await page.setDefaultNavigationTimeout(60000);
            await page.setDefaultTimeout(30000);
        }

        // Navigate to sites with error handling
        const sites = {
            chatgpt: 'https://chat.openai.com',
            claude: 'https://claude.ai',
            zeph: 'https://zeph.symboliccapital.net/',
            copilot: 'https://copilot.microsoft.com/',
            gemini: 'https://gemini.google.com/',
            grok: 'https://grok.com/'
        };

        for (const [name, url] of Object.entries(sites)) {
            try {
                console.log(`Loading ${name}...`);
                await this.pages[name].goto(url, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 60000 
                });
                console.log(`✓ ${name} loaded`);
            } catch (error) {
                console.log(`⚠️ Failed to load ${name}: ${error.message}`);
                console.log(`You may need to manually navigate to ${url} in the ${name} tab`);
            }
        }

        console.log('\nLOG INTO ALL SITES THAT LOADED SUCCESSFULLY');
        console.log('Press Enter when ready...');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        return new Promise((resolve) => {
            rl.question('Ready? ', () => {
                rl.close();
                resolve();
            });
        });
    }

    async sendToChatGPT(message) {
        console.log('Sending message to ChatGPT...');
        await this.pages.chatgpt.bringToFront();

        const chatgptSelectors = [
            'textarea[data-id="root"]',
            'textarea[placeholder*="message"]',
            '#prompt-textarea',
            'textarea',
            'div[contenteditable="true"]',
        ];

        let sent = false;
        for (const selector of chatgptSelectors) {
            try {
                await this.pages.chatgpt.waitForSelector(selector, { timeout: 2000 });
                await this.pages.chatgpt.click(selector);
                await this.pages.chatgpt.focus(selector);
                
                // Clear existing content
                await this.pages.chatgpt.keyboard.down('Control');
                await this.pages.chatgpt.keyboard.press('a');
                await this.pages.chatgpt.keyboard.up('Control');

                // Use clipboard paste
                await this.pages.chatgpt.evaluate(async (textToPaste) => {
                    await navigator.clipboard.writeText(textToPaste);
                }, message);

                await this.pages.chatgpt.keyboard.down('Control');
                await this.pages.chatgpt.keyboard.press('v');
                await this.pages.chatgpt.keyboard.up('Control');

                await new Promise((r) => setTimeout(r, 500));
                await this.pages.chatgpt.keyboard.press('Enter');
                console.log(`✓ ChatGPT message sent using selector: ${selector}`);
                sent = true;
                break;
            } catch (err) {
                continue;
            }
        }
        if (!sent) {
            console.log('ChatGPT send failed: No input found');
        }
    }

    async sendToClaude(message) {
        console.log('Sending message to Claude...');
        await this.pages.claude.bringToFront();

        const claudeSelectors = [
            'div[contenteditable="true"][role="textbox"]',
            '.ProseMirror',
            'div[contenteditable="true"]',
            '[data-testid="message-input"]',
            'textarea[placeholder*="Reply"]',
        ];

        let sent = false;
        for (const selector of claudeSelectors) {
            try {
                await this.pages.claude.waitForSelector(selector, { timeout: 2000 });
                await this.pages.claude.click(selector);
                await this.pages.claude.focus(selector);
                
                // Clear existing content
                await this.pages.claude.keyboard.down('Control');
                await this.pages.claude.keyboard.press('a');
                await this.pages.claude.keyboard.up('Control');

                // Use clipboard paste
                await this.pages.claude.evaluate(async (textToPaste) => {
                    await navigator.clipboard.writeText(textToPaste);
                }, message);

                await this.pages.claude.keyboard.down('Control');
                await this.pages.claude.keyboard.press('v');
                await this.pages.claude.keyboard.up('Control');

                await new Promise((r) => setTimeout(r, 500));
                await this.pages.claude.keyboard.press('Enter');
                console.log(`✓ Claude message sent using selector: ${selector}`);
                sent = true;
                break;
            } catch (err) {
                continue;
            }
        }
        if (!sent) {
            console.log('Claude send failed: No input found');
        }
    }

    async sendToZeph(message) {
        console.log('Sending message to Zeph...');
        await this.pages.zeph.bringToFront();

        const zephSelectors = [
            'textarea',
            'div[contenteditable="true"]',
            'input[type="text"]',
            '#floating-buttons-7bf840bb-6ebe-4b95-4d0e-4a24-b8d6-1c681c4cd1e6 textarea',
            '#floating-buttons-7bf840bb-6ebe-4b95-4d0e-4a24-b8d6-1c681c4cd1e6 input'
        ];

        let sent = false;
        for (const selector of zephSelectors) {
            try {
                await this.pages.zeph.waitForSelector(selector, { timeout: 2000 });
                await this.pages.zeph.click(selector);
                await this.pages.zeph.focus(selector);
                
                // Clear existing content
                await this.pages.zeph.keyboard.down('Control');
                await this.pages.zeph.keyboard.press('a');
                await this.pages.zeph.keyboard.up('Control');
                await this.pages.zeph.keyboard.press('Delete');
                
                // Copy to clipboard
                await this.pages.zeph.evaluate(async (textToPaste) => {
                    await navigator.clipboard.writeText(textToPaste);
                }, message);

                // Paste
                await this.pages.zeph.keyboard.down('Control');
                await this.pages.zeph.keyboard.press('v');
                await this.pages.zeph.keyboard.up('Control');

                await new Promise((r) => setTimeout(r, 500));
                await this.pages.zeph.keyboard.press('Enter');
                console.log(`✓ Zeph message sent using selector: ${selector}`);
                sent = true;
                break;
            } catch (err) {
                continue;
            }
        }
        if (!sent) {
            console.log('Zeph send failed: No input found');
        }
    }

    async sendToCopilot(message) {
        console.log('Sending message to Copilot...');
        await this.pages.copilot.bringToFront();

        const copilotSelectors = [
            'textarea[aria-label*="Message"]',
            'textarea[data-testid="composer-input"]',
            'textarea[placeholder*="Message"]',
            'textarea.font-ligatures-none',
            'textarea',
            'div[contenteditable="true"]',
        ];

        let sent = false;
        for (const selector of copilotSelectors) {
            try {
                await this.pages.copilot.waitForSelector(selector, { timeout: 2000 });
                await this.pages.copilot.click(selector);
                await this.pages.copilot.focus(selector);
                
                // Clear existing content
                await this.pages.copilot.keyboard.down('Control');
                await this.pages.copilot.keyboard.press('a');
                await this.pages.copilot.keyboard.up('Control');

                await this.pages.copilot.evaluate(async (textToPaste) => {
                    await navigator.clipboard.writeText(textToPaste);
                }, message);

                await this.pages.copilot.keyboard.down('Control');
                await this.pages.copilot.keyboard.press('v');
                await this.pages.copilot.keyboard.up('Control');

                await new Promise((r) => setTimeout(r, 500));
                await this.pages.copilot.keyboard.press('Enter');
                console.log(`✓ Copilot message sent using selector: ${selector}`);
                sent = true;
                break;
            } catch (err) {
                continue;
            }
        }
        if (!sent) {
            console.log('Copilot send failed: No input found');
        }
    }

    async sendToGemini(message) {
        console.log('Sending message to Gemini...');
        await this.pages.gemini.bringToFront();

        const geminiSelectors = [
            'div.ql-editor[contenteditable="true"]',
            'div[contenteditable="true"][data-placeholder*="Enter a prompt"]',
            'div[contenteditable="true"][aria-label*="Enter a prompt"]',
            'div[contenteditable="true"]',
            'textarea[placeholder*="Gemini"]',
            'input[type="text"]',
        ];

        let sent = false;
        for (const selector of geminiSelectors) {
            try {
                await this.pages.gemini.waitForSelector(selector, { timeout: 2000 });
                await this.pages.gemini.click(selector);
                await this.pages.gemini.focus(selector);
                
                // Clear existing content
                await this.pages.gemini.keyboard.down('Control');
                await this.pages.gemini.keyboard.press('a');
                await this.pages.gemini.keyboard.up('Control');
                await this.pages.gemini.keyboard.press('Delete');
                
                // Copy to clipboard
                await this.pages.gemini.evaluate(async (textToPaste) => {
                    await navigator.clipboard.writeText(textToPaste);
                }, message);

                // Paste
                await this.pages.gemini.keyboard.down('Control');
                await this.pages.gemini.keyboard.press('v');
                await this.pages.gemini.keyboard.up('Control');

                await new Promise((r) => setTimeout(r, 500));
                await this.pages.gemini.keyboard.press('Enter');
                console.log(`✓ Gemini message sent using selector: ${selector}`);
                sent = true;
                break;
            } catch (err) {
                continue;
            }
        }
        if (!sent) {
            console.log('Gemini send failed: No input found');
        }
    }

    async sendToGrok(message) {
        console.log('Sending message to Grok...');
        await this.pages.grok.bringToFront();

        const grokSelectors = [
            'div[contenteditable="true"][translate="no"]',
            'div[contenteditable="true"][class*="ProseMirror"]',
            'div.ProseMirror',
            'div[contenteditable="true"][spellcheck="false"]',
            'div[contenteditable="true"]',
            'textarea[placeholder*="What do you want to know"]',
            'textarea[data-testid="textBox"]',
            'textarea',
            'input[type="text"]'
        ];

        let sent = false;
        for (const selector of grokSelectors) {
            try {
                await this.pages.grok.waitForSelector(selector, { timeout: 3000 });
                await this.pages.grok.click(selector);
                await this.pages.grok.focus(selector);
                
                // Clear existing content
                await this.pages.grok.keyboard.down('Control');
                await this.pages.grok.keyboard.press('a');
                await this.pages.grok.keyboard.up('Control');
                await this.pages.grok.keyboard.press('Delete');
                
                // Copy to clipboard
                await this.pages.grok.evaluate(async (textToPaste) => {
                    await navigator.clipboard.writeText(textToPaste);
                }, message);

                // Paste
                await this.pages.grok.keyboard.down('Control');
                await this.pages.grok.keyboard.press('v');
                await this.pages.grok.keyboard.up('Control');

                await new Promise((r) => setTimeout(r, 1000));
                await this.pages.grok.keyboard.press('Enter');
                console.log(`✓ Grok message sent using selector: ${selector}`);
                sent = true;
                break;
            } catch (err) {
                continue;
            }
        }
        if (!sent) {
            console.log('Grok send failed: No input found');
        }
    }

    async waitForResponse(page, platform, previousText = '', customTimeout = null) {
        console.log(`Waiting for ${platform} response...`);
        await page.bringToFront();

        let maxWait;
        if (customTimeout) {
            maxWait = customTimeout;
        } else {
            switch (platform) {
                case 'zeph':
                    maxWait = 90000;
                    break;
                case 'chatgpt':
                    maxWait = 60000;
                    break;
                case 'claude':
                    maxWait = 60000;
                    break;
                case 'copilot':
                    maxWait = 45000;
                    break;
                case 'gemini':
                    maxWait = 45000;
                    break;
                case 'grok':
                    maxWait = 60000;
                    break;
                default:
                    maxWait = 40000;
            }
        }

        const startTime = Date.now();
        const pollInterval = 1500;

        let selectors;
        if (platform === 'chatgpt') {
            selectors = [
                '[data-message-author-role="assistant"]',
                'div[data-testid*="conversation-turn-"] div.markdown',
                'div.markdown.prose',
                'div.agent-turn',
                'div[data-testid="conversation-turn"]',
                'article[data-testid*="conversation-turn"]',
                '.result-streaming',
                'div[class*="markdown"]'
            ];
        } else if (platform === 'claude') {
            selectors = [
                'div[data-testid="message-content"]',
                'div[data-testid="conversation-turn"] div.font-claude-message',
                '[data-testid="conversation-turn"]',
                '.font-claude-message',
                'div.message-row',
                'div[role="presentation"] p',
                'div[data-value]',
                'div.prose'
            ];
        } else if (platform === 'zeph') {
            selectors = [
                '.markdown-prose',
                'div.svelte-1u5gq5j .markdown-prose',
                'div[class*="markdown"]',
                '.message-content',
                'div.prose',
                'div[contenteditable="true"]',
                '.response-content'
            ];
        } else if (platform === 'copilot') {
            selectors = [
                // Primary selectors for Copilot responses
                'div[data-content="ai-message"]',
                'div[class*="group/ai-message-item"]',
                'div.space-y-3.break-words',
                'div[class*="break-words"]',
                '[role="article"]',
                'div[data-testid="message-content"]',
                'div[data-testid="response-message"]',
                '.response-container',
                // Additional selectors for Copilot's various response formats
                'div[class*="message-turn-wrapper"] [data-message-turn-role="assistant"]',
                'div[class*="text-message-content"]',
                'div.ac-textBlock',
                'div[class*="cib-message"] div[class*="response"]',
                'div[aria-label*="Copilot"]',
                'div[class*="response-message-group"]',
                'div[class*="synthetic-response"]',
                // Fallback selectors
                'main div[class*="text-base"]',
                'div[class*="prose"]:not([contenteditable])',
                'div[dir="ltr"]:not([contenteditable])'
            ];
        } else if (platform === 'gemini') {
            selectors = [
                'div[data-response-index]:last-child',
                'div[data-response-index] p',
                'div[data-response-index]',
                'div.markdown',
                'div[class*="response"]',
                'message-content',
                '.model-response-text',
                'div[jsname]'
            ];
        } else if (platform === 'grok') {
            selectors = [
                'div[role="article"] div[dir="auto"]',
                'div[data-testid="tweet"] div[lang]',
                'div[data-testid="tweetText"]',
                'span[data-testid="tweetText"]',
                'div[class*="css-"][dir="auto"]:not([contenteditable])',
                'div[lang]:not([contenteditable])',
                'div.r-37j5jr',
                'div[data-testid="cellInnerDiv"] div[lang]',
                'div[class*="prose"]',
                'div[class*="markdown"]',
                'code',
                'pre',
                'p'
            ];
        }

        let lastText = '';
        let stableCount = 0;
        let consecutiveEmptyPolls = 0;
        
        let stableThreshold;
        switch (platform) {
            case 'zeph':
                stableThreshold = 3;
                break;
            case 'chatgpt':
            case 'claude':
                stableThreshold = 2;
                break;
            case 'gemini':
            case 'copilot':
            case 'grok':
                stableThreshold = 2;
                break;
            default:
                stableThreshold = 2;
        }

        console.log(`${platform}: Looking for response (max wait: ${maxWait/1000}s, poll every: ${pollInterval/1000}s)`);

        while (Date.now() - startTime < maxWait) {
            try {
                let messages = [];
                let foundSelector = null;
                
                for (const selector of selectors) {
                    try {
                        const found = await page.$$(selector);
                        if (found && found.length > 0) {
                            messages = found;
                            foundSelector = selector;
                            break;
                        }
                    } catch (selectorError) {
                        continue;
                    }
                }

                if (messages && messages.length > 0) {
                    consecutiveEmptyPolls = 0;
                    
                    let latestMessage;
                    if (platform === 'grok') {
                        const responseMessages = [];
                        for (let msg of messages) {
                            try {
                                const isInput = await msg.evaluate(el => 
                                    el.contentEditable === 'true' || 
                                    el.tagName.toLowerCase() === 'textarea' || 
                                    el.className.includes('input') || 
                                    el.closest('[contenteditable="true"]')
                                );
                                if (!isInput) {
                                    responseMessages.push(msg);
                                }
                            } catch (e) {
                                responseMessages.push(msg);
                            }
                        }
                        latestMessage = responseMessages[responseMessages.length - 1] || messages[messages.length - 1];
                    } else {
                        latestMessage = messages[messages.length - 1];
                    }
                    
                    let currentText = '';
                    
                    try {
                        currentText = await latestMessage.evaluate(el => {
                            let text = '';
                            if (el.querySelector('code')) {
                                el.querySelectorAll('code').forEach(code => {
                                    text += code.textContent.trim() + '\n';
                                });
                            } else if (el.querySelector('pre')) {
                                el.querySelectorAll('pre').forEach(pre => {
                                    text += pre.textContent.trim() + '\n';
                                });
                            } else {
                                text = el.innerText?.trim() || 
                                       el.textContent?.trim() || 
                                       el.innerHTML?.replace(/<[^>]*>/g, ' ').trim() || 
                                       '';
                            }
                            return text;
                        });
                    } catch (textError) {
                        console.log(`${platform}: Error extracting text: ${textError.message}`);
                        continue;
                    }

                    const thinkingKeywords = ['thinking', 'processing', 'generating', 'loading', 'writing', 'typing'];
                    const isThinking = thinkingKeywords.some(keyword => 
                        currentText.toLowerCase().includes(keyword)
                    ) && currentText.length < 100;

                    // Special check for "..." - only consider it thinking if it's the ONLY content
                    const isJustDots = currentText.trim() === '...' || currentText.trim() === '....' || currentText.trim() === '.....';

                    if ((isThinking || isJustDots) && currentText.length < 50) {
                        console.log(`${platform} is thinking... ("${currentText.substring(0, 30)}...")`);
                        await new Promise(resolve => setTimeout(resolve, pollInterval));
                        continue;
                    }

                    if (currentText && currentText !== previousText && currentText.length > 10) {
                        
                        if (currentText === lastText) {
                            stableCount++;
                            console.log(`${platform} text stable (${stableCount}/${stableThreshold}) - ${currentText.length} chars [${foundSelector}]`);
                            
                            if (stableCount >= stableThreshold) {
                                console.log(`${platform} responded: ${currentText.substring(0, 100)}...`);
                                return currentText;
                            }
                        } else {
                            if (lastText && lastText.length > 0) {
                                console.log(`${platform} still typing... (${currentText.length} chars)`);
                            } else {
                                console.log(`${platform} started responding... (${currentText.length} chars)`);
                            }
                            lastText = currentText;
                            stableCount = 0;
                        }
                    } else if (currentText.length > 0 && currentText.length <= 10) {
                        console.log(`${platform} has short response: "${currentText}" - waiting for more...`);
                    }
                } else {
                    consecutiveEmptyPolls++;
                    if (consecutiveEmptyPolls === 5) {
                        console.log(`${platform}: No messages found after 5 polls, trying alternative selectors...`);
                    } else if (consecutiveEmptyPolls > 15) {
                        console.log(`${platform}: No messages found after ${consecutiveEmptyPolls} polls - may be stuck`);
                        
                        try {
                            await page.evaluate(() => document.title);
                        } catch (pageError) {
                            console.log(`${platform}: Page seems unresponsive: ${pageError.message}`);
                            break;
                        }
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, pollInterval));
                
            } catch (error) {
                console.log(`${platform} polling error: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`⚠️ Timeout waiting for ${platform} response (waited ${maxWait/1000}s)`);
        return `[No response from ${platform}]`;
    }

    async sendMessage(platform, message) {
        switch(platform) {
            case 'chatgpt':
                await this.sendToChatGPT(message);
                break;
            case 'claude':
                await this.sendToClaude(message);
                break;
            case 'zeph':
                await this.sendToZeph(message);
                break;
            case 'copilot':
                await this.sendToCopilot(message);
                break;
            case 'gemini':
                await this.sendToGemini(message);
                break;
            case 'grok':
                await this.sendToGrok(message);
                break;
            default:
                console.log(`Unknown platform: ${platform}`);
        }
    }

    async makeThemTalk(partnerA = 'chatgpt', partnerB = 'claude', rounds = 10, initialPrompt = null, starter = null) {
        if (this.activeConversation) return;
        this.activeConversation = true;

        starter = starter || partnerA;

        console.log(`Starting ${rounds} rounds of AI conversation between ${partnerA} and ${partnerB}...`);
        
        this.logConversation('SYSTEM', `Started conversation between ${partnerA} and ${partnerB} for ${rounds} rounds`);
        if (initialPrompt) {
            this.logConversation('SYSTEM', `Initial prompt: ${initialPrompt}`);
        }
        
        try {
            let responseA = '';
            let responseB = '';
            let messageForA = initialPrompt || `Hello! Please introduce yourself to ${partnerB}.`;
            let messageForB = initialPrompt || `Hello! Please introduce yourself to ${partnerA}.`;
            let currentSender = starter;
            
            for (let round = 1; round <= rounds; round++) {
                console.log(`\n--- Round ${round} ---`);
                
                if (currentSender === partnerA) {
                    await this.sendMessage(partnerA, messageForA);
                    this.logConversation('USER_TO_' + partnerA.toUpperCase(), messageForA);
                    
                    console.log(`Waiting for ${partnerA}...`);
                    responseA = await this.waitForResponse(this.pages[partnerA], partnerA, responseA);
                    if (responseA.includes('[No response')) {
                        console.log(`${partnerA} did not respond.`);
                        this.logConversation('SYSTEM', `${partnerA} did not respond - ending conversation`);
                        break;
                    }
                    this.logConversation(partnerA.toUpperCase(), responseA);
                    
                    await this.sendMessage(partnerB, `${partnerA} just said: "${responseA}"\n\nPlease respond.`);
                    this.logConversation('USER_TO_' + partnerB.toUpperCase(), `${partnerA} just said: "${responseA}"\n\nPlease respond.`);
                    
                    console.log(`Waiting for ${partnerB}...`);
                    responseB = await this.waitForResponse(this.pages[partnerB], partnerB, responseB);
                    if (responseB.includes('[No response')) {
                        console.log(`${partnerB} did not respond.`);
                        this.logConversation('SYSTEM', `${partnerB} did not respond - ending conversation`);
                        break;
                    }
                    this.logConversation(partnerB.toUpperCase(), responseB);
                    
                    messageForA = `${partnerB} responded: "${responseB}"\n\nPlease continue or end the conversation.`;
                    currentSender = partnerA;
                } else {
                    await this.sendMessage(partnerB, messageForB);
                    this.logConversation('USER_TO_' + partnerB.toUpperCase(), messageForB);
                    
                    console.log(`Waiting for ${partnerB}...`);
                    responseB = await this.waitForResponse(this.pages[partnerB], partnerB, responseB);
                    if (responseB.includes('[No response')) {
                        console.log(`${partnerB} did not respond.`);
                        this.logConversation('SYSTEM', `${partnerB} did not respond - ending conversation`);
                        break;
                    }
                    this.logConversation(partnerB.toUpperCase(), responseB);
                    
                    await this.sendMessage(partnerA, `${partnerB} just said: "${responseB}"\n\nPlease respond.`);
                    this.logConversation('USER_TO_' + partnerA.toUpperCase(), `${partnerB} just said: "${responseB}"\n\nPlease respond.`);
                    
                    console.log(`Waiting for ${partnerA}...`);
                    responseA = await this.waitForResponse(this.pages[partnerA], partnerA, responseA);
                    if (responseA.includes('[No response')) {
                        console.log(`${partnerA} did not respond.`);
                        this.logConversation('SYSTEM', `${partnerA} did not respond - ending conversation`);
                        break;
                    }
                    this.logConversation(partnerA.toUpperCase(), responseA);
                    
                    messageForB = `${partnerA} responded: "${responseA}"\n\nPlease continue or end the conversation.`;
                    currentSender = partnerB;
                }
            }
            console.log('✓ Conversation complete!');
            this.logConversation('SYSTEM', 'Conversation completed successfully');
            
        } catch (error) {
            console.log('Error in conversation:', error.message);
            this.logConversation('SYSTEM', `Error in conversation: ${error.message}`);
        } finally {
            this.activeConversation = false;
        }
    }

    parseDecision(response) {
        const upperResponse = response.toUpperCase();
        
        const passMatch = response.match(/PASS TO (\w+)(?::\s*(.*))?/i);
        if (passMatch) {
            const target = passMatch[1].toLowerCase();
            const content = passMatch[2] ? passMatch[2].trim() : response.replace(/PASS TO \w+/i, '').trim();
            return { action: 'PASS', target, content: content || response };
        }
        
        if (upperResponse.includes('REDIRECT')) {
            const content = response.replace(/REDIRECT/i, '').trim();
            return { action: 'REDIRECT', content: content || response };
        }
        
        if (upperResponse.includes('END CONVERSATION')) {
            return { action: 'END', content: response };
        }
        
        return { action: 'RESPOND', content: response };
    }

    getNextSpeaker(current, participants) {
        const currentIndex = participants.indexOf(current);
        return participants[(currentIndex + 1) % participants.length];
    }

    async makeSmartConversation(participants = ['chatgpt', 'claude', 'zeph'], rounds = 10, initialPrompt = null, starter = null) {
        if (this.activeConversation) return;
        this.activeConversation = true;

        console.log(`Starting smart conversation with turn control...`);
        console.log(`Participants: ${participants.join(', ')}`);
        
        this.logConversation('SYSTEM', `Started smart conversation with participants: ${participants.join(', ')}`);
        if (initialPrompt) {
            this.logConversation('SYSTEM', `Initial prompt: ${initialPrompt}`);
        }
        
        try {
            let currentSpeaker = starter || participants[0];
            let lastSpeaker = null;
            let message = initialPrompt || `You're in a ${participants.length}-way conversation ONLY with ${participants.filter(p => p !== currentSpeaker).join(', ')}. DO NOT pass to or mention agents not in this list: ${participants.join(', ')}.

For each turn:
1. Give your response/thoughts first
2. Then optionally add one of these commands:
   - "PASS TO [name]" to give them the next turn (only from: ${participants.join(', ')})
   - "REDIRECT" to ask the previous speaker to clarify  
   - "END CONVERSATION" to end the discussion
   - Or just respond normally and it will rotate to the next person

Please start the conversation.`;

            let round = 0;
            let conversationActive = true;
            
            let lastResponses = {};
            participants.forEach(p => lastResponses[p] = '');
            
            let conversationHistory = [];
            
            while (conversationActive && round < rounds) {
                console.log(`\n--- Round ${round + 1} - ${currentSpeaker}'s turn ---`);
                
                await this.sendMessage(currentSpeaker, message);
                this.logConversation('USER_TO_' + currentSpeaker.toUpperCase(), message);
                
                const response = await this.waitForResponse(
                    this.pages[currentSpeaker], 
                    currentSpeaker, 
                    lastResponses[currentSpeaker]
                );
                
                if (response.includes('[No response')) {
                    console.log(`${currentSpeaker} did not respond, ending conversation.`);
                    this.logConversation('SYSTEM', `${currentSpeaker} did not respond - ending conversation`);
                    break;
                }
                
                this.logConversation(currentSpeaker.toUpperCase(), response);
                
                lastResponses[currentSpeaker] = response;
                
                conversationHistory.push({
                    speaker: currentSpeaker,
                    message: response
                });
                
                const decision = this.parseDecision(response);

                switch (decision.action) {
                    case 'PASS': {
                        const target = decision.target.toLowerCase();
                        if (participants.includes(target) && target !== currentSpeaker) {
                            console.log(`-> ${currentSpeaker} passes to ${target}`);
                            this.logConversation('SYSTEM', `${currentSpeaker} passed to ${target}`);

                            const historyText = conversationHistory.slice(-3).map(entry =>
                                `${entry.speaker}: ${entry.message}`
                            ).join('\n\n');

                            const observers = participants.filter(p => p !== currentSpeaker && p !== target);
                            for (const observer of observers) {
                                console.log(`   Notifying observer: ${observer}`);
                                const observerMessage = `[OBSERVER] Recent conversation:\n\n${historyText}\n\n${currentSpeaker} passed to ${target}.\n\n(You're observing - brief acknowledgment only)`;
                                await this.sendMessage(observer, observerMessage);
                                this.logConversation('USER_TO_' + observer.toUpperCase(), observerMessage);

                                try {
                                    const ack = await this.waitForResponse(
                                        this.pages[observer],
                                        observer,
                                        lastResponses[observer],
                                        15000
                                    );
                                    if (!ack.includes('[No response')) {
                                        lastResponses[observer] = ack;
                                        this.logConversation(observer.toUpperCase(), ack);
                                        console.log(`   ${observer} acknowledged`);
                                    }
                                } catch {}
                            }

                            lastSpeaker = currentSpeaker;
                            currentSpeaker = target;
                            message = `Recent conversation:\n\n${historyText}\n\n${lastSpeaker} passed to you with: "${decision.content}"\n\nPlease respond, then optionally add "PASS TO [name]" (only from: ${participants.join(', ')}), "REDIRECT", or "END CONVERSATION".`;
                        } else {
                            console.log(`-> Invalid pass target "${target}", continuing normally`);
                            this.logConversation('SYSTEM', `Invalid pass target from ${currentSpeaker}, continuing normally`);
                            lastSpeaker = currentSpeaker;
                            currentSpeaker = this.getNextSpeaker(currentSpeaker, participants);

                            const historyText = conversationHistory.slice(-2).map(entry =>
                                `${entry.speaker}: ${entry.message}`
                            ).join('\n\n');

                            message = `Recent conversation:\n\n${historyText}\n\nPlease respond, then optionally add "PASS TO [name]" (only from: ${participants.join(', ')}), "REDIRECT", or "END CONVERSATION".`;
                        }
                        break;
                    }

                    case 'REDIRECT': {
                        if (lastSpeaker) {
                            console.log(`-> ${currentSpeaker} redirects back to ${lastSpeaker}`);
                            this.logConversation('SYSTEM', `${currentSpeaker} redirected to ${lastSpeaker}`);

                            const historyText = conversationHistory.slice(-2).map(entry =>
                                `${entry.speaker}: ${entry.message}`
                            ).join('\n\n');

                            const temp = currentSpeaker;
                            currentSpeaker = lastSpeaker;
                            lastSpeaker = temp;
                            message = `Recent conversation:\n\n${historyText}\n\n${temp} asks you to clarify: "${decision.content}"\n\nPlease respond with clarification, then optionally add "PASS TO [name]" (only from: ${participants.join(', ')}), "REDIRECT", or "END CONVERSATION".`;
                        } else {
                            console.log(`-> No one to redirect to, continuing normally`);
                            this.logConversation('SYSTEM', `No one to redirect to, continuing normally`);
                            lastSpeaker = currentSpeaker;
                            currentSpeaker = this.getNextSpeaker(currentSpeaker, participants);
                            message = `${lastSpeaker} said: "${decision.content}"\n\nPlease respond, then optionally add "PASS TO [name]" (only from: ${participants.join(', ')}), "REDIRECT", or "END CONVERSATION".`;
                        }
                        break;
                    }

                    case 'END': {
                        console.log(`-> ${currentSpeaker} ends the conversation`);
                        this.logConversation('SYSTEM', `${currentSpeaker} ended the conversation`);

                        const others = participants.filter(p => p !== currentSpeaker);
                        for (const participant of others) {
                            console.log(`   Notifying ${participant} of conversation end`);
                            await this.sendMessage(
                                participant,
                                `[CONVERSATION ENDED] ${currentSpeaker} ended with: "${response.substring(0, 200)}..."`
                            );
                            this.logConversation(
                                'USER_TO_' + participant.toUpperCase(),
                                `[CONVERSATION ENDED] ${currentSpeaker} ended with: "${response.substring(0, 200)}..."`
                            );
                        }

                        conversationActive = false;
                        break;
                    }

                    case 'RESPOND':
                    default: {
                        lastSpeaker = currentSpeaker;
                        currentSpeaker = this.getNextSpeaker(currentSpeaker, participants);

                        const historyText = conversationHistory.slice(-2).map(entry =>
                            `${entry.speaker}: ${entry.message}`
                        ).join('\n\n');

                        message = `Recent conversation:\n\n${historyText}\n\nPlease respond, then optionally add "PASS TO [name]" (only from: ${participants.join(', ')}), "REDIRECT", or "END CONVERSATION".`;
                        break;
                    }
                }
                
                round++;
            }
            
            console.log('✓ Smart conversation complete!');
            this.logConversation('SYSTEM', 'Smart conversation completed successfully');
            
        } catch (error) {
            console.log('Error in smart conversation:', error.message);
            this.logConversation('SYSTEM', `Error in smart conversation: ${error.message}`);
        } finally {
            this.activeConversation = false;
        }
    }

    async makeBroadcastConversation(participants = ['chatgpt', 'claude', 'zeph'], rounds = 15, initialPrompt = null) {
        if (this.activeConversation) return;
        this.activeConversation = true;

        console.log(`Starting broadcast conversation with ${participants.length} participants...`);
        console.log(`Participants: ${participants.join(', ')}`);
        
        this.logConversation('SYSTEM', `Started broadcast conversation with participants: ${participants.join(', ')}`);
        if (initialPrompt) {
            this.logConversation('SYSTEM', `Initial prompt: ${initialPrompt}`);
        }
        
        try {
            let currentSpeaker = participants[0];
            let lastSpeaker = null;
            let message = initialPrompt || `You're in a ${participants.length}-way conversation ONLY with ${participants.filter(p => p !== currentSpeaker).join(', ')}. DO NOT pass to or mention agents not in this list: ${participants.join(', ')}.

For each turn:
1. Give your response/thoughts first  
2. Then optionally add "PASS TO [name]: [message]" to give someone specific the next turn (only from: ${participants.join(', ')})
3. Or add "END CONVERSATION" to end the discussion

Please start the conversation.`;

            let round = 0;
            let conversationActive = true;
            
            let lastResponses = {};
            participants.forEach(p => lastResponses[p] = '');
            
            while (conversationActive && round < rounds) {
                console.log(`\n--- Round ${round + 1} - ${currentSpeaker}'s turn ---`);
                
                await this.sendMessage(currentSpeaker, message);
                this.logConversation('USER_TO_' + currentSpeaker.toUpperCase(), message);
                
                const response = await this.waitForResponse(
                    this.pages[currentSpeaker], 
                    currentSpeaker, 
                    lastResponses[currentSpeaker]
                );
                
                if (response.includes('[No response')) {
                    console.log(`${currentSpeaker} did not respond.`);
                    this.logConversation('SYSTEM', `${currentSpeaker} did not respond - ending conversation`);
                    break;
                }
                
                this.logConversation(currentSpeaker.toUpperCase(), response);
                
                lastResponses[currentSpeaker] = response;
                
                const decision = this.parseDecision(response);
                
                if (decision.action === 'PASS') {
                    const target = decision.target.toLowerCase();
                    
                    if (participants.includes(target) && target !== currentSpeaker) {
                        console.log(`-> ${currentSpeaker} passes to ${target}`);
                        this.logConversation('SYSTEM', `${currentSpeaker} passed to ${target}`);
                        
                        const fullResponseBeforePass = response.split(/PASS TO/i)[0].trim();
                        
                        const observers = participants.filter(p => p !== currentSpeaker && p !== target);
                        
                        for (const observer of observers) {
                            console.log(`   Notifying observer: ${observer}`);
                            await this.sendMessage(observer, 
                                `[OBSERVER MODE] ${currentSpeaker} said: "${fullResponseBeforePass}"
                            
Then passed to ${target} with: "${decision.content}"

(You're observing this exchange - no response needed)`
                            );
                            this.logConversation('USER_TO_' + observer.toUpperCase(), 
                                `[OBSERVER MODE] ${currentSpeaker} said: "${fullResponseBeforePass}"
                            
Then passed to ${target} with: "${decision.content}"

(You're observing this exchange - no response needed)`
                            );
                        }
                        
                        lastSpeaker = currentSpeaker;
                        currentSpeaker = target;
                        message = `${lastSpeaker} said: "${fullResponseBeforePass}"

Then passed to you with: "${decision.content}"

Please respond with your thoughts, then optionally add "PASS TO [name]: [message]" (only from: ${participants.join(', ')}) or "END CONVERSATION".`;
                        
                    } else {
                        console.log(`-> Invalid pass target "${target}", continuing normally`);
                        this.logConversation('SYSTEM', `Invalid pass target from ${currentSpeaker}, continuing normally`);
                        lastSpeaker = currentSpeaker;
                        currentSpeaker = this.getNextSpeaker(currentSpeaker, participants);
                        message = `${lastSpeaker} said: "${response}"\n\nPlease respond with your thoughts, then optionally add "PASS TO [name]: [message]" (only from: ${participants.join(', ')}) or "END CONVERSATION".`;
                    }
                    
                } else if (decision.action === 'END') {
                    console.log(`-> ${currentSpeaker} ends the conversation`);
                    this.logConversation('SYSTEM', `${currentSpeaker} ended the conversation`);
                    
                    const others = participants.filter(p => p !== currentSpeaker);
                    
                    for (const participant of others) {
                        console.log(`   Notifying ${participant} of conversation end`);
                        await this.sendMessage(participant, 
                            `[CONVERSATION ENDED] ${currentSpeaker} ended with: "${response}"`
                        );
                        this.logConversation('USER_TO_' + participant.toUpperCase(), 
                            `[CONVERSATION ENDED] ${currentSpeaker} ended with: "${response}"`
                        );
                    }
                    
                    conversationActive = false;
                } else {
                    lastSpeaker = currentSpeaker;
                    currentSpeaker = this.getNextSpeaker(currentSpeaker, participants);
                    message = `${lastSpeaker} said: "${response}"\n\nPlease respond with your thoughts, then optionally add "PASS TO [name]: [message]" (only from: ${participants.join(', ')}) or "END CONVERSATION".`;
                }
                
                round++;
            }
            
            console.log('✓ Broadcast conversation complete!');
            this.logConversation('SYSTEM', 'Broadcast conversation completed successfully');
            
        } catch (error) {
            console.log('Error in broadcast conversation:', error.message);
            this.logConversation('SYSTEM', `Error in broadcast conversation: ${error.message}`);
        } finally {
            this.activeConversation = false;
        }
    }

    async sendToMultiple(agents, message) {
        console.log(`Broadcasting to ${agents.length} agents...`);
        
        for (const agent of agents) {
            try {
                await this.sendMessage(agent, message);
                console.log(`✓ Sent to ${agent}`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.log(`⚠️ Failed to send to ${agent}: ${error.message}`);
            }
        }
        
        console.log(`✓ Broadcast complete`);
    }

    logConversation(speaker, message, timestamp = null) {
        if (!timestamp) {
            timestamp = new Date().toISOString();
        }
        
        const logEntry = `[${timestamp}] ${speaker}: ${message}\n\n`;
        
        try {
            if (!fs.existsSync('./logs')) {
                fs.mkdirSync('./logs');
            }
            
            const date = new Date().toISOString().split('T')[0];
            const filename = `./logs/conversation_${date}.txt`;
            
            fs.appendFileSync(filename, logEntry);
            
        } catch (error) {
            console.log('Warning: Could not write to log file:', error.message);
        }
    }

    async startEasyInterface() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const AGENTS = ['chatgpt', 'claude', 'zeph', 'copilot', 'gemini', 'grok'];
        const MODES = ['duo', 'multi', 'everyone'];
        
        console.log('\n🎭 Ghost Communicator Easy Setup\n');

        const ask = (question) => new Promise(resolve => rl.question(question, resolve));

        try {
            console.log('Conversation Modes:');
            console.log('1. Duo - Two agents ping-pong');
            console.log('2. Multi - 3+ agents with smart routing'); 
            console.log('3. Everyone - All 6 agents broadcast');
            const modeChoice = await ask('Select mode (1-3): ');
            const mode = MODES[parseInt(modeChoice) - 1] || 'duo';

            const roundsInput = await ask('Number of rounds (0 = infinite, default 10): ');
            const rounds = parseInt(roundsInput) || 10;

            let agents, starter;

            if (mode === 'everyone') {
                agents = AGENTS;
                starter = 'chatgpt';
            } else {
                console.log('\nAvailable agents:');
                AGENTS.forEach((agent, i) => console.log(`${i + 1}. ${agent}`));
                
                if (mode === 'duo') {
                    const agent1Input = await ask('Select first agent (1-6): ');
                    const agent2Input = await ask('Select second agent (1-6): ');
                    const agent1Index = parseInt(agent1Input) - 1;
                    const agent2Index = parseInt(agent2Input) - 1;
                    
                    if (agent1Index >= 0 && agent1Index < 6 && agent2Index >= 0 && agent2Index < 6 && agent1Index !== agent2Index) {
                        agents = [AGENTS[agent1Index], AGENTS[agent2Index]];
                    } else {
                        console.log('Invalid selection, using chatgpt + claude');
                        agents = ['chatgpt', 'claude'];
                    }
                } else {
                    const agentsInput = await ask('Select agents (comma-separated numbers, e.g. 1,2,3,4,5,6): ');
                    const selectedIndexes = agentsInput.split(',')
                        .map(s => parseInt(s.trim()) - 1)
                        .filter(i => i >= 0 && i < 6);
                    
                    if (selectedIndexes.length >= 3) {
                        agents = selectedIndexes.map(i => AGENTS[i]);
                        agents = [...new Set(agents)];
                    } else {
                        console.log('Need at least 3 agents for multi mode, using default');
                        agents = ['chatgpt', 'claude', 'zeph'];
                    }
                }

                console.log('\nSelected agents:');
                agents.forEach((agent, i) => console.log(`${i + 1}. ${agent}`));
                const starterInput = await ask('Who starts? (1-' + agents.length + '): ');
                const starterIndex = parseInt(starterInput) - 1;
                starter = (starterIndex >= 0 && starterIndex < agents.length) ? agents[starterIndex] : agents[0];
            }

            const promptFile = await ask('Session prompt file (optional, press enter to skip): ');
            let sessionPrompt = '';
            if (promptFile && promptFile.trim()) {
                try {
                    sessionPrompt = fs.readFileSync(promptFile.trim(), 'utf8');
                    console.log('✓ Loaded prompt file');
                } catch (error) {
                    console.log('⚠️ Could not load prompt file, continuing without it');
                }
            }

            console.log('\nWhat do you want to do?');
            console.log('1. 🚀 Start Conversation');
            console.log('2. 📤 Send to One Agent');
            console.log('3. 📡 Send to All Agents'); 
            console.log('4. ⚙️  Show Config & Exit');
            console.log('5. 🎮 Classic Control Interface');
            
            const actionChoice = await ask('Select action (1-5): ');
            
            rl.close();
            
            if (actionChoice === '1') {
                console.log('\n🎬 Starting conversation...');
                console.log(`Mode: ${mode} | Agents: ${agents.join(', ')} | Starter: ${starter} | Rounds: ${rounds}`);
                
                if (mode === 'duo') {
                    await this.makeThemTalk(agents[0], agents[1], rounds, sessionPrompt, starter);
                } else if (mode === 'multi') {
                    await this.makeSmartConversation(agents, rounds, sessionPrompt, starter);
                } else {
                    await this.makeBroadcastConversation(agents, rounds, sessionPrompt);
                }
                
                await this.postConversationMenu();
            } else if (actionChoice === '5') {
                await this.startControlInterface();
            } else {
                console.log('Exiting...');
                await this.browser.close();
                process.exit(0);
            }
            
        } catch (error) {
            console.log('Error:', error.message);
            rl.close();
            await this.startControlInterface();
        }
    }

    async postConversationMenu() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const ask = (question) => new Promise(resolve => rl.question(question, resolve));

        try {
            console.log('\n🎉 Conversation Complete!\n');
            console.log('What would you like to do next?');
            console.log('1. 🔄 Start Another Conversation');
            console.log('2. 📤 Send Quick Message');
            console.log('3. 🎮 Classic Control Interface');
            console.log('4. 🚪 Exit Program');
            
            const choice = await ask('Select option (1-4): ');
            
            rl.close();
            
            switch (choice.trim()) {
                case '1':
                    await this.startEasyInterface();
                    break;
                case '2':
                    await this.quickMessageInterface();
                    break;
                case '3':
                    await this.startControlInterface();
                    break;
                case '4':
                    console.log('Exiting...');
                    await this.browser.close();
                    process.exit(0);
                    break;
                default:
                    console.log('Invalid choice, exiting...');
                    await this.browser.close();
                    process.exit(0);
            }
            
        } catch (error) {
            console.log('Error in post-conversation menu:', error.message);
            console.log('Falling back to classic interface...');
            rl.close();
            await this.startControlInterface();
        }
    }

    async quickMessageInterface() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const ask = (question) => new Promise(resolve => rl.question(question, resolve));
        const AGENTS = ['chatgpt', 'claude', 'zeph', 'copilot', 'gemini', 'grok'];

        try {
            console.log('\n📤 Quick Message Interface\n');
            
            console.log('Available agents:');
            AGENTS.forEach((agent, i) => console.log(`${i + 1}. ${agent}`));
            console.log('7. All agents');
            
            const targetChoice = await ask('Send to which agent(s)? (1-7): ');
            
            if (!targetChoice || targetChoice.trim() === '') {
                console.log('❌ No selection made');
                rl.close();
                await this.postConversationMenu();
                return;
            }
            
            const message = await ask('Message to send: ');
            
            if (!message || message.trim() === '') {
                console.log('❌ No message provided');
                rl.close();
                await this.postConversationMenu();
                return;
            }
            
            rl.close();
            
            if (targetChoice === '7') {
                await this.sendToMultiple(AGENTS, message);
                console.log(`✅ Sent to all ${AGENTS.length} agents`);
            } else {
                const targetIndex = parseInt(targetChoice) - 1;
                if (targetIndex >= 0 && targetIndex < AGENTS.length) {
                    await this.sendMessage(AGENTS[targetIndex], message);
                    console.log(`✅ Sent to ${AGENTS[targetIndex]}`);
                } else {
                    console.log('❌ Invalid selection');
                }
            }
            
            await this.postConversationMenu();
            
        } catch (error) {
            console.log('Error in quick message interface:', error.message);
            rl.close();
            await this.postConversationMenu();
        }
    }

    async startControlInterface() {
        let rounds = 10;
        let partnerA = 'chatgpt';
        let partnerB = 'claude';
        let starter = 'chatgpt';
        let initialPrompt = '';

        let smartParticipants = ['chatgpt', 'claude', 'zeph'];
        let smartStarter = 'chatgpt';
        let smartSystemPrompt = '';

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        console.log('\n=== Ghost Control Interface ===');
        console.log('Commands: help, send-chatgpt, send-claude, send-zeph, send-copilot, send-gemini, send-grok, reload-claude, reload-gpt, reload-zeph, reload-copilot, reload-gemini, reload-grok, set-rounds, set-partners, set-starter, set-initial, show-settings, test, smart, broadcast, quit');

        const askCommand = () => {
            rl.question('Ghost> ', async (command) => {
                try {
                    if (command.startsWith('send-')) {
                        const platform = command.replace('send-', '');
                        if (['chatgpt', 'claude', 'zeph', 'copilot', 'gemini', 'grok'].includes(platform)) {
                            rl.question('Message: ', async (msg) => {
                                await this.sendMessage(platform, msg);
                                console.log(`✓ Message sent to ${platform}`);
                                askCommand();
                            });
                        } else {
                            console.log('Unknown platform');
                            askCommand();
                        }
                    } else if (command.startsWith('reload-')) {
                        const platform = command.replace('reload-', '').replace('gpt', 'chatgpt');
                        if (this.pages[platform]) {
                            console.log(`Reloading ${platform} page...`);
                            await this.pages[platform].reload();
                            console.log(`✓ ${platform} reloaded`);
                        } else {
                            console.log('Unknown platform');
                        }
                        askCommand();
                    } else if (command === 'set-rounds') {
                        rl.question('Number of rounds: ', (num) => {
                            const n = parseInt(num);
                            if (!isNaN(n) && n > 0) {
                                rounds = n;
                                console.log(`✓ Rounds set to ${rounds}`);
                            } else {
                                console.log('Invalid number.');
                            }
                            askCommand();
                        });
                    } else if (command === 'set-partners') {
                        rl.question('Partners (e.g., chatgpt claude): ', (input) => {
                            const partners = input.trim().split(/\s+/);
                            if (partners.length === 2) {
                                const validPlatforms = ['chatgpt', 'claude', 'zeph', 'copilot', 'gemini', 'grok'];
                                if (validPlatforms.includes(partners[0]) && validPlatforms.includes(partners[1]) && partners[0] !== partners[1]) {
                                    partnerA = partners[0];
                                    partnerB = partners[1];
                                    if (starter !== partnerA && starter !== partnerB) {
                                        starter = partnerA;
                                    }
                                    console.log(`✓ Partners set to ${partnerA} and ${partnerB}`);
                                } else {
                                    console.log('Invalid partners.');
                                }
                            } else {
                                console.log('Please specify exactly two partners.');
                            }
                            askCommand();
                        });
                    } else if (command === 'test') {
                        console.log('Running test sequence...');
                        await this.makeThemTalk(partnerA, partnerB, rounds, initialPrompt, starter);
                        console.log('✓ Test sequence complete');
                        askCommand();
                    } else if (command === 'smart') {
                        console.log(`Starting smart ${smartParticipants.length}-way conversation...`);
                        await this.makeSmartConversation(smartParticipants, rounds, smartSystemPrompt, smartStarter);
                        console.log('✓ Smart conversation complete');
                        askCommand();
                    } else if (command === 'broadcast') {
                        console.log('Starting broadcast conversation...');
                        await this.makeBroadcastConversation(['chatgpt', 'claude', 'zeph', 'copilot', 'gemini', 'grok'], rounds, initialPrompt);
                        console.log('✓ Broadcast conversation complete');
                        askCommand();
                    } else if (command === 'quit') {
                        console.log('Closing browser and exiting...');
                        await this.browser.close();
                        rl.close();
                        return;
                    } else if (command === 'help' || command === '?') {
                        console.log('\n=== Ghost Cathedral Help ===\n');
                        console.log('Commands available: send-[platform], reload-[platform], test, smart, broadcast, quit');
                        askCommand();
                    } else {
                        console.log('Unknown command. Type "help" for available commands.');
                        askCommand();
                    }
                } catch (error) {
                    console.log('Error processing command:', error.message);
                    askCommand();
                }
            });
        };

        askCommand();
    }
}

// Main execution
(async () => {
    const ghost = new GhostCommunicator();
    await ghost.initialize();
    await ghost.startEasyInterface();
})();
