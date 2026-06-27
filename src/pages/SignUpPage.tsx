import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPhone, FiShield, FiShoppingBag, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import userApi from '../api/userApi';
import Button from '../components/Button';

const OTP_SCREEN_DELAY_MS = 1000;

type RegisterStep = 'details' | 'otp';

const AuthTopBar = () => (
  <header className="border-b border-gray-200 bg-white">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
      <Link to="/products" className="flex items-center gap-2 text-text">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
          <FiShoppingBag size={22} />
        </span>
        <span className="text-lg font-bold">ShopNow</span>
      </Link>
      <Link to="/login" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-text hover:border-primary hover:text-accent">
        Sign in
      </Link>
    </div>
  </header>
);

const AuthFooter = () => (
  <footer className="border-t border-gray-200 bg-white">
    <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p>ShopNow</p>
      <p>Browse, add to cart, and checkout with ease.</p>
    </div>
  </footer>
);

const SignUpPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<RegisterStep>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      if (step === 'details') {
        const { data } = await userApi.post('/auth/register', { name, phone });

        if (data.success === false) {
          throw new Error(data.message ?? 'Registration failed.');
        }

        setRegistrationToken(data.registrationToken ?? '');
        toast.success(`Your OTP is: ${data.otp}`, {
          icon: <FiShield color="#A78BFA" />,
          autoClose: 10000,
        });
        setMessage('OTP received. Opening verification...');
        await new Promise((resolve) => setTimeout(resolve, OTP_SCREEN_DELAY_MS));
        setStep('otp');
        setMessage('Enter the OTP to verify your account.');
      } else {
        const { data } = await userApi.post('/auth/verify-registration', { otp, registrationToken });

        if (data.success === false) {
          throw new Error(data.message ?? 'OTP verification failed.');
        }

        if (data.token) {
          localStorage.setItem('userToken', data.token);
        }
        toast.success('Account created! Welcome to ShopNow.', {
          icon: <FiShield color="#A78BFA" />,
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
    <div className="flex min-h-screen flex-col bg-background text-text">
      <AuthTopBar />
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
          <section className="hidden lg:block">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Join ShopNow</p>
            <h1 className="mt-3 max-w-xl text-4xl font-bold leading-tight text-text">
              Create your buyer account and start shopping in minutes.
            </h1>
            <div className="mt-8 grid max-w-xl grid-cols-2 gap-4">
              {['Free to join', 'Secure OTP login', 'Track orders', 'Easy returns'].map((item) => (
                <div key={item} className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                  <FiShield className="text-primary" size={24} />
                  <p className="mt-3 text-sm font-semibold text-text">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-md sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-primary">
                <FiUser size={24} />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-text">Create account</h2>
                <p className="text-sm text-gray-600">
                  {step === 'details' ? 'Enter your name and phone number.' : 'Enter the OTP to verify your account.'}
                </p>
              </div>
            </div>

            {message && <div className="mb-4 rounded-lg border border-primary bg-secondary p-3 text-sm text-accent">{message}</div>}
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <form className="space-y-4" onSubmit={submitRegister}>
              {step === 'details' ? (
                <>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text">Full name</label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Jane Doe"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-text">Phone number</label>
                    <div className="mt-1 flex items-center rounded-lg border border-gray-200 bg-white px-3 shadow-sm focus-within:ring-2 focus-within:ring-primary">
                      <FiPhone className="text-primary" size={20} />
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-3 text-sm outline-none"
                        placeholder="9876543210"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-text">OTP</label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="6 digit OTP"
                    required
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                label={isSubmitting ? 'Please wait...' : step === 'details' ? 'Send OTP' : 'Verify and create account'}
                className="w-full py-3"
              />
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account? <Link to="/login" className="font-semibold text-accent hover:underline">Sign in</Link>
            </p>
          </section>
        </div>
      </main>
      <AuthFooter />
    </div>
  );
};

export default SignUpPage;
