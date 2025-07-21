import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import CodeInput from "./components/CodeInput";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/editor" element={<CodeInput />} />
      </Routes>
    </Router>
  );
}

export default App;