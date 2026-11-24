import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({ component: Page });

function Page() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px", font: "16px/1.6 system-ui, sans-serif", color: "#f4eee3" }}>
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ opacity: 0.7, fontSize: 13 }}>Block Journey · Petty Games Studio · Last updated November 24, 2026</p>
      <h2 style={{ marginTop: 24 }}>What we collect</h2>
      <p>Your game progress (islands, coins, gems, boosters, skins, settings) is saved on your device.</p>
      <p>Leaderboard: if you play a ranked run, we store the name you choose, your score and a random player ID created on your device. We don't ask for your real name, email or an account.</p>
      <p>Purchases: in the iPhone app, purchases are handled entirely by Apple. On the website, payments are handled by Stripe. We never see your card details.</p>
      <h2 style={{ marginTop: 24 }}>How we use it</h2>
      <p>To save your progress, show leaderboards and unlock what you buy. We don't sell your data and the iPhone app shows no ads.</p>
      <h2 style={{ marginTop: 24 }}>Children</h2>
      <p>The game is not directed at children under 13, and we don't knowingly collect personal information from them.</p>
      <h2 style={{ marginTop: 24 }}>Deleting your data</h2>
      <p>Delete the app (or clear site data) to remove progress stored on your device. To remove a leaderboard entry, email us with your player name.</p>
      <h2 style={{ marginTop: 24 }}>Third parties</h2>
      <p>Apple · Stripe · Vercel</p>
      <h2 style={{ marginTop: 24 }}>Contact</h2>
      <p>Petty Games Studio · <a href="mailto:sineusw@gmail.com" style={{ color: "#ffd23f" }}>sineusw@gmail.com</a></p>
    </main>
  );
}
