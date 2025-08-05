<script lang="ts">
  import { browser } from '$app/environment';
  import { formatDistanceToNow } from 'date-fns';
  import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

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

<ProtectedRoute>
  <div class="notifications-container">

  
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
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
  }

  .notifications-content {
    flex: 1;
    padding: 2rem 4rem;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
  }

  .notifications-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
    padding: 1.5rem 0;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .notifications-header h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111;
  }

  .mark-read-btn {
    font-size: 0.875rem;
    color: #2563eb;
    background: none;
    border: 1px solid #2563eb;
    cursor: pointer;
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    transition: all 0.2s ease;
  }

  .mark-read-btn:hover {
    background: rgba(37, 99, 235, 0.08);
    transform: translateY(-1px);
  }

  .notifications-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .notification-card {
    background: #fff;
    border-radius: 1.5rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(37, 99, 235, 0.07);
    transition: all 0.2s ease;
  }

  .notification-card:hover {
    background: #f7f7fa;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(37, 99, 235, 0.12);
  }

  .notification-card.read {
    opacity: 0.7;
  }

  .notification-content {
    display: flex;
    gap: 1rem;
  }

  .user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e2e8f0;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.08);
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
    font-weight: 600;
    color: #111;
    margin: 0;
    font-size: 1.1rem;
  }

  .action-text {
    font-weight: normal;
    color: #64748b;
    margin-left: 0.25rem;
  }

  .content-text {
    color: #64748b;
    margin: 0.5rem 0;
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .timestamp {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0.25rem 0 0 0;
  }

  .unread-indicator {
    width: 0.5rem;
    height: 0.5rem;
    background: #2563eb;
    border-radius: 50%;
    margin-left: 1rem;
    flex-shrink: 0;
  }

  .action-buttons {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .follow-btn {
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    background: linear-gradient(135deg, #0EA5E9, #7C3AED);
    border: none;
    color: white;
  }

  .follow-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(37,99,235,0.12);
  }

  .decline-btn {
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    background: none;
    border: 1px solid #e2e8f0;
    color: #64748b;
  }

  .decline-btn:hover {
    background: #f7f7fa;
    color: #111;
  }

  @media (max-width: 768px) {
    .notifications-content {
      padding: 1rem;
    }

    .notifications-header {
      padding: 1rem 0;
    }

    .notification-card {
      padding: 1rem;
      border-radius: 1rem;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
    }

    .user-name {
      font-size: 0.95rem;
    }

    .content-text {
      font-size: 0.875rem;
    }
  }
</style>
</ProtectedRoute>