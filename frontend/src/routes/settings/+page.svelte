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
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>`,
      title: 'Account Settings'
    },
    {
      id: 'notifications',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>`,
      title: 'Notifications'
    },
    {
      id: 'privacy',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
            </svg>`,
      title: 'Privacy & Security'
    },
    {
      id: 'preferences',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    background-color: #FAF9F6;
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 2rem 1.5rem 2rem;
    background-color: #FAF9F6;
  }

  .settings-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: -0.025em;
  }

  .save-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #6366F1;
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }

  .save-button:hover {
    background: #4F46E5;
    transform: translateY(-1px);
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
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    height: fit-content;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: none;
    background: transparent;
    color: #64748B;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    width: 100%;
    text-align: left;
  }

  .nav-item:hover {
    background: #F1F5F9;
    color: #1E293B;
  }

  .nav-item.active {
    background: #F1F5F9;
    color: #6366F1;
  }

  .nav-icon {
    width: 1.5rem;
    height: 1.5rem;
    stroke-width: 1.5;
  }

  .settings-panel {
    background: white;
    border-radius: 1.5rem;
    overflow-y: auto;
    padding: 2.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  /* Custom Scrollbar Styling */
  .settings-panel::-webkit-scrollbar {
    width: 4px;
  }

  .settings-panel::-webkit-scrollbar-track {
    background: transparent;
  }

  .settings-panel::-webkit-scrollbar-thumb {
    background-color: rgba(203, 213, 225, 0.4);
    border-radius: 20px;
  }

  .settings-panel::-webkit-scrollbar-thumb:hover {
    background-color: rgba(148, 163, 184, 0.5);
  }

  /* Firefox */
  .settings-panel {
    scrollbar-width: thin;
    scrollbar-color: rgba(203, 213, 225, 0.4) transparent;
  }

  .settings-panel h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1E293B;
    margin-bottom: 1.5rem;
  }

  .settings-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #F8FAFC;
    border-radius: 0.75rem;
    transition: background-color 0.2s ease-in-out;
  }

  .setting-item:hover {
    background: #F1F5F9;
  }

  .setting-item label {
    font-weight: 500;
    color: #334155;
  }

  .setting-item select {
    padding: 0.5rem 2rem 0.5rem 1rem;
    border: 2px solid #E2E8F0;
    border-radius: 0.5rem;
    background: white;
    color: #1E293B;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }

  .setting-item select:hover {
    border-color: #CBD5E0;
  }

  .setting-item select:focus {
    outline: none;
    border-color: #6366F1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .toggle {
    position: relative;
    display: inline-block;
    width: 3rem;
    height: 1.75rem;
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
    background-color: #E2E8F0;
    transition: 0.4s;
    border-radius: 1.75rem;
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
    background-color: #6366F1;
  }

  input:checked + .toggle-slider:before {
    transform: translateX(1.25rem);
  }

  @media (max-width: 768px) {
    .settings-header {
      padding: 1.5rem 1.5rem 1rem 1.5rem;
    }

    .settings-container {
      margin: 0 1.5rem;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .settings-nav {
      flex-direction: row;
      overflow-x: auto;
      padding: 0.75rem;
    }

    .nav-item {
      flex: 0 0 auto;
      padding: 0.75rem;
    }

    .nav-item span {
      display: none;
    }

    .settings-panel {
      padding: 1.5rem;
    }
  }
</style> 