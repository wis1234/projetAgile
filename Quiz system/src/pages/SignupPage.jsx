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
import { GraduationCap, Lock, Mail, User, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const SignupPage = () => {
  const navigate = useNavigate();
  const { signUp, user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [submissionLoading, setSubmissionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = t('validation.required');
    
    if (!formData.email) {
      newErrors.email = t('validation.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.email');
    }
    
    if (!formData.password) {
      newErrors.password = t('validation.required');
    } else {
      if (formData.password.length < 8) newErrors.password = t('validation.passwordMin');
      else if (!/(?=.*[A-Z])/.test(formData.password)) newErrors.password = t('validation.passwordUpper');
      else if (!/(?=.*\d)/.test(formData.password)) newErrors.password = t('validation.passwordNum');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.passwordMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmissionLoading(true);

    try {
      const { data, error } = await signUp(formData.email.trim(), formData.password, {
        data: {
          full_name: formData.fullName.trim(),
          role: 'user'
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error(t('validation.emailInUse'));
        }
        throw error;
      }

      if (data) {
        toast({
          title: t('auth.signup.success'),
          description: t('auth.signup.successDesc'),
        });
        navigate('/login');
      }
    } catch (error) {
      console.error("Signup submission error:", error);
      toast({
        variant: "destructive",
        title: t('auth.signup.error'),
        description: error.message || t('auth.signup.error'),
      });
    } finally {
      setSubmissionLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.signup.title')} - {t('app.title')}</title>
        <meta name="description" content={t('auth.signup.description')} />
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
          className="w-full max-w-[440px] relative z-10"
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
              <CardTitle className="text-2xl font-bold text-slate-800">{t('auth.signup.title')}</CardTitle>
              <CardDescription className="text-base">{t('auth.signup.description')}</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">{t('auth.signup.fullName')}</Label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                    <Input
                      id="fullName"
                      placeholder=""
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`pl-11 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 ${errors.fullName ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                  </div>
                  {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">{t('auth.signup.email')}</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={`pl-11 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">{t('auth.signup.password')}</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className={`pl-11 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">{t('auth.signup.confirmPassword')}</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`pl-11 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={submissionLoading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200 mt-4"
                >
                  {submissionLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('auth.signup.submitting')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t('auth.signup.submit')}
                      <ArrowRight className="w-5 h-5 opacity-80" />
                    </span>
                  )}
                </Button>

                <div className="text-center mt-6">
                  <p className="text-slate-600">
                    <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline decoration-2 underline-offset-2 transition-all">
                      {t('auth.signup.hasAccount')}
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

export default SignupPage;