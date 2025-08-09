<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { updateProfile } from '$lib/api/auth';
  
  export let isOpen = false;
  export let userData: any = null;
  
  const dispatch = createEventDispatcher();
  
  let loading = false;
  let error = '';
  let success = '';
  
  // Form data
  let formData = {
    fullName: '',
    bio: '',
    location: '',
    website: '',
    profilePicture: '',
    coverPicture: ''
  };
  
  // Initialize form data when modal opens
  $: if (isOpen && userData) {
    formData = {
      fullName: userData.fullName || '',
      bio: userData.bio || '',
      location: userData.location || '',
      website: userData.website || '',
      profilePicture: userData.profilePicture || '',
      coverPicture: userData.coverPicture || ''
    };
  }
  
  async function handleSubmit() {
    try {
      loading = true;
      error = '';
      success = '';
      
      const response = await updateProfile(formData);
      
      if (response.ok) {
        const data = await response.json();
        success = 'Profile updated successfully!';
        
        // Dispatch event to parent to update user data
        dispatch('profileUpdated', data.profileInfo);
        
        // Close modal after a short delay
        setTimeout(() => {
          isOpen = false;
          success = '';
        }, 1500);
      } else {
        const errorData = await response.json();
        error = errorData.message || 'Failed to update profile';
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      error = 'Failed to update profile';
    } finally {
      loading = false;
    }
  }
  
  function closeModal() {
    isOpen = false;
    error = '';
    success = '';
  }
</script>

{#if isOpen}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Edit Profile</h2>
        <button class="close-button" on:click={closeModal}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <form on:submit|preventDefault={handleSubmit} class="edit-form">
        {#if error}
          <div class="error-message">{error}</div>
        {/if}
        
        {#if success}
          <div class="success-message">{success}</div>
        {/if}
        
        <div class="form-group">
          <label for="fullName">Full Name</label>
          <input 
            type="text" 
            id="fullName" 
            bind:value={formData.fullName}
            placeholder="Enter your full name"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="bio">Bio</label>
          <textarea 
            id="bio" 
            bind:value={formData.bio}
            placeholder="Tell us about yourself..."
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="location">Location</label>
          <input 
            type="text" 
            id="location" 
            bind:value={formData.location}
            placeholder="Enter your location"
          />
        </div>
        
        <div class="form-group">
          <label for="website">Website</label>
          <input 
            type="url" 
            id="website" 
            bind:value={formData.website}
            placeholder="https://your-website.com"
          />
        </div>
        
        <div class="form-group">
          <label for="profilePicture">Profile Picture URL</label>
          <input 
            type="url" 
            id="profilePicture" 
            bind:value={formData.profilePicture}
            placeholder="https://example.com/profile.jpg"
          />
        </div>
        
        <div class="form-group">
          <label for="coverPicture">Cover Picture URL</label>
          <input 
            type="url" 
            id="coverPicture" 
            bind:value={formData.coverPicture}
            placeholder="https://example.com/cover.jpg"
          />
        </div>
        
        <div class="form-actions">
          <button type="button" class="cancel-button" on:click={closeModal}>
            Cancel
          </button>
          <button type="submit" class="save-button" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .modal-content {
    background: white;
    border-radius: 1rem;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a202c;
  }
  
  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.5rem;
    color: #64748b;
    transition: all 0.2s ease;
  }
  
  .close-button:hover {
    background: #f1f5f9;
    color: #1a202c;
  }
  
  .close-button svg {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .edit-form {
    padding: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }
  
  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    transition: border-color 0.2s ease;
  }
  
  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .form-group textarea {
    resize: vertical;
    min-height: 80px;
  }
  
  .error-message {
    background: #FEF2F2;
    color: #DC2626;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }
  
  .success-message {
    background: #F0FDF4;
    color: #16A34A;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }
  
  .cancel-button {
    padding: 0.75rem 1.5rem;
    border: 1px solid #d1d5db;
    background: white;
    color: #374151;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .cancel-button:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
  
  .save-button {
    padding: 0.75rem 1.5rem;
    border: none;
    background: #3B82F6;
    color: white;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .save-button:hover:not(:disabled) {
    background: #2563EB;
  }
  
  .save-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: 640px) {
    .modal-content {
      margin: 1rem;
      max-height: calc(100vh - 2rem);
    }
    
    .form-actions {
      flex-direction: column;
    }
    
    .cancel-button,
    .save-button {
      width: 100%;
    }
  }
</style>


