import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App.js";
import "./styles/global.css";

const appElement = document.getElementById("app");

if (appElement === null) {
  throw new Error("App element '#app' was not found.");
}

ReactDOM.createRoot(appElement).render(
  React.createElement(React.StrictMode, null, React.createElement(App)),
);
