import React, { useState, useEffect } from 'react';
import { adminListUsers, adminListFiles, getFileDownloadLink } from '../services/azureService';
import { 
  Users, 
  Files, 
  Shield, 
  User, 
  Calendar, 
  HardDrive,
  Mail,
  Search,
  Database,
  Loader2,
  ArrowLeft,
  Download,
  ChevronRight
} from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'files'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingUser, setViewingUser] = useState(null); // Track which user to show details for

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [allUsers, allFiles] = await Promise.all([
        adminListUsers(),
        adminListFiles()
      ]);
      setUsers(allUsers);
      setFiles(allFiles);
    } catch (error) {
      console.error('Admin fetch error:', error);
      alert('Không thể tải dữ liệu quản trị.');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (id, fileName) => {
    try {
      const downloadUrl = await getFileDownloadLink(id);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Không thể tải tệp tin.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFiles = files.filter(f => 
    f.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.owner_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Đang tải dữ liệu hệ thống...</p>
        </div>
      </div>
    );
  }

  // User Detail View
  if (viewingUser) {
    const userFiles = files.filter(f => f.owner_email === viewingUser.email);
    
    return (
      <div className="min-h-screen bg-[#0f172a] text-gray-200 p-8">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={() => setViewingUser(null)}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Quay lại danh sách</span>
          </button>

          <div className="bg-gray-800/30 border border-gray-700/50 rounded-3xl p-8 backdrop-blur-md mb-8">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center text-blue-400 text-3xl font-bold border border-blue-500/10">
                {viewingUser.full_name?.[0]?.toUpperCase() || <User className="w-10 h-10" />}
              </div>
              <div>
                <h2 className="text-3xl font-black text-white mb-2">{viewingUser.full_name || 'Người dùng'}</h2>
                <div className="flex items-center space-x-4 text-gray-400">
                  <span className="flex items-center"><Mail className="w-4 h-4 mr-2" /> {viewingUser.email}</span>
                  <span>•</span>
                  <span className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> Tham gia {new Date(viewingUser.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <Files className="w-5 h-5 mr-3 text-blue-500" />
            Tệp tin của người dùng ({userFiles.length})
          </h3>

          <div className="bg-gray-800/30 border border-gray-700/50 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700/50 bg-gray-900/40">
                    <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Tệp tin</th>
                    <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Dung lượng</th>
                    <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Ngày tải lên</th>
                    <th className="px-6 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {userFiles.map((f) => (
                    <tr 
                      key={f.id} 
                      className="group hover:bg-gray-700/20 transition-colors cursor-pointer"
                      onClick={() => handleDownload(f.id, f.file_name)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                            <Files className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="font-bold text-white group-hover:text-blue-200 transition-colors">
                            {f.file_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-400">
                        {formatSize(f.file_size)}
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-400">
                        {new Date(f.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="p-2 text-gray-600 group-hover:text-blue-400 transition-colors">
                          <Download className="w-5 h-5" />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {userFiles.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-20 text-center text-gray-500">Người dùng này chưa có tệp tin nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-200 p-8 pt-16">
      {/* Admin Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-gray-800/50">
          <div className="flex items-center space-x-5">
            <div className="p-4 bg-red-600/20 rounded-3xl shadow-2xl shadow-red-900/20 border border-red-500/20">
              <Shield className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight mb-1">Bảng điều khiển quản trị</h1>
              <p className="text-gray-400 font-medium">Hệ thống quản lý tệp tin Google Drive Mini</p>
            </div>
          </div>
          
          <div className="flex items-center bg-gray-900/40 rounded-[2rem] p-1.5 border border-gray-800 backdrop-blur-sm self-start lg:self-center mr-24">
            <button 
              onClick={() => { setActiveTab('users'); setViewingUser(null); }}
              className={`flex items-center space-x-3 px-8 py-3 rounded-[1.5rem] transition-all duration-500 ${
                activeTab === 'users' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-y-[-1px]' : 'text-gray-500 hover:text-white hover:bg-gray-800/40'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-bold text-sm tracking-wide">Người dùng ({users.length})</span>
            </button>
            <button 
              onClick={() => { setActiveTab('files'); setViewingUser(null); }}
              className={`flex items-center space-x-3 px-8 py-3 rounded-[1.5rem] transition-all duration-500 ${
                activeTab === 'files' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-y-[-1px]' : 'text-gray-500 hover:text-white hover:bg-gray-800/40'
              }`}
            >
              <Files className="w-5 h-5" />
              <span className="font-bold text-sm tracking-wide">Tệp tin ({files.length})</span>
            </button>
          </div>
        </div>

        {/* System Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg"><User className="w-5 h-5 text-blue-400" /></div>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Target reached</span>
            </div>
            <h4 className="text-3xl font-black text-white">{users.length}</h4>
            <p className="text-sm text-gray-400">Tổng tài khoản đăng ký</p>
          </div>
          <div className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg"><Database className="w-5 h-5 text-purple-400" /></div>
            </div>
            <h4 className="text-3xl font-black text-white">{files.length}</h4>
            <p className="text-sm text-gray-400">Tổng tệp tin trên hệ thống</p>
          </div>
          <div className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg"><HardDrive className="w-5 h-5 text-green-400" /></div>
            </div>
            <h4 className="text-3xl font-black text-white">{formatSize(files.reduce((acc, f) => acc + parseInt(f.file_size || 0), 0))}</h4>
            <p className="text-sm text-gray-400">Dung lượng lưu trữ đã dùng</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-8 relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text"
            placeholder={activeTab === 'users' ? "Tìm kiếm user theo email hoặc tên..." : "Tìm kiếm file hoặc người upload..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800/80 border border-gray-700 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
          />
        </div>

        {/* Content Section */}
        <div className="mt-8 bg-gray-800/30 border border-gray-700/50 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
          {activeTab === 'users' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700/50 bg-gray-900/40">
                    <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Người dùng</th>
                    <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Gói cước</th>
                    <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Vai trò</th>
                    <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Ngày tham gia</th>
                    <th className="px-6 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {filteredUsers.map((u) => (
                    <tr 
                      key={u.id} 
                      className="group hover:bg-gray-700/20 transition-colors cursor-pointer"
                      onClick={() => setViewingUser(u)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 font-bold border border-blue-500/10">
                            {u.full_name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{u.full_name || 'N/A'}</div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <Mail className="w-3 h-3 mr-1" /> {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                          u.plan === 'pro' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                          u.plan === 'plus' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                          'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                          {u.plan || 'free'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-tighter ${
                          u.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                          {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="p-2 text-gray-600 group-hover:text-white transition-colors">
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-20 text-center text-gray-500">Không tìm thấy người dùng nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700/50 bg-gray-900/40">
                    <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Tệp tin</th>
                    <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Người upload</th>
                    <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Dung lượng</th>
                    <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Ngày tải lên</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {filteredFiles.map((f) => (
                    <tr 
                      key={f.id} 
                      className="group hover:bg-gray-700/20 transition-colors cursor-pointer"
                      onClick={() => handleDownload(f.id, f.file_name)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                            <Files className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="font-bold text-white group-hover:text-blue-200 transition-colors truncate max-w-[200px]" title={f.file_name}>
                            {f.file_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-medium text-gray-300">{f.owner_name}</div>
                        <div className="text-[11px] text-gray-500">{f.owner_email}</div>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-400">
                        {formatSize(f.file_size)}
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-400 text-right">
                        <div className="flex items-center justify-end">
                           <span className="mr-4">{new Date(f.created_at).toLocaleDateString()}</span>
                           <Download className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredFiles.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-20 text-center text-gray-500">Không tìm thấy tệp tin nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
