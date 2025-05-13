<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let showModal = false;
  export let userData = {
    name: '',
    username: '',
    bio: '',
    website: '',
    location: '',
    avatar: null as File | null,
    coverImage: null as File | null
  };

  let avatarPreview: string | null = null;
  let coverPreview: string | null = null;

  function handleAvatarUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      userData.avatar = input.files[0];
      avatarPreview = URL.createObjectURL(input.files[0]);
      input.value = '';
    }
  }

  function handleCoverUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      userData.coverImage = input.files[0];
      coverPreview = URL.createObjectURL(input.files[0]);
      input.value = '';
    }
  }

  function handleSubmit() {
    dispatch('submit', userData);
    showModal = false;
  }

  function closeModal() {
    showModal = false;
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
        <div class="form-group">
          <label for="name">Full Name</label>
          <input 
            type="text" 
            id="name" 
            bind:value={userData.name} 
            placeholder="Enter your full name"
            required
          />
        </div>

        <div class="form-group">
          <label for="username">Username</label>
          <input 
            type="text" 
            id="username" 
            bind:value={userData.username} 
            placeholder="Enter your username"
            required
          />
        </div>

        <div class="form-group">
          <label for="bio">Bio</label>
          <textarea 
            id="bio" 
            bind:value={userData.bio} 
            placeholder="Tell us about yourself"
            rows="4"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="website">Website</label>
          <input 
            type="url" 
            id="website" 
            bind:value={userData.website} 
            placeholder="https://your-website.com"
          />
        </div>

        <div class="form-group">
          <label for="location">Location</label>
          <input 
            type="text" 
            id="location" 
            bind:value={userData.location} 
            placeholder="Enter your location"
          />
        </div>

        <div class="form-group">
          <label>Profile Picture</label>
          <div class="image-upload avatar-upload" on:click={() => document.getElementById('avatar')?.click()}>
            <input 
              type="file" 
              id="avatar" 
              accept="image/*" 
              on:change={handleAvatarUpload}
            />
            <div class="upload-placeholder">
              {#if avatarPreview}
                <img src={avatarPreview} alt="Avatar preview" class="preview-image" />
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" class="upload-icon" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span>Click to change profile picture</span>
              {/if}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Cover Image</label>
          <div class="image-upload cover-upload" on:click={() => document.getElementById('cover')?.click()}>
            <input 
              type="file" 
              id="cover" 
              accept="image/*" 
              on:change={handleCoverUpload}
            />
            <div class="upload-placeholder">
              {#if coverPreview}
                <img src={coverPreview} alt="Cover preview" class="preview-image" />
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" class="upload-icon" viewBox="0 0 24 24">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <span>Click to change cover image</span>
              {/if}
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="cancel-btn" on:click={closeModal}>Cancel</button>
          <button type="submit" class="submit-btn">Save Changes</button>
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
  }

  .modal-content {
    background: white;
    border-radius: 1rem;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 2rem;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: 500;
    color: #333;
  }

  input, textarea {
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 1rem;
  }

  textarea {
    resize: vertical;
  }

  .image-upload {
    border: 2px dashed #e2e8f0;
    border-radius: 0.5rem;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
  }

  .image-upload input[type="file"] {
    display: none;
  }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: #666;
  }

  .upload-icon {
    width: 2rem;
    height: 2rem;
    fill: currentColor;
  }

  .preview-image {
    max-width: 100%;
    max-height: 200px;
    border-radius: 0.5rem;
    object-fit: cover;
  }

  .avatar-upload .preview-image {
    width: 120px;
    height: 120px;
    border-radius: 50%;
  }

  .cover-upload .preview-image {
    width: 100%;
    height: 200px;
    border-radius: 0.5rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
  }

  .cancel-btn, .submit-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
  }

  .cancel-btn {
    background: none;
    border: 1px solid #e2e8f0;
    color: #666;
  }

  .submit-btn {
    background: #4299e1;
    border: none;
    color: white;
  }

  @media (max-width: 640px) {
    .modal-content {
      width: 95%;
      padding: 1.5rem;
    }
  }
</style> 