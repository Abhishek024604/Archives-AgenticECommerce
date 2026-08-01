async function check() {
  const r = await fetch('https://archives-agentic-e-commerce.vercel.app/');
  const html = await r.text();
  const scriptMatch = html.match(/<script type="module" crossorigin src="(.*?)"><\/script>/);
  if(scriptMatch) {
    const jsUrl = 'https://archives-agentic-e-commerce.vercel.app' + scriptMatch[1];
    const js = await fetch(jsUrl).then(res => res.text());
    console.log('Includes Render?', js.includes('archives-agenticecommerce.onrender.com'));
    console.log('Includes localhost?', js.includes('localhost:5000'));
    if (js.includes('localhost:5000')) {
        const i = js.indexOf('localhost:5000');
        console.log('Snippet around localhost:', js.substring(i - 40, i + 40));
    }
  } else {
    console.log('No script found');
  }
}
check().catch(console.error);
