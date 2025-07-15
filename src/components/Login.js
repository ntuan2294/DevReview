import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // hook để điều hướng

  const handleSignIn = () => {
    if (username && password) {
      alert(`Đăng nhập thành công!`);
      navigate("/editor"); // chuyển sang giao diện CodeEditor
    } else {
      alert("Vui lòng nhập đầy đủ thông tin!");
    }
  };

  const handleSignUp = () => {
    alert("Chuyển sang trang đăng ký...");
  };

  const handleClear = () => {
    setUsername("");
    setPassword("");
  };

  return (
    <div className="w-full max-w-md mx-auto mt-8 p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Đăng nhập</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Tên đăng nhập:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nhập tên đăng nhập"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Mật khẩu:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
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
    </div>
  );
}

export default Login;
