import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import { login } from './services/azureService';
import { Lock, Mail, Loader2 } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingShareId, setPendingShareId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setUserRole(localStorage.getItem('userRole') || 'user');
    }

    // Check for shareId in URL
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('shareId');
    if (shareId) {
      setPendingShareId(shareId);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(email, password);
      setIsAuthenticated(true);
      setUserRole(data.user.role);
      localStorage.setItem('userRole', data.user.role);
    } catch (err) {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const resp = await axios.post('http://localhost:5000/api/auth/register', {
        email,
        password,
        fullName
      });
      setSuccess('Đăng ký thành công! Hãy đăng nhập.');
      setIsRegisterMode(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserRole('user');
  };

  if (isAuthenticated) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute top-6 right-6 z-50 flex items-center space-x-4">
          {userRole === 'admin' && (
            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter">
              Admin Mode
            </span>
          )}
          <button
            onClick={handleLogout}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm text-white px-4 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-gray-900/40"
          >
            Đăng xuất
          </button>
        </div>
        
        {userRole === 'admin' ? <AdminDashboard /> : (
          <Dashboard 
            pendingShareId={pendingShareId} 
            onShareHandled={() => setPendingShareId(null)} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-600/20 rounded-xl mb-4">
            <Lock className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Google Drive Mini</h1>
          <p className="text-gray-400 mt-2">
            {isRegisterMode ? 'Tạo tài khoản mới' : 'Đăng nhập để quản lý tệp tin'}
          </p>
        </div>

        {success && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-sm text-green-400 text-center">
            {success}
          </div>
        )}

        <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-6">
          {isRegisterMode && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Họ tên</label>
              <input
                type="text"
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="demo@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>{isRegisterMode ? 'Đăng ký' : 'Đăng nhập'}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError('');
              setSuccess('');
            }}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {isRegisterMode ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700 text-center">
          <p className="text-sm text-gray-500">
            Dự án Google Drive Mini - IT Cybersecurity Student
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
