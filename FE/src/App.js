import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CodeEditorPage from "./components/CodeEditorPage";
import CodeResultPage from "./components/CodeResultPage";
import { CodeProvider } from "./components/CodeContext";
import ExplainCodePage from "./components/ExplainCodePage";
import SuggestNamePage from "./components/SuggestNamePage";
import Login from "./components/Login";

function App() {
  return (
    <Router>
      <CodeProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/editor" element={<CodeEditorPage />} />
          <Route path="/result" element={<CodeResultPage />} />
          <Route path="/explain" element={<ExplainCodePage />} />
          <Route path="/suggest" element={<SuggestNamePage />} />
        </Routes>
      </CodeProvider>
    </Router>
  );
}

export default App;
