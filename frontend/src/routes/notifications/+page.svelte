<script lang="ts">
  import { browser } from '$app/environment';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { formatDistanceToNow } from 'date-fns';

  interface Notification {
    id: number;
    user: {
      name: string;
      avatar: string;
      action: string;
    };
    timestamp: Date;
    type: 'follow' | 'comment' | 'reply';
    read: boolean;
    content?: string;
  }

  let notifications: Notification[] = [
    {
      id: 1,
      user: {
        name: 'Lex Murphy',
        avatar: '/test.jpg.jpg',
        action: 'Followed you'
      },
      timestamp: new Date(2024, 2, 20, 9, 42),
      type: 'follow',
      read: false
    },
    {
      id: 2,
      user: {
        name: 'Ray Arnold',
        avatar: '/wrigglyLine2.png',
        action: 'left 6 comments on your post'
      },
      timestamp: new Date(2024, 2, 19, 9, 42),
      type: 'comment',
      read: false
    },
    {
      id: 3,
      user: {
        name: 'Denise Nedry',
        avatar: '/test.jpg.jpg',
        action: 'replied to MBT CEO'
      },
      content: 'Oh, I finished de-bugging the phones, but the system\'s compiling for eighteen minutes, or twent...',
      timestamp: new Date(2024, 2, 19, 9, 42),
      type: 'reply',
      read: false
    }
  ];

  function markAllAsRead() {
    notifications = notifications.map(n => ({ ...n, read: true }));
  }

  function handleNotificationAction(notification: Notification) {
    if (notification.type === 'follow') {
      // Handle follow back or decline
    } else {
      // Navigate to the relevant post/comment
    }
  }
</script>

<div class="notifications-container">
  <Sidebar />
  
  <div class="notifications-content">
    <div class="notifications-header">
      <h1>Notifications</h1>
      <button class="mark-read-btn" on:click={markAllAsRead}>
        Mark all as read
      </button>
    </div>

    <div class="notifications-list">
      {#each notifications as notification (notification.id)}
        <div class="notification-card" class:read={notification.read}>
          <div class="notification-content">
            <img 
              src={notification.user.avatar} 
              alt={notification.user.name}
              class="user-avatar"
            />
            
            <div class="notification-details">
              <div class="notification-header">
                <div class="notification-text">
                  <p class="user-name">
                    {notification.user.name}
                    <span class="action-text">
                      {notification.user.action}
                    </span>
                  </p>
                  {#if notification.content}
                    <p class="content-text">
                      {notification.content}
                    </p>
                  {/if}
                  <p class="timestamp">
                    {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                  </p>
                </div>

                {#if !notification.read}
                  <div class="unread-indicator"></div>
                {/if}
              </div>

              {#if notification.type === 'follow'}
                <div class="action-buttons">
                  <button class="follow-btn">
                    Follow Back
                  </button>
                  <button class="decline-btn">
                    Decline
                  </button>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .notifications-container {
    display: flex;
    min-height: 100vh;
    background-color: #FAF9F6;
  }

  .notifications-content {
    flex: 1;
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .notifications-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .notifications-header h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .mark-read-btn {
    font-size: 0.875rem;
    color: #666;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
  }

  .mark-read-btn:hover {
    color: #1a1a1a;
  }

  .notifications-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .notification-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }

  .notification-card:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .notification-card.read {
    opacity: 0.7;
  }

  .notification-content {
    display: flex;
    gap: 1rem;
  }

  .user-avatar {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    object-fit: cover;
  }

  .notification-details {
    flex: 1;
  }

  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .notification-text {
    flex: 1;
  }

  .user-name {
    font-weight: 500;
    color: #1a1a1a;
    margin: 0;
  }

  .action-text {
    font-weight: normal;
    color: #666;
    margin-left: 0.25rem;
  }

  .content-text {
    color: #666;
    margin: 0.5rem 0;
    font-size: 0.875rem;
  }

  .timestamp {
    color: #999;
    font-size: 0.75rem;
    margin: 0.25rem 0 0 0;
  }

  .unread-indicator {
    width: 0.5rem;
    height: 0.5rem;
    background: #6366F1;
    border-radius: 50%;
    margin-left: 1rem;
    flex-shrink: 0;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .follow-btn, .decline-btn {
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
  }

  .follow-btn {
    background: #6366F1;
    color: white;
  }

  .follow-btn:hover {
    background: #4F46E5;
  }

  .decline-btn {
    background: #f1f1f1;
    color: #666;
  }

  .decline-btn:hover {
    background: #e5e5e5;
  }

  @media (max-width: 768px) {
    .notifications-content {
      padding: 1rem;
    }

    .notification-content {
      flex-direction: column;
    }

    .action-buttons {
      flex-direction: column;
    }
  }
</style>