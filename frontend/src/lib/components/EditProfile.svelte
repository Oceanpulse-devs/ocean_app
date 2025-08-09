<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { updateProfile } from '$lib/api/auth';
  
  const dispatch = createEventDispatcher();
  
  export let showModal = false;
  export let userData: any = null;
  
  let loading = false;
  let error = '';
  let success = '';
  
  // Form data structure to match backend exactly
  let formData = {
    fullName: '',
    bio: '',
    location: '',
    website: '',
    profilePicture: '',
    coverPicture: ''
  };
  
  // Initialize form data when modal opens
  $: if (showModal && userData) {
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
      
      // Only send fields that have values to avoid overwriting with empty strings
      const updateData: any = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          updateData[key] = value;
        }
      });
      
      console.log('Sending update data:', updateData);
      
      const response = await updateProfile(updateData);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Profile update response:', data);
        
        success = 'Profile updated successfully!';
        
        // Dispatch updated data to parent - use the profileInfo from backend
        if (data.profileInfo) {
          dispatch('submit', data.profileInfo);
        } else {
          // Fallback to form data if backend doesn't return profileInfo
          dispatch('submit', { ...userData, ...updateData });
        }
        
        // Close modal after a short delay
        setTimeout(() => {
          showModal = false;
          success = '';
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error('Profile update error response:', errorData);
        error = errorData.message || 'Failed to update profile';
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      error = 'Failed to update profile. Please try again.';
    } finally {
      loading = false;
    }
  }
  
  function closeModal() {
    showModal = false;
    error = '';
    success = '';
    // Reset form data
    formData = {
      fullName: '',
      bio: '',
      location: '',
      website: '',
      profilePicture: '',
      coverPicture: ''
    };
  }
  
  // Handle input changes to provide real-time validation
  function handleInputChange() {
    // Clear any previous errors when user starts typing
    if (error) {
      error = '';
    }
  }
</script>

{#if showModal}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Edit Profile</h2>
        <button class="close-btn" on:click={closeModal}>×</button>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="edit-form">
        {#if error}
          <div class="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        {/if}
        
        {#if success}
          <div class="success-message">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {success}
          </div>
        {/if}

        <div class="form-group">
          <label for="name">Full Name *</label>
          <input 
            type="text" 
            id="name" 
            bind:value={formData.fullName}
            on:input={handleInputChange}
            placeholder="Enter your full name"
            required
          />
        </div>

        <div class="form-group">
          <label for="bio">Bio</label>
          <textarea 
            id="bio" 
            bind:value={formData.bio}
            on:input={handleInputChange}
            placeholder="Tell us about yourself or your business"
            rows="4"
          ></textarea>
          <small class="help-text">Share your story, interests, or business description</small>
        </div>

        <div class="form-group">
          <label for="location">Location</label>
          <input 
            type="text" 
            id="location" 
            bind:value={formData.location}
            on:input={handleInputChange}
            placeholder="Enter your city, state, or country"
          />
        </div>

        <div class="form-group">
          <label for="website">Website</label>
          <input 
            type="url" 
            id="website" 
            bind:value={formData.website}
            on:input={handleInputChange}
            placeholder="https://your-website.com"
          />
          <small class="help-text">Optional: Add your personal or business website</small>
        </div>

        <div class="form-group">
          <label for="profilePicture">Profile Picture URL</label>
          <input 
            type="url" 
            id="profilePicture" 
            bind:value={formData.profilePicture}
            on:input={handleInputChange}
            placeholder="https://example.com/profile.jpg"
          />
          {#if formData.profilePicture}
            <div class="image-preview">
              <img src={formData.profilePicture} alt="Profile preview" class="preview-image avatar-preview" />
            </div>
          {/if}
          <small class="help-text">Enter a direct link to your profile image</small>
        </div>

        <div class="form-group">
          <label for="coverPicture">Cover Image URL</label>
          <input 
            type="url" 
            id="coverPicture" 
            bind:value={formData.coverPicture}
            on:input={handleInputChange}
            placeholder="https://example.com/cover.jpg"
          />
          {#if formData.coverPicture}
            <div class="image-preview">
              <img src={formData.coverPicture} alt="Cover preview" class="preview-image cover-preview" />
            </div>
          {/if}
          <small class="help-text">Enter a direct link to your cover image</small>
        </div>

        <div class="form-actions">
          <button type="button" class="cancel-btn" on:click={closeModal}>Cancel</button>
          <button type="submit" class="submit-btn" disabled={loading}>
            {#if loading}
              <svg class="loading-spinner" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Saving...
            {:else}
              Save Changes
            {/if}
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
    border-radius: 12px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0.25rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: #f3f4f6;
    color: #374151;
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
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-group textarea {
    resize: vertical;
    min-height: 100px;
  }

  .help-text {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: #6b7280;
    font-style: italic;
  }

  .image-preview {
    margin-top: 0.75rem;
    text-align: center;
  }

  .preview-image {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    border: 2px solid #e5e7eb;
  }

  .avatar-preview {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 50%;
  }

  .cover-preview {
    width: 100%;
    max-height: 120px;
    object-fit: cover;
  }

  .error-message {
    background: #fef2f2;
    color: #dc2626;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    border: 1px solid #fecaca;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .error-message svg {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
  }

  .success-message {
    background: #f0fdf4;
    color: #16a34a;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    border: 1px solid #bbf7d0;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .success-message svg {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .cancel-btn,
  .submit-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .cancel-btn {
    background: #f3f4f6;
    color: #374151;
  }

  .cancel-btn:hover {
    background: #e5e7eb;
  }

  .submit-btn {
    background: #3b82f6;
    color: white;
  }

  .submit-btn:hover:not(:disabled) {
    background: #2563eb;
  }

  .submit-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .loading-spinner {
    width: 1rem;
    height: 1rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 640px) {
    .modal-content {
      margin: 0.5rem;
      max-height: calc(100vh - 1rem);
    }

    .modal-header {
      padding: 1rem 1rem 0.75rem;
    }

    .modal-header h2 {
      font-size: 1.25rem;
    }

    .edit-form {
      padding: 1rem;
    }

    .form-actions {
      flex-direction: column;
      gap: 0.75rem;
    }

    .cancel-btn,
    .submit-btn {
      width: 100%;
      padding: 0.875rem 1.5rem;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .modal-overlay {
      padding: 0.5rem;
    }

    .modal-content {
      border-radius: 8px;
    }

    .form-group input,
    .form-group textarea {
      padding: 0.875rem;
      font-size: 1rem;
    }
  }
</style> 