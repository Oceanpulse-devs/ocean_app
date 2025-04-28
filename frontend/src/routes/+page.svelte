<script>
  import LandingPage from './LandingPage.svelte';
  import { goto } from '$app/navigation';
  
  function navigateToFeed() {
    goto('/feed');
  }
</script>

<LandingPage onGetStarted={navigateToFeed} />
