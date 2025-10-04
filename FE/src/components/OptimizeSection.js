import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import OptimizeService from "../services/OptimizeService";

const OptimizeSection = ({ code, language, currentUser, onBack, onNew }) => {
  const [optimizations, setOptimizations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Render code with line numbers
  const renderCodeWithLineNumbers = (codeContent) => {
    if (!codeContent) return "No source code.";
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

  // Format optimizations with performance-focused styling
  const formatOptimizations = (text) => {
    if (!text) return "Processing...";
    return (
      <div className="prose prose-sm max-w-none text-gray-800">
        <ReactMarkdown
          components={{
            code: ({ inline, children, ...props }) =>
              !inline ? (
                <pre className="bg-red-900 text-red-200 p-3 rounded-lg overflow-x-auto shadow-inner">
                  <code {...props}>{children}</code>
                </pre>
              ) : (
                <code className="bg-red-200 text-red-900 px-1 py-0.5 rounded text-sm">
                  {children}
                </code>
              ),
            h1: ({ children }) => (
              <h1 className="text-xl font-bold mb-3 text-red-700 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold mb-2 text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-md font-medium mb-2 text-red-500">
                {children}
              </h3>
            ),
            ul: ({ children }) => (
              <ul className="list-none ml-0 mb-3 space-y-2">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal ml-4 mb-3 space-y-2">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-gray-700 flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{children}</span>
              </li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-red-800 bg-red-100 px-1 py-0.5 rounded">
                {children}
              </strong>
            ),
            // Performance metrics table styling
            table: ({ children }) => (
              <div className="overflow-x-auto">
                <table className="border-collapse border border-red-300 w-full mb-4 bg-white">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-red-300 bg-red-100 px-3 py-2 text-left font-semibold text-red-800">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-red-300 px-3 py-2">
                {children}
              </td>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  };

  // Call Optimize API when code changes
  useEffect(() => {
    const fetchOptimizations = async () => {
      if (!code || !code.trim()) {
        setOptimizations("No code available for optimization.");
        setLoading(false);
        setError(null);
        return;
      }

      if (!language) {
        setOptimizations("Please select a programming language.");
        setLoading(false);
        setError(null);
        return;
      }

      console.log("Starting optimization analysis...");
      setLoading(true);
      setError(null);

      try {
        const result = await OptimizeService.optimizeCode(
          language,
          code,
          currentUser?.username || "anonymous"
        );

        console.log("Optimization result:", result);

        // Handle response from backend
        if (result.optimizations) {
          setOptimizations(result.optimizations);
        } else if (result.explanation) { // fallback
          setOptimizations(result.explanation);
        } else if (result.feedback) { // another fallback
          setOptimizations(result.feedback);
        } else {
          setOptimizations("API returned data but no specific optimizations.");
        }

      } catch (error) {
        console.error("Error fetching optimizations:", error);
        setError(error.message);
        setOptimizations(
          `**Error calling optimization API:**\n\n${error.message}\n\n` +
          `Please:\n` +
          `- Check network connection\n` +
          `- Ensure backend is running\n` +
          `- Try again in a few minutes`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOptimizations();
  }, [code, language, currentUser?.username]);

  // Loading state with performance theme
  const renderLoadingState = () => (
    <div className="flex items-center justify-center h-40">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-red-600 font-medium">Analyzing performance...</p>
        <p className="text-xs text-gray-500 mt-1">
          Optimizing {language?.toUpperCase()} code for speed & efficiency
        </p>
      </div>
    </div>
  );

  // Error state with retry button
  const renderErrorState = () => (
    <div className="text-center p-6">
      <div className="text-red-500 text-4xl mb-4">⚠</div>
      <div className="text-red-700 font-semibold mb-2">Error occurred</div>
      <div className="text-sm text-gray-600 mb-4">{error}</div>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
      >
        Retry
      </button>
    </div>
  );

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
          <span>Back to Editor</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Status indicator */}
          {loading && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-100 px-3 py-1 rounded-full text-sm">
              <div className="animate-spin w-3 h-3 border border-red-600 border-t-transparent rounded-full"></div>
              <span>Optimizing...</span>
            </div>
          )}
          
          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-100 px-3 py-1 rounded-full text-sm">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Error</span>
            </div>
          )}

          {!loading && !error && optimizations && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Complete</span>
            </div>
          )}

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
            <span>New Code</span>
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
              <span>Original {language?.toUpperCase()} Code</span>
            </h2>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {code?.split("\n").length || 0} lines
              </span>
              <span className="text-red-600 bg-red-100 px-2 py-1 rounded">
                {language?.toUpperCase() || "N/A"}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg overflow-auto max-h-[500px] p-4 border">
            {renderCodeWithLineNumbers(code)}
          </div>
        </div>

        {/* Right: Performance Optimizations */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Performance Optimizations</span>
          </h2>
          
          <div className="bg-red-50 border border-red-200 rounded-lg flex-1 overflow-hidden">
            {loading ? (
              renderLoadingState()
            ) : error ? (
              renderErrorState()
            ) : (
              <div className="p-4 overflow-auto max-h-[500px]">
                {formatOptimizations(optimizations)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizeSection;