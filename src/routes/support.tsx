import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/support")({ component: Page });

function Page() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px", font: "16px/1.6 system-ui, sans-serif", color: "#f4eee3" }}>
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>Support</h1>
      <p style={{ opacity: 0.7, fontSize: 13 }}>Block Journey · Petty Games Studio · Last updated November 24, 2026</p>
      <p>Need help with Block Journey? Email <a href="mailto:sineusw@gmail.com" style={{ color: "#ffd23f" }}>sineusw@gmail.com</a> and we'll get back to you within 2 business days.</p>
      <h2 style={{ marginTop: 24 }}>Common questions</h2>
      <p><b>I bought something on a new phone and it's missing.</b> Open Settings in the game and tap Restore purchases (skins and one-time offers). Coins, gems and boosters are used up when bought and can't be restored.</p>
      <p><b>How do I make power blocks?</b> Clear 2 lines at once for an arrow, 3 for a bomb, 4 for a golden block. A x5 combo or emptying the board earns a star color bomb.</p>
      <p><b>How do I reset my progress?</b> Settings → Reset progress. This can't be undone.</p>
    </main>
  );
}
