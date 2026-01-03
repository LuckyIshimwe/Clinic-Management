import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";

const StethoscopeIcon = () => (
  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
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

const DoctorIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const NurseIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 16.93c-3.95-.49-7-3.85-7-7.84V6.3l6-2.25v14.88z"/>
  </svg>
);

const PharmacistIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M4 6h16v2H4zm0 5h16v6H4zm16-2H4V7h16v2zm0 9H4v-6h16v6zM8 13h8v2H8z"/>
  </svg>
);

const ReceptionistIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
  </svg>
);

export default function Register() {
  const [formData, setFormData] = useState({
    staffId: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    clinicId: '',
    role: 'doctor',
    specialization: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const roles = [
    { 
      id: 'doctor', 
      label: 'Doctor', 
      icon: DoctorIcon,
      prefix: 'DOC',
      activeClass: 'bg-teal-600', 
      hoverClass: 'hover:bg-teal-700', 
      ringClass: 'focus:ring-teal-500',
      textClass: 'text-teal-600',
      borderClass: 'border-teal-200',
      lightBgClass: 'bg-teal-100'
    },
    { 
      id: 'nurse', 
      label: 'Nurse', 
      icon: NurseIcon,
      prefix: 'NUR',
      activeClass: 'bg-green-600', 
      hoverClass: 'hover:bg-green-700', 
      ringClass: 'focus:ring-green-500',
      textClass: 'text-green-600',
      borderClass: 'border-green-200',
      lightBgClass: 'bg-green-100'
    },
    { 
      id: 'pharmacist', 
      label: 'Pharmacist', 
      icon: PharmacistIcon,
      prefix: 'PHARM',
      activeClass: 'bg-purple-600', 
      hoverClass: 'hover:bg-purple-700', 
      ringClass: 'focus:ring-purple-500',
      textClass: 'text-purple-600',
      borderClass: 'border-purple-200',
      lightBgClass: 'bg-purple-100'
    },
    { 
      id: 'receptionist', 
      label: 'Receptionist', 
      icon: ReceptionistIcon,
      prefix: 'RECEP',
      activeClass: 'bg-orange-600', 
      hoverClass: 'hover:bg-orange-700', 
      ringClass: 'focus:ring-orange-500',
      textClass: 'text-orange-600',
      borderClass: 'border-orange-200',
      lightBgClass: 'bg-orange-100'
    }
  ];

  const getCurrentRole = () => roles.find(r => r.id === formData.role);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };   

 
  const detectRoleFromStaffId = (staffId) => {
    const id = staffId.toLowerCase();
    if (id.includes('doc') || id.includes('doctor')) return 'doctor';
    if (id.includes('nur') || id.includes('nurse')) return 'nurse';
    if (id.includes('pharm') || id.includes('pharmacist')) return 'pharmacist';
    if (id.includes('recep') || id.includes('receptionist')) return 'receptionist';
    return null;
  };

  const handleStaffIdChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, staffId: value }));
    
   
    const detectedRole = detectRoleFromStaffId(value);
    if (detectedRole && detectedRole !== formData.role) {
      setFormData(prev => ({ ...prev, role: detectedRole }));
    }
    
    if (errors.staffId) {
      setErrors(prev => ({ ...prev, staffId: '' }));
    }
  };

  const validateStaffId = (staffId, role) => {
    const id = staffId.toLowerCase();
    const roleMap = {
      doctor: ['doc', 'doctor'],
      nurse: ['nur', 'nurse'],
      pharmacist: ['pharm', 'pharmacist'],
      receptionist: ['recep', 'receptionist']
    };

    const expectedPrefixes = roleMap[role];
    const hasValidPrefix = expectedPrefixes.some(prefix => id.includes(prefix));

    if (!hasValidPrefix) {
      return `Staff ID must contain '${roleMap[role][0].toUpperCase()}' for ${role}s (e.g., ${getCurrentRole().prefix}-001)`;
    }
    return null;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.staffId.trim()) {
      newErrors.staffId = 'Staff ID is required';
    } else {
      const staffIdError = validateStaffId(formData.staffId, formData.role);
      if (staffIdError) newErrors.staffId = staffIdError;
    }

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.clinicId.trim()) newErrors.clinicId = 'Clinic ID is required';
    
    if (formData.role === 'doctor' && !formData.specialization.trim()) {
      newErrors.specialization = 'Specialization is required for doctors';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const { confirmPassword, ...dataToSend } = formData;
      
      const res = await axios.post(`${baseURL}/user/register`, dataToSend);
      
      alert('Registration successful! Please login with your credentials.');
      navigate('/');
    } catch (err) {
      console.error(err);
      setErrors({ 
        submit: err.response?.data?.message || 'Registration failed. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentRole = getCurrentRole();

  return (
    <div className="bg-gray-50 flex justify-center min-h-screen overflow-hidden font-['Poppins']">
      <div className="flex gap-16 items-stretch max-w-7xl w-full px-10 py-10">
        
        
        <div className="flex-1 max-w-md flex flex-col justify-center">
          <div className={`flex items-center px-5 py-4 border-2 rounded-2xl gap-3 bg-white shadow-sm mb-8 transition-colors ${currentRole.borderClass}`}>
            <div className={`p-3 rounded-xl transition-colors ${currentRole.activeClass}`}>
              <StethoscopeIcon />
            </div>
            <div>
              <h2 className={`font-semibold text-base transition-colors ${currentRole.textClass}`}>Join Our Team</h2>
              <p className="text-gray-600 text-sm">Clinic Management System</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-7 shadow-md border border-gray-100">
            <h3 className="text-gray-800 font-semibold text-lg mb-5">Why Register With Us?</h3>
            
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <CheckCircleIcon />
                <p className="text-gray-600 text-sm leading-relaxed">
                  Access comprehensive patient management tools
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircleIcon />
                <p className="text-gray-600 text-sm leading-relaxed">
                  Streamline appointment scheduling and tracking
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircleIcon />
                <p className="text-gray-600 text-sm leading-relaxed">
                  Collaborate seamlessly with your medical team
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircleIcon />
                <p className="text-gray-600 text-sm leading-relaxed">
                  Secure cloud-based health records system
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircleIcon />
                <p className="text-gray-600 text-sm leading-relaxed">
                  Real-time updates across all departments
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 px-1">
            <p className="text-gray-500 text-sm leading-relaxed">
              Trusted by healthcare professionals worldwide and secure.
            </p>
          </div>
        </div>

        
        <div className="flex-1 max-w-lg flex items-center">
          <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold text-gray-800 mb-1">Create Account</h1>
              <p className="text-gray-600 text-sm">Fill in your details to get started</p>
            </div>

            {errors.submit && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm">
                {errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
             
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Select Your Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isActive = formData.role === role.id;
                    
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
                        className={`py-2 px-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                          isActive
                            ? `${role.activeClass} text-white shadow-md`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <div className={isActive ? 'text-white' : 'text-gray-600'}>
                          <Icon />
                        </div>
                        {role.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              
              <div>
                <label htmlFor="staffId" className="block text-gray-700 text-sm font-medium mb-1.5">
                  Staff ID <span className="text-red-500">*</span>
                </label>
                <input
                  id="staffId"
                  name="staffId"
                  type="text"
                  value={formData.staffId}
                  onChange={handleStaffIdChange}
                  className={`w-full px-3 py-2.5 bg-gray-50 border ${
                    errors.staffId ? 'border-red-300' : 'border-gray-200'
                  } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 ${currentRole.ringClass} focus:border-transparent transition-all`}
                  placeholder={`${currentRole.prefix}-001`}
                />
                {errors.staffId && (
                  <p className="text-red-500 text-xs mt-1">{errors.staffId}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Format: {currentRole.prefix}-XXX (e.g., {currentRole.prefix}-001)
                </p>
              </div>

              
              <div>
                <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 bg-gray-50 border ${
                    errors.name ? 'border-red-300' : 'border-gray-200'
                  } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 ${currentRole.ringClass} focus:border-transparent transition-all`}
                  placeholder="Dr. John Doe"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              
              <div>
                <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 bg-gray-50 border ${
                    errors.email ? 'border-red-300' : 'border-gray-200'
                  } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 ${currentRole.ringClass} focus:border-transparent transition-all`}
                  placeholder="john.doe@clinic.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              
              <div>
                <label htmlFor="clinicId" className="block text-gray-700 text-sm font-medium mb-1.5">
                  Clinic ID <span className="text-red-500">*</span>
                </label>
                <input
                  id="clinicId"
                  name="clinicId"
                  type="text"
                  value={formData.clinicId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 bg-gray-50 border ${
                    errors.clinicId ? 'border-red-300' : 'border-gray-200'
                  } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 ${currentRole.ringClass} focus:border-transparent transition-all`}
                  placeholder="CLINIC-001"
                />
                {errors.clinicId && (
                  <p className="text-red-500 text-xs mt-1">{errors.clinicId}</p>
                )}
              </div>

              
              {formData.role === 'doctor' && (
                <div>
                  <label htmlFor="specialization" className="block text-gray-700 text-sm font-medium mb-1.5">
                    Specialization <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="specialization"
                    name="specialization"
                    type="text"
                    value={formData.specialization}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 bg-gray-50 border ${
                      errors.specialization ? 'border-red-300' : 'border-gray-200'
                    } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all`}
                    placeholder="e.g., Cardiology, Pediatrics"
                  />
                  {errors.specialization && (
                    <p className="text-red-500 text-xs mt-1">{errors.specialization}</p>
                  )}
                </div>
              )}

              
              <div>
                <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 pr-10 bg-gray-50 border ${
                      errors.password ? 'border-red-300' : 'border-gray-200'
                    } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 ${currentRole.ringClass} focus:border-transparent transition-all`}
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
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
                <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 pr-10 bg-gray-50 border ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                    } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 ${currentRole.ringClass} focus:border-transparent transition-all`}
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
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
                className={`w-full text-white font-semibold py-2.5 rounded-xl transition-all shadow-md mt-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${currentRole.activeClass} ${currentRole.hoverClass}`}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-gray-600 text-sm mt-5">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/')}
                className="text-teal-600 hover:text-teal-700 font-semibold transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}