import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSignIn = () => {
    const result = authService.login(username, password);
    
    if (result.success) {
      authService.setCurrentUser(result.account);
      setMessage(result.message);
      setTimeout(() => {
        navigate("/editor");
      }, 1000);
    } else {
      setMessage(result.message);
    }
  };

  const handleSignUp = () => {
    if (isRegistering) {
      // Xử lý đăng ký
      const result = authService.register(username, password);
      setMessage(result.message);
      
      if (result.success) {
        setTimeout(() => {
          setIsRegistering(false);
          setUsername("");
          setPassword("");
          setMessage("Đăng ký thành công! Bạn có thể đăng nhập ngay.");
        }, 1500);
      }
    } else {
      // Chuyển sang chế độ đăng ký
      setIsRegistering(true);
      setMessage("");
      setUsername("");
      setPassword("");
    }
  };

  const handleClear = () => {
    setUsername("");
    setPassword("");
    setMessage("");
  };

  const handleCancel = () => {
    setIsRegistering(false);
    setMessage("");
    setUsername("");
    setPassword("");
  };

  return (
    <div className="w-full max-w-md mx-auto mt-8 p-6">
      <h1 className="text-2xl font-bold text-center mb-6">
        {isRegistering ? "Đăng ký tài khoản" : "Đăng nhập"}
      </h1>

      {message && (
        <div className={`p-3 mb-4 rounded-lg text-center ${
          message.includes("thành công") 
            ? "bg-green-100 text-green-800 border border-green-300"
            : "bg-red-100 text-red-800 border border-red-300"
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Tên đăng nhập:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={isRegistering ? "Nhập tên đăng nhập (ít nhất 3 ký tự)" : "Nhập tên đăng nhập"}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Mật khẩu:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isRegistering ? "Nhập mật khẩu (ít nhất 6 ký tự)" : "Nhập mật khẩu"}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {isRegistering ? (
          <>
            <button
              onClick={handleSignUp}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Đăng ký
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleClear}
                className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={handleSignIn}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Đăng nhập
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleSignUp}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Đăng ký
              </button>
              <button
                onClick={handleClear}
                className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Thông tin hiện tại:</h3>
        <p className="text-sm text-gray-600">
          Tên đăng nhập: {username || "Chưa nhập"}
        </p>
        <p className="text-sm text-gray-600">
          Mật khẩu: {password ? "*".repeat(password.length) : "Chưa nhập"}
        </p>
      </div>

      {/* Hiển thị số lượng tài khoản đã đăng ký */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Đã có {authService.getAllAccounts().length} tài khoản đăng ký
      </div>
    </div>
  );
}

export default Login;