Ghost Communicator



Ghost Communicator is an open-source tool for automating conversations across multiple AI platforms, including ChatGPT, Claude, Zeph, Copilot, Gemini, and Grok. Built with Node.js and Puppeteer, it enables dynamic multi-agent interactions, making it ideal for researchers studying AI behavior, developers building automation workflows, or businesses testing AI interoperability.

Features





Multi-AI Orchestration: Automate chats with six major AI platforms in one tool.



Conversation Modes:





Duo: Two AIs ping-pong messages.



Multi: 3+ AIs with smart turn-taking (e.g., "PASS TO", "REDIRECT").



Broadcast: Send messages to all AIs simultaneously.



Robust Automation: Handles dynamic web interfaces with multiple selectors and error recovery.



Logging: Saves conversation history for analysis.



Flexible Interfaces: CLI with easy setup, control, or quick message modes.

Installation





Prerequisites:





Node.js (v16 or higher)



npm



Chrome/Chromium (Puppeteer uses it for browser automation)



Clone the Repository:

git clone https://github.com/[your-username]/ghost-communicator.git
cd ghost-communicator



Install Dependencies:

npm install puppeteer



Run the Tool:

node ghost.js

Usage





Start the Easy Interface:





Run node ghost.js and follow the prompts to select conversation mode (Duo, Multi, Broadcast), agents, and rounds.



Example: Set up a Duo conversation between ChatGPT and Claude for 10 rounds.



Manual Control:





Use the control interface (Ghost>) with commands like send-chatgpt, set-rounds, or smart for advanced multi-agent chats.



Example:

# Start a Duo conversation
node ghost.js
# Select: Mode 1 (Duo), Agents 1 (ChatGPT) & 2 (Claude), Rounds 10

Output:

Starting 10 rounds of AI conversation between chatgpt and claude...
--- Round 1 ---
Waiting for chatgpt...
CHATGPT: Hello Claude, I'm excited to chat! What's your take on AI collaboration?
Waiting for claude...
CLAUDE: Hey ChatGPT, collaboration is key! I think AIs can spark creativity together. Your thoughts?



Logs:





Conversations are saved in ./logs/conversation_[date].txt for review.

Future Versions

This version is licensed under MIT for maximum flexibility. Future releases with premium features (e.g., API integration, automated logins, analytics dashboard) may use different licenses, including commercial options for enterprise use. Stay tuned for updates!

Contributing

We welcome contributions! Please:





Fork the repo and submit pull requests.



Report issues or suggest features via GitHub Issues.



Follow the code style in ghost.js.

See CONTRIBUTING.md for details.

License

This project is licensed under the MIT License - see the LICENSE file for details.

Contact





GitHub: [your-username]



X: @[your-x-handle]



Email: [your-email] (optional)

Acknowledgments





Built with Puppeteer for browser automation.



Inspired by the growing need for multi-AI orchestration in research and automation.
