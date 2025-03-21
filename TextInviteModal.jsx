// TextInviteModal.jsx - Create this as a new file
import React, { useState } from 'react';
import { X, Copy, CheckCircle, Share2, MessageSquare } from 'lucide-react';
import { generateInviteLink } from './firebase';

const TextInviteModal = ({ isOpen, onClose, currentUser, selectedRestaurant = null }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Employee');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  
  // Reset state when modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setEmail('');
      setRole('Employee');
      setGeneratedLink('');
      setCopied(false);
      setError('');
    }
  }, [isOpen]);
  
  const handleGenerateLink = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter an email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // For managers, use their restaurant ID
      let restaurantId = null;
      
      if (currentUser.jobTitle === 'Manager' && currentUser.restaurantId) {
        restaurantId = currentUser.restaurantId;
      } else if (currentUser.jobTitle === 'Admin' && selectedRestaurant) {
        restaurantId = selectedRestaurant.id;
      }
      
      const result = await generateInviteLink(
        email, 
        role,
        currentUser.id,
        restaurantId
      );
      
      setGeneratedLink(result.inviteLink);
    } catch (error) {
      console.error("Error generating invite link:", error);
      setError(error.message || "Failed to generate invite link");
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const shareViaText = () => {
    // Try to use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: 'Restaurant Employee Invitation',
        text: `You've been invited to join our restaurant staff! Click this link to set up your account: ${generatedLink}`,
        url: generatedLink
      }).catch(err => {
        console.log('Error sharing:', err);
        // Fall back to SMS link if sharing fails
        window.open(`sms:?body=${encodeURIComponent(`You've been invited to join our restaurant staff! Click this link to set up your account: ${generatedLink}`)}`);
      });
    } else {
      // Fallback for browsers without Web Share API
      window.open(`sms:?body=${encodeURIComponent(`You've been invited to join our restaurant staff! Click this link to set up your account: ${generatedLink}`)}`);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 bg-indigo-50 border-b border-indigo-100">
          <h3 className="text-lg font-medium text-indigo-800 flex items-center">
            <MessageSquare size={20} className="mr-2 text-indigo-600" />
            Invite via Text Message
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {!generatedLink ? (
            <form onSubmit={handleGenerateLink}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="inviteEmail"
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="employee@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    This email will be linked to their account
                  </p>
                </div>
                
                {currentUser.jobTitle === 'Admin' && (
                  <div>
                    <label htmlFor="inviteRole" className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      id="inviteRole"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="Employee">Employee</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate Invite Link'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-indigo-800 mb-2">Invitation Link Generated</h4>
                <div className="flex items-center">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                    value={generatedLink}
                    readOnly
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 focus:outline-none"
                    title="Copy to clipboard"
                  >
                    {copied ? <CheckCircle size={18} className="text-green-600" /> : <Copy size={18} className="text-gray-600" />}
                  </button>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <p className="text-sm text-green-800">
                  Your invite link is ready! Copy it to send manually via text message or click the button below to share.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={shareViaText}
                  className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Share2 size={18} className="mr-2" />
                  Text Invite
                </button>
                
                <button
                  onClick={() => {
                    setGeneratedLink('');
                    setEmail('');
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextInviteModal;