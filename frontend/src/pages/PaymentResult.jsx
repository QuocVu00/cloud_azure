import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { verifyPayment } from '../services/azureService';

const PaymentResult = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading, success, failure
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            const queryParams = Object.fromEntries(new URLSearchParams(location.search));
            try {
                const result = await verifyPayment(queryParams);
                if (result.success) {
                    setStatus('success');
                    setMessage(result.message);
                    // Crucial: Update local user info if needed, or just let Dashboard refresh on mount
                } else {
                    setStatus('failure');
                    setMessage(result.message || 'Thanh toán không thành công.');
                }
            } catch (error) {
                setStatus('failure');
                setMessage('Lỗi hệ thống khi xác thực thanh toán.');
            }
        };

        verify();
    }, [location]);

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-gray-800/50 border border-gray-700 rounded-[2.5rem] p-10 text-center backdrop-blur-md shadow-2xl">
                {status === 'loading' && (
                    <div className="py-12">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2">Đang xác thực giao dịch</h2>
                        <p className="text-gray-400">Vui lòng không đóng trình duyệt...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="py-8 animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4">Thành công!</h2>
                        <p className="text-gray-400 mb-8">{message}</p>
                        <button 
                            onClick={() => {
                                // Force reload to get new quota
                                window.location.href = '/';
                            }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-green-900/20 flex items-center justify-center space-x-2"
                        >
                            <span>Về Dashboard</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {status === 'failure' && (
                    <div className="py-8 animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                            <XCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4">Thất bại</h2>
                        <p className="text-gray-400 mb-8">{message}</p>
                        <button 
                            onClick={() => navigate('/')}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-2xl transition-all"
                        >
                            Quay lại trang chủ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentResult;
