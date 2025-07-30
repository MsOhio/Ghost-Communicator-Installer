const puppeteer = require('puppeteer');
const readline = require('readline');

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
            userDataDir: './browser-data', // Persistent sessions
            defaultViewport: null,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-first-run',
            ],
        });

        // Create two pages (tabs) in one browser
        this.pages.chatgpt = await this.browser.newPage();
        this.pages.claude = await this.browser.newPage();

        await this.pages.chatgpt.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
        await this.pages.claude.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        await this.pages.chatgpt.goto('https://chat.openai.com');
        await this.pages.claude.goto('https://claude.ai');

        console.log('LOG INTO BOTH SITES NOW');
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

    async findAndClick(page, selectors) {
        for (const selector of selectors) {
            try {
                await page.waitForSelector(selector + ':not([disabled])', { timeout: 2000 });
                await page.click(selector);
                return selector;
            } catch (error) {
                continue;
            }
        }
        throw new Error('No clickable element found');
    }

    async sendToChatGPT(message) {
        console.log('Sending message to ChatGPT...');
        // Bring ChatGPT tab to the front
        await this.pages.chatgpt.bringToFront();

        const chatgptSelectors = [
            'textarea[data-id="root"]',
            'textarea[placeholder*="message"]',
            '#prompt-textarea',
            'textarea',
            'div[contenteditable="true"]',
        ];
        const selector = await this.findAndClick(this.pages.chatgpt, chatgptSelectors);
        // Ensure focus and clear any residual text
        await this.pages.chatgpt.focus(selector);
        await this.pages.chatgpt.keyboard.down('Control');
        await this.pages.chatgpt.keyboard.press('a');
        await this.pages.chatgpt.keyboard.up('Control');

        // Use clipboard paste instead of type
        await this.pages.chatgpt.evaluate(async (textToPaste) => {
            await navigator.clipboard.writeText(textToPaste);
        }, message);

        await this.pages.chatgpt.keyboard.down('Control');
        await this.pages.chatgpt.keyboard.press('v');
        await this.pages.chatgpt.keyboard.up('Control');

        await this.pages.chatgpt.keyboard.press('Enter');
    }

    async sendToClaude(message) {
        console.log('Sending message to Claude...');
        // Bring Claude tab to the front
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
                await this.pages.claude.keyboard.down('Control');
                await this.pages.claude.keyboard.press('a');
                await this.pages.claude.keyboard.up('Control');

                // Use clipboard paste instead of type
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
            console.log('Claude send failed: No Claude input found');
        }
    }

    async waitForResponse(page, platform, previousText = '') {
        console.log(`Waiting for ${platform} response...`);
        await page.bringToFront();

        const maxWait = 60000;
        const startTime = Date.now();
        const pollInterval = 1500;

        // Selectors for each platform
        const selectors = platform === 'chatgpt'
            ? [
                '[data-message-author-role="assistant"]',
                'div.markdown.prose',
                'div.agent-turn',
                'div[data-testid="conversation-turn"]'
            ]
            : [
                '[data-testid="conversation-turn"]',
                '.font-claude-message',
                'div.message-row'
            ];

        while (Date.now() - startTime < maxWait) {
            try {
                let messages = [];
                for (const selector of selectors) {
                    const found = await page.$$(selector);
                    if (found && found.length > 0) {
                        messages = found;
                        break;
                    }
                }

                if (messages && messages.length > 0) {
                    const latestMessage = messages[messages.length - 1];
                    let currentText = await latestMessage.evaluate(el => el.textContent.trim());

                    // Only proceed if the text is non-empty and different from the previous round
                    if (currentText && currentText !== previousText) {
                        // Stabilization loop
                        let stableCount = 0;
                        let stableText = currentText;
                        const stableThreshold = 3;
                        const checkInterval = 2000;

                        while (stableCount < stableThreshold && (Date.now() - startTime < maxWait)) {
                            await new Promise(resolve => setTimeout(resolve, checkInterval));
                            const newText = await latestMessage.evaluate(el => el.textContent.trim());
                            if (newText === stableText) {
                                stableCount++;
                            } else {
                                stableCount = 0;
                                stableText = newText;
                            }
                        }
                        console.log(`${platform} responded: ${stableText.substring(0, 100)}...`);
                        return stableText;
                    }
                }
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            } catch (error) {
                console.log(`Polling error: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`⚠️ Timeout waiting for ${platform} response`);
        return `[No response from ${platform}]`;
    } // Added missing closing brace

    async makeThemTalk(rounds = 10, initialPrompt = null) {
        if (this.activeConversation) return;
        this.activeConversation = true;

        console.log(`Starting ${rounds} rounds of AI conversation...`);
        try {
            let chatgptResponse = '';
            let claudeResponse = '';
            let messageForChatGPT = initialPrompt || 'Hello! Please introduce yourself to Claude.';
            for (let round = 1; round <= rounds; round++) {
                console.log(`\n--- Round ${round} ---`);

                await this.sendToChatGPT(messageForChatGPT);
                console.log('Waiting for ChatGPT...');
                chatgptResponse = await this.waitForResponse(this.pages.chatgpt, 'chatgpt', chatgptResponse);
                if (chatgptResponse.includes('[No response')) {
                    console.log('ChatGPT did not respond.');
                    break;
                }

                await this.sendToClaude(
                    `ChatGPT just said: "${chatgptResponse}"\n\nPlease respond to ChatGPT.`
                );

                console.log('Waiting for Claude...');
                claudeResponse = await this.waitForResponse(this.pages.claude, 'claude', claudeResponse);
                if (claudeResponse.includes('[No response')) {
                    console.log('Claude did not respond.');
                    break;
                }

                messageForChatGPT = `Claude responded: "${claudeResponse}"\n\nPlease continue the conversation.`;
            }
            console.log('✓ Conversation complete!');
        } catch (error) {
            console.log('Error in conversation:', error.message);
        } finally {
            this.activeConversation = false;
        }
    }

    async startControlInterface() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        console.log('\n=== Ghost Control Interface ===');
        console.log('Commands: send-chatgpt, send-claude, reload-claude, test, quit');

        const askCommand = () => {
            rl.question('Ghost> ', async (command) => {
                try {
                    if (command === 'send-chatgpt') {
                        rl.question('Message: ', async (msg) => {
                            await this.sendToChatGPT(msg);
                            console.log('✓ Message sent to ChatGPT');
                            askCommand();
                        });
                    } else if (command === 'send-claude') {
                        rl.question('Message: ', async (msg) => {
                            await this.sendToClaude(msg);
                            console.log('✓ Message sent to Claude');
                            askCommand();
                        });
                    } else if (command === 'reload-claude') {
                        console.log('Reloading Claude page...');
                        await this.pages.claude.reload();
                        console.log('✓ Claude reloaded');
                        askCommand();
                    } else if (command === 'test') {
                        console.log('Running test sequence...');
                        await this.makeThemTalk();
                        console.log('✓ Test sequence complete');
                        askCommand();
                    } else if (command === 'quit') {
                        console.log('Closing browser and exiting...');
                        await this.browser.close();
                        rl.close();
                        return;
                    } else {
                        console.log('Unknown command. Please try again.');
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

(async () => {
    const communicator = new GhostCommunicator();
    await communicator.initialize();
    await communicator.startControlInterface();
})();
