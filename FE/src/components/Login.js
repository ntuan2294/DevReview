import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/AuthService";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async () => {
    setIsLoading(true);
    const result = await AuthService.login(username, password);

    if (result.success) {
      AuthService.setCurrentUser(result.user);
      setMessage(result.message);
      setTimeout(() => {
        navigate("/editor");
      }, 1000);
    } else {
      setMessage(result.message);
    }
    setIsLoading(false);
  };

  const handleSignUp = async () => {
    if (isRegistering) {
      setIsLoading(true);
      const result = await AuthService.register(username, password);
      setMessage(result.message);

      if (result.success) {
        setTimeout(() => {
          setIsRegistering(false);
          setUsername("");
          setPassword("");
          setMessage("Đăng ký thành công! Bạn có thể đăng nhập ngay.");
        }, 1500);
      }
      setIsLoading(false);
    } else {
      setIsRegistering(true);
      setMessage("");
      setUsername("");
      setPassword("");
    }
  };

  const handleCancel = () => {
    setIsRegistering(false);
    setMessage("");
    setUsername("");
    setPassword("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (isRegistering) {
        handleSignUp();
      } else {
        handleSignIn();
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fillRule="evenodd"%3E%3Cg fill="%239C92AC" fillOpacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
          }}
        ></div>

        {/* Floating Elements */}
        <div
          className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          style={{
            animation: "pulse 2s infinite",
          }}
        ></div>
        <div
          className="absolute top-40 right-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          style={{
            animation: "pulse 2s infinite",
            animationDelay: "2s",
          }}
        ></div>
        <div
          className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          style={{
            animation: "pulse 2s infinite",
            animationDelay: "4s",
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-2 tracking-tight">
            DEVREVIEW
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-cyan-400 to-purple-400 mx-auto rounded-full"></div>
          <p className="text-gray-300 mt-4 text-sm">
            {isRegistering ? "Tạo tài khoản mới" : "Chào mừng trở lại"}
          </p>
        </div>

        {/* Login/Register Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="flex bg-gray-800/50 rounded-lg p-1">
              <button
                onClick={() => !isRegistering && setIsRegistering(false)}
                className={`px-6 py-2 rounded-md transition-all text-sm font-medium ${
                  !isRegistering
                    ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => isRegistering && setIsRegistering(true)}
                className={`px-6 py-2 rounded-md transition-all text-sm font-medium ${
                  isRegistering
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Đăng ký
              </button>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`p-4 mb-6 rounded-xl border backdrop-blur-sm text-center text-sm font-medium ${
                message.includes("thành công")
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-red-500/20 text-red-300 border-red-500/30"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {message.includes("thành công") ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {message}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Tên đăng nhập
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isRegistering
                      ? "Nhập tên đăng nhập (ít nhất 3 ký tự)"
                      : "Nhập tên đăng nhập"
                  }
                  className="w-full p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isRegistering
                      ? "Nhập mật khẩu (ít nhất 6 ký tự)"
                      : "Nhập mật khẩu"
                  }
                  className="w-full p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-4">
            {isRegistering ? (
              <>
                <button
                  onClick={handleSignUp}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    "Đăng ký"
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white py-3 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm border border-gray-600/50"
                >
                  Hủy
                </button>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            )}
          </div>

          {/* Toggle Button */}
          {!isRegistering && (
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Chưa có tài khoản?{" "}
                <button
                  onClick={() => setIsRegistering(true)}
                  className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  Đăng ký ngay
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-xs">
            © 2025 DevReview. Được phát triển với {String.fromCharCode(10084)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
