<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import FileUpload from '../../lib/components/FileUpload.svelte';
  
  let currentStep = 1;
  let totalSteps = 4;
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';
  
  // Form data
  let formData: Record<string, any> = {
    businessName: '',
    businessType: 'individual',
    businessCategory: '',
    businessDescription: '',
    phoneNumber: '',
    businessAddress: '',
    city: '',
    state: '',
    country: '',
    yearsInBusiness: '',
    businessLicense: '',
    idDocument: null as File | null,
    businessLicenseDoc: null as File | null
  };
  
  let businessCategories = [
    'Electronics & Technology', 'Fashion & Apparel', 'Home & Garden',
    'Automotive', 'Health & Beauty', 'Sports & Outdoors'
  ];
  
  let countries = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'United States'];
  let states = ['Lagos', 'Abuja', 'Kano', 'Ondo', 'Oyo', 'Rivers'];
  
  let errors: Record<string, string> = {};
  
  function validateStep(step: number): boolean {
    errors = {};
    
    switch (step) {
      case 1:
        if (!formData.businessName.trim()) errors.businessName = 'Business name is required';
        if (!formData.businessCategory) errors.businessCategory = 'Business category is required';
        break;
      case 2:
        if (!formData.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';
        if (!formData.businessAddress.trim()) errors.businessAddress = 'Business address is required';
        break;
      case 3:
        if (!formData.yearsInBusiness) errors.yearsInBusiness = 'Years in business is required';
        if (!formData.businessLicense.trim()) errors.businessLicense = 'Business license is required';
        break;
      case 4:
        if (!formData.idDocument) errors.idDocument = 'ID document is required';
        if (!formData.businessLicenseDoc) errors.businessLicenseDoc = 'Business license document is required';
        break;
    }
    
    return Object.keys(errors).length === 0;
  }
  
  function nextStep() {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      currentStep++;
      errorMessage = '';
    }
  }
  
  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
      errorMessage = '';
    }
  }
  
  async function submitApplication() {
    if (!validateStep(currentStep)) return;
    
    isLoading = true;
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'idDocument' && key !== 'businessLicenseDoc') {
          submitData.append(key, formData[key]);
        }
      });
      
      if (formData.idDocument) submitData.append('idDocument', formData.idDocument);
      if (formData.businessLicenseDoc) submitData.append('businessLicenseDoc', formData.businessLicenseDoc);
      
      const response = await fetch('/api/seller-verification/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessName: formData.businessName,
          businessAddress: formData.businessAddress,
          country: formData.country,
          state: formData.state,
          category: formData.businessCategory,
          documents: [
            {
              documentType: 'idDocument',
              documentNumber: formData.businessLicense,
              documentImage: formData.idDocument ? await fileToBase64(formData.idDocument) : null,
              documentBackImage: null,
              documentExpiryDate: null,
              documentIssuingAuthority: 'Government',
              documentCountry: formData.country
            },
            {
              documentType: 'businessLicense',
              documentNumber: formData.businessLicense,
              documentImage: formData.businessLicenseDoc ? await fileToBase64(formData.businessLicenseDoc) : null,
              documentBackImage: null,
              documentExpiryDate: null,
              documentIssuingAuthority: 'Business Registry',
              documentCountry: formData.country
            }
          ]
        })
      });
      
      if (response.ok) {
        successMessage = 'Application submitted successfully!';
        setTimeout(() => goto('/seller-dashboard'), 3000);
      } else {
        const error = await response.json();
        errorMessage = error.message || 'Failed to submit application.';
      }
    } catch (error) {
      errorMessage = 'Network error. Please try again.';
    } finally {
      isLoading = false;
    }
  }
  
  function handleFileChange(event: CustomEvent<any>, field: string) {
    const { files } = event.detail;
    if (files && files.length > 0) {
      formData[field] = files[0];
    }
  }
  
  // Convert file to base64
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data:image/jpeg;base64, part and just get the base64 string
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
    });
  }
  
  $: progress = (currentStep / totalSteps) * 100;
</script>

