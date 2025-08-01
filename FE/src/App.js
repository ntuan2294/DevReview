import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CodeEditorPage from "./components/CodeEditorPage";
import CodeResultPage from "./components/CodeResultPage";
import { CodeProvider } from "./components/CodeContext";
import Login from "./components/Login";

function App() {
  return (
    <Router>
      <CodeProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/editor" element={<CodeEditorPage />} />
          <Route path="/result" element={<CodeResultPage />} />
        </Routes>
      </CodeProvider>
    </Router>
  );
}

export default App;
