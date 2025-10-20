import { useTranslations } from 'next-intl';
import React from 'react';

const LoginPage = () => {
  const DARK_GREEN = 'bg-[#2E5C3E]'; 
  const MEDIUM_GREEN = 'bg-[#5c8d6b]'; 
  const LIGHT_GREEN = 'bg-[#E9F5E9]'; 
  const t = useTranslations('HomePage');

  return (
    <div className={`min-h-screen bg-[#E9F5E9] flex flex-col items-center p-4 sm:p-8 font-sans`}>

      {/* <header className="w-full max-w-5xl flex justify-between items-center mb-6">
        <div className="text-xl font-bold text-[#2E5C3E]">QHome</div>
        <div className="flex items-center space-x-2">
          <Flag className="text-red-500 w-5 h-5" />
          <div className="w-10 h-6 rounded-full bg-gray-300 relative">
            <div className="absolute w-4 h-4 bg-white rounded-full top-1 left-1 shadow"></div>
          </div>
        </div>
      </header> */}

      <div className="flex w-full max-w-4xl min-h-[500px] bg-white rounded-xl shadow-xl overflow-hidden">

        {/* Phần bên trái: Chào mừng (WELLCOME TO QHOME PMS) */}
        <div className={`hidden lg:flex flex-col flex-1 bg-[#2E5C3E] text-white p-10 justify-around relative rounded-l-xl`}>
          
          <style jsx>{`
            .welcome-section-tail::after {
              content: '';
              position: absolute;
              top: 0;
              right: -30px; 
              bottom: 0;
              width: 100px; 
              background-color: #2E5C3E;
              transform: skewX(-10deg); 
              z-index: 10;
            }
            .welcome-content-tail {
                position: relative;
                z-index: 20;
            }
          `}</style>

          <div className="welcome-section-tail absolute inset-0 rounded-l-xl"></div>
          <div className="welcome-content-tail flex flex-col justify-around h-full">
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              {t('HomePage.title')}
            </h1>
            
            <div className="text-center mt-8">
              <Image src="/images/login-illustration.png" alt="Welcome Illustration" width={200} height={200} />
            </div>
          </div>
        </div>

        {/* Phần bên phải: Form Login */}
        <div className="flex-1 p-8 sm:p-12 flex flex-col justify-center relative z-20">
          <h2 className="text-3xl font-semibold text-[#2E5C3E] mb-8">Login</h2>

          <form className="space-y-6">
            
            {/* Input Email */}
            <div className="relative">
              <input
                type="email"
                placeholder="Email"
                className="w-full py-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c8d6b] focus:border-[#5c8d6b] outline-none"
              />
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            {/* Input Password */}
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                className="w-full py-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c8d6b] focus:border-[#5c8d6b] outline-none"
              />
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            <div className="text-right">
              <a href="#" className="text-sm text-[#5c8d6b] hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Nút Login */}
            <button
              type="submit"
              className={`w-full py-3 text-white font-medium rounded-lg ${MEDIUM_GREEN} hover:bg-[#4a7758] transition duration-200`}
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;