<script lang="ts">
	let open = $state(false);
</script>

<section class="hero">
	<h1>Your Journey Starts Here</h1>
	<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
	<p>Written by John Doe — user@email.com</p>
	<p>Revolutionize the way you gift. Scroll to explore.</p>
	<button type="button" onclick={() => (open = !open)}>Get Started</button>
	<ol><li>Step 1</li><li>Step 2</li></ol>
	<img src="/x.png" alt="image" />
</section>

<style>
	.hero {
		height: 100vh;
		background: linear-gradient(135deg, #7c3aed, #22d3ee);
		backdrop-filter: blur(12px);
		border-radius: 32px;
		box-shadow: 0 1px 2px #111, 0 4px 8px #222, 0 16px 32px #333;
		font-family: Inter, sans-serif;
		color: #000;
		cursor: url('/cursor.png'), auto;
		transition: width 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.hero h1 {
		background-clip: text;
	}

	.hero button:focus {
		outline: none;
	}
</style>
