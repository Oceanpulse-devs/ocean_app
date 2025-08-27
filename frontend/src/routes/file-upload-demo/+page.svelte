<script lang="ts">
  import FileUpload from '../../lib/components/FileUpload.svelte';
  
  let singleImageFiles: File[] = [];
  let multipleImageFiles: File[] = [];
  let productFiles: File[] = [];
  let postFiles: File[] = [];
  
  function handleSingleImageChange(event: CustomEvent) {
    singleImageFiles = event.detail.files;
    console.log('Single image files:', singleImageFiles);
  }
  
  function handleMultipleImageChange(event: CustomEvent) {
    multipleImageFiles = event.detail.files;
    console.log('Multiple image files:', multipleImageFiles);
  }
  
  function handleProductChange(event: CustomEvent) {
    productFiles = event.detail.files;
    console.log('Product files:', productFiles);
  }
  
  function handlePostChange(event: CustomEvent) {
    postFiles = event.detail.files;
    console.log('Post files:', postFiles);
  }
</script>

<svelte:head>
  <title>File Upload Demo - Ocean App</title>
</svelte:head>

<div class="demo-container">
  <header class="demo-header">
    <h1>File Upload Component Demo</h1>
    <p>Modern drag-and-drop file upload component with Cloudinary integration</p>
  </header>
  
  <div class="demo-sections">
    <!-- Single Image Upload -->
    <section class="demo-section">
      <h2>Single Image Upload</h2>
      <p>Upload a single profile picture or product image</p>
      <FileUpload
        multiple={false}
        accept="image/*"
        maxSize={5 * 1024 * 1024} // 5MB
        on:change={handleSingleImageChange}
        bind:value={singleImageFiles}
      />
      <div class="demo-info">
        <h4>Configuration:</h4>
        <ul>
          <li>Single file only</li>
          <li>Images only</li>
          <li>5MB max size</li>
        </ul>
      </div>
    </section>
    
    <!-- Multiple Image Upload -->
    <section class="demo-section">
      <h2>Multiple Image Upload</h2>
      <p>Upload multiple images for products or posts</p>
      <FileUpload
        multiple={true}
        accept="image/*"
        maxFiles={5}
        maxSize={10 * 1024 * 1024} // 10MB
        on:change={handleMultipleImageChange}
        bind:value={multipleImageFiles}
      />
      <div class="demo-info">
        <h4>Configuration:</h4>
        <ul>
          <li>Multiple files (up to 5)</li>
          <li>Images only</li>
          <li>10MB max size per file</li>
        </ul>
      </div>
    </section>
    
    <!-- Product Images Upload -->
    <section class="demo-section">
      <h2>Product Images Upload</h2>
      <p>Upload product images with e-commerce optimizations</p>
      <FileUpload
        multiple={true}
        accept="image/*"
        maxFiles={8}
        maxSize={15 * 1024 * 1024} // 15MB
        on:change={handleProductChange}
        bind:value={productFiles}
      />
      <div class="demo-info">
        <h4>Configuration:</h4>
        <ul>
          <li>Multiple files (up to 8)</li>
          <li>Images only</li>
          <li>15MB max size per file</li>
          <li>E-commerce optimized</li>
        </ul>
      </div>
    </section>
    
    <!-- Post Media Upload -->
    <section class="demo-section">
      <h2>Post Media Upload</h2>
      <p>Upload images and videos for social media posts</p>
      <FileUpload
        multiple={true}
        accept="image/*,video/*"
        maxFiles={10}
        maxSize={20 * 1024 * 1024} // 20MB
        on:change={handlePostChange}
        bind:value={postFiles}
      />
      <div class="demo-info">
        <h4>Configuration:</h4>
        <ul>
          <li>Multiple files (up to 10)</li>
          <li>Images and videos</li>
          <li>20MB max size per file</li>
          <li>Social media optimized</li>
        </ul>
      </div>
    </section>
  </div>
  
  <!-- Features Section -->
  <section class="features-section">
    <h2>Component Features</h2>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">🎯</div>
        <h3>Drag & Drop</h3>
        <p>Intuitive drag and drop interface with visual feedback</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">📱</div>
        <h3>Responsive Design</h3>
        <p>Works perfectly on all devices and screen sizes</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <h3>File Validation</h3>
        <p>Automatic file type and size validation with error handling</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🖼️</div>
        <h3>File Previews</h3>
        <p>Instant previews for images and videos with file information</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>Performance</h3>
        <p>Optimized for smooth animations and fast file processing</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🎨</div>
        <h3>Customizable</h3>
        <p>Easy to customize with props for different use cases</p>
      </div>
    </div>
  </section>
  
  <!-- Integration Info -->
  <section class="integration-section">
    <h2>Backend Integration</h2>
    <div class="integration-content">
      <div class="integration-text">
        <h3>Cloudinary Service</h3>
        <p>This component is designed to work seamlessly with our Cloudinary service for:</p>
        <ul>
          <li>Automatic image optimization</li>
          <li>Video compression and thumbnails</li>
          <li>Multiple format support (WebP, AVIF)</li>
          <li>Global CDN delivery</li>
          <li>Organized file storage</li>
        </ul>
      </div>
      
      <div class="integration-code">
        <h4>Usage Example:</h4>
        <pre><code>// In your Svelte component
