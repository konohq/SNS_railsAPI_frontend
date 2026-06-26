import React from "react";
import ReactDOM from "react-dom/client";
import App from "./api/App";
import { AuthProvider } from "./api/AuthProvider";
import './index.css'

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
