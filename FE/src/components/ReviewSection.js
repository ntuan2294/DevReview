import React, { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import CodeWithHighlight from "./CodeWithHighlight"; // ✅ Import component highlight

const ReviewSection = ({
  code,
  language,
  reviewResult,
  fixedCode,
  currentUser,
  onBack,
  onNew,
}) => {
  const [activeTab, setActiveTab] = useState("review"); // 'review' | 'fixed'

  // Helper function để render code với line numbers (cho fixed code - không cần highlight)
  const renderCodeWithLineNumbers = (codeContent) => {
    if (!codeContent) return "Không có mã nguồn.";

    const lines = codeContent.split("\n");
    return (
      <div className="font-mono text-sm">
        {lines.map((line, idx) => (
          <div key={idx} className="flex">
            <span
              className="text-gray-400 select-none pr-4 text-right"
              style={{ minWidth: "3rem" }}
            >
              {idx + 1}
            </span>
            <span className="flex-1 whitespace-pre-wrap">{line || " "}</span>
          </div>
        ))}
      </div>
    );
  };

  // Format review feedback thành plain text
  const formatReviewFeedback = (feedback) => {
    if (!feedback) return "Đang xử lý...";

    // Loại bỏ markdown formatting và chỉ hiển thị text thuần
    let plainText = feedback
      // Loại bỏ code blocks
      .replace(/```[\s\S]*?```/g, "[Code đã được loại bỏ]")
      // Loại bỏ inline code
      .replace(/`([^`]+)`/g, "$1")
      // Loại bỏ headers
      .replace(/^#{1,6}\s*/gm, "")
      // Loại bỏ bold/italic
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      // Loại bỏ bullet points
      .replace(/^\s*[-*+]\s*/gm, "• ")
      // Loại bỏ numbered lists
      .replace(/^\s*\d+\.\s*/gm, "")
      // Chuẩn hóa line breaks
      .replace(/\n\s*\n/g, "\n\n")
      .trim();

    return (
      <div className="text-gray-800 leading-relaxed">
        {plainText.split("\n").map((line, idx) => (
          <p key={idx} className={`${line.trim() ? "mb-2" : "mb-4"}`}>
            {line || "\u00A0"} {/* Non-breaking space for empty lines */}
          </p>
        ))}
      </div>
    );
  };

  // Lấy improved code từ reviewResult
  const getImprovedCode = () => {
    return (
      reviewResult?.improvedCode ||
      reviewResult?.fixedCode ||
      fixedCode ||
      "⚠️ Không tìm thấy code đã cải thiện."
    );
  };

  // Lấy original code
  const getOriginalCode = () => {
    return reviewResult?.originalCode || code || "Không có mã nguồn gốc.";
  };

  // ✅ THÊM: Lấy error lines
  const getErrorLines = () => {
    return reviewResult?.errorLines || [];
  };

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-6">
      {/* Header với thông tin */}
      <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Quay lại chỉnh sửa</span>
          </button>

          {reviewResult?.isFromHistory && (
            <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Từ lịch sử: ID #{reviewResult.historyId}</span>
            </div>
          )}
        </div>

        <button
          onClick={onNew}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>Code mới</span>
        </button>
      </div>

      {/* Bố cục 2 cột */}
      <div className="grid grid-cols-2 gap-6">
        {/* ✅ CỘT TRÁI: Sử dụng CodeWithHighlight component */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <CodeWithHighlight
            code={getOriginalCode()}
            errorLines={getErrorLines()}
            language={language}
            maxHeight="max-h-96"
          />
        </div>

        {/* Cột phải: Tabs Review / Code đã sửa */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
          {/* Tabs */}
          <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("review")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "review"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Kết quả Review</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("fixed")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "fixed"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-green-600"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Code đã cải thiện</span>
              </div>
            </button>
          </div>

          {/* Nội dung tab */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "review" && (
              <div className="h-full">
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-auto border">
                  {reviewResult ? (
                    formatReviewFeedback(reviewResult.feedback)
                  ) : (
                    <LoadingSpinner
                      message="Đang phân tích code..."
                      submessage={`Ngôn ngữ: ${
                        language?.toUpperCase() || "N/A"
                      }`}
                      color="blue"
                      size="medium"
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === "fixed" && (
              <div className="h-full">
                <div className="bg-gray-50 rounded-lg max-h-96 overflow-auto p-4 border">
                  {renderCodeWithLineNumbers(getImprovedCode())}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSection;
