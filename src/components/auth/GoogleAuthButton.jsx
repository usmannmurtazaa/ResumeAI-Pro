import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { FcGoogle } from 'react-icons/fc';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

const GoogleAuthButton = ({ onSuccess, mode = 'signin' }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      toast.success(`Successfully ${mode === 'signin' ? 'signed in' : 'signed up'} with Google!`);
      onSuccess?.(result.user);
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error(error.message || 'Failed to authenticate with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleAuth}
      loading={loading}
      icon={<FcGoogle className="w-5 h-5" />}
      className="w-full bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
    >
      Continue with Google
    </Button>
  );
};

export default GoogleAuthButton;