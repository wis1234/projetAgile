import React, { useState, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { FaPlus, FaUser, FaUsers, FaArrowLeft, FaEnvelope, FaLock, FaUserShield, FaCamera, FaEye, FaEyeSlash } from 'react-icons/fa';

function Create({ roles = [] }) {
  const { errors = {}, flash = {} } = usePage().props;
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user',
    profile_photo: null,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setValues(values => ({ ...values, [e.target.id]: e.target.value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValues(values => ({ ...values, profile_photo: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const removePhoto = () => {
    setValues(values => ({ ...values, profile_photo: null }));
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Create FormData for file upload
    const formData = new FormData();
    Object.keys(values).forEach(key => {
      if (values[key] !== null) {
        formData.append(key, values[key]);
      }
    });

    router.post('/users', formData, {
      forceFormData: true,
      onSuccess: () => {
        setValues({ 
          name: '', 
          email: '', 
          password: '', 
          password_confirmation: '', 
          role: 'user',
          profile_photo: null 
        });
        setPhotoPreview(null);
        setLoading(false);
        setTimeout(() => router.visit('/users'), 1200);
      },
      onError: () => {
        setLoading(false);
      }
    });
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-white dark:bg-gray-950 p-0 m-0">
      <main className="flex-1 flex flex-col w-full py-8 px-4 sm:px-6 lg:px-8">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/users" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition duration-150">
              <FaArrowLeft className="text-2xl" />
            </Link>
            <FaUser className="text-4xl text-blue-600 dark:text-blue-400" />
            <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">Nouveau Membre</h1>
          </div>
        </div>

        {/* Form Card */}
        <div className="max-w-4xl mx-auto w-full">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Photo Section */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-4">
                  <div 
                    className="w-32 h-32 rounded-full border-4 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors duration-200 overflow-hidden"
                    onClick={handlePhotoClick}
                  >
                    {photoPreview ? (
                      <img 
                        src={photoPreview} 
                        alt="Aperçu" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaCamera className="text-4xl text-gray-400" />
                    )}
                  </div>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition duration-200"
                    >
                      ×
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handlePhotoClick}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition duration-200"
                >
                  {photoPreview ? 'Changer la photo' : 'Ajouter une photo de profil'}
                </button>
                {errors.profile_photo && <div className="text-red-600 text-sm mt-2">{errors.profile_photo}</div>}
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="name">
                    <FaUser className="inline mr-2" />
                    Nom complet
                  </label>
                  <input 
                    type="text" 
                    id="name" 
                    value={values.name} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                    placeholder="Entrez le nom complet"
                    required 
                  />
                  {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
                </div>

                {/* Email Field */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">
                    <FaEnvelope className="inline mr-2" />
                    Adresse email
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    value={values.email} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                    placeholder="exemple@email.com"
                    required 
                  />
                  {errors.email && <div className="text-red-600 text-sm mt-1">{errors.email}</div>}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="password">
                    <FaLock className="inline mr-2" />
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      id="password" 
                      value={values.password} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                      placeholder="Mot de passe sécurisé"
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && <div className="text-red-600 text-sm mt-1">{errors.password}</div>}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="password_confirmation">
                    <FaLock className="inline mr-2" />
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      id="password_confirmation" 
                      value={values.password_confirmation} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                      placeholder="Confirmez le mot de passe"
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password_confirmation && <div className="text-red-600 text-sm mt-1">{errors.password_confirmation}</div>}
                </div>

                {/* Role Field */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="role">
                    <FaUserShield className="inline mr-2" />
                    Rôle
                  </label>
                  <select 
                    id="role" 
                    value={values.role} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                  >
                    <option value="user">Utilisateur</option>
                    <option value="admin">Administrateur</option>
                    <option value="manager">Manager</option>
                    <option value="developer">Développeur</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.name}>{role.name}</option>
                    ))}
                  </select>
                  {errors.role && <div className="text-red-600 text-sm mt-1">{errors.role}</div>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <FaPlus />
                      Créer le membre
                    </>
                  )}
                </button>
                <Link 
                  href="/users" 
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition duration-200 hover:shadow-md"
                >
                  <FaUsers />
                  Retour à la liste
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Success/Error Messages */}
        {flash.success && (
          <div className="fixed top-6 right-6 z-50 px-6 py-4 rounded-lg shadow-xl text-white bg-green-600 transition-all">
            {flash.success}
          </div>
        )}
        {flash.error && (
          <div className="fixed top-6 right-6 z-50 px-6 py-4 rounded-lg shadow-xl text-white bg-red-600 transition-all">
            {flash.error}
          </div>
        )}
      </main>
    </div>
  );
}

Create.layout = page => <AdminLayout children={page} />;
export default Create;
