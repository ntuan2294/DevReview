import { useEffect, useState } from "react";
import ExplainService from "../services/ExplainService";
import LoadingSpinner from "./LoadingSpinner"; // ✅ Import loading spinner

const ExplainSection = ({ code, language, currentUser, onBack, onNew }) => {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Render code with line numbers
  const renderCodeWithLineNumbers = (codeContent) => {
    if (!codeContent) return "Không có mã nguồn.";

    // Filter out empty lines or lines with only whitespace
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
  };

  const formatExplanation = (text) => {
    if (!text) return "Đang xử lý...";

    let plainText = text
      .replace(/```[\s\S]*?```/g, "[Code ví dụ đã được loại bỏ]")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^\s*[-*+]\s*/gm, "• ")
      .replace(/^\s*\d+\.\s*/gm, "")
      // ✅ ENHANCED: Better empty line handling
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
            const isHeader = line.includes(":") && line.length < 100;
            const isBullet = line.startsWith("• ");

            return (
              <p
                key={idx}
                className={`
              ${
                isHeader
                  ? "font-semibold text-blue-700 text-lg border-b border-blue-200 pb-1"
                  : ""
              }
              ${isBullet ? "ml-4" : ""}
            `}
              >
                {line}
              </p>
            );
          })}
      </div>
    );
  };

  // Call Explain API khi code thay đổi
  useEffect(() => {
    const fetchExplanation = async () => {
      if (!code || !language) {
        setExplanation("⚠ Không có code để giải thích.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const result = await ExplainService.explainCode(
          language,
          code,
          currentUser?.username
        );
        setExplanation(result.explanation);
      } catch (error) {
        setExplanation("❌ Lỗi khi gọi ExplainService.");
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [code, language, currentUser]);

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow">
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

      {/* Content: 2 columns */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Code */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              📄 Mã {language?.toUpperCase()} gốc
            </h2>
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {code?.split("\n").length || 0} dòng
            </span>
          </div>
          <div className="bg-gray-50 rounded-lg overflow-auto max-h-[500px] p-4 border">
            {renderCodeWithLineNumbers(code)}
          </div>
        </div>

        {/* Right: Explanation */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">📖 Giải thích chi tiết</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg flex-1 overflow-hidden">
            {loading ? (
              <LoadingSpinner
                message="Đang phân tích code..."
                submessage={`Giải thích code ${
                  language?.toUpperCase() || "N/A"
                } - ${code?.split("\n").length || 0} dòng`}
                color="green"
                size="medium"
              />
            ) : (
              <div className="p-4 overflow-auto max-h-[500px]">
                {formatExplanation(explanation)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplainSection;
