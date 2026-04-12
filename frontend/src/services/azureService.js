import axios from 'axios';
import { BlockBlobClient } from '@azure/storage-blob';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Helper to get Authorization header using JWT from localStorage
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Azure Service Layer
 * Handles the tri-step upload process:
 * 1. Request SAS URL from Backend
 * 2. Upload file directly to Azure Blob
 * 3. Save file metadata to PostgreSQL
 */
export const getSasAndUpload = async (file, onProgress) => {
  try {
    // Step 1: Request SAS URL from backend
    const sasResponse = await axios.get(`${API_BASE_URL}/files/upload-link`, {
      params: { 
        fileName: file.name,
        fileSize: file.size
      },
      headers: getAuthHeaders()
    });

    const { sasUrl, uniqueFileName } = sasResponse.data;

    // Step 2: Upload directly to Azure Blob Storage
    const blockBlobClient = new BlockBlobClient(sasUrl);
    
    // Setting up progress monitoring
    const options = {
      onProgress: (progress) => {
        const percent = Math.round((progress.loadedBytes / file.size) * 100);
        if (onProgress) onProgress(percent);
      },
      blobHTTPHeaders: { blobContentType: file.type }
    };

    // uploadData handles File object directly in browser
    await blockBlobClient.uploadData(file, options);

    // Step 3: Save metadata to PostgreSQL backend
    const metadataResponse = await axios.post(`${API_BASE_URL}/files/metadata`, {
      fileName: file.name,
      blobName: uniqueFileName,
      size: file.size,
      fileType: file.type,
      blobUrl: blockBlobClient.url.split('?')[0] // URL without SAS token
    }, {
      headers: getAuthHeaders()
    });

    return metadataResponse.data;
  } catch (error) {
    let step = 'unknown';
    if (!error.response) {
      if (error.message?.includes('Network Error')) step = 'Azure Upload (CORS/Network)';
      else step = 'Client logic';
    } else if (error.config.url.includes('upload-link')) {
      step = 'Backend SAS Generation';
    } else if (error.config.url.includes('blob.core.windows.net')) {
      step = 'Azure Blob Storage';
    } else if (error.config.url.includes('metadata')) {
      step = 'Backend Metadata Save';
    }

    const customError = new Error(error.message || 'Upload failed');
    customError.step = step;
    customError.status = error.response?.status;
    
    console.error(`Upload Error at step [${step}]:`, error);
    throw customError;
  }
};

/**
 * Fetch file list from backend
 */
export const listFiles = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/files`, {
      headers: getAuthHeaders()
    });
    return response.data.files;
  } catch (error) {
    console.error('List Files Error:', error);
    throw error;
  }
};

/**
 * Login function to store token
 */
export const login = async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
    }
    return response.data;
};

/**
 * Delete a file
 */
export const deleteFile = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/files/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Delete File Error:', error);
        throw error;
    }
};

/**
 * Get a temporary download link for a file
 */
export const getFileDownloadLink = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/files/download/${id}`, {
            headers: getAuthHeaders()
        });
        return response.data.downloadUrl;
    } catch (error) {
        console.error('Get Download Link Error:', error);
        throw error;
    }
};

/**
 * Get basic info for a file (for sharing)
 */
export const getFileInfo = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/files/info/${id}`, {
            headers: getAuthHeaders()
        });
        return response.data.file;
    } catch (error) {
        console.error('Get File Info Error:', error);
        throw error;
    }
};
/**
 * Save a shared file to the current user's drive
 */
export const saveSharedFileToDrive = async (fileId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/files/save-shared`, { fileId }, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error('Save Shared File Error:', error);
        throw error;
    }
};

/**
 * Admin: Get all users
 */
export const adminListUsers = async () => {
    const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: getAuthHeaders()
    });
    return response.data.users;
};

/**
 * Admin: Get all files
 */
export const adminListFiles = async () => {
    const response = await axios.get(`${API_BASE_URL}/admin/files`, {
        headers: getAuthHeaders()
    });
    return response.data.files;
};

/**
 * Payment: Create VNPay URL
 */
export const createPaymentUrl = async (amount, planId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/payment/create-url`, { amount, planId }, {
            headers: getAuthHeaders()
        });
        return response.data.paymentUrl;
    } catch (error) {
        console.error('Create Payment URL Error:', error);
        throw error;
    }
};

/**
 * Payment: Verify VNPay Return
 */
export const verifyPayment = async (queryParams) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/payment/vnpay-return`, {
            params: queryParams,
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error('Verify Payment Error:', error);
        throw error;
    }
};
