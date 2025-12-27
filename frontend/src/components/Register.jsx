import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";


const MedicalIcon = () => (
  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 6h-4V2h-8v4H4v8h4v8h8v-8h4V6zm-10 10v4h4v-4h-4zm4-4h4V8h-4V4h-4v4H6v4h4v4h4v-4z"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
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
  const navigate = useNavigate();

  const roles = [
    { id: 'doctor', label: 'Doctor', color: 'teal' },
    { id: 'nurse', label: 'Nurse', color: 'green' },
    { id: 'pharmacist', label: 'Pharmacist', color: 'purple' },
    { id: 'receptionist', label: 'Receptionist', color: 'orange' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.staffId.trim()) newErrors.staffId = 'Staff ID is required';
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

  const roleColors = {
    doctor: 'teal',
    nurse: 'green',
    pharmacist: 'purple',
    receptionist: 'orange'
  };

  const currentColor = roleColors[formData.role];

  return (
   <div className="bg-gray-50 flex justify-center min-h-screen overflow-y-auto font-['Poppins']">

      <div className="flex gap-16 items-start max-w-7xl w-full px-10 py-10">

        
        
        <div className="flex-1 max-w-md flex flex-col justify-center">
         
          <div className="flex items-center px-5 py-4 border-2 border-teal-200 rounded-2xl gap-3 bg-white shadow-sm mb-8">
            <div className="bg-teal-600 p-3 rounded-xl">
              <MedicalIcon />
            </div>
            <div>
              <h2 className="text-teal-600 font-semibold text-base">Join Our Team</h2>
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

       
        <div className="flex-1 max-w-lg flex items-center h-full overflow-y-auto py-4">
          <div className="bg-white rounded-3xl shadow-lg p-8 w-full">
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
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
                      className={`py-2 px-3 rounded-xl font-medium text-sm transition-all ${
                        formData.role === role.id
                          ? `bg-${role.color}-600 text-white shadow-md`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
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
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 bg-gray-50 border ${
                    errors.staffId ? 'border-red-300' : 'border-gray-200'
                  } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-${currentColor}-500 focus:border-transparent transition-all`}
                  placeholder={`${formData.role.toUpperCase()}-001`}
                />
                {errors.staffId && (
                  <p className="text-red-500 text-[10px] mt-1">{errors.staffId}</p>
                )}
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
                  } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-${currentColor}-500 focus:border-transparent transition-all`}
                  placeholder="Dr. John Doe"
                />
                {errors.name && (
                  <p className="text-red-500 text-[10px] mt-1">{errors.name}</p>
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
                  } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-${currentColor}-500 focus:border-transparent transition-all`}
                  placeholder="john.doe@clinic.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-[10px] mt-1">{errors.email}</p>
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
                  } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-${currentColor}-500 focus:border-transparent transition-all`}
                  placeholder="CLINIC-001"
                />
                {errors.clinicId && (
                  <p className="text-red-500 text-[10px] mt-1">{errors.clinicId}</p>
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
                    <p className="text-red-500 text-[10px] mt-1">{errors.specialization}</p>
                  )}
                </div>
              )}

            
              <div>
                <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 bg-gray-50 border ${
                    errors.password ? 'border-red-300' : 'border-gray-200'
                  } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-${currentColor}-500 focus:border-transparent transition-all`}
                  placeholder="Minimum 6 characters"
                />
                {errors.password && (
                  <p className="text-red-500 text-[10px] mt-1">{errors.password}</p>
                )}
              </div>

            
              <div>
                <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 bg-gray-50 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                  } rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-${currentColor}-500 focus:border-transparent transition-all`}
                  placeholder="Re-enter password"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-[10px] mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-${currentColor}-600 hover:bg-${currentColor}-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md mt-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
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