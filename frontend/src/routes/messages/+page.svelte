<script lang="ts">
  import { browser } from '$app/environment';
  import { slide } from 'svelte/transition';

  let userStats = {
    posts: 46,
    followers: '2.8K',
    following: 200
  };

  let selectedChat = {
    name: 'Cody Fisher',
    avatar: '/test.jpg.jpg',
    online: true
  };

  let showContacts = true;
  let isMobile = false;

  // Check if we're on mobile and update layout accordingly
  if (browser) {
    const updateLayout = () => {
      isMobile = window.innerWidth <= 768;
      showContacts = !isMobile;
    };
    
    updateLayout();
    window.addEventListener('resize', updateLayout);
  }

  function toggleContacts() {
    showContacts = !showContacts;
  }

  let messages = [
    {
      text: "Oh, hello! All perfectly. I will check it and get back to you soon.",
      timestamp: "06:32 PM",
      isMe: false
    },
    {
      text: "Oh, hello! All perfectly. I will check it and get back to you soon",
      timestamp: "04:45 PM",
      isMe: true
    },
    {
      text: "Oh, hello! All perfectly. I will check it and get back to you soon",
      timestamp: "04:45 PM",
      isMe: true
    },
    {
      text: "Oh, hello! All perfectly. I will check it and get back to you soon",
      timestamp: "04:45 PM",
      isMe: true
    },
    {
      text: "Oh, hello! All perfectly. I will check it and get back to you soon",
      timestamp: "04:45 PM",
      isMe: true
    },{
      text: "Oh, hello! All perfectly. I will check it and get back to you soon",
      timestamp: "04:45 PM",
      isMe: false
    },{
      text: "Oh, hello! All perfectly. I will check it and get back to you soon",
      timestamp: "04:45 PM",
      isMe: true
    },
    {
      text: "Oh, hello! All perfectly. I will check it and get back to you soon",
      timestamp: "04:45 PM",
      isMe: false
    },
  ];

  let contacts = [
    {
      name: "Mariam Tipsy",
      avatar: "/test.jpg.jpg",
      lastMessage: "The products are shipped from...",
      time: "2m",
      unread: true
    },
    {
      name: "Cody Fisher",
      avatar: "/wrigglyLine2.png",
      lastMessage: "The products are shipped from...",
      time: "5m",
      unread: true
    },
    {
      name: "Esther Howard",
      avatar: "/test.jpg.jpg",
      lastMessage: "Have you gone through...",
      time: "10m",
      unread: false
    },
    {
      name: "Esther Howard",
      avatar: "/test.jpg.jpg",
      lastMessage: "Have you gone through...",
      time: "10m",
      unread: false
    },
    {
      name: "Esther Howard",
      avatar: "/test.jpg.jpg",
      lastMessage: "Have you gone through...",
      time: "10m",
      unread: false
    },
    {
      name: "Esther Howard",
      avatar: "/test.jpg.jpg",
      lastMessage: "Have you gone through...",
      time: "10m",
      unread: false
    },
    {
      name: "Esther Howard",
      avatar: "/test.jpg.jpg",
      lastMessage: "Have you gone through...",
      time: "10m",
      unread: false
    },
    {
      name: "Esther Howard",
      avatar: "/test.jpg.jpg",
      lastMessage: "Have you gone through...",
      time: "10m",
      unread: false
    },
    {
      name: "Esther Howard",
      avatar: "/test.jpg.jpg",
      lastMessage: "Have you gone through...",
      time: "10m",
      unread: false
    },
    {
      name: "Esther Howard",
      avatar: "/test.jpg.jpg",
      lastMessage: "Have you gone through...",
      time: "10m",
      unread: true
    }
    // Add more contacts as needed
  ];
</script>

