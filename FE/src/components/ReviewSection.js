import React, { useState, useEffect, useCallback, useMemo } from "react";
import LoadingSpinner from "./LoadingSpinner";
import CodeWithHighlight from "./CodeWithHighlight";

const ReviewSection = React.memo(
  ({ code, language, reviewResult, fixedCode, currentUser, onBack, onNew }) => {
    const [activeTab, setActiveTab] = useState("review");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      if (reviewResult) {
        setLoading(false);
        setError(null);
      } else {
        setLoading(true);
      }
    }, [reviewResult]);

    useEffect(() => {
      if (reviewResult && reviewResult.error) {
        setError(reviewResult.error);
        setLoading(false);
      }
    }, [reviewResult]);

    const renderCodeWithLineNumbers = useCallback((codeContent) => {
      if (!codeContent) return "Không có mã nguồn.";

      const lines = codeContent.split("\n");
      return (
        <div className="font-mono text-sm">
          {lines.map((line, idx) => (
            <div key={idx} className="flex hover:bg-gray-100">
              <span
                className="text-gray-400 select-none pr-4 text-right flex-shrink-0"
                style={{ minWidth: "3rem" }}
              >
                {idx + 1}
              </span>
              <span className="flex-1 whitespace-pre-wrap">{line || " "}</span>
            </div>
          ))}
        </div>
      );
    }, []);

    const formatReviewFeedback = useCallback((feedback) => {
      if (!feedback) return "Đang xử lý...";

      // Nếu feedback là array (list issues từ backend)
      if (Array.isArray(feedback)) {
        if (feedback.length === 0) {
          return (
            <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded">
              ✅ Không có lỗi được phát hiện
            </div>
          );
        }

        return (
          <div className="space-y-3">
            {feedback.map((issue, idx) => (
              <div
                key={idx}
                className={`p-3 rounded border ${
                  issue.type === "ERROR"
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "border-yellow-400 bg-yellow-50 text-yellow-700"
                }`}
              >
                <p>
                  <strong>{issue.type}</strong> [{issue.code}] tại dòng{" "}
                  {issue.line}, cột {issue.col}
                </p>
                <p>👉 {issue.message}</p>
                {issue.sourceLine && (
                  <pre className="bg-gray-100 text-sm p-2 rounded my-1">
                    {issue.sourceLine}
                  </pre>
                )}
                {issue.suggestion && (
                  <p className="italic text-gray-600">🔧 {issue.suggestion}</p>
                )}
              </div>
            ))}
          </div>
        );
      }

      // feedback là string (ví dụ dữ liệu cũ từ history)
      let plainText = feedback
        .replace(/```[\s\S]*?```/g, "[Code đã được loại bỏ]")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/^#{1,6}\s*/gm, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/^\s*[-*+]\s*/gm, "• ")
        .replace(/^\s*\d+\.\s*/gm, "")
        .replace(/\n\s*\n\s*\n+/g, "\n\n")
        .replace(/^\s*$/gm, "")
        .replace(/\n+/g, "\n")
        .trim();

      return (
        <div className="text-gray-800 leading-relaxed space-y-3">
          {plainText
            .split("\n")
            .filter((line) => line.trim())
            .map((line, idx) => {
              const isBullet = line.startsWith("• ");
              const isImportant =
                line.includes("Lỗi") ||
                line.includes("Error") ||
                line.includes("❌");

              return (
                <p
                  key={idx}
                  className={`${isBullet ? "ml-4" : ""} ${
                    isImportant
                      ? "font-semibold text-red-700 bg-red-50 p-2 rounded"
                      : ""
                  }`}
                >
                  {line}
                </p>
              );
            })}
        </div>
      );
    }, []);

    const improvedCode = useMemo(() => {
      return (
        reviewResult?.improvedCode ||
        reviewResult?.fixedCode ||
        fixedCode ||
        "⚠️ Không tìm thấy code đã cải thiện."
      );
    }, [reviewResult?.improvedCode, reviewResult?.fixedCode, fixedCode]);

    const originalCode = useMemo(() => {
      return reviewResult?.originalCode || code || "Không có mã nguồn gốc.";
    }, [reviewResult?.originalCode, code]);

    const errorLines = useMemo(() => {
      return reviewResult?.errorLines || [];
    }, [reviewResult?.errorLines]);

    const loadingSubmessage = useMemo(() => {
      const lang = language?.toUpperCase() || "N/A";
      const lineCount = code?.split("\n").length || 0;
      return `Đánh giá code ${lang} - ${lineCount} dòng`;
    }, [language, code]);

    return (
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              <span>Quay lại chỉnh sửa</span>
            </button>

            {reviewResult?.isFromHistory && (
              <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded">
                <span>Từ lịch sử: ID #{reviewResult.historyId}</span>
              </div>
            )}
          </div>

          <button
            onClick={onNew}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <span>Code mới</span>
          </button>
        </div>

        {/* Layout 2 cột */}
        <div className="grid grid-cols-2 gap-6">
          {/* Cột trái: Code gốc */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <CodeWithHighlight
              code={originalCode}
              errorLines={errorLines}
              language={language}
              maxHeight="max-h-96"
            />
          </div>

          {/* Cột phải: Tabs */}
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
            <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("review")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === "review"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                Kết quả Review
              </button>
              <button
                onClick={() => setActiveTab("fixed")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === "fixed"
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-green-600"
                }`}
              >
                Code đã cải thiện
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              {activeTab === "review" && (
                <div className="h-full">
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-auto border">
                    {loading ? (
                      <LoadingSpinner
                        message="Đang phân tích code..."
                        submessage={loadingSubmessage}
                        color="blue"
                        size="medium"
                      />
                    ) : error ? (
                      <div className="text-red-600 p-4">{error}</div>
                    ) : (
                      <div className="p-4 overflow-auto max-h-[500px]">
                        {formatReviewFeedback(reviewResult?.feedback)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "fixed" && (
                <div className="h-full">
                  <div className="bg-gray-50 rounded-lg max-h-96 overflow-auto p-4 border">
                    {renderCodeWithLineNumbers(improvedCode)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default ReviewSection;
