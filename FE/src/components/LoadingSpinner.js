// LoadingSpinner.js - Component loading thống nhất cho tất cả các trang
import React from "react";

const LoadingSpinner = ({
  message = "Đang xử lý...",
  submessage = null,
  color = "blue", // blue, orange, green
  size = "medium", // small, medium, large
}) => {
  // Định nghĩa màu sắc
  const colorClasses = {
    blue: {
      spinner: "border-blue-500",
      text: "text-blue-600",
      subtext: "text-blue-400",
    },
    orange: {
      spinner: "border-orange-500",
      text: "text-orange-600",
      subtext: "text-orange-400",
    },
    green: {
      spinner: "border-green-500",
      text: "text-green-600",
      subtext: "text-green-400",
    },
    purple: {
      spinner: "border-purple-500",
      text: "text-purple-600",
      subtext: "text-purple-400",
    },
  };

  // Định nghĩa kích thước
  const sizeClasses = {
    small: {
      spinner: "w-6 h-6",
      container: "h-24",
      text: "text-sm",
      subtext: "text-xs",
    },
    medium: {
      spinner: "w-8 h-8",
      container: "h-40",
      text: "text-base",
      subtext: "text-sm",
    },
    large: {
      spinner: "w-12 h-12",
      container: "h-56",
      text: "text-lg",
      subtext: "text-base",
    },
  };

  const currentColor = colorClasses[color] || colorClasses.blue;
  const currentSize = sizeClasses[size] || sizeClasses.medium;

  return (
    <div
      className={`flex items-center justify-center ${currentSize.container}`}
    >
      <div className="text-center">
        {/* Animated Spinner */}
        <div
          className={`
          animate-spin ${currentSize.spinner} 
          border-2 ${currentColor.spinner} 
          border-t-transparent rounded-full mx-auto mb-4
          shadow-lg
        `}
        ></div>

        {/* Main Loading Message */}
        <p
          className={`${currentColor.text} font-semibold ${currentSize.text} mb-1`}
        >
          {message}
        </p>

        {/* Optional Submessage */}
        {submessage && (
          <p
            className={`${currentColor.subtext} ${currentSize.subtext} italic`}
          >
            {submessage}
          </p>
        )}

        {/* Animated Dots */}
        <div className="flex justify-center mt-2 space-x-1">
          <div
            className={`w-2 h-2 ${currentColor.spinner.replace(
              "border-",
              "bg-"
            )} rounded-full animate-bounce`}
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className={`w-2 h-2 ${currentColor.spinner.replace(
              "border-",
              "bg-"
            )} rounded-full animate-bounce`}
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className={`w-2 h-2 ${currentColor.spinner.replace(
              "border-",
              "bg-"
            )} rounded-full animate-bounce`}
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
