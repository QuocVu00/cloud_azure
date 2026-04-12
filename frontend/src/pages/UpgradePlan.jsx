import React, { useState } from 'react';
import { Check, Zap, Crown, Loader2, ArrowLeft } from 'lucide-react';
import { createPaymentUrl } from '../services/azureService';

const UpgradePlan = ({ onBack }) => {
  const [loading, setLoading] = useState(null); // 'plus' or 'pro'

  const plans = [
    {
      id: 'plus',
      name: 'Plus',
      price: '50.000',
      numericPrice: 50000,
      quota: '15GB',
      icon: <Zap className="w-8 h-8 text-amber-500" />,
      color: 'amber',
      features: [
        'Dung lượng lưu trữ 15GB',
        'Băng thông tải xuống tốc độ cao',
        'Giao diện Plus Gold đặc quyền',
        'Hỗ trợ khách hàng ưu tiên'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '120.000',
      numericPrice: 120000,
      quota: '50GB',
      icon: <Crown className="w-8 h-8 text-purple-500" />,
      color: 'purple',
      features: [
        'Dung lượng lưu trữ 50GB',
        'Toàn bộ tính năng Plus',
        'Giao diện Pro Royal Diamond',
        'Không giới hạn thời gian chia sẻ',
        'Đặc quyền Admin (nếu yêu cầu)'
      ]
    }
  ];

  const handleUpgrade = async (plan) => {
    setLoading(plan.id);
    try {
      const paymentUrl = await createPaymentUrl(plan.numericPrice, plan.id);
      // Redirect to VNPay
      window.location.href = paymentUrl;
    } catch (error) {
      alert('Không thể tạo liên kết thanh toán. Vui lòng thử lại.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-12 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Quay lại Dashboard</span>
        </button>

        <div className="text-center mb-16">
          <h1 className="text-5xl font-black mb-4 tracking-tight">Nâng cấp không gian lưu trữ</h1>
          <p className="text-gray-400 text-lg">Mở rộng giới hạn, trải nghiệm tốc độ và đặc quyền cao cấp nhất.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative bg-gray-800/40 border-2 rounded-[2.5rem] p-8 backdrop-blur-md transition-all duration-500 hover:scale-[1.02] ${
                plan.id === 'plus' ? 'border-amber-500/30 hover:shadow-amber-900/20' : 'border-purple-500/30 hover:shadow-purple-900/20'
              } flex flex-col`}
            >
              <div className="flex justify-between items-start mb-8">
                <div className={`p-4 rounded-3xl ${plan.id === 'plus' ? 'bg-amber-500/10' : 'bg-purple-500/10'}`}>
                  {plan.icon}
                </div>
                <div className="text-right">
                  <span className="block text-sm font-bold text-gray-500 uppercase tracking-widest">{plan.name} Plan</span>
                  <div className="text-3xl font-black text-white">{plan.quota}</div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-xl text-gray-500 ml-1">VND</span>
                </div>
                <p className="text-sm text-gray-400 italic">Thanh toán một lần qua VNPay</p>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center space-x-3 text-sm text-gray-300">
                    <Check className={`w-4 h-4 ${plan.id === 'plus' ? 'text-amber-500' : 'text-purple-500'}`} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={loading !== null}
                onClick={() => handleUpgrade(plan)}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl flex items-center justify-center space-x-2 ${
                  plan.id === 'plus' 
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:shadow-amber-900/40 text-black' 
                    : 'bg-gradient-to-r from-purple-700 to-purple-600 hover:shadow-purple-900/40 text-white'
                }`}
              >
                {loading === plan.id ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <span>Nâng cấp ngay</span>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
            <p className="text-gray-500 text-sm">
                Bảo mật và an toàn qua cổng thanh toán VNPay Sandbox. <br/>
                Mọi thắc mắc vui lòng liên hệ Admin hệ thống.
            </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradePlan;