&lt;FileUpload
  multiple={true}
  accept="image/*,video/*"
  maxFiles={5}
  on:change={handleFileChange}
/&gt;

// Handle the files
function handleFileChange(event) {
  const { files, errors } = event.detail;
  if (errors.length === 0) {
    // Upload to Cloudinary via your API
    uploadFiles(files);
  }
}</code></pre>
      </div>
    </div>
  </section>
</div>

<style>
  .demo-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .demo-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .demo-header h1 {
    font-size: 2.5rem;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }
  
  .demo-header p {
    font-size: 1.125rem;
    color: #64748b;
    margin: 0;
  }
  
  .demo-sections {
    display: flex;
    flex-direction: column;
    gap: 3rem;
    margin-bottom: 4rem;
  }
  
  .demo-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
  }
  
  .demo-section h2 {
    color: #1e293b;
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
  }
  
  .demo-section p {
    color: #64748b;
    margin: 0 0 1.5rem 0;
  }
  
  .demo-info {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
  }
  
  .demo-info h4 {
    color: #1e293b;
    margin: 0 0 0.75rem 0;
  }
  
  .demo-info ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #64748b;
  }
  
  .demo-info li {
    margin-bottom: 0.25rem;
  }
  
  .features-section {
    margin-bottom: 4rem;
  }
  
  .features-section h2 {
    text-align: center;
    color: #1e293b;
    margin-bottom: 2rem;
    font-size: 2rem;
  }
  
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .feature-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
  }
  
  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  
  .feature-card h3 {
    color: #1e293b;
    margin: 0 0 0.75rem 0;
    font-size: 1.25rem;
  }
  
  .feature-card p {
    color: #64748b;
    margin: 0;
    line-height: 1.5;
  }
  
  .integration-section {
    background: #f8fafc;
    border-radius: 12px;
    padding: 2rem;
    border: 1px solid #e2e8f0;
  }
  
  .integration-section h2 {
    color: #1e293b;
    margin: 0 0 1.5rem 0;
    text-align: center;
    font-size: 2rem;
  }
  
  .integration-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: start;
  }
  
  .integration-text h3 {
    color: #1e293b;
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
  }
  
  .integration-text p {
    color: #64748b;
    margin: 0 0 1rem 0;
  }
  
  .integration-text ul {
    color: #64748b;
    margin: 0;
    padding-left: 1.5rem;
  }
  
  .integration-text li {
    margin-bottom: 0.5rem;
  }
  
  .integration-code h4 {
    color: #1e293b;
    margin: 0 0 1rem 0;
  }
  
  .integration-code pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 0.875rem;
    line-height: 1.5;
  }
  
  .integration-code code {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }
  
  @media (max-width: 768px) {
    .demo-container {
      padding: 1rem;
    }
    
    .demo-header h1 {
      font-size: 2rem;
    }
    
    .demo-section {
      padding: 1.5rem;
    }
    
    .features-grid {
      grid-template-columns: 1fr;
    }
    
    .integration-content {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }
</style>

