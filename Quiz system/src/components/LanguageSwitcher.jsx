import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Globe, Check } from 'lucide-react';

const LanguageSwitcher = ({ className }) => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (e, lang) => {
    e.preventDefault();
    setLanguage(lang);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative z-50 h-11 min-w-[44px] px-3 md:px-4 flex items-center justify-center gap-2 bg-white/50 backdrop-blur-sm border border-slate-200 shadow-sm hover:bg-white/80 transition-all duration-200 touch-manipulation ${className}`}
          aria-label={language === 'en' ? "Switch to French" : "Passer en Anglais"}
        >
          <Globe className="w-5 h-5" />
          <span className="font-semibold text-sm uppercase">{language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 min-w-[150px]">
        <DropdownMenuItem 
          onClick={(e) => handleLanguageChange(e, 'fr')} 
          className="cursor-pointer min-h-[44px] flex items-center px-4 py-2 focus:bg-slate-100"
        >
          <span className="flex items-center w-full justify-between font-medium">
            {t('french')}
            {language === 'fr' && <Check className="w-4 h-4 ml-2 text-green-600" />}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={(e) => handleLanguageChange(e, 'en')} 
          className="cursor-pointer min-h-[44px] flex items-center px-4 py-2 focus:bg-slate-100"
        >
          <span className="flex items-center w-full justify-between font-medium">
            {t('english')}
            {language === 'en' && <Check className="w-4 h-4 ml-2 text-green-600" />}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;