import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { FaUserPlus, FaChevronRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const RecruitmentCard = () => {
  const { t } = useTranslation();
  const backgrounds = [
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  ];

  const [currentBg, setCurrentBg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl shadow-lg h-36 group">
      {/* Images d'arrière-plan */}
      <div className="absolute inset-0 transition-opacity duration-1000">
        {backgrounds.map((bg, index) => (
          <div 
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${index === currentBg ? 'opacity-100' : 'opacity-0'}`}
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${bg})`,
            }}
          />
        ))}
      </div>
      
      {/* Contenu de la carte */}
      <div className="relative z-10 h-full flex flex-col justify-between p-4 text-white">
        <div>
          <h3 className="text-xl font-bold mb-1">{t('job_offers.title')}</h3>
          <p className="text-sm opacity-90">{t ('job_offers.subtitle')}</p>
        </div>
        
        <Link 
          href="/recruitment"
          className="inline-flex items-center justify-between px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg hover:bg-opacity-30 transition-all group-hover:translate-x-1"
        >
          <span className="font-medium">{t('job_offers.cta')}</span>
          <FaChevronRight className="ml-2 h-3 w-3 opacity-70 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      
      {/* Indicateurs de diapositive */}
      <div className="absolute bottom-3 right-3 flex space-x-1">
        {backgrounds.map((_, index) => (
          <span 
            key={index}
            className={`block w-1.5 h-1.5 rounded-full transition-all ${index === currentBg ? 'bg-white w-6' : 'bg-white bg-opacity-50'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default RecruitmentCard;
