import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submissionLoading, setSubmissionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const validateForm = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = t('validation.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('validation.email');
    }
    if (!password) {
      newErrors.password = t('validation.required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmissionLoading(true);

    try {
      const { data, error } = await signIn(email.trim(), password);
      
      if (error) throw error;
      
      if (data) {
        toast({
          title: t('auth.login.success'),
          description: t('auth.login.successDesc'),
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Login submission error:", error);
      toast({
        variant: "destructive",
        title: t('auth.login.error'),
        description: t('auth.login.errorDesc'),
      });
    } finally {
      setSubmissionLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.login.title')} - {t('app.title')}</title>
        <meta name="description" content={t('auth.login.description')} />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>
        
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[420px] relative z-10"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-6 shadow-lg shadow-blue-600/20"
            >
              <GraduationCap className="w-7 h-7 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{t('app.title')}</h1>
            <p className="text-slate-500 text-lg font-light">{t('app.subtitle')}</p>
          </div>

          <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm ring-1 ring-slate-100">
            <CardHeader className="space-y-1 pb-6 pt-8 px-8">
              <CardTitle className="text-2xl font-bold text-slate-800">{t('auth.login.title')}</CardTitle>
              <CardDescription className="text-base">{t('auth.login.description')}</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">{t('auth.login.email')}</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: null });
                      }}
                      className={`pl-11 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">{t('auth.login.password')}</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: null });
                      }}
                      className={`pl-11 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={submissionLoading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200"
                >
                  {submissionLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('auth.login.submitting')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t('auth.login.submit')}
                      <ArrowRight className="w-5 h-5 opacity-80" />
                    </span>
                  )}
                </Button>

                <div className="text-center mt-6">
                  <p className="text-slate-600">
                    <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline decoration-2 underline-offset-2 transition-all">
                      {t('auth.login.noAccount')}
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <p className="text-sm text-slate-500 font-light">&copy; 2026 {t('app.title')}.</p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;