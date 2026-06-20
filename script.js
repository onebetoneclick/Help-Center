const STORAGE_KEY = 'hashabi_local_chat_system_v3';
let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { tickets: {}, currentSessionUser: null };

window.addEventListener('DOMContentLoaded', () => {
    if (state.currentSessionUser && state.tickets[state.currentSessionUser]) {
        switchToUserChatMode();
    } else {
        state.currentSessionUser = null;
        saveState();
    }
});

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function initiateLiveChat(event) {
    event.preventDefault();
    const name = document.getElementById('custName').value.trim();
    const email = document.getElementById('custEmail').value.trim();
    const text = document.getElementById('custMessage').value.trim();
    const userId = 'usr_' + Date.now();

    state.tickets[userId] = {
        id: userId, name: name, email: email, lastUpdated: Date.now(), messages: []
    };
    state.currentSessionUser = userId;
    saveState();

    sendToLocalStorage(text, 'text', 'user');

    // BOT AUTO GREETING DISPATCH TRIGGER
    setTimeout(() => {
        const autoGreetingText = `Hello ${name}! Thank you for contacting Bright Star Hotel Collection Support. We have received your query regarding your ticket and a live dispatch agent will join this chat channel shortly.`;
        sendToLocalStorage(autoGreetingText, 'text', 'admin', 'System Bot');
        fetchChatHistory();
    }, 1000);

    switchToUserChatMode();
}

function switchToUserChatMode() {
    document.getElementById('formContainer').style.display = 'none';
    document.getElementById('chatBoxContainer').style.display = 'block';
    
    fetchChatHistory();
    setInterval(fetchChatHistory, 1500);
}

function fetchChatHistory() {
    if (!state.currentSessionUser || !state.tickets[state.currentSessionUser]) return;
    state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || state;
    const currentTicket = state.tickets[state.currentSessionUser];
    const container = document.getElementById('userChatLog');
    const currentTime = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    let htmlOutput = "";
    let hasRenderedJoinLine = false;

    currentTicket.messages.forEach(m => {
        if ((currentTime - m.rawTime) > twentyFourHours) return;

        // CENTERED JOIN LINE ACCENT FOR USER PREVIEW
        if (m.sender === 'admin' && m.agentName !== 'System Bot' && !hasRenderedJoinLine) {
            htmlOutput += `<div class="system-join-divider"><span>The live agent has entered the chat</span></div>`;
            hasRenderedJoinLine = true;
        }

        htmlOutput += `
            <div class="chat-bubble-row ${m.sender === 'user' ? 'outgoing' : 'incoming'}">
                <div class="bubble">
                    ${m.sender === 'admin' ? `<div style="font-size: 11px; font-weight: 700; color: #3b82f6; margin-bottom: 3px;">${m.agentName || 'Agent'}</div>` : ''}
                    ${m.type === 'image' ? `<img src="${m.text}" style="max-width:100%; border-radius:12px; display:block; margin-top:4px;">` : m.text}
                </div>
                <span class="time">${m.timestamp}</span>
            </div>
        `;
    });

    container.innerHTML = htmlOutput;
    container.scrollTop = container.scrollHeight;
}

function sendUserChatMessage(event) {
    event.preventDefault();
    const input = document.getElementById('chatUserMsgInput');
    const txt = input.value.trim();
    if (!txt) return;

    sendToLocalStorage(txt, 'text', 'user');
    input.value = '';
    fetchChatHistory();
}

function uploadUserImage(fileInput) {
    const file = fileInput.files;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        sendToLocalStorage(e.target.result, 'image', 'user');
        fetchChatHistory();
    };
    reader.readAsDataURL(file);
    fileInput.value = '';
}

function sendToLocalStorage(text, type, senderIdentity, agentName = null) {
    if (!state.currentSessionUser || !state.tickets[state.currentSessionUser]) return;

    state.tickets[state.currentSessionUser].messages.push({
        sender: senderIdentity, text: text, type: type, agentName: agentName,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        rawTime: Date.now()
    });
    state.tickets[state.currentSessionUser].lastUpdated = Date.now();
    saveState();
}

function clearUserSession() {
    state.currentSessionUser = null;
    saveState();
    location.reload();
}

function toggleAccordion(element) {
    const content = element.nextElementSibling;
    element.parentElement.classList.toggle('active');
    content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + "px";
}
