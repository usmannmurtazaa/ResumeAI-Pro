import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import PhoneInput from 'react-phone-number-input';
import OtpInput from 'react-otp-input';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';
import 'react-phone-number-input/style.css';

const PhoneAuth = ({ isOpen, onClose, onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {}
      });
    }
    return window.recaptchaVerifier;
  };

  const sendOTP = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const verifier = setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(confirmation);
      setStep('otp');
      setResendTimer(60);
      toast.success('OTP sent successfully!');
    } catch (error) {
      console.error('Error sending OTP:', error);
      if (error.code === 'auth/too-many-requests') {
        toast.error('Too many requests. Please try again later.');
      } else if (error.code === 'auth/invalid-phone-number') {
        toast.error('Invalid phone number format');
      } else {
        toast.error(error.message || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (resendTimer > 0) return;
    await sendOTP();
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create new user document for phone sign-ups
        await setDoc(userDocRef, {
          phoneNumber: user.phoneNumber,
          email: user.email || '',
          displayName: user.displayName || `User${user.uid.slice(0, 6)}`,
          role: 'user',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authProvider: 'phone'
        });
      }
      
      toast.success('Phone number verified successfully!');
      onSuccess?.(user);
      handleClose();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      if (error.code === 'auth/invalid-verification-code') {
        toast.error('Invalid verification code. Please try again.');
      } else if (error.code === 'auth/code-expired') {
        toast.error('Verification code has expired. Please request a new one.');
        setStep('phone');
      } else {
        toast.error('Failed to verify OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPhoneNumber('');
    setOtp('');
    setStep('phone');
    setConfirmationResult(null);
    setResendTimer(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Phone Authentication" size="sm">
      <div className="space-y-6">
        <div id="recaptcha-container"></div>
        
        {step === 'phone' ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Enter your phone number
              </label>
              <PhoneInput
                international
                countryCallingCodeEditable={false}
                defaultCountry="US"
                value={phoneNumber}
                onChange={setPhoneNumber}
                className="input-field"
                placeholder="Enter phone number"
              />
              <p className="text-xs text-gray-500 mt-2">
                We'll send you a verification code via SMS
              </p>
            </div>
            <Button
              onClick={sendOTP}
              loading={loading}
              className="w-full"
            >
              Send Verification Code
            </Button>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium mb-3 text-center text-gray-700 dark:text-gray-300">
                Enter 6-digit verification code
              </label>
              <OtpInput
                value={otp}
                onChange={setOtp}
                numInputs={6}
                renderInput={(props) => (
                  <input
                    {...props}
                    className="w-12 h-12 text-center text-xl border border-gray-300 dark:border-gray-600 rounded-lg mx-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800"
                  />
                )}
              />
              <p className="text-sm text-gray-500 text-center mt-3">
                Sent to {phoneNumber}
              </p>
              <div className="text-center mt-2">
                <button
                  onClick={resendOTP}
                  disabled={resendTimer > 0}
                  className={`text-sm ${
                    resendTimer > 0 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-primary-600 hover:text-primary-700'
                  }`}
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <Button
                onClick={verifyOTP}
                loading={loading}
                className="w-full"
              >
                Verify & Continue
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                }}
                className="w-full"
              >
                Change Phone Number
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PhoneAuth;