import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiPhone, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import userApi from '../api/userApi';
import AuthLayout from '../components/layout/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import OtpInput from '../components/auth/OtpInput';
import { useCountdown } from '../hooks/useCountdown';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const OTP_SCREEN_DELAY_MS = 1000;
const RESEND_COOLDOWN_SECONDS = 60;

type LoginStep = 'credentials' | 'otp';

const isPhoneValue = (value: string) => /^\d+$/.test(value.trim());

const validatePhone = (value: string): string | null => {
  const v = value.trim();
  if (v.length !== 10) return 'Phone number must be exactly 10 digits.';
  if (!/^[6-9]/.test(v)) return 'Phone number must start with 6, 7, 8, or 9.';
  return null;
};

const LoginPage = () => {
  useDocumentTitle('Log in');
  const navigate = useNavigate();
  const [step, setStep] = useState<LoginStep>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resendCountdown = useCountdown(RESEND_COOLDOWN_SECONDS);

  const isPhone = isPhoneValue(identifier);

  const buildPayload = () =>
    isPhone ? { phone: identifier.trim() } : { email: identifier.trim() };

  const requestOtp = async () => {
    const { data } = await userApi.post('/auth/login', buildPayload());

    if (data.success === false) {
      throw new Error(data.message ?? 'Unable to send OTP.');
    }

    setDevOtp(data.otp ?? '');
    toast.success(`Your OTP is: ${data.otp}`, {
      icon: <FiShield color="var(--k-accent)" />,
      autoClose: 10000,
    });
    setMessage(`OTP sent to your ${isPhone ? 'phone' : 'email'}.`);
    resendCountdown.start();
  };

  const resendOtp = async () => {
    setError('');
    try {
      await requestOtp();
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message ?? 'Unable to resend OTP.'
        : 'Unable to resend OTP.';
      toast.error(errorMessage);
    }
  };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError('');
    setMessage('');

    if (step === 'credentials' && isPhone) {
      const phoneError = validatePhone(identifier);
      if (phoneError) {
        setError(phoneError);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (step === 'credentials') {
        await requestOtp();
        await new Promise((resolve) => setTimeout(resolve, OTP_SCREEN_DELAY_MS));
        setStep('otp');
        setMessage('Enter the OTP to finish login.');
        return;
      }

      const { data } = await userApi.post('/auth/verify-login', { ...buildPayload(), otp });

      if (data.success === false) {
        throw new Error(data.message ?? 'OTP verification failed.');
      }

      if (data.token) {
        localStorage.setItem('userToken', data.token);
      }
      toast.success('Logged in successfully.', {
        icon: <FiShield color="var(--k-accent)" />,
      });
      navigate('/products');
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message ?? 'Unable to complete login.'
        : err instanceof Error ? err.message : 'Unable to complete login.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="BUYER STOREFRONT"
      heading="Shop thousands of products with secure, OTP-protected checkout."
      features={['OTP protected access', 'Easy cart management', 'Fast checkout', 'Order tracking']}
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-tile bg-soft text-[var(--k-on-soft)]">
          {isPhone && identifier ? <FiPhone size={22} /> : <FiMail size={22} />}
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Login</h1>
          <p className="text-sm text-muted">
            {step === 'credentials'
              ? 'Enter your email address or phone number.'
              : `Enter the OTP sent to your ${isPhone ? 'phone' : 'email'}.`}
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-btn border border-accent bg-soft2 p-3 text-sm font-semibold text-accent">{message}</div>
      )}
      {step === 'otp' && devOtp && (
        <div className="mb-4 flex items-center gap-2 rounded-btn border border-warn-fg/30 bg-warn-bg p-3">
          <Badge tone="warn">DEV</Badge>
          <p className="font-mono text-xs font-bold text-warn-fg">OTP: {devOtp} (shown for testing — no SMS/email is sent)</p>
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-btn border border-danger bg-bad-bg p-3 text-sm font-semibold text-bad-fg">{error}</div>
      )}

      <form className="space-y-4" onSubmit={submitLogin}>
        {step === 'credentials' ? (
          <div key="credentials" className="animate-up">
            <Input
              label="Email address or phone number"
              id="identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="jane@example.com or 9876543210"
              inputMode={isPhone ? 'numeric' : 'email'}
              required
            />
            <p className="mt-1.5 text-xs text-muted">
              {isPhone && identifier
                ? 'Indian mobile number — 10 digits starting with 6–9.'
                : 'Type digits only to switch to phone number.'}
            </p>
          </div>
        ) : (
          <div key="otp" className="animate-up">
            <p className="mb-2.5 text-[12px] font-extrabold text-ink">OTP</p>
            <OtpInput value={otp} onChange={setOtp} disabled={isSubmitting} />
            <button
              type="button"
              onClick={resendOtp}
              disabled={!resendCountdown.isReady}
              className="mt-3 text-xs font-bold text-muted disabled:cursor-not-allowed enabled:text-accent enabled:hover:underline"
            >
              {resendCountdown.isReady ? 'Resend OTP' : `Resend OTP in ${resendCountdown.remaining}s`}
            </button>
          </div>
        )}

        <Button type="submit" variant="primary" loading={isSubmitting} fullWidth>
          {step === 'credentials' ? 'Send OTP' : 'Verify and login'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New here? <Link to="/signup" className="font-bold text-accent hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