<svelte:head>
  <title>Seller Registration - Ocean App</title>
</svelte:head>

<div class="seller-registration">
  <div class="container">
    <header class="registration-header">
      <h1>Become a Verified Seller</h1>
      <p>Join thousands of successful sellers on Ocean</p>
    </header>
    
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progress}%"></div>
      </div>
      <div class="progress-steps">
        {#each Array(totalSteps) as _, i}
          <div class="step-indicator {i + 1 === currentStep ? 'active' : i + 1 < currentStep ? 'completed' : ''}">
            <span class="step-number">{i + 1}</span>
            <span class="step-label">
              {i === 0 ? 'Basic Info' : i === 1 ? 'Contact' : i === 2 ? 'Business' : 'Documents'}
            </span>
          </div>
        {/each}
      </div>
    </div>
    
    <div class="form-container">
      {#if errorMessage}
        <div class="error-message">{errorMessage}</div>
      {/if}
      
      {#if successMessage}
        <div class="success-message">{successMessage}</div>
      {/if}
      
      <!-- Step 1: Basic Information -->
      {#if currentStep === 1}
        <div class="form-step">
          <h2>Basic Business Information</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="businessName">Business Name *</label>
              <input
                id="businessName"
                type="text"
                bind:value={formData.businessName}
                placeholder="Enter your business name"
                class={errors.businessName ? 'error' : ''}
              />
              {#if errors.businessName}
                <span class="error-text">{errors.businessName}</span>
              {/if}
            </div>
            
            <div class="form-group">
              <label for="businessType">Business Type</label>
              <select bind:value={formData.businessType}>
                <option value="individual">Individual</option>
                <option value="company">Company</option>
                <option value="partnership">Partnership</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="businessCategory">Business Category *</label>
              <select
                bind:value={formData.businessCategory}
                class={errors.businessCategory ? 'error' : ''}
              >
                <option value="">Select category</option>
                {#each businessCategories as category}
                  <option value={category}>{category}</option>
                {/each}
              </select>
              {#if errors.businessCategory}
                <span class="error-text">{errors.businessCategory}</span>
              {/if}
            </div>
            
            <div class="form-group full-width">
              <label for="businessDescription">Business Description</label>
              <textarea
                bind:value={formData.businessDescription}
                placeholder="Describe your business..."
                rows="4"
              ></textarea>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Step 2: Contact & Location -->
      {#if currentStep === 2}
        <div class="form-step">
          <h2>Contact & Location Information</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="phoneNumber">Phone Number *</label>
              <input
                id="phoneNumber"
                type="tel"
                bind:value={formData.phoneNumber}
                placeholder="+234 801 234 5678"
                class={errors.phoneNumber ? 'error' : ''}
              />
              {#if errors.phoneNumber}
                <span class="error-text">{errors.phoneNumber}</span>
              {/if}
            </div>
            
            <div class="form-group">
              <label for="businessAddress">Business Address *</label>
              <input
                bind:value={formData.businessAddress}
                placeholder="123 Business Street"
                class={errors.businessAddress ? 'error' : ''}
              />
              {#if errors.businessAddress}
                <span class="error-text">{errors.businessAddress}</span>
              {/if}
            </div>
            
            <div class="form-group">
              <label for="city">City</label>
              <input bind:value={formData.city} placeholder="Enter city" />
            </div>
            
            <div class="form-group">
              <label for="state">State</label>
              <select bind:value={formData.state}>
                <option value="">Select state</option>
                {#each states as state}
                  <option value={state}>{state}</option>
                {/each}
              </select>
            </div>
            
            <div class="form-group">
              <label for="country">Country</label>
              <select bind:value={formData.country}>
                <option value="">Select country</option>
                {#each countries as country}
                  <option value={country}>{country}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Step 3: Business Details -->
      {#if currentStep === 3}
        <div class="form-step">
          <h2>Business Details</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="yearsInBusiness">Years in Business *</label>
              <select
                bind:value={formData.yearsInBusiness}
                class={errors.yearsInBusiness ? 'error' : ''}
              >
                <option value="">Select years</option>
                <option value="0-1">Less than 1 year</option>
                <option value="1-2">1-2 years</option>
                <option value="3-5">3-5 years</option>
                <option value="6-10">6-10 years</option>
                <option value="10+">More than 10 years</option>
              </select>
              {#if errors.yearsInBusiness}
                <span class="error-text">{errors.yearsInBusiness}</span>
              {/if}
            </div>
            
            <div class="form-group">
              <label for="businessLicense">Business License Number *</label>
              <input
                bind:value={formData.businessLicense}
                placeholder="Enter license number"
                class={errors.businessLicense ? 'error' : ''}
              />
              {#if errors.businessLicense}
                <span class="error-text">{errors.businessLicense}</span>
              {/if}
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Step 4: Documents -->
      {#if currentStep === 4}
        <div class="form-step">
          <h2>Document Upload</h2>
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Government ID *</label>
                              <FileUpload
                  multiple={false}
                  accept="image/*,.pdf"
                  maxSize={5 * 1024 * 1024}
                  on:change={(e: CustomEvent<any>) => handleFileChange(e, 'idDocument')}
                  value={formData.idDocument ? [formData.idDocument] : []}
                />
              {#if errors.idDocument}
                <span class="error-text">{errors.idDocument}</span>
              {/if}
            </div>
            
            <div class="form-group full-width">
              <label>Business License Document *</label>
                              <FileUpload
                  multiple={false}
                  accept="image/*,.pdf"
                  maxSize={5 * 1024 * 1024}
                  on:change={(e: CustomEvent<any>) => handleFileChange(e, 'businessLicenseDoc')}
                  value={formData.businessLicenseDoc ? [formData.businessLicenseDoc] : []}
                />
              {#if errors.businessLicenseDoc}
                <span class="error-text">{errors.businessLicenseDoc}</span>
              {/if}
            </div>
          </div>
        </div>
      {/if}
      
      <div class="form-navigation">
        {#if currentStep > 1}
          <button type="button" class="btn btn-secondary" on:click={prevStep}>
            ← Previous
          </button>
        {:else}
          <div></div>
        {/if}
        
        {#if currentStep < totalSteps}
          <button type="button" class="btn btn-primary" on:click={nextStep}>
            Next →
          </button>
        {:else}
          <button 
            type="button" 
            class="btn btn-primary" 
            on:click={submitApplication}
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Application'}
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .seller-registration {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem 0;
  }
  
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  .registration-header {
    text-align: center;
    color: white;
    margin-bottom: 3rem;
  }
  
  .registration-header h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    font-weight: 700;
  }
  
  .progress-container {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 2rem;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    transition: width 0.3s ease;
  }
  
  .progress-steps {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .step-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #e2e8f0;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  .step-label {
    font-size: 0.875rem;
    color: #64748b;
    text-align: center;
  }
  
  .step-indicator.active .step-number {
    background: #667eea;
    color: white;
  }
  
  .step-indicator.completed .step-number {
    background: #10b981;
    color: white;
  }
  
  .form-container {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .error-message,
  .success-message {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    font-weight: 500;
  }
  
  .error-message {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }
  
  .success-message {
    background: #f0fdf4;
    color: #16a34a;
    border: 1px solid #bbf7d0;
  }
  
  .form-step {
    margin-bottom: 2rem;
  }
  
  .form-step h2 {
    color: #1e293b;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  
  .form-group.full-width {
    grid-column: 1 / -1;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #1e293b;
    font-weight: 600;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
  }
  
  .form-group input.error,
  .form-group select.error {
    border-color: #dc2626;
  }
  
  .error-text {
    color: #dc2626;
    font-size: 0.875rem;
    margin-top: 0.25rem;
    display: block;
  }
  
  .form-navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e2e8f0;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 120px;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
  }
  
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
  }
  
  .btn-secondary:hover {
    background: #e2e8f0;
  }
  
  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .progress-steps {
      flex-direction: column;
      gap: 1rem;
    }
  }
</style>
