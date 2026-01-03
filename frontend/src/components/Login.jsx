import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";

const StethoscopeIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const NurseIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 16.93c-3.95-.49-7-3.85-7-7.84V6.3l6-2.25v14.88z"/>
  </svg>
);

const PharmacistIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M4 6h16v2H4zm0 5h16v6H4zm16-2H4V7h16v2zm0 9H4v-6h16v6zM8 13h8v2H8z"/>
  </svg>
);

const ReceptionistIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
  </svg>
);

export default function Login() {
  const [activeTab, setActiveTab] = useState('doctor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffId, setStaffId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Detect role from Staff ID
  const detectRoleFromStaffId = (staffId) => {
    const id = staffId.toLowerCase();
    if (id.includes('doctor') || id.includes('doc')) return 'doctor';
    if (id.includes('nurse') || id.includes('nur')) return 'nurse';
    if (id.includes('pharmacist') || id.includes('pharm')) return 'pharmacist';
    if (id.includes('receptionist') || id.includes('recep')) return 'receptionist';
    return null;
  };

  const handleStaffIdChange = (e) => {
    const value = e.target.value;
    setStaffId(value);
    
    // Auto-detect and switch role based on Staff ID
    const detectedRole = detectRoleFromStaffId(value);
    if (detectedRole) {
      setActiveTab(detectedRole);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate that Staff ID matches selected role
      const detectedRole = detectRoleFromStaffId(staffId);
      if (detectedRole && detectedRole !== activeTab) {
        const roleNames = {
          doctor: 'Doctor',
          nurse: 'Nurse',
          pharmacist: 'Pharmacist',
          receptionist: 'Receptionist'
        };
        setError(`This Staff ID appears to be for a ${roleNames[detectedRole]}. Please select the correct role.`);
        setActiveTab(detectedRole);
        setIsLoading(false);
        return;
      }

      const loginData = {
        staffId,
        email,
        password
      };

      const res = await axios.post(`${baseURL}/user/login`, loginData);
      
      const { token, user } = res.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('Login successful:', user);
      
      const userRole = user.role.toLowerCase();

      // Double-check role matches
      if (userRole !== activeTab) {
        const roleNames = {
          doctor: 'Doctor',
          nurse: 'Nurse',
          pharmacist: 'Pharmacist',
          receptionist: 'Receptionist'
        };

        setError(`This account belongs to a ${roleNames[userRole]}. Please select the correct role.`);
        setActiveTab(userRole);
        setIsLoading(false);
        return;
      }

      // Navigate to correct dashboard
      switch (userRole) {
        case 'doctor':
          navigate('/doctor');
          break;
        case 'nurse':
          navigate('/nurse');
          break;
        case 'pharmacist':
          navigate('/pharmacist');
          break;
        case 'receptionist':
          navigate('/receptionist');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToCreate = () => navigate('/register');

  const roleColors = {
    doctor: {
      bg: 'bg-teal-600',
      hoverBg: 'hover:bg-teal-700',
      ring: 'focus:ring-teal-600',
      text: 'text-teal-600',
      hoverText: 'hover:text-teal-700',
      lightBg: 'bg-teal-100',
      borderColor: 'border-teal-200'
    },
    nurse: {
      bg: 'bg-green-600',
      hoverBg: 'hover:bg-green-700',
      ring: 'focus:ring-green-600',
      text: 'text-green-600',
      hoverText: 'hover:text-green-700',
      lightBg: 'bg-green-100',
      borderColor: 'border-green-200'
    },
    pharmacist: {
      bg: 'bg-purple-600',
      hoverBg: 'hover:bg-purple-700',
      ring: 'focus:ring-purple-600',
      text: 'text-purple-600',
      hoverText: 'hover:text-purple-700',
      lightBg: 'bg-purple-100',
      borderColor: 'border-purple-200'
    },
    receptionist: {
      bg: 'bg-orange-500',
      hoverBg: 'hover:bg-orange-600',
      ring: 'focus:ring-orange-500',
      text: 'text-orange-500',
      hoverText: 'hover:text-orange-600',
      lightBg: 'bg-orange-100',
      borderColor: 'border-orange-200'
    }
  };

  const currentColors = roleColors[activeTab];

  const roles = [
    { id: 'doctor', label: 'Doctor', icon: DoctorIcon, prefix: 'DOC' },
    { id: 'nurse', label: 'Nurse', icon: NurseIcon, prefix: 'NUR' },
    { id: 'pharmacist', label: 'Pharmacist', icon: PharmacistIcon, prefix: 'PHARM' },
    { id: 'receptionist', label: 'Receptionist', icon: ReceptionistIcon, prefix: 'RECEP' }
  ];

  return (
    <div className="bg-gray-50 flex items-center justify-center h-screen overflow-hidden font-['Poppins']">
      <div className="flex gap-12 items-center max-w-7xl w-full px-8 h-full py-8">

        {/* Left Side - Role Info */}
        <div className="flex-1 max-w-md flex flex-col justify-center h-full">
          <div className={`flex items-center px-5 py-4 border-2 ${currentColors.borderColor} rounded-2xl gap-4 bg-white shadow-sm mb-8`}>
            <div className={`${currentColors.bg} p-3 rounded-xl`}>
              <StethoscopeIcon />
            </div>
            <div>
              <h2 className={`${currentColors.text} font-semibold text-base`}>Clinic Management System</h2>
              <p className="text-gray-600 text-xs">Professional Healthcare Portal</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-teal-100 p-2.5 rounded-xl mt-0.5 flex-shrink-0">
                <DoctorIcon />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold text-sm mb-1">For Doctors</h3>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Manage patient appointments, medical records, and prescriptions efficiently
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-2.5 rounded-xl mt-0.5 flex-shrink-0">
                <NurseIcon />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold text-sm mb-1">For Nurses</h3>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Track patient vitals, assist in treatments, and coordinate care activities
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-purple-100 p-2.5 rounded-xl mt-0.5 flex-shrink-0">
                <PharmacistIcon />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold text-sm mb-1">For Pharmacists</h3>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Dispense medications, manage inventory, and verify prescriptions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-orange-100 p-2.5 rounded-xl mt-0.5 flex-shrink-0">
                <ReceptionistIcon />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold text-sm mb-1">For Receptionists</h3>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Schedule appointments, manage patient check-ins, and handle administrative tasks
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 max-w-lg flex items-center h-full">
          <div className="bg-white rounded-3xl shadow-lg p-8 w-full">
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold text-gray-800 mb-1">Welcome Back</h1>
              <p className="text-gray-600 text-xs">Select your role to continue</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {roles.map((role) => {
                const Icon = role.icon;
                const isActive = activeTab === role.id;
                const colors = roleColors[role.id];
                
                return (
                  <button
                    key={role.id}
                    onClick={() => setActiveTab(role.id)}
                    type="button"
                    className={`py-2.5 px-3 rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-2 ${
                      isActive
                        ? `${colors.bg} text-white shadow-md`
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

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="staffId" className="block text-gray-700 text-xs font-medium mb-1.5">
                  Staff ID
                </label>
                <input
                  id="staffId"
                  type="text"
                  value={staffId}
                  onChange={handleStaffIdChange}
                  className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 ${currentColors.ring} focus:border-transparent transition-all`}
                  placeholder={`${roles.find(r => r.id === activeTab)?.prefix}-001`}
                  required
                />
                <p className="text-gray-500 text-xs mt-1">
                  Role will auto-detect from your Staff ID
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 text-xs font-medium mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 ${currentColors.ring} focus:border-transparent transition-all`}
                  placeholder={`${activeTab}@clinic.com`}
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-gray-700 text-xs font-medium mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-3 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 ${currentColors.ring} focus:border-transparent transition-all`}
                    placeholder="••••••••"
                    required
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
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full ${currentColors.bg} ${currentColors.hoverBg} text-white font-semibold py-3 rounded-xl transition-all shadow-md mb-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? 'Signing in...' : `Sign In as ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
              </button>
            </form>

            <p className="text-center text-gray-600 text-xs">
              Don't have an account?{' '}
              <button 
                onClick={goToCreate}
                className={`${currentColors.text} ${currentColors.hoverText} font-semibold transition-colors`}
              >
                Create one here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}