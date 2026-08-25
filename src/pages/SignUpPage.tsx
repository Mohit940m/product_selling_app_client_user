import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiShield, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import userApi from '../api/userApi';
import AuthLayout from '../components/layout/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import OtpInput from '../components/auth/OtpInput';
import { useCountdown } from '../hooks/useCountdown';

const OTP_SCREEN_DELAY_MS = 1000;
const RESEND_COOLDOWN_SECONDS = 60;

type RegisterStep = 'details' | 'otp';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<RegisterStep>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resendCountdown = useCountdown(RESEND_COOLDOWN_SECONDS);

  const requestOtp = async () => {
    const payload: Record<string, string> = { name, email, password };
    if (phone) payload.phone = phone;

    const { data } = await userApi.post('/auth/register', payload);

    if (data.success === false) {
      throw new Error(data.message ?? 'Registration failed.');
    }

    setDevOtp(data.otp ?? '');
    toast.success(`Your OTP is: ${data.otp}`, {
      icon: <FiShield color="var(--k-accent)" />,
      autoClose: 10000,
    });
    setMessage('OTP sent to your email.');
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

  const submitRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      if (step === 'details') {
        await requestOtp();
        await new Promise((resolve) => setTimeout(resolve, OTP_SCREEN_DELAY_MS));
        setStep('otp');
        setMessage('Enter the OTP to verify your account.');
      } else {
        const { data } = await userApi.post('/auth/verify-registration', { email, otp });

        if (data.success === false) {
          throw new Error(data.message ?? 'OTP verification failed.');
        }

        if (data.token) {
          localStorage.setItem('userToken', data.token);
        }
        toast.success('Account created! Welcome to ShopNow.', {
          icon: <FiShield color="var(--k-accent)" />,
        });
        navigate('/products');
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message ?? 'Something went wrong.'
        : err instanceof Error ? err.message : 'Something went wrong.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="JOIN SHOPNOW"
      heading="Create your buyer account and start shopping in minutes."
      features={['Free to join', 'Secure OTP login', 'Track orders', 'Easy returns']}
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-tile bg-soft text-[var(--k-on-soft)]">
          <FiUser size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Create account</h1>
          <p className="text-sm text-muted">
            {step === 'details' ? 'Fill in your details to get started.' : 'Enter the OTP sent to your email.'}
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

      <form className="space-y-4" onSubmit={submitRegister}>
        {step === 'details' ? (
          <div key="details" className="animate-up space-y-4">
            <Input label="Full name" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
            <Input
              label="Email address"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              required
            />
            <div className="relative">
              <Input
                label="Password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                minLength={6}
                required
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-[38px] text-muted hover:text-ink"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            <Input
              label={
                <>
                  Phone number <span className="text-muted">(optional)</span>
                </>
              }
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
            />
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
          {step === 'details' ? 'Send OTP' : 'Verify and create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link to="/login" className="font-bold text-accent hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
};

export default SignUpPage;
