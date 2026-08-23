import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import MobileApp from "./MobileApp";

const mobileDemo = /Android/i.test(navigator.userAgent) || new URLSearchParams(window.location.search).get("mobileDemo") === "1";
document.documentElement.classList.toggle("mobile-runtime", mobileDemo);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {mobileDemo ? <MobileApp /> : <App />}
  </React.StrictMode>,
);
