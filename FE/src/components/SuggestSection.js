import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import ExplainService from "../services/ExplainService";

const SuggestSection = ({ code, language, currentUser, onBack, onNew }) => {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Render code with line numbers
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

  // Format explanation
  const formatExplanation = (text) => {
    if (!text) return "Đang xử lý...";
    return (
      <div className="prose prose-sm max-w-none text-gray-800">
        <ReactMarkdown
          components={{
            code: ({ inline, children, ...props }) =>
              !inline ? (
                <pre className="bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto shadow-inner">
                  <code {...props}>{children}</code>
                </pre>
              ) : (
                <code className="bg-gray-200 px-1 py-0.5 rounded text-sm">
                  {children}
                </code>
              ),
            h1: ({ children }) => (
              <h1 className="text-xl font-bold mb-3 text-blue-700">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold mb-2 text-blue-600">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-md font-medium mb-2 text-blue-500">
                {children}
              </h3>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
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
          <h2 className="text-lg font-semibold mb-4">
            ✨ Gợi ý tên hàm & biến
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg border flex-1 overflow-auto max-h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-gray-500 italic">Đang giải thích...</p>
                </div>
              </div>
            ) : (
              formatExplanation(explanation)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestSection;
