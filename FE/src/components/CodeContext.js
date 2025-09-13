// src/pages/CodeContext.js  (đặt ở đúng chỗ project)
import React, { createContext, useContext, useState, useMemo } from "react";

const CodeContext = createContext(null);

export const CodeProvider = ({ children }) => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [reviewResult, setReviewResult] = useState(null);
  const [type, setType] = useState("");
  const [historyItems, setHistoryItems] = useState([]);
  // Không bắt buộc đưa isLoadingHistory toàn cục; nếu có thì default false
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const value = useMemo(
    () => ({
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
    }),
    [code, language, reviewResult, type, historyItems, isLoadingHistory]
  );

  return <CodeContext.Provider value={value}>{children}</CodeContext.Provider>;
};

export const useCode = () => {
  const ctx = useContext(CodeContext);
  if (!ctx) throw new Error("useCode must be used within CodeProvider");
  return ctx;
};
