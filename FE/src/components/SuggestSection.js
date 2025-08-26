import { useEffect, useState } from "react";
import SuggestNameService from "../services/SuggestNameService";
import LoadingSpinner from "./LoadingSpinner"; // ✅ Import component loading thống nhất

const SuggestSection = ({ code, language, currentUser, onBack, onNew }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Format suggestions thành plain text
  const formatSuggestions = (text) => {
    if (!text) return "Đang xử lý...";

    // Loại bỏ markdown formatting và chỉ hiển thị text thuần
    let plainText = text
      // Loại bỏ code blocks hoàn toàn
      .replace(/```[\s\S]*?```/g, "[Code ví dụ đã được loại bỏ]")
      // Loại bỏ inline code nhưng giữ nội dung
      .replace(/`([^`]+)`/g, "$1")
      // Loại bỏ headers nhưng giữ lại nội dung và làm nổi bật
      .replace(/^#{1,6}\s*/gm, "")
      // Loại bỏ bold/italic nhưng giữ lại nội dung
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      // Chuyển bullet points thành ký tự đơn giản
      .replace(/^\s*[-*+]\s*/gm, "• ")
      // Loại bỏ numbered lists markers nhưng giữ nội dung
      .replace(/^\s*\d+\.\s*/gm, "")
      // Chuẩn hóa line breaks
      .replace(/\n\s*\n/g, "\n\n")
      .trim();

    return (
      <div className="text-gray-800 leading-relaxed">
        {plainText.split("\n").map((line, idx) => {
          // Tạo style khác nhau cho các loại dòng
          const isMainHeader =
            line.includes("Gợi ý tên") ||
            line.includes("Quy tắc đặt tên") ||
            line.includes("Nhiệm vụ");
          const isSubHeader =
            line.includes(":") && line.length < 100 && !line.startsWith("• ");
          const isBullet = line.startsWith("• ");
          const isEmpty = !line.trim();

          return (
            <p
              key={idx}
              className={`
                ${isEmpty ? "mb-4" : "mb-3"}
                ${
                  isMainHeader
                    ? "font-bold text-orange-700 text-xl border-b border-orange-200 pb-2 mb-4"
                    : ""
                }
                ${
                  isSubHeader && !isMainHeader
                    ? "font-semibold text-orange-600 text-lg mt-4 mb-2"
                    : ""
                }
                ${isBullet ? "ml-4 mb-2 text-gray-700" : ""}
              `}
            >
              {line || "\u00A0"}
            </p>
          );
        })}
      </div>
    );
  };

  // ✅ Error state với retry button (sử dụng LoadingSpinner style)
  const renderErrorState = () => (
    <div className="flex items-center justify-center h-40">
      <div className="text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <div className="text-red-700 font-semibold mb-2">Có lỗi xảy ra</div>
        <div className="text-sm text-gray-600 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center space-x-2 mx-auto"
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Thử lại</span>
        </button>
      </div>
    </div>
  );

  // ✅ Gọi SuggestName API khi code thay đổi
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!code || !code.trim()) {
        setSuggestions("⚠️ Không có code để gợi ý tên.");
        setLoading(false);
        setError(null);
        return;
      }

      if (!language) {
        setSuggestions("⚠️ Vui lòng chọn ngôn ngữ lập trình.");
        setLoading(false);
        setError(null);
        return;
      }

      console.log("🔄 Bắt đầu gọi SuggestName API...");
      setLoading(true);
      setError(null);

      try {
        const result = await SuggestNameService.suggestNames(
          language,
          code,
          currentUser?.username || "anonymous"
        );

        console.log("📦 Kết quả từ API:", result);

        // ✅ Xử lý response từ backend
        if (result.suggestions) {
          setSuggestions(result.suggestions);
        } else if (result.explanation) {
          setSuggestions(result.explanation);
        } else if (result.feedback) {
          setSuggestions(result.feedback);
        } else {
          setSuggestions("🤔 API trả về dữ liệu nhưng không có gợi ý cụ thể.");
        }
      } catch (error) {
        console.error("❌ Lỗi khi fetch suggestions:", error);
        setError(error.message);
        setSuggestions(
          `❌ Lỗi khi gọi API gợi ý tên:\n\n${error.message}\n\n` +
            `Vui lòng:\n` +
            `• Kiểm tra kết nối mạng\n` +
            `• Đảm bảo backend đang chạy\n` +
            `• Thử lại sau ít phút`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [code, language, currentUser?.username]);

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

        <div className="flex items-center space-x-2">
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
      </div>

      {/* Content: 2 columns */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Code */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <span>📄</span>
              <span>Mã {language?.toUpperCase()} gốc</span>
            </h2>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {code?.split("\n").length || 0} dòng
              </span>
              <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded">
                {language?.toUpperCase() || "N/A"}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg overflow-auto max-h-[500px] p-4 border">
            {renderCodeWithLineNumbers(code)}
          </div>
        </div>

        {/* Right: Suggestions */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <span>🏷️</span>
            <span>Gợi ý tên hàm & biến</span>
          </h2>

          <div className="bg-orange-50 border border-orange-200 rounded-lg flex-1 overflow-hidden">
            {loading ? (
              // ✅ THAY ĐỔI: Sử dụng LoadingSpinner component thống nhất
              <LoadingSpinner
                message="Đang phân tích code..."
                submessage={`Gợi ý tên cho ${
                  language?.toUpperCase() || "N/A"
                } - ${code?.split("\n").length || 0} dòng`}
                color="orange"
                size="medium"
              />
            ) : error ? (
              renderErrorState()
            ) : (
              <div className="p-4 overflow-auto max-h-[500px]">
                {formatSuggestions(suggestions)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestSection;
