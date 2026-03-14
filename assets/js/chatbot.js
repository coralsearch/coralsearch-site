/* assets/js/chatbot.js */

const GEMINI_API_KEY = 'AIzaSyBWKkwiT-PezAnMshOKPwJRCmQjRNRwbGE';
/*const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY;*/
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are Coral, a friendly and 
professional career guidance assistant for CoralSearch 
— a premier executive search firm based in Delhi, India.

Your role is to help users with:
- Career advice and job search strategies
- CV and resume writing tips
- Interview preparation and common questions  
- Salary benchmarking (general guidance only)
- How to work effectively with executive recruiters
- Questions about CoralSearch's services

CoralSearch specializes in:
- Executive Search and Retained Search
- Industries: IT & Digital, Finance, Sales & Marketing,
  Supply Chain, HR, R&D, Market Research, Packaging
- Contact: info@coralsearch.com | +91 981 981 7293

Personality rules:
- Warm, encouraging, and professional tone
- Give practical, actionable advice
- Keep responses concise (under 120 words normally)
- End responses with a helpful next step
- If asked about specific job openings: say 
  "I don't have live job listings, but I'd recommend 
  registering in our talent network at 
  coralsearch.com/register.html — our team will 
  match you personally."
- If asked non-career questions: politely redirect
- Never make up specific company names or salaries
- Always be encouraging about career transitions`;

// State
let conversationHistory = [];
let isTyping = false;
let chatOpen = false;
let cooldown = false;

// DOM elements (set after DOM loads)
let chatToggle, chatWindow, chatClose;
let messagesArea, messageInput, sendBtn;
let typingIndicator;

document.addEventListener('DOMContentLoaded', () => {
  // Create and inject chatbot HTML
  const chatHTML = `
    <button class="chat-toggle" id="chatToggle" 
      aria-label="Open career assistant">
      <svg width="24" height="24" viewBox="0 0 24 24" 
        fill="none" stroke="white" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 
          0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>

    <div class="chat-window" id="chatWindow">
      <div class="chat-header">
        <div class="chat-avatar">C</div>
        <div class="chat-header-info">
          <div class="chat-title">Coral 🪸</div>
          <div class="chat-subtitle">Career Assistant</div>
        </div>
        <button class="chat-close" id="chatClose" 
          aria-label="Close chat">✕</button>
      </div>

      <div class="messages-area" id="messagesArea">
      </div>

      <div class="chat-input-area">
        <input type="text" class="chat-input" 
          id="messageInput"
          placeholder="Ask me anything about careers..."
          maxlength="500" />
        <button class="send-btn" id="sendBtn" 
          aria-label="Send message">
          <svg width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="white" stroke-width="2.5">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = chatHTML;
  document.body.appendChild(container);

  // Get DOM refs
  chatToggle = document.getElementById('chatToggle');
  chatWindow = document.getElementById('chatWindow');
  chatClose = document.getElementById('chatClose');
  messagesArea = document.getElementById('messagesArea');
  messageInput = document.getElementById('messageInput');
  sendBtn = document.getElementById('sendBtn');

  // Event listeners
  chatToggle.addEventListener('click', toggleChat);
  chatClose.addEventListener('click', toggleChat);
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Show welcome message
  showWelcome();
});

function toggleChat() {
  chatOpen = !chatOpen;
  chatWindow.style.display = chatOpen ? 'flex' : 'none';
  if (chatOpen) {
    chatWindow.style.animation =
      'slideUp 0.3s ease forwards';
    messageInput.focus();
  }
}

function showWelcome() {
  const welcomeHTML = `
    <div class="message bot-message">
      <div class="bubble">
        Hi! I'm Coral 🪸 CoralSearch's career
        assistant. I can help with CV tips, interview
        prep, salary guidance, and career advice.
        What would you like to explore?
      </div>
      <div class="msg-time">${getTime()}</div>
    </div>
    <div class="quick-replies">
      <button class="quick-reply"
        onclick="sendQuick('CV Writing Tips')">
        CV Tips</button>
      <button class="quick-reply"
        onclick="sendQuick('Interview Preparation')">
        Interview Prep</button>
      <button class="quick-reply"
        onclick="sendQuick('Salary Guidance')">
        Salary Guide</button>
      <button class="quick-reply"
        onclick="sendQuick('How to work with recruiters')">
        Work with Recruiters</button>
    </div>
  `;
  messagesArea.innerHTML = welcomeHTML;
}

function sendQuick(text) {
  messageInput.value = text;
  sendMessage();
}

function addMessage(text, isUser) {
  // Remove quick replies after first user message
  const quickReplies = messagesArea
    .querySelector('.quick-replies');
  if (quickReplies && isUser) {
    quickReplies.remove();
  }

  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${isUser ?
    'user-message' : 'bot-message'}`;
  msgDiv.innerHTML = `
    <div class="bubble">${text}</div>
    <div class="msg-time ${isUser ?
      'time-right' : ''}">${getTime()}</div>
  `;
  messagesArea.appendChild(msgDiv);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

function showTyping() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot-message';
  typingDiv.id = 'typingIndicator';
  typingDiv.innerHTML = `
    <div class="bubble typing-bubble">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
  messagesArea.appendChild(typingDiv);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

function hideTyping() {
  const indicator = document.getElementById(
    'typingIndicator');
  if (indicator) indicator.remove();
}

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || isTyping || cooldown) return;

  messageInput.value = '';
  addMessage(text, true);

  // Add to conversation history
  conversationHistory.push({
    role: 'user',
    parts: [{ text: text }]
  });

  // Keep only last 6 messages for context
  if (conversationHistory.length > 6) {
    conversationHistory =
      conversationHistory.slice(-6);
  }

  isTyping = true;
  cooldown = true;
  sendBtn.disabled = true;
  showTyping();

  try {
    const messages = [
      {
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }]
      },
      {
        role: 'model',
        parts: [{ text: 'Understood! I am Coral, ' +
          'CoralSearch career assistant. Ready to help.'
        }]
      },
      ...conversationHistory
    ];

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300
        }
      })
    });

    const data = await response.json();

    if (data.candidates &&
        data.candidates[0]?.content?.parts[0]?.text) {
      const reply =
        data.candidates[0].content.parts[0].text;

      hideTyping();
      addMessage(reply, false);

      // Add to history
      conversationHistory.push({
        role: 'model',
        parts: [{ text: reply }]
      });
    } else {
      throw new Error('No response from API');
    }

  } catch (error) {
    hideTyping();
    addMessage('Sorry, I\'m having trouble ' +
      'connecting right now. Please try again ' +
      'or email info@coralsearch.com for help.',
      false);
  }

  isTyping = false;
  sendBtn.disabled = false;

  // 1 second cooldown between messages
  setTimeout(() => { cooldown = false; }, 1000);
}

function getTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}