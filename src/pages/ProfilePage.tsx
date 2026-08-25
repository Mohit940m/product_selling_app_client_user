import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiEdit2, FiMapPin, FiPlus, FiSave, FiUser, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import userApi from '../api/userApi';
import Container from '../components/layout/Container';
import Panel from '../components/ui/Panel';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Sheet from '../components/ui/Sheet';
import Switch from '../components/ui/Switch';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import { useTheme } from '../theme/ThemeProvider';

type UserAddress = {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
};

type Profile = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  defaultAddress?: UserAddress;
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addrFullName, setAddrFullName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(true);

  const addressSheetOpen = isEditingAddress || isAddingAddress;

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) { navigate('/login'); return; }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const { data } = await userApi.get('/profile');
      setProfile(data.data);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message ?? 'Failed to load profile.' : 'Failed to load profile.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditProfile = () => {
    if (!profile) return;
    setEditName(profile.name ?? '');
    setEditEmail(profile.email ?? '');
    setEditPhone(profile.phone ?? '');
    setEditDob(profile.dob ? profile.dob.slice(0, 10) : '');
    setEditGender(profile.gender ?? '');
    setImageFile(null);
    setPreviewImage(null);
    setIsEditingProfile(true);
  };

  const cancelEditProfile = () => {
    setIsEditingProfile(false);
    setPreviewImage(null);
    setImageFile(null);
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const formData = new FormData();
      if (editName) formData.append('name', editName);
      if (editEmail) formData.append('email', editEmail);
      if (editPhone) formData.append('phone', editPhone);
      if (editDob) formData.append('dob', editDob);
      if (editGender) formData.append('gender', editGender);
      if (imageFile) formData.append('profileImage', imageFile);

      const { data } = await userApi.put('/profile', formData);
      setProfile(prev => prev ? { ...prev, ...data.data } : data.data);
      toast.success('Profile updated successfully.');
      setIsEditingProfile(false);
      setPreviewImage(null);
      setImageFile(null);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message ?? 'Failed to update profile.' : 'Failed to update profile.';
      toast.error(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const startEditAddress = () => {
    if (!profile?.defaultAddress) return;
    const a = profile.defaultAddress;
    setAddrFullName(a.fullName);
    setAddrPhone(a.phone);
    setAddrLine1(a.addressLine1);
    setAddrLine2(a.addressLine2 ?? '');
    setAddrCity(a.city);
    setAddrState(a.state);
    setAddrPincode(a.pincode);
    setAddrIsDefault(true);
    setIsEditingAddress(true);
    setIsAddingAddress(false);
  };

  const startAddAddress = () => {
    setAddrFullName(profile?.name ?? '');
    setAddrPhone(profile?.phone ?? '');
    setAddrLine1('');
    setAddrLine2('');
    setAddrCity('');
    setAddrState('');
    setAddrPincode('');
    setAddrIsDefault(true);
    setIsAddingAddress(true);
    setIsEditingAddress(false);
  };

  const cancelAddressForm = () => {
    setIsEditingAddress(false);
    setIsAddingAddress(false);
  };

  const saveAddress = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingAddress(true);
    const payload = {
      fullName: addrFullName,
      phone: addrPhone,
      addressLine1: addrLine1,
      ...(addrLine2 && { addressLine2: addrLine2 }),
      city: addrCity,
      state: addrState,
      pincode: addrPincode,
      isDefault: addrIsDefault,
    };
    try {
      if (isEditingAddress && profile?.defaultAddress) {
        await userApi.put(`/profile/address/${profile.defaultAddress._id}`, payload);
        toast.success('Address updated successfully.');
      } else {
        await userApi.post('/profile/address', payload);
        toast.success('Address added successfully.');
      }
      await loadProfile();
      setIsEditingAddress(false);
      setIsAddingAddress(false);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message ?? 'Failed to save address.' : 'Failed to save address.';
      toast.error(msg);
    } finally {
      setIsSavingAddress(false);
    }
  };

  return (
    <Container className="max-w-3xl! py-6 lg:py-10">
      <div className="mb-6 lg:mb-8">
        <p className="font-mono text-[11px] font-bold text-muted">MY ACCOUNT</p>
        <h1 className="mt-1.5 font-extrabold text-[22px] tracking-[-.02em]">Profile</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Panel>
            <div className="flex gap-5">
              <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
              <div className="flex-1 space-y-3 pt-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </Panel>
          <Skeleton preset="block" className="h-40" />
        </div>
      ) : !profile ? null : (
        <div className="space-y-5">
          {/* Personal Information */}
          <Panel>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-tile bg-soft text-[var(--k-on-soft)]">
                  <FiUser size={20} />
                </span>
                <h2 className="text-lg font-extrabold text-ink">Personal Information</h2>
              </div>
              {!isEditingProfile && (
                <button
                  type="button"
                  onClick={startEditProfile}
                  className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-bold text-muted t-fast hover:border-accent hover:text-accent"
                >
                  <FiEdit2 size={14} />
                  Edit
                </button>
              )}
            </div>

            {!isEditingProfile ? (
              <div className="flex gap-5">
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={profile.name ?? 'User'}
                    className="h-[66px] w-[66px] shrink-0 rounded-[22px] border border-line object-cover"
                  />
                ) : (
                  <div className="bg-hatch flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-[22px] border border-line">
                    <FiUser size={24} className="text-muted" />
                  </div>
                )}
                <div className="grid flex-1 grid-cols-1 gap-y-4 text-sm sm:grid-cols-2">
                  {profile.name && (
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-muted">Name</p>
                      <p className="mt-0.5 font-bold text-ink">{profile.name}</p>
                    </div>
                  )}
                  {profile.email && (
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-muted">Email</p>
                      <p className="mt-0.5 font-bold text-ink">{profile.email}</p>
                    </div>
                  )}
                  {profile.phone && (
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-muted">Phone</p>
                      <p className="mt-0.5 font-bold text-ink">{profile.phone}</p>
                    </div>
                  )}
                  {profile.dob && (
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-muted">Date of Birth</p>
                      <p className="mt-0.5 font-bold text-ink">{formatDate(profile.dob)}</p>
                    </div>
                  )}
                  {profile.gender && (
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-muted">Gender</p>
                      <p className="mt-0.5 font-bold capitalize text-ink">{profile.gender}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={saveProfile} className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {previewImage ?? profile.profileImage ? (
                      <img
                        src={previewImage ?? profile.profileImage}
                        alt="avatar"
                        className="h-20 w-20 rounded-full border border-line object-cover"
                      />
                    ) : (
                      <div className="bg-hatch flex h-20 w-20 items-center justify-center rounded-full border border-line">
                        <FiUser size={26} className="text-muted" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-onacc t-fast hover:shadow-lift-accent-cta"
                    >
                      <FiCamera size={13} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </div>
                  <p className="text-xs text-muted">Click the camera icon to change your profile photo.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Name" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" />
                  <Input label="Email" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="your@email.com" />
                  <Input label="Phone" type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="9876543210" />
                  <Input label="Date of Birth" type="date" value={editDob} onChange={e => setEditDob(e.target.value)} />
                  <Select label="Gender" value={editGender} onChange={e => setEditGender(e.target.value as typeof editGender)}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" variant="primary" icon={<FiSave size={16} />} loading={isSavingProfile}>
                    Save changes
                  </Button>
                  <Button type="button" variant="outline" icon={<FiX size={16} />} onClick={cancelEditProfile}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </Panel>

          {/* Default Address */}
          <Panel>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-tile bg-soft text-[var(--k-on-soft)]">
                  <FiMapPin size={20} />
                </span>
                <h2 className="text-lg font-extrabold text-ink">Default Address</h2>
              </div>
              <div className="flex gap-2">
                {profile.defaultAddress && (
                  <button
                    type="button"
                    onClick={startEditAddress}
                    className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-bold text-muted t-fast hover:border-accent hover:text-accent"
                  >
                    <FiEdit2 size={14} />
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={startAddAddress}
                  className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-bold text-muted t-fast hover:border-accent hover:text-accent"
                >
                  <FiPlus size={14} />
                  Add new
                </button>
              </div>
            </div>

            {profile.defaultAddress ? (
              <div className="rounded-card border border-accent bg-soft2 p-4 text-sm">
                <div className="flex items-center gap-2">
                  <p className="font-extrabold text-ink">{profile.defaultAddress.fullName}</p>
                  <Badge tone="ink">DEFAULT</Badge>
                </div>
                <p className="mt-1.5 text-muted">
                  {profile.defaultAddress.addressLine1}
                  {profile.defaultAddress.addressLine2 ? `, ${profile.defaultAddress.addressLine2}` : ''}
                </p>
                <p className="text-muted">
                  {profile.defaultAddress.city}, {profile.defaultAddress.state} – {profile.defaultAddress.pincode}
                </p>
                <p className="text-muted">{profile.defaultAddress.country}</p>
                <p className="text-muted">Phone: {profile.defaultAddress.phone}</p>
              </div>
            ) : (
              <EmptyState
                icon={<FiMapPin size={28} />}
                title="No address saved"
                description="Add a default shipping address to speed up checkout."
              />
            )}
          </Panel>

          {/* Preferences */}
          <Panel className="flex items-center justify-between">
            <span className="text-sm font-bold text-ink">Dark mode</span>
            <Switch checked={theme === 'dark'} onChange={toggleTheme} label="Dark mode" />
          </Panel>
        </div>
      )}

      <Sheet open={addressSheetOpen} onClose={cancelAddressForm} title={isEditingAddress ? 'Edit address' : 'New address'}>
        <form onSubmit={saveAddress} className="space-y-3.5">
          <Input label="Full name" required value={addrFullName} onChange={e => setAddrFullName(e.target.value)} placeholder="Full name" />
          <Input label="Phone" type="tel" required value={addrPhone} onChange={e => setAddrPhone(e.target.value)} placeholder="9876543210" />
          <Input label="Address line 1" required value={addrLine1} onChange={e => setAddrLine1(e.target.value)} placeholder="Street / house number" />
          <Input label="Address line 2 (optional)" value={addrLine2} onChange={e => setAddrLine2(e.target.value)} placeholder="Landmark, area" />
          <div className="flex gap-3">
            <Input label="City" required wrapperClassName="flex-1" value={addrCity} onChange={e => setAddrCity(e.target.value)} placeholder="City" />
            <Input label="ZIP" required wrapperClassName="w-[104px]" value={addrPincode} onChange={e => setAddrPincode(e.target.value)} placeholder="Pincode" />
          </div>
          <Input label="State" required value={addrState} onChange={e => setAddrState(e.target.value)} placeholder="State" />

          {isAddingAddress && (
            <label htmlFor="addrIsDefault" className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                id="addrIsDefault"
                checked={addrIsDefault}
                onChange={e => setAddrIsDefault(e.target.checked)}
                className="h-4 w-4 accent-[var(--k-accent)]"
              />
              <span className="text-sm font-semibold text-ink">Set as default</span>
            </label>
          )}

          <Button type="submit" variant="dark" fullWidth loading={isSavingAddress}>
            Save address
          </Button>
        </form>
      </Sheet>
    </Container>
  );
};

export default ProfilePage;
