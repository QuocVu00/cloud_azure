import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  File as FileIcon, 
  MoreVertical, 
  Download, 
  Trash2,
  HardDrive
} from 'lucide-react';
import { listFiles, deleteFile, getFileDownloadLink, getFileInfo, saveSharedFileToDrive } from '../services/azureService';
import UploadZone from '../components/UploadZone';

const Dashboard = ({ pendingShareId, onShareHandled }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null); // Track ID of file with open menu
  const [sharedFile, setSharedFile] = useState(null); // Metadata of file from share link
  const [totalUsage, setTotalUsage] = useState(0);
  const MAX_QUOTA = 5 * 1024 * 1024 * 1024; // 5GB

  const fetchFiles = async () => {
    try {
      const data = await listFiles();
      setFiles(data);
      const usage = data.reduce((acc, f) => acc + parseInt(f.file_size || 0), 0);
      setTotalUsage(usage);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Handle pendingShareId from URL after login
  useEffect(() => {
    const handleSharedFile = async () => {
      if (pendingShareId) {
        try {
          // Fetch file info from server (can be from any user)
          const shareFile = await getFileInfo(pendingShareId);
          if (shareFile) {
            // Set shared file metadata for preview instead of auto-download
            setSharedFile(shareFile);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            if (onShareHandled) onShareHandled();
          }
        } catch (error) {
          console.error('Failed to handle share link:', error);
          alert('Không thể truy cập tệp tin được chia sẻ.');
          if (onShareHandled) onShareHandled();
        }
      }
    };

    if (pendingShareId) {
      handleSharedFile();
    }
  }, [pendingShareId]);

  const getFileIcon = (type) => {
    if (type?.includes('image')) return <ImageIcon className="text-pink-400" />;
    if (type?.includes('pdf')) return <FileText className="text-red-400" />;
    return <FileIcon className="text-blue-400" />;
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa file này không?')) return;
    try {
      await deleteFile(id);
      fetchFiles(); // Refresh list
    } catch (error) {
      console.error('Delete error:', error);
      alert('Xóa file thất bại.');
    }
  };

  const handleDownload = async (id, fileName) => {
    try {
      const downloadUrl = await getFileDownloadLink(id);
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setActiveMenu(null);
    } catch (error) {
      console.error('Download error:', error);
      alert('Không thể tạo link tải xuống.');
    }
  };

  const handleDownloadAndSave = async (id, fileName) => {
    try {
      // 1. Save to current user's drive
      await saveSharedFileToDrive(id);
      // 2. Trigger browser download
      await handleDownload(id, fileName);
      // 3. Clear preview and refresh main list
      setSharedFile(null);
      fetchFiles();
    } catch (error) {
      console.error('Download & Save error:', error);
      alert('Không thể tải về và lưu tệp tin.');
    }
  };

  const handleCopyLink = async (id) => {
    try {
      // Generate an app link instead of a direct SAS link
      const shareUrl = `${window.location.origin}/?shareId=${id}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Đã sao chép link chia sẻ! Người nhận cần đăng nhập để xem file này.');
      setActiveMenu(null);
    } catch (error) {
      console.error('Copy link error:', error);
      alert('Không thể tạo link chia sẻ.');
    }
  };

  return (

    <div 
      className="min-h-screen bg-[#0f172a] text-gray-200 p-8 pt-16"
      onClick={() => setActiveMenu(null)}
    >
      {/* Shared File Preview Card */}
      {sharedFile && (
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-2 border-blue-500/30 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={() => setSharedFile(null)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <MoreVertical className="w-5 h-5 rotate-45" /> {/* Close icon using rotated menu */}
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="p-4 bg-blue-600/30 rounded-2xl">
                {getFileIcon(sharedFile.file_type)}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                  Tệp tin được chia sẻ
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{sharedFile.file_name}</h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-400">
                  <span>Dung lượng: {formatSize(sharedFile.file_size)}</span>
                  <span>•</span>
                  <span>Người gửi: <b className="text-gray-200">{sharedFile.owner_email}</b></span>
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[200px]">
                <button 
                  onClick={() => handleDownloadAndSave(sharedFile.id, sharedFile.file_name)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  <Download className="w-5 h-5" /> Tải về & Lưu vào Drive
                </button>
                <button 
                  onClick={() => setSharedFile(null)}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 px-6 rounded-xl transition-all text-sm"
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 border-b border-gray-800 pb-8 gap-6">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-900/30">
            <HardDrive className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Google Drive Mini</h1>
            <p className="text-gray-500 text-sm font-medium">Lưu trữ tệp tin cá nhân an toàn</p>
          </div>
        </div>

        {/* Improved Storage Meter */}
        <div className="flex flex-col w-full md:w-64">
           <div className="flex justify-between items-end mb-2">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bộ nhớ đã dùng</span>
             <span className="text-sm font-black text-blue-400">
               {((totalUsage / MAX_QUOTA) * 100).toFixed(1)}%
             </span>
           </div>
           <div className="h-2.5 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700/50 p-[2px]">
             <div 
               className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${
                 (totalUsage / MAX_QUOTA) > 0.9 ? 'bg-red-500 shadow-red-900/40' : 'bg-gradient-to-r from-blue-600 to-blue-400 shadow-blue-900/40'
               }`} 
               style={{ width: `${Math.min((totalUsage / MAX_QUOTA) * 100, 100)}%` }}
             ></div>
           </div>
           <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-500 uppercase">
             <span>{formatSize(totalUsage)}</span>
             <span>Tối đa 5GB</span>
           </div>
        </div>

        <div className="flex items-center space-x-4 pr-24">
            {/* Space reserved for Logout Button */}
        </div>
      </div>

      {/* Upload Section */}
      <section className="mb-12">
        <UploadZone onUploadSuccess={fetchFiles} />
      </section>

      {/* File Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-100">Tất cả tệp tin</h2>
          <span className="text-sm text-gray-400">{files.length} tệp</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {files.map((file) => (
              <div 
                key={file.id} 
                className="group bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800 hover:border-blue-500/50 transition-all duration-300 cursor-pointer relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-gray-700/50 rounded-lg">
                    {getFileIcon(file.file_type)}
                  </div>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === file.id ? null : file.id);
                      }}
                      className="text-gray-500 hover:text-white transition-colors p-1"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {activeMenu === file.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                        <button 
                          onClick={() => handleCopyLink(file.id)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                        >
                          <span className="w-4 h-4">🔗</span> Sao chép link chia sẻ
                        </button>
                        <button 
                          onClick={() => handleDownload(file.id, file.file_name)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 md:hidden flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Tải xuống
                        </button>
                        <button 
                          onClick={() => handleDelete(file.id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Xóa tệp tin
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mb-2">
                  <p className="text-sm font-medium text-gray-100 truncate pr-4" title={file.file_name}>
                    {file.file_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatSize(file.file_size)}
                  </p>
                </div>

                {/* Quick Actions Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-around rounded-b-xl">
                    <button 
                        onClick={() => handleDownload(file.id, file.file_name)} 
                        className="p-2 hover:bg-blue-600 rounded-lg transition-colors"
                        title="Tải xuống"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => handleDelete(file.id)}
                        className="p-2 hover:bg-red-600 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

              </div>
            ))}
          </div>
        )}

        {!loading && files.length === 0 && (
          <div className="text-center py-20 bg-gray-800/20 rounded-2xl border-2 border-dashed border-gray-700">
            <p className="text-gray-500">Chưa có tệp tin nào. Hãy kéo thả file để bắt đầu.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
