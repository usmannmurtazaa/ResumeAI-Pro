import React, { useState } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../services/firebase';
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
      toast.success('OTP sent successfully!');
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      toast.success('Phone number verified successfully!');
      onSuccess?.(result.user);
      handleClose();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPhoneNumber('');
    setOtp('');
    setStep('phone');
    setConfirmationResult(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Phone Authentication">
      <div className="space-y-6">
        <div id="recaptcha-container"></div>
        
        {step === 'phone' ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <PhoneInput
                international
                countryCallingCodeEditable={false}
                defaultCountry="US"
                value={phoneNumber}
                onChange={setPhoneNumber}
                className="input-field"
              />
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
              <label className="block text-sm font-medium mb-2 text-center">
                Enter 6-digit verification code
              </label>
              <OtpInput
                value={otp}
                onChange={setOtp}
                numInputs={6}
                renderInput={(props) => (
                  <input
                    {...props}
                    className="w-12 h-12 text-center text-xl border border-gray-300 dark:border-gray-600 rounded-lg mx-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                )}
              />
              <p className="text-sm text-gray-500 text-center mt-2">
                Sent to {phoneNumber}
              </p>
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
                onClick={() => setStep('phone')}
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