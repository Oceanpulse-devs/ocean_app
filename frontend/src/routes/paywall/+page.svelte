<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  const tiers = [
    {
      name: 'Basic',
      price: '$9.99',
      period: 'month',
      description: 'Perfect for casual users',
      features: [
        'Access to basic marketplace',
        'Up to 5 product listings',
        'Basic search functionality',
        'Email support'
      ],
      buttonText: 'Start Basic',
      popular: false
    },
    {
      name: 'Pro',
      price: '$19.99',
      period: 'month',
      description: 'Ideal for active sellers',
      features: [
        'Everything in Basic',
        'Up to 20 product listings',
        'Advanced search filters',
        'Priority support',
        'Analytics dashboard',
        'Custom storefront'
      ],
      buttonText: 'Start Pro',
      popular: true
    },
    {
      name: 'Premium',
      price: '$29.99',
      period: 'month',
      description: 'For power users and businesses',
      features: [
        'Everything in Pro',
        'Unlimited product listings',
        'API access',
        '24/7 priority support',
        'Advanced analytics',
        'Custom domain',
        'Bulk upload tools'
      ],
      buttonText: 'Start Premium',
      popular: false
    }
  ];

  function handleSubscribe(tier: string) {
    // TODO: Implement subscription logic
    console.log(`Subscribing to ${tier} tier`);
  }
</script>

<div class="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-16">
      <div class="flex justify-center mb-8">
        <img src="/logoopacity.png" alt="Ocean Logo" class="h-24 w-24 object-contain drop-shadow-lg rounded-full bg-black/30 p-2" />
      </div>
      <h1 class="text-4xl font-bold mb-4">Choose Your Plan</h1>
      <p class="text-xl text-gray-400">Select the perfect plan for your needs</p>
    </div>

    <!-- Pricing Tiers -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {#each tiers as tier}
        <div class="relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 {tier.popular ? 'scale-105' : ''}">
          {#if tier.popular}
            <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span class="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</span>
            </div>
          {/if}
          
          <div class="text-center">
            <h3 class="text-2xl font-bold mb-2">{tier.name}</h3>
            <div class="mb-4">
              <span class="text-4xl font-bold">{tier.price}</span>
              <span class="text-gray-400">/{tier.period}</span>
            </div>
            <p class="text-gray-400 mb-6">{tier.description}</p>
          </div>

          <ul class="space-y-4 mb-8">
            {#each tier.features as feature}
              <li class="flex items-center">
                <svg class="feature-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-gray-300">{feature}</span>
              </li>
            {/each}
          </ul>

          <button
            on:click={() => handleSubscribe(tier.name)}
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
          >
            {tier.buttonText}
          </button>
        </div>
      {/each}
    </div>

    <!-- FAQ Section -->
    <div class="mt-24 text-center">
      <h2 class="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div class="text-left">
          <h3 class="text-xl font-semibold mb-2">Can I change plans later?</h3>
          <p class="text-gray-400">Yes, you can upgrade or downgrade your plan at any time.</p>
        </div>
        <div class="text-left">
          <h3 class="text-xl font-semibold mb-2">Is there a free trial?</h3>
          <p class="text-gray-400">Yes, all plans come with a 14-day free trial.</p>
        </div>
        <div class="text-left">
          <h3 class="text-xl font-semibold mb-2">What payment methods do you accept?</h3>
          <p class="text-gray-400">We accept all major credit cards and PayPal.</p>
        </div>
        <div class="text-left">
          <h3 class="text-xl font-semibold mb-2">Can I cancel anytime?</h3>
          <p class="text-gray-400">Yes, you can cancel your subscription at any time.</p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  body, :global(body) {
    background: #fff;
    min-height: 100vh;
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, 'Liberation Sans', sans-serif;
  }

  .min-h-screen {
    min-height: 100vh;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .max-w-7xl {
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .paywall-logo {
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
    background: rgba(0,0,0,0.03);
    border-radius: 50%;
    padding: 1rem;
    margin-bottom: 2rem;
    transition: box-shadow 0.3s;
  }
  .paywall-logo:hover {
    box-shadow: 0 12px 48px 0 rgba(31, 38, 135, 0.12);
  }

  .text-center {
    text-align: center;
  }
  .mb-16 { margin-bottom: 4rem; }
  .mb-8 { margin-bottom: 2rem; }
  .mb-4 { margin-bottom: 1rem; }
  .mb-6 { margin-bottom: 1.5rem; }
  .mt-24 { margin-top: 6rem; }

  .text-4xl { font-size: 2.5rem; font-weight: 700; }
  .text-3xl { font-size: 2rem; font-weight: 700; }
  .text-2xl { font-size: 1.5rem; font-weight: 600; }
  .text-xl { font-size: 1.25rem; }
  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }
  .text-gray-400 { color: #7b8a9c; }
  .text-gray-300 { color: #4a5568; }
  .text-white { color: #fff; }

  .grid { display: grid; }
  .grid-cols-1 { grid-template-columns: 1fr; }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .gap-8 { gap: 2rem; }

  @media (max-width: 900px) {
    .md\:grid-cols-3 { grid-template-columns: 1fr; }
  }

  .relative { position: relative; }
  .rounded-2xl { border-radius: 1.5rem; }
  .p-8 { padding: 2rem; }
  .border { border: 1px solid #e5e7eb; }
  .transition-all { transition: all 0.3s; }
  .duration-300 { transition-duration: 0.3s; }
  .scale-105 { transform: scale(1.05); }
  .backdrop-blur-sm {
    background: #fff;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07), 0 1.5px 8px 0 rgba(60,60,60,0.04);
    border: 1px solid #f1f1f1;
  }
  .hover\:border-blue-500\/50:hover {
    border-color: #3f89fb80;
  }

  .w-full { width: 100%; }
  .bg-blue-600 { background: linear-gradient(90deg, #3f89fb 0%, #005bea 100%); }
  .hover\:bg-blue-700:hover { background: #005bea; }
  .rounded-lg { border-radius: 1rem; }
  .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
  .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
  .font-bold { font-weight: 700; }

  .space-y-4 > * + * { margin-top: 1rem; }

  .faq-section {
    margin-top: 6rem;
    text-align: center;
  }
  .faq-section h2 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 2rem;
  }
  .faq-section .grid {
    max-width: 800px;
    margin: 0 auto;
    gap: 2rem;
  }
  .faq-section .text-left {
    text-align: left;
  }

  /* Custom scrollbar for premium feel */
  ::-webkit-scrollbar {
    width: 8px;
    background: #f1f1f1;
  }
  ::-webkit-scrollbar-thumb {
    background: #3f89fb;
    border-radius: 8px;
  }
  /* Make checkmarks smaller and more subtle */
  .feature-check {
    height: 1.1em;
    width: 1.1em;
    min-width: 1.1em;
    margin-right: 0.5em;
    color: #3f89fb;
    flex-shrink: 0;
    vertical-align: middle;
  }
</style> 