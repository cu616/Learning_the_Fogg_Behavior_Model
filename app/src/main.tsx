import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

async function bootstrap() {
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has("mock")) {
    const { installDevMock } = await import("./devMock");
    installDevMock();
  }

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap();
