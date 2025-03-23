import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { completeRegistration, isSignInWithEmailLink, auth } from './firebase';
import { User, Shield, CheckCircle, XCircle, Mail, Coffee } from 'lucide-react';

const CompleteSignup = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteId, setInviteId] = useState('');
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkLink = async () => {
      // Get parameters from URL
      const params = new URLSearchParams(location.search);
      const id = params.get('inviteId');
      const emailParam = params.get('email');
      
      // Set the invite ID
      if (id) {
        setInviteId(id);
      } else {
        setInvalidLink(true);
        setError('Invalid invite link. Missing invite ID.');
        return;
      }
      
      // Set the email
      if (emailParam) {
        setEmail(emailParam);
        // Store it in localStorage as a backup
        localStorage.setItem('emailForSignIn', emailParam);
      } else {
        // Try to get from localStorage
        const storedEmail = localStorage.getItem('emailForSignIn');
        if (storedEmail) {
          setEmail(storedEmail);
        } else {
          setInvalidLink(true);
          setError('Email address not found. Please go back to your email and click the link again.');
        }
      }
      
      // Check if this is a valid sign-in link
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        setInvalidLink(true);
        setError('Invalid sign-in link. Please request a new invitation.');
      }
    };
    
    checkLink();
  }, [location]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await completeRegistration(name, password, inviteId);
      
      // Show success message
      setSuccess(true);
      
      // Navigate to the login page after successful registration (with a delay)
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to complete registration');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Invalid link state
  if (invalidLink) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full flex items-center justify-center mb-4">
                <img src="logo.jpg" alt="Restaurant Logo" className="h-20 w-20 object-contain" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Invalid Link</h1>
            <p className="mt-2 text-gray-500">There was a problem with your invitation link</p>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg border border-red-100 mt-6">
            <p className="text-red-700 font-medium mb-2">We couldn't process your invitation</p>
            <p className="text-red-600 text-sm">
              {error}
            </p>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => navigate('/')}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors font-medium"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Success state
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full flex items-center justify-center mb-4">
                <img src="/logo.jpg" alt="Restaurant Logo" className="h-20 w-20 object-contain" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome to the Team!</h1>
            <p className="mt-2 text-gray-500">Your account has been successfully created</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg border border-green-100 mt-6">
            <p className="text-green-700 font-medium mb-2">Account setup complete!</p>
            <p className="text-green-600 text-sm">
              You'll be redirected to the login page in a moment where you can sign in with your new credentials.
            </p>
          </div>
          
          <div className="flex items-center justify-center mt-6">
            <span className="text-indigo-600 animate-pulse">Redirecting to login...</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full flex items-center justify-center mb-4">
              <img src="/logo.jpg" alt="Restaurant Logo" className="h-20 w-20 object-contain" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome Aboard!</h1>
          <p className="mt-2 text-gray-500">You're just two steps away from employee discounts</p>
        </div>
        
        {email && (
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-center">
            <Mail size={18} className="text-indigo-600 mr-2" />
            <p className="text-sm text-indigo-700">Setting up account for: <strong>{email}</strong></p>
          </div>
        )}
        
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Create Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield size={18} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield size={18} className="text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm flex items-center">
              <XCircle size={16} className="mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors font-medium ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Your Account...
                </>
              ) : (
                'Complete Account Setup'
              )}
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm text-gray-500 mt-4">
          <p>By creating an account, you'll get access to exclusive employee discounts at all participating restaurants!</p>
        </div>
      </div>
    </div>
  );
};

export default CompleteSignup;