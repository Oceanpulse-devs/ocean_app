<script lang="ts">
  // Settings state
  let notificationsEnabled = true;
  let emailNotifications = true;
  let darkMode = false;
  let language = 'english';
  let currency = 'USD';
  let privacyProfile = 'public';
  let twoFactorEnabled = false;
  let autoSaveEnabled = true;
  let newsletterEnabled = true;

  // Handle form submission
  function saveSettings() {
    // TODO: Implement settings save logic
    alert('Settings saved successfully!');
  }

  // Settings sections
  const settingsSections = [
    {
      id: 'account',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="settings-nav-icon" width="20" height="20" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>`,
      title: 'Account Settings'
    },
    {
      id: 'notifications',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="settings-nav-icon" width="20" height="20" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>`,
      title: 'Notifications'
    },
    {
      id: 'privacy',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="settings-nav-icon" width="20" height="20" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
            </svg>`,
      title: 'Privacy & Security'
    },
    {
      id: 'preferences',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="settings-nav-icon" width="20" height="20" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>`,
      title: 'Preferences'
    }
  ];

  let activeSection = 'account';
</script>

<div class="settings-content">
    <div class="settings-header">
      <h1>Settings</h1>
      <button class="save-button" on:click={saveSettings}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Save Changes
      </button>
    </div>

  <div class="settings-container">
      <nav class="settings-nav">
        {#each settingsSections as section}
          <button
            class="nav-item"
            class:active={activeSection === section.id}
            on:click={() => activeSection = section.id}
          >
            {@html section.icon}
          <span>{section.title}</span>
          </button>
        {/each}
      </nav>

      <div class="settings-panel">
        {#if activeSection === 'account'}
          <section>
            <h2>Account Settings</h2>
            <div class="settings-group">
              <div class="setting-item">
                <label for="language">Language</label>
                <select id="language" bind:value={language}>
                  <option value="english">English</option>
                  <option value="french">French</option>
                  <option value="spanish">Spanish</option>
                </select>
              </div>
              
              <div class="setting-item">
                <label for="currency">Currency</label>
                <select id="currency" bind:value={currency}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div class="setting-item">
                <label>Auto-save Drafts</label>
                <label class="toggle">
                  <input type="checkbox" bind:checked={autoSaveEnabled}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </section>
        {/if}

        {#if activeSection === 'notifications'}
          <section>
            <h2>Notification Preferences</h2>
            <div class="settings-group">
              <div class="setting-item">
                <label>Push Notifications</label>
                <label class="toggle">
                  <input type="checkbox" bind:checked={notificationsEnabled}>
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <label>Email Notifications</label>
                <label class="toggle">
                  <input type="checkbox" bind:checked={emailNotifications}>
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <label>Newsletter</label>
                <label class="toggle">
                  <input type="checkbox" bind:checked={newsletterEnabled}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </section>
        {/if}

        {#if activeSection === 'privacy'}
          <section>
            <h2>Privacy & Security</h2>
            <div class="settings-group">
              <div class="setting-item">
                <label for="privacy">Profile Privacy</label>
                <select id="privacy" bind:value={privacyProfile}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="friends">Friends Only</option>
                </select>
              </div>

              <div class="setting-item">
                <label>Two-Factor Authentication</label>
                <label class="toggle">
                  <input type="checkbox" bind:checked={twoFactorEnabled}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </section>
        {/if}

        {#if activeSection === 'preferences'}
          <section>
            <h2>Display Preferences</h2>
            <div class="settings-group">
              <div class="setting-item">
                <label>Dark Mode</label>
                <label class="toggle">
                  <input type="checkbox" bind:checked={darkMode}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </section>
        {/if}
      </div>
    </div>
</div>

<style>
  .settings-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
    overflow-y: auto;
    padding-top: 88px; /* 72px navbar + 16px gap */
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 2rem 1.5rem 2rem;
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
    position: sticky;
    top: 88px;
    z-index: 10;
  }

  .settings-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #111;
    letter-spacing: -0.025em;
  }

  .save-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #0EA5E9, #7C3AED);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }

  .save-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(37,99,235,0.12);
  }

  .save-button svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .settings-container {
    flex: 1;
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 2rem;
    margin: 0 2rem;
    min-height: 0;
  }

  .settings-nav {
    background: #fff;
    border-radius: 1.5rem;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    height: fit-content;
    box-shadow: 0 1px 3px rgba(37, 99, 235, 0.07);
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    color: #64748b;
    font-size: 0.95rem;
    cursor: pointer;
    border-radius: 0.75rem;
    transition: all 0.2s;
  }

  .nav-item:hover {
    background: #f7f7fa;
    color: #111;
  }

  .nav-item.active {
    background: #111;
    color: #fff;
  }

  .settings-nav-icon {
    width: 20px;
    height: 20px;
    stroke-width: 2;
  }

  .settings-panel {
    background: #fff;
    border-radius: 1.5rem;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(37, 99, 235, 0.07);
  }

  .settings-panel h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111;
    margin: 0 0 1.5rem 0;
  }

  .settings-group {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f7f7fa;
    border-radius: 1rem;
    transition: all 0.2s;
  }

  .setting-item:hover {
    background: #f1f5f9;
  }

  .setting-item label {
    font-size: 0.95rem;
    color: #111;
    font-weight: 500;
  }

  .setting-item select {
    padding: 0.5rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    background: #fff;
    color: #111;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .setting-item select:hover {
    border-color: #cbd5e1;
  }

  .setting-item select:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
  }

  .toggle {
    position: relative;
    display: inline-block;
    width: 3rem;
    height: 1.5rem;
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #e2e8f0;
    transition: .4s;
    border-radius: 1.5rem;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 1.25rem;
    width: 1.25rem;
    left: 0.25rem;
    bottom: 0.25rem;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }

  input:checked + .toggle-slider {
    background: linear-gradient(135deg, #0EA5E9, #7C3AED);
  }

  input:checked + .toggle-slider:before {
    transform: translateX(1.25rem);
  }

  @media (max-width: 768px) {
    .settings-content {
      padding-top: 64px; /* 56px navbar + 8px gap for mobile */
      height: calc(100vh - 64px);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    .settings-header {
      padding: 1rem;
      position: fixed;
      top: 64px;
      left: 0;
      right: 0;
      z-index: 20;
      background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
      border-bottom: 1px solid rgba(37, 99, 235, 0.1);
    }

    .settings-header h1 {
      font-size: 1.5rem;
    }

    .save-button {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .save-button svg {
      width: 1rem;
      height: 1rem;
    }

    .settings-container {
      grid-template-columns: 1fr;
      margin: 0;
      gap: 0;
      padding: 0;
      padding-top: 56px; /* Height of the settings header */
    }

    .settings-nav {
      position: sticky;
      top: 120px; /* 64px navbar + 56px header */
      z-index: 10;
      border-radius: 0;
      padding: 0.5rem 1rem;
      box-shadow: none;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      flex-direction: row;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      -ms-overflow-style: none;
      gap: 0.5rem;
    }

    .settings-nav::-webkit-scrollbar {
      display: none;
    }

    .nav-item {
      flex: 0 0 auto;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      white-space: nowrap;
      font-size: 0.875rem;
      background: #f7f7fa;
      border: 1px solid transparent;
    }

    .nav-item svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .nav-item.active {
      background: #111;
      color: #fff;
      border-color: #111;
    }

    .settings-panel {
      border-radius: 0;
      padding: 1rem;
      box-shadow: none;
      background: transparent;
    }

    .settings-panel h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      padding: 0 0.5rem;
    }

    .settings-group {
      gap: 1rem;
      padding: 0 0.5rem;
    }

    .setting-item {
      padding: 1rem;
      border-radius: 1rem;
      background: #fff;
      box-shadow: 0 1px 3px rgba(37, 99, 235, 0.07);
      margin: 0 0.5rem;
    }

    .setting-item label {
      font-size: 0.875rem;
    }

    .setting-item select {
      padding: 0.5rem 2rem 0.5rem 1rem;
      font-size: 0.875rem;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.5rem center;
      background-size: 1.25rem;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
    }

    .toggle {
      width: 2.5rem;
      height: 1.25rem;
    }

    .toggle-slider:before {
      height: 1rem;
      width: 1rem;
      left: 0.25rem;
      bottom: 0.25rem;
    }

    input:checked + .toggle-slider:before {
      transform: translateX(1rem);
    }
  }

  /* Small mobile devices */
  @media (max-width: 380px) {
    .settings-header {
      padding: 0.75rem;
    }

    .settings-header h1 {
      font-size: 1.25rem;
    }

    .save-button {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }

    .settings-nav {
      padding: 0.5rem;
      gap: 0.25rem;
    }

    .nav-item {
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
    }

    .nav-item svg {
      width: 1rem;
      height: 1rem;
    }

    .settings-panel {
      padding: 0.75rem;
    }

    .settings-panel h2 {
      font-size: 1.125rem;
      padding: 0 0.25rem;
    }

    .settings-group {
      padding: 0 0.25rem;
    }

    .setting-item {
      padding: 0.75rem;
      margin: 0 0.25rem;
    }

    .setting-item label {
      font-size: 0.75rem;
    }

    .setting-item select {
      padding: 0.375rem 1.5rem 0.375rem 0.75rem;
      font-size: 0.75rem;
    }
  }
</style> 