<div class="messages-wrapper">
  <div class="chat-area" class:full-width={!showContacts}>
    <div class="chat-header">
      {#if isMobile}
        <button class="toggle-contacts" on:click={toggleContacts}>
          {#if showContacts}
            <!-- Close/X icon when contacts are shown -->
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          {:else}
            <!-- Back arrow when showing chat -->
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 19l-7-7 7-7"></path>
            </svg>
          {/if}
        </button>
      {/if}
      <div class="chat-user">
        <img src={selectedChat.avatar} alt={selectedChat.name} class="user-avatar" />
        <div class="user-info">
          <h2>{selectedChat.name}</h2>
          <span class="status">
            <span class="status-dot" class:online={selectedChat.online}></span>
            {selectedChat.online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      <div class="chat-actions">
        <button class="action-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
          </svg>
        </button>
        <button class="action-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"/>
          </svg>
        </button>
        <button class="action-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="chat-messages">
      {#each messages as message}
        <div class="message" class:sent={message.isMe} class:received={!message.isMe}>
          <div class="message-content">
            <p>{message.text}</p>
            <span class="message-time">{message.timestamp}</span>
          </div>
        </div>
      {/each}
    </div>

    <div class="chat-input">
      <button class="emoji-btn">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
        </svg>
      </button>
      <button class="attach-btn">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
          <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
        </svg>
      </button>
      <div class="input-wrapper">
        <textarea 
          placeholder="Type a message..." 
          rows="1"
          on:input={(e) => {
            const textarea = e.target as HTMLTextAreaElement;
            // Auto-expand the textarea
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
          }}
        ></textarea>
      </div>
      <button class="send-btn">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
  </div>

  {#if showContacts}
    <div class="chat-details" transition:slide={{duration: 200}}>
      <div class="contacts-header">
        <div class="contacts-header-top">
          <h2>Messages</h2>
          {#if isMobile}
            <button class="close-contacts" on:click={toggleContacts}>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          {/if}
        </div>
        <div class="search-container">
          <input type="text" placeholder="Search messages..." />
          <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </div>
      </div>

      <div class="contacts-scroll">
        {#each contacts as contact}
          <div class="contact-item" class:unread={contact.unread}>
            <img src={contact.avatar} alt={contact.name} class="contact-avatar" />
            <div class="contact-info">
              <div class="contact-header">
                <h3>{contact.name}</h3>
                <span class="contact-time">{contact.time}</span>
              </div>
              <p class="last-message">{contact.lastMessage}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .messages-wrapper {
    display: grid;
    grid-template-columns: 1fr 280px;
    overflow: hidden;
    position: fixed;
    top: 65px; /* Account for navbar height */
    left: 280px; /* Account for sidebar width */
    right: 0;
    bottom: 0;
    background-color: #faf9f6;
  }

  .chat-area {
    background-color: #faf9f6;
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    position: relative;
    transition: all 0.3s ease;
  }

  .chat-area.full-width {
    grid-column: 1 / -1;
  }

  .toggle-contacts {
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    color: #64748b;
    display: none;
  }

  .toggle-contacts:hover {
    color: #1e293b;
  }

  .toggle-contacts .icon {
    width: 24px;
    height: 24px;
    stroke-width: 2;
  }

  .chat-header {
    flex-shrink: 0;
    background-color: white;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chat-user {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }

  .user-info h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #e9edef;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #8696a0;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #2f3b43;
  }

  .status-dot.online {
    background-color: #00a884;
  }

  .chat-actions {
    display: flex;
    gap: 1rem;
  }

  .action-btn {
    background: none;
    border: none;
    color: #8696a0;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: #e9edef;
  }

  .action-btn .icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-height: 0; /* Important for Firefox */
  }

  .message {
    display: flex;
    max-width: 65%;
    box-sizing: border-box;
  }

  .message.sent {
    margin-left: auto;
  }

  .message.received {
    margin-right: auto;
  }

  .message-content {
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    background-color: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    width: 100%;
  }

  .sent .message-content {
    background-color: #4299e1;
    color: white;
  }

  .message-content p {
    margin: 0;
    line-height: 1.5;
  }

  .message-time {
    display: block;
    font-size: 0.75rem;
    color: #718096;
    margin-top: 0.25rem;
  }

  .sent .message-time {
    color: rgba(255, 255, 255, 0.8);
  }

  .chat-input {
    flex-shrink: 0;
    background-color: white;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    padding: 1rem;
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
    min-height: 62px;
  }

  .input-wrapper {
    flex: 1;
    min-height: 40px;
    max-height: 150px;
    display: flex;
    align-items: flex-end;
  }

  .chat-input textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 20px;
    font-size: 0.95rem;
    outline: none;
    resize: none;
    line-height: 1.4;
    max-height: 150px;
    min-height: 40px;
    font-family: inherit;
    background-color: white;
  }

  .chat-input textarea:focus {
    border-color: #4299e1;
  }

  .attach-btn,
  .emoji-btn,
  .send-btn {
    background: none;
    border: none;
    color: #718096;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
  }

  .attach-btn:hover,
  .emoji-btn:hover,
  .send-btn:hover {
    background-color: rgba(66, 153, 225, 0.1);
    color: #4299e1;
  }

  .attach-btn .icon,
  .emoji-btn .icon,
  .send-btn .icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .send-btn {
    background-color: #4299e1;
    color: white;
  }

  .send-btn:hover {
    background-color: #3182ce;
    color: white;
  }

  /* Custom Scrollbar Styling */
  .chat-messages::-webkit-scrollbar {
    width: 4px;
  }

  .chat-messages::-webkit-scrollbar-track {
    background: transparent;
  }

  .chat-messages::-webkit-scrollbar-thumb {
    background-color: rgba(203, 213, 225, 0.4);
    border-radius: 20px;
  }

  .chat-messages::-webkit-scrollbar-thumb:hover {
    background-color: rgba(148, 163, 184, 0.5);
  }

  /* Firefox */
  .chat-messages {
    scrollbar-width: thin;
    scrollbar-color: rgba(203, 213, 225, 0.4) transparent;
  }

  /* Contacts List Styles */
  .chat-details {
    background-color: white;
    border-left: 1px solid rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0; /* Important for Firefox */
  }

  .contacts-header {
    padding: 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    background: white;
  }

  .contacts-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
  }

  .search-container {
    position: relative;
  }

  .search-container input {
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 1rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 9999px;
    font-size: 0.95rem;
    outline: none;
    background-color: white;
  }

  .search-icon {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1.25rem;
    height: 1.25rem;
    color: #718096;
  }

  .contacts-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .contact-item {
    display: flex;
    gap: 1rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .contact-item:hover {
    background-color: #f7fafc;
  }

  .contact-item.unread {
    background-color: #ebf8ff;
  }

  .contact-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }

  .contact-info {
    flex: 1;
    min-width: 0;
  }

  .contact-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .contact-header h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #2d3748;
  }

  .contact-time {
    font-size: 0.75rem;
    color: #718096;
  }

  .last-message {
    margin: 0;
    font-size: 0.875rem;
    color: #718096;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .unread .last-message {
    color: #2d3748;
    font-weight: 500;
  }

  @media (max-width: 1024px) {
    .messages-wrapper {
      left: 0;
    }
  }

  @media (max-width: 768px) {
    .messages-wrapper {
      grid-template-columns: 1fr;
      top: 56px; /* Adjust for smaller mobile navbar */
    }

    .chat-details {
      position: fixed;
      top: 56px;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      z-index: 40;
    }

    .toggle-contacts {
      display: block;
    }

    .chat-header {
      padding: 0.75rem;
    }
  }

  .contacts-header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .close-contacts {
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-contacts:hover {
    color: #1e293b;
  }

  .close-contacts .icon {
    width: 20px;
    height: 20px;
  }

  .toggle-contacts .icon {
    width: 24px;
    height: 24px;
    stroke-width: 2;
  }

  /* Update existing styles */
  .contacts-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
  }
</style> 