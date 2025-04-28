<script>
  export let onGetStarted = () => {}; // Default empty function
  
  let isLogin = false;
  
  function toggleAuthModal() {
    isLogin = !isLogin;
  }
  
  function handleGetStarted() {
    // Call the provided navigation function
    onGetStarted();
  }
</script>

<div class="landing">
  <div class="overlay"></div>
  <div class="particles">
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
  </div>
  
  <div class="hero">
    <div class="hero-content">
      <h1 class="glow">OCEAN</h1>
      <p class="subtitle">Your marine marketplace</p>
      <div class="buttons">
        <button class="primary-btn" on:click={handleGetStarted}>
          <span>Get Started</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
            <path fill-rule="evenodd" d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
  
  <div class="info-section">
    <div class="info-box">
      <div class="info-icon">🛒</div>
      <h2>Buy & Sell</h2>
      <p>Marine products marketplace</p>
    </div>
    <div class="info-box">
      <div class="info-icon">🔨</div>
      <h2>Auctions</h2>
      <p>Bid on unique items</p>
    </div>
    <div class="info-box">
      <div class="info-icon">⚡</div>
      <h2>Distress Sales</h2>
      <p>Great deals on urgent sales</p>
    </div>
  </div>
  
  {#if isLogin}
    <div class="auth-modal">
      <div class="modal-content">
        <h2>Sign In</h2>
        <form>
          <div class="form-group">
            <input type="email" placeholder="Email" required />
          </div>
          <div class="form-group">
            <input type="password" placeholder="Password" required />
          </div>
          <button type="submit" class="primary-btn">Sign In</button>
        </form>
        <p class="toggle-text">
          Don't have an account? 
          <button class="text-btn" on:click={toggleAuthModal}>Sign Up</button>
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Full screen container */
  .landing {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background: #000;
    color: white;
    display: flex;
    flex-direction: column;
    padding-top: 60px; /* Space for the navbar */
    overflow: hidden;
  }
  
  /* Overlay with gradient */
  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, #000428, #001e3c, #000c66);
    z-index: -2;
  }
  
  /* Animated particles */
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
    left: 10%;
    width: 120px;
    height: 120px;
    animation: float 20s ease-in-out infinite;
    opacity: 0.3;
  }
  
  .particle:nth-child(2) {
    top: 60%;
    left: 80%;
    width: 160px;
    height: 160px;
    animation: float 15s ease-in-out infinite;
    animation-delay: 2s;
    opacity: 0.2;
  }
  
  .particle:nth-child(3) {
    top: 40%;
    left: 40%;
    width: 80px;
    height: 80px;
    animation: float 18s ease-in-out infinite;
    animation-delay: 1s;
    opacity: 0.15;
  }
  
  .particle:nth-child(4) {
    top: 80%;
    left: 20%;
    width: 100px;
    height: 100px;
    animation: float 22s ease-in-out infinite;
    animation-delay: 5s;
    opacity: 0.25;
  }
  
  .particle:nth-child(5) {
    top: 10%;
    left: 60%;
    width: 140px;
    height: 140px;
    animation: float 25s ease-in-out infinite;
    animation-delay: 3s;
    opacity: 0.2;
  }
  
  .particle:nth-child(6) {
    top: 30%;
    left: 90%;
    width: 70px;
    height: 70px;
    animation: float 19s ease-in-out infinite;
    animation-delay: 7s;
    opacity: 0.15;
  }
  
  .particle:nth-child(7) {
    top: 70%;
    left: 5%;
    width: 110px;
    height: 110px;
    animation: float 21s ease-in-out infinite;
    animation-delay: 6s;
    opacity: 0.3;
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
  
  .hero {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 60vh;
  }
  
  .hero-content {
    padding: 0;
    z-index: 1;
  }
  
  h1 {
    font-size: 5.5rem;
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
  
  .subtitle {
    font-size: 1.5rem;
    margin: 1rem 0 2rem;
    opacity: 0.9;
    font-weight: 300;
    letter-spacing: 0.05em;
  }
  
  .buttons {
    margin-top: 2rem;
  }
  
  .primary-btn {
    background: linear-gradient(90deg, #0052d4, #4364f7, #6fb1fc);
    color: white;
    padding: 0.9rem 2.5rem;
    font-size: 1.2rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(65, 132, 234, 0.4);
  }
  
  .primary-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(65, 132, 234, 0.6);
  }
  
  .primary-btn:active {
    transform: translateY(1px);
  }
  
  .info-section {
    display: flex;
    justify-content: center;
    gap: 2rem;
    padding: 2rem;
    margin: 0 auto;
    max-width: 1200px;
    z-index: 1;
  }
  
  .info-box {
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(10px);
    padding: 2rem;
    border-radius: 8px;
    text-align: center;
    flex: 1;
    max-width: 300px;
    transition: transform 0.3s, box-shadow 0.3s;
    border: 1px solid rgba(63, 137, 251, 0.2);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }
  
  .info-box:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(63, 137, 251, 0.2);
    border: 1px solid rgba(63, 137, 251, 0.4);
  }
  
  .info-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  
  .info-box h2 {
    margin-top: 0;
    font-size: 1.5rem;
    color: #4299e1;
    margin-bottom: 0.5rem;
  }
  
  .info-box p {
    font-size: 1rem;
    margin: 0.5rem 0 0;
    opacity: 0.8;
  }
  
  .auth-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000; /* Higher than navbar */
  }
  
  .modal-content {
    background-color: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(10px);
    color: white;
    padding: 2rem;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
    border: 1px solid rgba(63, 137, 251, 0.2);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid rgba(63, 137, 251, 0.3);
    background-color: rgba(15, 23, 42, 0.6);
    border-radius: 4px;
    font-size: 1rem;
    color: white;
    transition: border-color 0.3s;
  }
  
  input:focus {
    border-color: rgba(63, 137, 251, 0.8);
    outline: none;
  }
  
  .toggle-text {
    color: #e2e8f0;
    font-size: 0.9rem;
    margin-top: 1rem;
    text-align: center;
  }
  
  .text-btn {
    background: none;
    border: none;
    color: #4299e1;
    font-weight: bold;
    cursor: pointer;
    padding: 0;
    font-size: 0.9rem;
    text-decoration: underline;
  }
  
  @media (max-width: 768px) {
    .info-section {
      flex-direction: column;
      align-items: center;
    }
    
    .info-box {
      width: 100%;
      margin-bottom: 1rem;
    }
    
    h1 {
      font-size: 3.5rem;
    }
  }
</style> 