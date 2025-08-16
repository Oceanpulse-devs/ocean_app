<script lang="ts">
  import { browser } from '$app/environment';
  import { slide } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
  import { 
    getConversations, 
    getConversation,
    getMessages, 
    sendMessage, 
    createConversation,
    searchUsers,
    getRecentContacts,
    getMessagingToken
  } from '$lib/api/messaging';
  import { authStore } from '$lib/stores/auth';
  import { io } from 'socket.io-client';

  // Real data structures
  let conversations: any[] = [];
  let selectedConversation: any = null;
  let messages: any[] = [];
  let loading = true;
  let error: string | null = null;
  let searchQuery = '';
  let searchResults: any[] = [];
  let showSearchResults = false;
  let messageInput = '';
  let sendingMessage = false;
  let contacts: any[] = [];
  let refreshInterval: any = null;

  // UI state
  let showContacts = true;
  let isMobile = false;
  let selectedChat = {
    name: 'Select a conversation',
    avatar: '/wriggly2.png',
    online: false
  };

  // Socket.IO connection
  let socket: any = null;

  // Subscribe to auth store changes
  let currentUser: any = null;
  let hasInitialized = false;
  
  // Wait for user to be available before doing anything
  authStore.subscribe((state) => {
    console.log('🔍 Auth store state:', state);
    
    if (state.user && state.user.id) {
      currentUser = state.user;
      console.log('✅ User authenticated:', currentUser.id);
      
      if (!hasInitialized) {
        console.log('🚀 Initializing messaging system...');
        hasInitialized = true;
        
        // Load conversations first
        loadConversations().then(() => {
          console.log('📋 Conversations loaded, setting up socket...');
          setupSocketConnection();
          startPeriodicRefresh();
        }).catch(err => {
          console.error('❌ Failed to load conversations:', err);
        });
      }
    } else {
      console.log('⏳ Waiting for user authentication...');
      currentUser = null;
      hasInitialized = false;
      
      // Clear everything when no user
      conversations = [];
      contacts = [];
      selectedConversation = null;
      messages = [];
      stopPeriodicRefresh();
    }
  });
  
  // Add a timeout to prevent infinite loading
  setTimeout(() => {
    if (loading && !currentUser?.id) {
      console.log('⏰ Loading timeout - forcing loading to false');
      loading = false;
      error = 'Loading timeout. Please check your authentication and try again.';
    }
  }, 10000); // 10 second timeout

  // Setup Socket.IO connection for real-time messaging
  async function setupSocketConnection() {
    if (!browser) return;
    
    // Wait for user to be available
    if (!currentUser?.id) {
      console.log('Waiting for user to be available...');
      return;
    }
    
    try {
      // Get JWT token for authentication
      const token = await getMessagingToken();
      if (!token) {
        console.error('No messaging token available');
        return;
      }
      
      // Connect to messaging server
      socket = io('http://localhost:5001', {
        auth: {
          token: token
        }
      });

      // Handle connection events
      socket.on('connect', () => {
        console.log('🔌 Connected to messaging server');
        
        // Join user's personal room
        if (currentUser?.id) {
          socket.emit('join', { userId: currentUser.id });
        }
      });

      socket.on('disconnect', () => {
        console.log('🔌 Disconnected from messaging server');
      });

      // Handle incoming messages
      socket.on('newMessage', (messageData: any) => {
        console.log('📨 New message received:', messageData);
        
        // If this message is for the currently selected conversation
        if (selectedConversation && messageData.conversationId === selectedConversation.id) {
          // Add message to local state
          const newMessage = {
            id: messageData.id,
            text: messageData.content,
            timestamp: formatTime(messageData.createdAt),
            isMe: false, // This is from another user
            sender: messageData.sender
          };
          
          messages = [...messages, newMessage];
        }
        
        // Refresh conversations list to update last message
        loadConversations();
      });

      socket.on('error', (error: any) => {
        console.error('Socket error:', error);
      });

    } catch (error) {
      console.error('Error setting up socket connection:', error);
    }
  }

      // Set up periodic refresh to keep conversations up-to-date
  
  function startPeriodicRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    
    // Refresh conversations every 30 seconds to prevent stale data
    refreshInterval = setInterval(() => {
      if (currentUser?.id && !loading) {
        console.log('🔄 Periodic refresh of conversations...');
        loadConversations();
      }
    }, 30000); // 30 seconds
  }

  function stopPeriodicRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

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

  // Load conversations on mount
  onMount(() => {
    // Check if there's a conversation parameter in the URL
    const conversationId = $page.url.searchParams.get('conversation');
    if (conversationId && currentUser?.id) {
      // Find the conversation and select it
      let conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        selectConversation(conversation);
      } else {
        // If conversation not found in list, try to get it directly
        getConversation(conversationId).then(response => {
          conversation = response.conversation;
          if (conversation) {
            // Add to conversations list
            conversations = [conversation, ...conversations];
            selectConversation(conversation);
          }
        }).catch(err => {
          console.error('Error loading conversation:', err);
        });
      }
    }
    
    // Cleanup function
    return () => {
      if (socket) {
        socket.disconnect();
        console.log('🔌 Socket disconnected');
      }
      stopPeriodicRefresh();
    };
  });

  // Load conversations
  async function loadConversations() {
    try {
      // Prevent multiple simultaneous loads
      if (loading) {
        console.log('⏳ Already loading conversations, skipping...');
        return;
      }
      
      // Ensure user is available
      if (!currentUser?.id) {
        console.log('⏳ No user available, skipping conversation load');
        return;
      }
      
      loading = true;
      error = null;
      
      console.log('🔄 Loading conversations for user:', currentUser.id);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });
      
      const response = await Promise.race([
        getConversations({ limit: 50 }),
        timeoutPromise
      ]);
      
      conversations = response.conversations || [];
      console.log('📋 Loaded conversations:', conversations.length);
      
      // Update contacts list with real conversation data
      const contactsData = conversations.map(conv => {
        const otherParticipant = conv.participants?.find((p: any) => p.userId !== currentUser?.id);
        const contactData = {
          id: conv.id,
          name: otherParticipant?.user?.fullName || 'Unknown User',
          avatar: otherParticipant?.user?.profilePicture || '/wrigglyLine2.png',
          lastMessage: conv.lastMessage?.content || 'No messages yet',
          time: formatTime(conv.lastMessageAt || conv.createdAt),
          unread: conv.unreadCount > 0,
          conversation: conv
        };
        console.log('👤 Contact data:', contactData);
        return contactData;
      });
      
      // Set contacts to the mapped data
      contacts = contactsData;
      console.log('✅ Contacts updated:', contacts.length);
      
    } catch (err) {
      console.error('❌ Error loading conversations:', err);
      error = err instanceof Error ? err.message : 'Failed to load conversations';
      
      // Set a reasonable timeout to prevent infinite loading
      setTimeout(() => {
        if (loading) {
          console.log('⏰ Force timeout - setting loading to false');
          loading = false;
        }
      }, 5000);
    } finally {
      loading = false;
    }
  }

  // Force refresh conversations (clears cache and reloads)
  async function forceRefreshConversations() {
    console.log('🔄 Force refreshing conversations...');
    // Clear current data
    conversations = [];
    contacts = [];
    // Reload
    await loadConversations();
  }

  // Load messages for a conversation
  async function loadMessages(conversationId: string) {
    try {
      const response = await getMessages(conversationId, { limit: 50 });
      messages = response.messages || [];
      
      // Format messages for display
      messages = messages.map(msg => {
        const isMe = msg.senderId === currentUser?.id;
        console.log('Message formatting:', {
          messageId: msg.id,
          senderId: msg.senderId,
          currentUserId: currentUser?.id,
          isMe: isMe,
          content: msg.content
        });
        
        return {
          id: msg.id,
          text: msg.content,
          timestamp: formatTime(msg.createdAt),
          isMe: isMe,
          sender: msg.sender
        };
      });
      
    } catch (err) {
      console.error('Error loading messages:', err);
      error = 'Failed to load messages';
    }
  }

  // Send a message
  async function sendNewMessage() {
    if (!selectedConversation || !messageInput.trim() || sendingMessage) return;
    
    try {
      sendingMessage = true;
      
      const response = await sendMessage(selectedConversation.id, {
        type: 'text',
        content: messageInput.trim()
      });
      
      // Add new message to local state
      const newMessage = {
        id: response.id,
        text: messageInput.trim(),
        timestamp: formatTime(new Date().toISOString()),
        isMe: true,
        sender: currentUser
      };
      
      messages = [...messages, newMessage];
      
      // Clear input
      messageInput = '';
      
      // Emit message through Socket.IO for real-time delivery
      if (socket) {
        socket.emit('sendMessage', {
          conversationId: selectedConversation.id,
          message: newMessage
        });
      }
      
      // Update conversation last message
      await loadConversations();
      
    } catch (err) {
      console.error('Error sending message:', err);
      error = 'Failed to send message';
    } finally {
      sendingMessage = false;
    }
  }

  // Select a conversation
  async function selectConversation(conversation: any) {
    selectedConversation = conversation;
    selectedChat = {
              name: conversation.participants?.find((p: any) => p.userId !== currentUser?.id)?.user?.fullName || 'Unknown User',
        avatar: conversation.participants?.find((p: any) => p.userId !== currentUser?.id)?.user?.profilePicture || '/wrigglyLine2.png',
      online: true // TODO: Implement online status
    };
    
    await loadMessages(conversation.id);
    
    if (isMobile) {
      showContacts = false;
    }
  }

  // Search users
  async function searchUsersForChat(query: string) {
    if (!query.trim()) {
      searchResults = [];
      showSearchResults = false;
      return;
    }
    
    try {
      const response = await searchUsers(searchQuery);
      searchResults = response.users || [];
      showSearchResults = true;
    } catch (err) {
      console.error('Error searching users:', err);
      searchResults = [];
    }
  }

  // Create new conversation
  async function startNewConversation(userId: string) {
    try {
      const response = await createConversation({
        type: 'direct',
        participants: [userId]
      });
      
      // Add to conversations list
      await loadConversations();
      
      // Select the new conversation
      const newConversation = response;
      await selectConversation(newConversation);
      
      // Hide search results
      showSearchResults = false;
      searchQuery = '';
      
    } catch (err) {
      console.error('Error creating conversation:', err);
      error = 'Failed to create conversation';
    }
  }

  // Format time for display
  function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  }

  // Handle enter key in message input
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendNewMessage();
    }
  }

  // Sample contacts for now (will be replaced by real data)
