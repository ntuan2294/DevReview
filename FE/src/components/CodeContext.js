import React, { useState, createContext, useContext } from "react";

const CodeContext = createContext();

export const CodeProvider = ({ children }) => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [reviewResult, setReviewResult] = useState(null);
  const [type, setType] = useState(""); // "Re" for Review, "Ex" for Explain, "Su" for Suggest
  const [historyItems, setHistoryItems] = useState([]); // ✅ Thêm historyItems vào context
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // ✅ Thêm loading state

  return (
    <CodeContext.Provider
      value={{
        code,
        setCode,
        language,
        setLanguage,
        reviewResult,
        setReviewResult,
        type,
        setType,
        historyItems,
        setHistoryItems,
        isLoadingHistory,
        setIsLoadingHistory,
      }}
    >
      {children}
    </CodeContext.Provider>
  );
};

export const useCode = () => useContext(CodeContext);
