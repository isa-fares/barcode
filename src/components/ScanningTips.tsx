import React from 'react';

const ScanningTips: React.FC = () => {
  const tips = [
    {
      text: 'تأكد من وضوح الإضاءة',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
    },
    {
      text: 'اجعل الكود في وسط الإطار',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      text: 'تجنب اهتزاز اليد',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    }
  ];

  return (
    <div className="mt-12 md:mt-16 max-w-lg md:max-w-2xl text-center">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl mb-20 p-12  shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-gray-900 dark:text-white font-semibold mb-6 text-xl md:text-2xl">
          نصائح للمسح الأمثل:
        </h3>
        <ul className="text-slate-600 dark:text-slate-300 text-lg md:text-xl space-y-4 text-right">
          {tips.map((tip, index) => (
            <li key={index} className="flex items-center justify-start">
              <div className={`ml-4 w-8 h-8 md:w-10 md:h-10 ${tip.bgColor} rounded-full flex items-center justify-center`}>
                {tip.icon}
              </div>
              <span>{tip.text}</span>

            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ScanningTips;