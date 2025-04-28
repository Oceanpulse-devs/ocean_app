<script>
  import LandingPage from './LandingPage.svelte';
  import { goto } from '$app/navigation';
  
  function navigateToSignup() {
    goto('/signup');
  }
</script>

<LandingPage onGetStarted={navigateToSignup} />
