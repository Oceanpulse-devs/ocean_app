<script>
  import { goto } from '$app/navigation';
  
  let email = '';
  let password = '';
  let rememberMe = false;
  let isLoading = false;
  
  function handleLogin() {
    isLoading = true;
    
    // Simulate login - replace with actual authentication
    setTimeout(() => {
      isLoading = false;
      goto('/feed');
    }, 1000);
  }
  
  function handleGoogleLogin() {
    // Implement Google OAuth login
    console.log('Google login clicked');
    // Redirect to Google OAuth flow
  }
  
  function navigateToSignup() {
    goto('/signup');
  }
  
  function navigateToHome() {
    goto('/');
  }
</script>

<div class="auth-page">
  <div class="overlay"></div>
  <div class="particles">
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
  </div>

  <div class="auth-container">
    <!-- <div class="logo-section" on:click={navigateToHome}>
      <img src="/oceanlogo-removebg-preview.png" alt="Ocean App Logo" class="ocean-logo" />
    </div> -->
    
    <div class="auth-form-container">
      <div class="auth-form">
        <img src="/oceanlogo-removebg-preview.png" alt="Ocean App Logo" class="ocean-logo" style="cursor:pointer" on:click={navigateToHome} />
        <h2>Welcome Back</h2>
        <p class="subtitle">Login to your account</p>
        
        <form on:submit|preventDefault={handleLogin}>
          <div class="form-group">
            <label for="email">Email</label>
            <div class="input-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
              </svg>
              <input type="email" id="email" bind:value={email} required placeholder="Your email address" />
            </div>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.775 11.775 0 0 1-2.517 2.453 7.159 7.159 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7.158 7.158 0 0 1-1.048-.625 11.777 11.777 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 62.456 62.456 0 0 1 5.072.56z"/>
                <path d="M9.5 6.5a1.5 1.5 0 0 1-1 1.415l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99a1.5 1.5 0 1 1 2-1.415z"/>
              </svg>
              <input type="password" id="password" bind:value={password} required placeholder="Your password" />
            </div>
          </div>
          
          <div class="form-group">
            <div class="checkbox-container">
              <input type="checkbox" id="remember" bind:checked={rememberMe} />
              <label for="remember">Remember me</label>
            </div>
            <a href="/forgot-password" class="forgot-link">Forgot password?</a>
          </div>
          
          <button type="submit" class="submit-btn" disabled={isLoading}>
            {#if isLoading}
              <span class="spinner"></span>
              <span>Logging in...</span>
            {:else}
              <span>Login</span>
            {/if}
          </button>
        </form>
        
        <div class="divider">
          <span>OR</span>
        </div>
        
        <button class="google-btn" on:click={handleGoogleLogin}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span>Continue with Google</span>
        </button>
        
        <div class="auth-footer">
          <p>Don't have an account? <button class="text-btn" on:click={navigateToSignup}>Sign up</button></p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  body, .login-container, .auth-bg {
    background: #fff !important;
    color: #111 !important;
  }
  .login-container, .auth-form {
    background: #fff;
    color: #111;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    border-radius: 1rem;
  }
  input, input[type="email"], input[type="password"] {
    background: #f7f7fa;
    color: #111;
    border: 1px solid #2563eb44;
    border-radius: 4px;
    padding: 0.75rem;
    font-size: 1rem;
    margin-bottom: 1rem;
  }
  input:focus {
    border-color: #2563eb;
    outline: none;
  }
  .auth-title, h1, h2, h3, h4, h5, h6 {
    color: #111;
  }
  .auth-btn, button[type="submit"] {
    background: #111;
    color: #fff;
    border: none;
    border-radius: 9999px;
    font-weight: 700;
    font-size: 1.1rem;
    padding: 0.85rem 2.5rem;
    box-shadow: 0 2px 8px rgba(66,153,225,0.08);
    cursor: pointer;
    transition: background 0.2s, box-shadow 0.2s, transform 0.2s;
  }
  .auth-btn:hover, button[type="submit"]:hover {
    background: #222;
    transform: translateY(-2px) scale(1.03);
  }
  .auth-link, a {
    color: #2563eb;
    text-decoration: underline;
  }
  .auth-link:hover, a:hover {
    color: #1d4ed8;
  }
  .auth-page {
    position: relative;
    min-height: 100vh;
    width: 100%;
    background: 
      radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.85) 0%, rgba(245,247,250,0.7) 60%, rgba(230,230,230,0.3) 100%),
      linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%);
    color: #111;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  
  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, #f5f7fa 0%, #c3cfe2 100%);
    z-index: -2;
  }
  
  .particles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }
  
  .particle {
    position: absolute;
    border-radius: 50%;
    background: rgba(63, 137, 251, 0.4);
    box-shadow: 0 0 15px 2px rgba(63, 137, 251, 0.6);
  }
  
  .particle:nth-child(1) {
    top: 20%;
    left: 80%;
    width: 150px;
    height: 150px;
    animation: float 20s ease-in-out infinite;
    opacity: 0.3;
  }
  
  .particle:nth-child(2) {
    top: 60%;
    left: 10%;
    width: 180px;
    height: 180px;
    animation: float 15s ease-in-out infinite;
    animation-delay: 2s;
    opacity: 0.2;
  }
  
  .particle:nth-child(3) {
    top: 30%;
    left: 20%;
    width: 120px;
    height: 120px;
    animation: float 18s ease-in-out infinite;
    animation-delay: 1s;
    opacity: 0.15;
  }
  
  .particle:nth-child(4) {
    top: 70%;
    left: 70%;
    width: 100px;
    height: 100px;
    animation: float 22s ease-in-out infinite;
    animation-delay: 5s;
    opacity: 0.25;
  }
  
  @keyframes float {
    0% {
      transform: translate(0, 0);
    }
    50% {
      transform: translate(30px, 20px);
    }
    100% {
      transform: translate(0, 0);
    }
  }
  
  .auth-container {
    width: 100%;
    max-width: 900px;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 1;
    padding: 2rem;
  }
  
  .logo-section {
    margin-bottom: 2rem;
    cursor: pointer;
  }
  
  h1 {
    font-size: 3rem;
    margin: 0;
    font-weight: 900;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  
  .glow {
    text-shadow: 0 0 10px rgba(63, 137, 251, 0.7),
                 0 0 20px rgba(63, 137, 251, 0.5),
                 0 0 30px rgba(63, 137, 251, 0.3);
    animation: pulse 3s infinite;
  }
  
  @keyframes pulse {
    0% {
      text-shadow: 0 0 10px rgba(63, 137, 251, 0.7),
                   0 0 20px rgba(63, 137, 251, 0.5),
                   0 0 30px rgba(63, 137, 251, 0.3);
    }
    50% {
      text-shadow: 0 0 15px rgba(63, 137, 251, 0.9),
                   0 0 30px rgba(63, 137, 251, 0.7),
                   0 0 45px rgba(63, 137, 251, 0.5);
    }
    100% {
      text-shadow: 0 0 10px rgba(63, 137, 251, 0.7),
                   0 0 20px rgba(63, 137, 251, 0.5),
                   0 0 30px rgba(63, 137, 251, 0.3);
    }
  }
  
  .auth-form-container {
    width: 100%;
    max-width: 450px;
  }
  
  .auth-form {
    background: #fff;
    color: #111;
    padding: 2.5rem;
    border-radius: 10px;
    border: 1px solid #2563eb22;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }
  
  h2 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
    color: #111;
  }
  
  .subtitle {
    margin: 0.5rem 0 2rem;
    color: #333;
    font-size: 1rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: #111;
  }
  
  .input-container {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .input-container svg {
    position: absolute;
    left: 1rem;
    color: #2563eb;
  }
  
  input[type="email"],
  input[type="password"] {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 1px solid #2563eb44;
    background-color: #f7f7fa;
    border-radius: 4px;
    font-size: 1rem;
    color: #111;
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  
  input[type="email"]::placeholder,
  input[type="password"]::placeholder {
    color: #888;
  }
  
  input[type="email"]:focus,
  input[type="password"]:focus {
    border-color: #2563eb;
    outline: none;
    box-shadow: 0 0 0 2px #2563eb22;
  }
  
  .checkbox-container {
    display: flex;
    align-items: center;
    float: left;
  }
  
  input[type="checkbox"] {
    margin-right: 0.5rem;
    accent-color: #4299e1;
  }
  
  .forgot-link {
    float: right;
    color: #4299e1;
    text-decoration: none;
    font-size: 0.9rem;
  }
  
  .forgot-link:hover {
    text-decoration: underline;
  }
  
  .submit-btn {
    width: 100%;
    background: linear-gradient(90deg, #0052d4, #4364f7, #6fb1fc);
    color: white;
    padding: 0.9rem;
    font-size: 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    font-weight: 500;
    box-shadow: 0 4px 15px rgba(65, 132, 234, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 1.5rem 0;
  }
  
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(65, 132, 234, 0.6);
  }
  
  .submit-btn:disabled {
    opacity: 0.8;
    cursor: not-allowed;
  }
  
  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s linear infinite;
    margin-right: 0.5rem;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .auth-footer {
    text-align: center;
    margin-top: 1rem;
    color: #333;
    font-size: 0.9rem;
  }
  
  .text-btn {
    background: none;
    border: none;
    color: #4299e1;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    font-size: 0.9rem;
  }
  
  .text-btn:hover {
    text-decoration: underline;
  }
  
  .divider {
    margin: 1.5rem 0;
    display: flex;
    align-items: center;
    text-align: center;
    color: #888;
  }
  
  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #eee;
  }
  
  .divider::before {
    margin-right: 0.5rem;
  }
  
  .divider::after {
    margin-left: 0.5rem;
  }
  
  .google-btn {
    width: 100%;
    background-color: #fff;
    color: #111;
    padding: 0.75rem;
    font-size: 1rem;
    border: 1px solid #2563eb44;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
  }
  
  .google-btn:hover {
    background-color: #f3f4f6;
  }
  
  @media (max-width: 600px) {
    .auth-container {
      padding: 1rem;
    }
    
    .auth-form {
      padding: 1.5rem;
    }
    
    h1 {
      font-size: 2.5rem;
    }
    
    h2 {
      font-size: 1.5rem;
    }
  }
  
  .ocean-logo {
    width: 110px;
    max-width: 60vw;
    margin: 0 auto 1.5rem auto;
    display: block;
    filter: drop-shadow(0 4px 16px rgba(63,137,251,0.10));
    transition: transform 0.2s;
  }
  .ocean-logo:hover {
    transform: scale(1.04) rotate(-2deg);
    filter: drop-shadow(0 8px 32px rgba(63,137,251,0.18));
  }
  @media (max-width: 600px) {
    .ocean-logo {
      width: 70px;
      margin-bottom: 1rem;
    }
  }
</style> 