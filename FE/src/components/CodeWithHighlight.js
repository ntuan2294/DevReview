// CodeWithHighlight.js - Component hiển thị code với highlight các dòng bị lỗi
import React from "react";

const CodeWithHighlight = ({
  code,
  errorLines = [],
  language = "",
  maxHeight = "max-h-96",
}) => {
  // Helper function để parse error lines từ JSON string hoặc array
  const parseErrorLines = (errorLinesData) => {
    if (!errorLinesData) return [];

    try {
      // Nếu là string, parse JSON
      if (typeof errorLinesData === "string") {
        const parsed = JSON.parse(errorLinesData);
        return Array.isArray(parsed) ? parsed : [];
      }

      // Nếu đã là array
      if (Array.isArray(errorLinesData)) {
        return errorLinesData;
      }

      return [];
    } catch (e) {
      console.warn("⚠️ Không thể parse error lines:", errorLinesData);
      return [];
    }
  };

  // Render code với line numbers và highlight
  const renderCodeWithHighlight = (codeContent) => {
    if (!codeContent) return "Không có mã nguồn.";

    const lines = codeContent.split("\n");
    const parsedErrorLines = parseErrorLines(errorLines);

    console.log("🔍 Debug highlight - Error lines:", parsedErrorLines);
    console.log("🔍 Debug highlight - Total lines:", lines.length);

    return (
      <div className="font-mono text-sm">
        {lines.map((line, idx) => {
          const lineNumber = idx + 1;
          const isErrorLine = parsedErrorLines.includes(lineNumber);

          return (
            <div
              key={idx}
              className={`flex group relative ${
                isErrorLine
                  ? "bg-red-100 border-l-4 border-red-500 hover:bg-red-150"
                  : "hover:bg-gray-100"
              }`}
            >
              {/* Line number */}
              <span
                className={`
                  select-none pr-4 text-right font-medium
                  ${isErrorLine ? "text-red-600 bg-red-200" : "text-gray-400"}
                `}
                style={{ minWidth: "3.5rem", padding: "0.25rem 0.75rem" }}
              >
                {lineNumber}
              </span>

              {/* Code content */}
              <span
                className={`
                flex-1 whitespace-pre-wrap px-2 py-1
                ${isErrorLine ? "text-red-800" : "text-gray-800"}
              `}
              >
                {line || " "}
              </span>

              {/* Error indicator tooltip */}
              {isErrorLine && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="group relative">
                    <span className="text-red-500 text-sm font-bold cursor-help">
                      ⚠️
                    </span>
                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
                      <div className="bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                        Dòng có lỗi được phát hiện bởi AI
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Summary thống kê lỗi
  const ErrorSummary = () => {
    const parsedErrorLines = parseErrorLines(errorLines);

    if (parsedErrorLines.length === 0) {
      return (
        <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded mb-4">
          <span>✅</span>
          <span className="text-sm font-medium">
            Không có lỗi được phát hiện
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between bg-red-50 border border-red-200 px-3 py-2 rounded mb-4">
        <div className="flex items-center space-x-2 text-red-700">
          <span>⚠️</span>
          <span className="text-sm font-medium">
            Phát hiện {parsedErrorLines.length} dòng có lỗi
          </span>
        </div>
        <div className="text-xs text-red-600">
          Dòng: {parsedErrorLines.join(", ")}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header với thống kê */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          📄 Mã {language?.toUpperCase()} gốc
        </h2>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {code?.split("\n").length || 0} dòng
          </span>
          <span
            className={`px-2 py-1 rounded ${
              parseErrorLines(errorLines).length > 0
                ? "text-red-600 bg-red-100"
                : "text-green-600 bg-green-100"
            }`}
          >
            {parseErrorLines(errorLines).length} lỗi
          </span>
        </div>
      </div>

      {/* Error summary */}
      <ErrorSummary />

      {/* Code content với highlighting */}
      <div
        className={`bg-gray-50 rounded-lg overflow-auto ${maxHeight} border`}
      >
        <div className="p-4">{renderCodeWithHighlight(code)}</div>
      </div>

      {/* Legend/Chú thích */}
      {parseErrorLines(errorLines).length > 0 && (
        <div className="mt-3 text-xs text-gray-600 flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-100 border-l-2 border-red-500"></div>
            <span>Dòng có lỗi</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>⚠️</span>
            <span>Cảnh báo lỗi</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeWithHighlight;
