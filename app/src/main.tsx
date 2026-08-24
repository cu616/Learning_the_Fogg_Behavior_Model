import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import MobileApp from "./MobileApp";
import { loadVisualTheme } from "./themePreference";

const mobileDemo = /Android/i.test(navigator.userAgent) || new URLSearchParams(window.location.search).get("mobileDemo") === "1";
document.documentElement.classList.toggle("mobile-runtime", mobileDemo);
loadVisualTheme();

async function bootstrap() {
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has("mock")) {
    const { installDevMock } = await import("./devMock");
    installDevMock();
  }

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      {mobileDemo ? <MobileApp /> : <App />}
    </React.StrictMode>,
  );
}

bootstrap();
