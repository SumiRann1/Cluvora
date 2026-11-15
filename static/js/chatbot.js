document.addEventListener('DOMContentLoaded', () => {
  const messagesContainer = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const clearBtn = document.getElementById('clear-chat-btn');

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatMarkdown(text) {
    if (!text) return '';
    let html = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    const lines = html.split('\n');
    let inList = false;
    const processed = [];

    for (let line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || (trimmed.startsWith('* ') && !trimmed.endsWith('*'))) {
        if (!inList) {
          processed.push('<ul>');
          inList = true;
        }
        processed.push(`<li>${trimmed.substring(2)}</li>`);
      } else {
        if (inList) {
          processed.push('</ul>');
          inList = false;
        }
        processed.push(line);
      }
    }
    if (inList) processed.push('</ul>');

    return processed.join('\n')
      .replace(/\n\n+/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  function appendMessage(sender, text, sources = []) {
    const row = document.createElement('div');
    row.className = `message-row ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = `msg-avatar ${sender}`;
    if (sender === 'bot') {
      avatar.innerHTML = '<img src="/assets/logos/cosa-crest.svg" alt="CoSA Crest" width="20" height="20">';
    } else {
      avatar.textContent = 'You';
    }

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.innerHTML = formatMarkdown(text);

    if (sources && sources.length > 0) {
      const sourcesDiv = document.createElement('div');
      sourcesDiv.className = 'sources-container';
      sourcesDiv.innerHTML = `
        <div class="sources-heading">Brochure references:</div>
        <div class="sources-list">
          ${sources.map(s => `
            <span class="source-pill" title="${escapeHtml(s.title || 'Page ' + s.page)}">
              Page ${s.page}
            </span>
          `).join('')}
        </div>
      `;
      bubble.appendChild(sourcesDiv);
    }

    row.appendChild(avatar);
    row.appendChild(bubble);
    messagesContainer.appendChild(row);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return row;
  }

  function showTypingIndicator() {
    const row = document.createElement('div');
    row.className = 'typing-row';
    row.id = 'typing-indicator';
    row.innerHTML = `
      <div class="msg-avatar bot"><img src="/assets/logos/cosa-crest.svg" alt="CoSA Crest" width="20" height="20"></div>
      <div class="typing-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-label">Checking handbook...</span>
      </div>
    `;
    messagesContainer.appendChild(row);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }

  async function handleSend(query) {
    const userText = query.trim();
    if (!userText) return;

    appendMessage('user', userText);
    chatInput.value = '';
    chatInput.disabled = true;
    sendBtn.disabled = true;

    showTypingIndicator();

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });

      removeTypingIndicator();

      if (!response.ok) {
        throw new Error(`Server returned error ${response.status}`);
      }

      const data = await response.json();
      appendMessage('bot', data.reply || 'No response returned.', data.sources || []);

    } catch (err) {
      removeTypingIndicator();
      console.error(err);
      appendMessage('bot', '⚠️ Sorry, there was an issue processing your question. Please ensure the Flask server is running.');
    } finally {
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSend(chatInput.value);
  });

  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.getAttribute('data-query');
      if (query) {
        handleSend(query);
      }
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      messagesContainer.innerHTML = `
        <div class="message-row bot">
          <div class="msg-avatar bot">
            <img src="/assets/logos/cosa-crest.svg" alt="CoSA Crest" width="20" height="20" style="vertical-align: middle;">
          </div>
          <div class="chat-bubble">
            Conversation reset. Hey there! What would you like to know about councils, technical/cultural clubs, Meraz fest, or hostel &amp; sports facilities?
          </div>
        </div>
      `;
    });
  }
});
