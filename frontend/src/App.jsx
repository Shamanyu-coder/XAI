import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Assessment from "./pages/Assessment";
import Recommendation from "./pages/Recommendation";
import LiveCoaching from "./pages/LiveCoaching";
import BenefitsWithCamera from "./pages/BenefitsWithCamera";
import Feedback from "./pages/Feedback";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/assessment" element={<Assessment />} />
        <Route path="/recommendation" element={<Recommendation />} />

        <Route path="/livecoaching" element={<LiveCoaching />} />
        <Route path="/benefits" element={<BenefitsWithCamera />} />
        <Route path="/feedback" element={<Feedback />} />

        {/* optional: fallback for unknown routes */}
        <Route path="*" element={<h1 style={{ padding: 20 }}>404 - Page not found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
