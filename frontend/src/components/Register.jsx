import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";

const StethoscopeIcon = () => (
  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
  </svg>
);

export default function Register() {
  const [formData, setFormData] = useState({
    staffId: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    clinicId: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [detectedRole, setDetectedRole] = useState('');
  const navigate = useNavigate();

  const detectRoleFromStaffId = (staffId) => {
    const id = staffId.toLowerCase();
    
    if (id.includes('nur')) return 'nurse';
    if (id.includes('doc') || id.includes('dr')) return 'doctor';
    if (id.includes('recep') || id.includes('rec')) return 'receptionist';
    if (id.includes('admin') || id.includes('adm')) return 'admin';
    if (id.includes('lab')) return 'lab technician';
    if (id.includes('pharm')) return 'pharmacist';
    
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'staffId') {
      const role = detectRoleFromStaffId(value);
      setDetectedRole(role);
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (!formData.staffId) newErrors.staffId = 'Staff ID is required';
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.clinicId) newErrors.clinicId = 'Clinic ID is required';
    
    if (!detectedRole) {
      newErrors.staffId = 'Invalid Staff ID format. Use prefixes like NUR, DOC, RECEP, etc.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...dataToSend } = formData;
      
      const dataWithRole = {
        ...dataToSend,
        role: detectedRole
      };
      
      console.log('Sending data:', dataWithRole);
      console.log('Base URL:', baseURL);
      
      const res = await axios.post(`${baseURL}/user/register`, dataWithRole);
      
      console.log('Response:', res.data);
      
      alert('Registration successful! Please login with your credentials.');
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response?.data);
      setErrors({ 
        submit: err.response?.data?.message || 'Registration failed. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-green-50 flex justify-center min-h-screen overflow-hidden font-['Poppins']">
      <div className="flex gap-16 items-start max-w-6xl w-full px-10 py-8">
        
        <div className="flex-1 max-w-md flex flex-col justify-start pt-10">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-green-600 p-4 rounded-2xl shadow-lg">
                <StethoscopeIcon />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Join Our Team</h1>
                <p className="text-green-600 font-medium">Clinic Management System</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Create your account to access our comprehensive healthcare management platform.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-green-100">
              <div className="bg-green-100 p-2.5 rounded-lg mt-0.5 flex-shrink-0">
                <UserIcon />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold text-sm mb-1">Role-Based Access</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Your role is automatically assigned based on your Staff ID
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-green-100">
              <div className="bg-green-100 p-2.5 rounded-lg mt-0.5 flex-shrink-0">
                <ShieldIcon />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold text-sm mb-1">Secure Platform</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  HIPAA-compliant with enterprise-grade security
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            <div className="flex items-start gap-3">
              <CheckCircleIcon />
              <p className="text-gray-600 text-sm">Patient management tools</p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircleIcon />
              <p className="text-gray-600 text-sm">Real-time collaboration</p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircleIcon />
              <p className="text-gray-600 text-sm">Secure health records</p>
            </div>
          </div>

          {detectedRole && (
            <div className="mt-6 bg-green-100 border border-green-300 rounded-xl p-4">
              <p className="text-green-800 text-sm font-medium">
                Detected Role: <span className="capitalize font-bold">{detectedRole}</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 max-w-md flex items-start pt-10">
          <div className="bg-white rounded-3xl shadow-xl w-full border border-gray-100 flex flex-col max-h-[calc(100vh-5rem)]">
            <div className="text-center pt-10 px-10 pb-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h2>
              <p className="text-gray-600 text-sm">Fill in your details to get started</p>
            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-10">
              {errors.submit && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{errors.submit}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="staffId" className="block text-gray-700 text-sm font-semibold mb-2">
                    Staff ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="staffId"
                    name="staffId"
                    type="text"
                    value={formData.staffId}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border ${
                      errors.staffId ? 'border-red-300' : 'border-gray-200'
                    } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                    placeholder="NUR-001, DOC-001, RECEP-001"
                  />
                  {errors.staffId && (
                    <p className="text-red-500 text-xs mt-1">{errors.staffId}</p>
                  )}
                  {detectedRole && !errors.staffId && (
                    <p className="text-green-600 text-xs mt-1">
                      Role detected: <span className="font-semibold capitalize">{detectedRole}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border ${
                      errors.name ? 'border-red-300' : 'border-gray-200'
                    } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border ${
                      errors.email ? 'border-red-300' : 'border-gray-200'
                    } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                    placeholder="john.doe@clinic.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="clinicId" className="block text-gray-700 text-sm font-semibold mb-2">
                    Clinic ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="clinicId"
                    name="clinicId"
                    type="text"
                    value={formData.clinicId}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border ${
                      errors.clinicId ? 'border-red-300' : 'border-gray-200'
                    } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                    placeholder="CLINIC-001"
                  />
                  {errors.clinicId && (
                    <p className="text-red-500 text-xs mt-1">{errors.clinicId}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 bg-gray-50 border ${
                        errors.password ? 'border-red-300' : 'border-gray-200'
                      } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                      placeholder="Minimum 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-semibold mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 bg-gray-50 border ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                      } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-center text-gray-600 text-sm">
                  Already have an account?{' '}
                  <button
                    onClick={() => navigate('/')}
                    className="text-green-600 hover:text-green-700 font-semibold transition-colors"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}