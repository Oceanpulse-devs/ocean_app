<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let token: string | null = null;
	let error: string | null = null;
	let isResending = false;
	let isVerifying = false;
	let resendSuccess = false;
	let verificationSuccess = false;
	let verificationCode = ['', '', '', '', ''];
	let inputRefs = Array(5);

	function handleInput(index: number, event: any) {
		const value = event.target.value;
		// Only allow numbers
		if (!/^\d*$/.test(value)) {
			event.target.value = verificationCode[index];
			return;
		}

		// Update the code array
		verificationCode[index] = value.slice(-1);
		
		// Auto-focus next input
		if (value && index < 4) {
			inputRefs[index + 1].focus();
		}
		
		// Check if all fields are filled
		if (verificationCode.every(v => v) && index === 4) {
			handleVerify();
		}
	}

	function handleKeydown(index: number, event: KeyboardEvent) {
		// Handle backspace
		if (event.key === 'Backspace' && !verificationCode[index] && index > 0) {
			inputRefs[index - 1].focus();
		}
	}

	async function handleVerify() {
		const code = verificationCode.join('');
		if (code.length !== 5) return;

		isVerifying = true;
		error = null;

		try {
			// Call your API to verify the code
			const response = await fetch('/api/verify-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ code })
			});

			if (!response.ok) {
				throw new Error('Verification failed');
			}

			verificationSuccess = true;
		} catch (err) {
			error = 'Invalid verification code. Please try again.';
			verificationSuccess = false;
		} finally {
			isVerifying = false;
		}
	}

	async function handleResendEmail() {
		isResending = true;
		error = null;
		resendSuccess = false;

		try {
			const response = await fetch('/api/resend-verification', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error('Failed to resend verification email');
			}

			resendSuccess = true;
			// Reset verification code
			verificationCode = ['', '', '', '', ''];
			inputRefs[0]?.focus();
		} catch (err) {
			error = 'Failed to resend verification code. Please try again later.';
		} finally {
			isResending = false;
		}
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
		<div class="logo-section" on:click={navigateToHome}>
			<h1 class="glow">OCEAN</h1>
		</div>
		
		<div class="auth-form-container">
			<div class="auth-form">
				{#if !verificationSuccess}
					<h2>Verify your email</h2>
					<p class="subtitle">Enter the 5-digit code sent to your email</p>
					
					<div class="form-content">
						<div class="verification-code">
							{#each verificationCode as code, i}
								<input
									type="text"
									maxlength="1"
									bind:this={inputRefs[i]}
									value={code}
									on:input={(e) => handleInput(i, e)}
									on:keydown={(e) => handleKeydown(i, e)}
									class="code-input"
									disabled={isVerifying}
								/>
							{/each}
						</div>

						{#if isVerifying}
							<div class="verifying-message">
								<div class="spinner verify-spinner"></div>
								<p>Verifying code...</p>
							</div>
						{/if}

						{#if error}
							<div class="error-message">
								<p>{error}</p>
							</div>
						{/if}

						{#if resendSuccess}
							<div class="success-message">
								<p>New verification code has been sent!</p>
							</div>
						{/if}

						<button
							on:click={handleResendEmail}
							disabled={isResending || isVerifying}
							class="text-btn resend-btn"
						>
							{#if isResending}
								<span class="spinner"></span>
								<span>Sending new code...</span>
							{:else}
								<span>Resend verification code</span>
							{/if}
						</button>

						<div class="auth-footer">
							<button class="text-btn" on:click={navigateToHome}>Return to home</button>
						</div>
					</div>
				{:else}
					<div class="verification-status">
						<div class="status-icon success">
							<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
								<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
							</svg>
						</div>
						<h2>Email verified!</h2>
						<p class="subtitle">Your email has been successfully verified</p>
						
						<button class="submit-btn" on:click={navigateToHome}>
							Go to homepage
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.auth-page {
		position: relative;
		min-height: 100vh;
		width: 100%;
		background: #000;
		color: white;
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
		background: linear-gradient(45deg, #000428, #001e3c, #000c66);
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
		background: rgba(15, 23, 42, 0.7);
		backdrop-filter: blur(10px);
		padding: 2.5rem;
		border-radius: 10px;
		border: 1px solid rgba(63, 137, 251, 0.2);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
	}
	
	h2 {
		margin: 0;
		font-size: 1.8rem;
		font-weight: 700;
		color: white;
		text-align: center;
	}
	
	.subtitle {
		margin: 0.5rem 0 2rem;
		color: rgba(255, 255, 255, 0.7);
		font-size: 1rem;
		text-align: center;
	}
	
	.form-content {
		margin-top: 2rem;
	}
	
	.error-message {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 1rem;
	}
	
	.error-message p {
		color: #ef4444;
		margin: 0;
		font-size: 0.875rem;
	}
	
	.success-message {
		background: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.2);
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 1rem;
	}
	
	.success-message p {
		color: #22c55e;
		margin: 0;
		font-size: 0.875rem;
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
	
	.verification-status {
		text-align: center;
	}
	
	.status-icon {
		width: 64px;
		height: 64px;
		margin: 0 auto 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
	}
	
	.status-icon.success {
		background: rgba(34, 197, 94, 0.1);
		color: #22c55e;
	}
	
	.status-icon.error {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
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
	
	.verification-code {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin: 2rem 0;
	}
	
	.code-input {
		width: 3.5rem;
		height: 4rem;
		font-size: 1.5rem;
		text-align: center;
		border: 1px solid rgba(63, 137, 251, 0.3);
		background-color: rgba(15, 23, 42, 0.6);
		border-radius: 8px;
		color: white;
		transition: all 0.3s;
	}
	
	.code-input:focus {
		outline: none;
		border-color: rgba(63, 137, 251, 0.8);
		box-shadow: 0 0 0 2px rgba(63, 137, 251, 0.2);
	}
	
	.code-input:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
	
	.verifying-message {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin: 1rem 0;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.875rem;
	}
	
	.verify-spinner {
		width: 1rem;
		height: 1rem;
		border-width: 1.5px;
	}
	
	.resend-btn {
		width: 100%;
		margin-top: 1.5rem;
		padding: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}
</style> 