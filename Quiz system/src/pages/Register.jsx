import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Lock, Mail, User, ArrowRight } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useToast } from '@/components/ui/use-toast';

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password || !fullName || !confirmPassword) {
      toast({
        variant: "destructive",
        title: t('validationError'),
        description: t('fillAllFields'),
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t('validationError'),
        description: t('passwordsNoMatch'),
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: t('validationError'),
        description: t('minChars'),
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await signUp(email, password, {
        data: {
          full_name: fullName,
          role: 'user' // Default role
        }
      });

      if (error) {
        // Error handled in signUp context, but we can do specific UI updates here if needed
        return;
      }

      if (data) {
        toast({
          title: t('success'),
          description: "Account created! Please sign in.",
        });
        navigate('/login');
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: error.message === "Failed to fetch" 
          ? "Network error. Please check your internet connection." 
          : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('appTitle')} - {t('registerButton')}</title>
        <meta name="description" content="Create a new account" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute top-1/2 -left-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
          <LanguageSwitcher className="text-slate-600 hover:bg-slate-100" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[400px] sm:max-w-[440px] relative z-10"
        >
          <div className="text-center mb-8 sm:mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-xl mb-4 sm:mb-6 shadow-lg shadow-blue-600/20"
            >
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">{t('appTitle')}</h1>
            <p className="text-slate-500 text-base sm:text-lg font-light">{t('appSubtitle')}</p>
          </div>

          <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm ring-1 ring-slate-100">
            <CardHeader className="space-y-1 pb-4 sm:pb-6 pt-6 sm:pt-8 px-6 sm:px-8">
              <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800">{t('createAccount')}</CardTitle>
              <CardDescription className="text-slate-500 text-sm sm:text-base">{t('createAccountSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">{t('fullNameLabel')}</Label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="pl-11 h-10 sm:h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">{t('emailLabel')}</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-11 h-10 sm:h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">{t('passwordLabel')}</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pl-11 h-10 sm:h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">{t('passwordLabel')} (Confirm)</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pl-11 h-10 sm:h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200 mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      {t('creatingAccount')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t('registerButton')}
                      <ArrowRight className="w-4 h-4 opacity-80" />
                    </span>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <p className="text-slate-600">
                    {t('alreadyAccount')}{' '}
                    <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline decoration-2 underline-offset-2 transition-all">
                      {t('loginLink')}
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Register;