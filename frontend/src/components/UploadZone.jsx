import React, { useState, useCallback } from 'react';
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react';
import { getSasAndUpload } from '../services/azureService';

const UploadZone = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState([]); // Array to track multiple uploads

  const handleUpload = async (file) => {
    // 1GB check (1024^3 bytes)
    if (file.size > 1024 * 1024 * 1024) {
      alert(`File "${file.name}" quá lớn. Giới hạn upload là 1GB.`);
      return;
    }

    const uploadId = Date.now() + Math.random();
    const newUpload = { id: uploadId, name: file.name, progress: 0, status: 'uploading' };
    
    setUploads(prev => [newUpload, ...prev]);

    try {
      await getSasAndUpload(file, (percent) => {
        setUploads(prev => prev.map(u => 
          u.id === uploadId ? { ...u, progress: percent } : u
        ));
      });

      setUploads(prev => prev.map(u => 
        u.id === uploadId ? { ...u, status: 'success', progress: 100 } : u
      ));

      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error('Upload catch:', error);
      setUploads(prev => prev.map(u => 
        u.id === uploadId ? { 
          ...u, 
          status: 'error', 
          errorMsg: `Lỗi: ${error.step || 'Không xác định'} ${error.status ? `(${error.status})` : ''}`
        } : u
      ));
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(handleUpload);
  }, []);

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Drag and Drop Area */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-300 ${
          isDragging ? 'border-blue-500 bg-blue-50/10' : 'border-gray-600 bg-gray-800/50'
        }`}
      >
        <Upload className={`w-12 h-12 mb-4 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
        <h3 className="text-xl font-semibold mb-2 text-white">Thả file vào đây để Upload</h3>
        <p className="text-gray-400">Hoặc chọn file từ máy tính</p>
        <input 
          type="file" 
          multiple 
          className="hidden" 
          id="fileInput" 
          onChange={(e) => Array.from(e.target.files).forEach(handleUpload)}
        />
        <label 
          htmlFor="fileInput" 
          className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
        >
          Chọn File
        </label>
      </div>

      {/* Progress List */}
      <div className="mt-6 space-y-3">
        {uploads.map((upload) => (
          <div key={upload.id} className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3 overflow-hidden">
                <File className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-200 truncate">{upload.name}</span>
              </div>
              <div>
                {upload.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {upload.status === 'error' && (
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-red-500 max-w-[100px] truncate">{upload.errorMsg}</span>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                )}
                {upload.status === 'uploading' && <span className="text-xs text-blue-400">{upload.progress}%</span>}
              </div>
            </div>
            {upload.status === 'uploading' && (
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${upload.progress}%` }}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadZone;