</script>

<ProtectedRoute>
  <div class="messages-wrapper">
    <div class="chat-area" class:full-width={!showContacts}>
    <div class="chat-header">
      {#if isMobile}
        <button class="toggle-contacts" on:click={toggleContacts}>
          {#if showContacts}
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          {:else}
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
          <button class="action-btn" title="Voice Call">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
          </svg>
        </button>
          <button class="action-btn" title="Video Call">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"/>
          </svg>
        </button>
          <button class="action-btn" title="More Options">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
      </div>
    </div>

      {#if !selectedConversation}
        <div class="no-conversation">
          <div class="no-conversation-icon">💬</div>
          <h3>Select a conversation</h3>
          <p>Choose a conversation from the list to start messaging</p>
        </div>
      {:else}
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
          <button class="emoji-btn" title="Add emoji">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
        </svg>
      </button>
          <button class="attach-btn" title="Attach file">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
          <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
        </svg>
      </button>
      <div class="input-wrapper">
        <textarea 
              bind:value={messageInput}
          placeholder="Type a message..." 
          rows="1"
              on:keypress={handleKeyPress}
          on:input={(e) => {
            const textarea = e.target as HTMLTextAreaElement;
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
          }}
        ></textarea>
      </div>
          <button 
            class="send-btn" 
            on:click={sendNewMessage}
            disabled={!messageInput.trim() || sendingMessage}
            title="Send message"
          >
            {#if sendingMessage}
              <div class="spinner-small"></div>
            {:else}
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
            {/if}
      </button>
    </div>
      {/if}
  </div>

  {#if showContacts}
    <div class="chat-details" transition:slide={{duration: 200}}>
    <div class="contacts-header">
        <div class="contacts-header-top">
          <h2>Messages</h2>
          <div class="header-actions">
            <button class="refresh-btn" on:click={forceRefreshConversations} title="Refresh conversations">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 4v6h6M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
            </button>
            <button class="debug-btn" on:click={() => console.log('Debug - Current state:', { currentUser: currentUser?.id, loading, error, conversations: conversations.length, contacts: contacts.length })} title="Debug info">
              🐛
            </button>
          {#if isMobile}
            <button class="close-contacts" on:click={toggleContacts}>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          {/if}
        </div>
        </div>
          
      <div class="search-container">
            <input 
              type="text" 
              placeholder="Search users..." 
              bind:value={searchQuery}
              on:input={() => searchUsersForChat(searchQuery)}
            />
        <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
      </div>

          {#if showSearchResults && searchResults.length > 0}
            <div class="search-results">
              {#each searchResults as user}
                <div class="search-result-item" on:click={() => startNewConversation(user.id)}>
                  <img src={user.profilePicture || '/wrigglyLine2.png'} alt={user.fullName} class="search-result-avatar" />
                  <div class="search-result-info">
                    <h4>{user.fullName}</h4>
                    <p>@{user.username}</p>
                  </div>
                  <button class="start-chat-btn">Start Chat</button>
                </div>
              {/each}
            </div>
          {/if}
    </div>

        {#if loading}
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading conversations...</p>
          </div>
        {:else if error}
          <div class="error-state">
            <p><strong>Error:</strong> {error}</p>
            <div class="debug-info">
              <p><strong>Debug Info:</strong></p>
              <p>User: {currentUser?.id ? 'Authenticated' : 'Not authenticated'}</p>
              <p>Loading: {loading}</p>
              <p>Conversations: {conversations.length}</p>
              <p>Contacts: {contacts.length}</p>
            </div>
            <button class="retry-btn" on:click={loadConversations}>Try Again</button>
            <button class="retry-btn" on:click={forceRefreshConversations}>Force Refresh</button>
          </div>
        {:else if contacts.length === 0}
          <div class="empty-state">
            <div class="empty-icon">💬</div>
            <h3>No conversations yet</h3>
            <p>Search for users to start chatting</p>
          </div>
        {:else}
    <div class="contacts-scroll">
      {#each contacts as contact}
              <div 
                class="contact-item" 
                class:unread={contact.unread}
                class:selected={selectedConversation?.id === contact.id}
                on:click={() => selectConversation(contact.conversation)}
              >
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
        {/if}
    </div>
  {/if}
</div>
</ProtectedRoute>

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
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
  }

  .chat-area {
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
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
    color: #1f2937;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #9ca3af;
  }

  .status-dot.online {
    background-color: #10b981;
  }

  .chat-actions {
    display: flex;
    gap: 1rem;
  }

  .action-btn {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background-color: #f3f4f6;
    color: #374151;
  }

  .action-btn .icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .no-conversation {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #6b7280;
    padding: 2rem;
  }

  .no-conversation-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .no-conversation h3 {
    margin: 0 0 0.5rem 0;
    color: #374151;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-height: 0;
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
    background-color: #3b82f6;
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
    border-color: #3b82f6;
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
  .send-btn:hover:not(:disabled) {
    background-color: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  .attach-btn .icon,
  .emoji-btn .icon,
  .send-btn .icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .send-btn {
    background-color: #3b82f6;
    color: white;
  }

  .send-btn:hover:not(:disabled) {
    background-color: #2563eb;
    color: white;
  }

  .send-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner-small {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
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
    min-height: 0;
  }

  .contacts-header {
    padding: 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    background: white;
  }

  .contacts-header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .refresh-btn, .debug-btn {
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.375rem;
    transition: all 0.2s ease;
    margin-right: 0.5rem;
  }

  .refresh-btn:hover, .debug-btn:hover {
    color: #1e293b;
    background-color: rgba(0, 0, 0, 0.05);
  }

  .refresh-btn .icon {
    width: 18px;
    height: 18px;
  }
  
  .debug-btn {
    font-size: 1rem;
  }

  .contacts-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
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

  .search-results {
    margin-top: 1rem;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    padding-top: 1rem;
  }

  .search-result-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .search-result-item:hover {
    background-color: #f7fafc;
  }

  .search-result-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }

  .search-result-info {
    flex: 1;
  }

  .search-result-info h4 {
    margin: 0 0 0.25rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #2d3748;
  }

  .search-result-info p {
    margin: 0;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .start-chat-btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .start-chat-btn:hover {
    background: #2563eb;
  }

  .loading-state,
  .error-state,
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #6b7280;
  }

  .spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid #f3f4f6;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  .retry-btn {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .retry-btn:hover {
    background: #2563eb;
  }
  
  .debug-info {
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 1rem;
    margin: 1rem 0;
    text-align: left;
    font-family: monospace;
    font-size: 0.875rem;
  }
  
  .debug-info p {
    margin: 0.25rem 0;
    color: #4a5568;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    display: block;
  }

  .empty-state h3 {
    color: #374151;
    margin: 0 0 0.5rem 0;
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

  .contact-item.selected {
    background-color: #dbeafe;
    border: 1px solid #3b82f6;
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
    color: #6b7280;
  }

  .last-message {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
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
      top: 56px;
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
</style>