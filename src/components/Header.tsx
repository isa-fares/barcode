import React from 'react';

interface HeaderProps {
  title: string;
  subtitle: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="text-center mb-8 md:mb-12">
      <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-xl md:text-2xl">
        {subtitle}
      </p>
    </div>
  );
};

export default Header;