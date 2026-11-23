import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { useEffect } from "react";
import appCss from "../styles.css?url";

/** Google H5 Games Ads (AdSense for games). Off until VITE_ADSENSE_CLIENT (ca-pub-...) is set. */
function H5Ads() {
  useEffect(() => {
    const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
    if (!client || document.getElementById("h5ads")) return;
    const s = document.createElement("script");
    s.id = "h5ads";
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
    s.setAttribute("data-ad-frequency-hint", "30s");
    if (import.meta.env.VITE_ADSENSE_TEST === "on") s.setAttribute("data-adbreak-test", "on");
    // Only expose adBreak once the SDK loads, so ad blockers fall back to the house video.
    s.onload = () => {
      const w = window as unknown as { adsbygoogle: unknown[]; adBreak: (o: unknown) => void; adConfig: (o: unknown) => void };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adBreak = w.adConfig = (o: unknown) => void w.adsbygoogle.push(o);
      w.adConfig({ preloadAdBreaks: "on", sound: "on" });
    };
    document.head.appendChild(s);
  }, []);
  return null;
}

const APP_NAME = "Block Journey";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#071428" },
      { name: "description", content: "Drop blocks, clear lines, and chase combos on a tropical night island." },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@600;700;800&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <H5Ads />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
