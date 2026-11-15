document.addEventListener('DOMContentLoaded', () => {
  const messages_box = document.getElementById('chat-messages');
  const chat_form = document.getElementById('chat-form');
  const chat_input = document.getElementById('chat-input');
  const send_btn = document.getElementById('chat-send');
  const clear_btn = document.getElementById('clear-chat-btn');

  function escape_html(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function format_markdown(text) {
    if (!text) return '';
    let html = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    const lines = html.split('\n');
    let in_list = false;
    const processed = [];

    for (let line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || (trimmed.startsWith('* ') && !trimmed.endsWith('*'))) {
        if (!in_list) {
          processed.push('<ul>');
          in_list = true;
        }
        processed.push(`<li>${trimmed.substring(2)}</li>`);
      } else {
        if (in_list) {
          processed.push('</ul>');
          in_list = false;
        }
        processed.push(line);
      }
    }
    if (in_list) processed.push('</ul>');

    return processed.join('\n')
      .replace(/\n\n+/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  function append_message(sender, text, sources = []) {
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
    bubble.innerHTML = format_markdown(text);

    if (sources && sources.length > 0) {
      const sources_wrap = document.createElement('div');
      sources_wrap.className = 'sources-container';
      sources_wrap.innerHTML = `
        <div class="sources-heading">Brochure references:</div>
        <div class="sources-list">
          ${sources.map(s => `
            <span class="source-pill" title="${escape_html(s.title || 'Page ' + s.page)}">
              Page ${s.page}
            </span>
          `).join('')}
        </div>
      `;
      bubble.appendChild(sources_wrap);
    }

    row.appendChild(avatar);
    row.appendChild(bubble);
    messages_box.appendChild(row);
    messages_box.scrollTop = messages_box.scrollHeight;
    return row;
  }

  function show_typing_indicator() {
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
    messages_box.appendChild(row);
    messages_box.scrollTop = messages_box.scrollHeight;
  }

  function remove_typing_indicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }

  async function handle_send(query) {
    const user_query = query.trim();
    if (!user_query) return;

    append_message('user', user_query);
    chat_input.value = '';
    chat_input.disabled = true;
    send_btn.disabled = true;

    show_typing_indicator();

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: user_query })
      });

      remove_typing_indicator();

      if (!response.ok) {
        throw new Error(`Server returned error ${response.status}`);
      }

      const res_data = await response.json();
      append_message('bot', res_data.reply || 'No response returned.', res_data.sources || []);

    } catch (err) {
      remove_typing_indicator();
      console.error(err);
      append_message('bot', '⚠️ Sorry, there was an issue processing your question. Please ensure the Flask server is running.');
    } finally {
      chat_input.disabled = false;
      send_btn.disabled = false;
      chat_input.focus();
    }
  }

  chat_form.addEventListener('submit', (e) => {
    e.preventDefault();
    handle_send(chat_input.value);
  });

  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.getAttribute('data-query');
      if (query) {
        handle_send(query);
      }
    });
  });

  if (clear_btn) {
    clear_btn.addEventListener('click', () => {
      messages_box.innerHTML = `
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
