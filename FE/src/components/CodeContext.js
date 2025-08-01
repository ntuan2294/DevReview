import React, { useState, createContext, useContext } from "react";

const CodeContext = createContext();

export const CodeProvider = ({ children }) => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [reviewResult, setReviewResult] = useState(null);

  return (
    <CodeContext.Provider value={{ code, setCode, language, setLanguage, reviewResult, setReviewResult }}>
      {children}
    </CodeContext.Provider>
  );
};

export const useCode = () => useContext(CodeContext);
