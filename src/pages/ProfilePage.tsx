import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiEdit2, FiMapPin, FiPlus, FiSave, FiUser, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import userApi from '../api/userApi';
import Navbar from '../components/Navbar';
import Button from '../components/Button';

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

const inputCls = 'mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary';
const labelCls = 'block text-sm font-medium text-text';

const ProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="flex min-h-screen flex-col bg-background text-text">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-8 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">My Account</p>
            <h1 className="text-2xl font-bold text-text">Profile</h1>
          </div>
        </section>

        <section className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <div className="flex gap-4">
                  <div className="h-20 w-20 shrink-0 rounded-full bg-secondary" />
                  <div className="flex-1 space-y-3 pt-2">
                    <div className="h-5 w-1/3 rounded bg-secondary" />
                    <div className="h-4 w-1/2 rounded bg-secondary" />
                    <div className="h-4 w-2/5 rounded bg-secondary" />
                  </div>
                </div>
              </div>
              <div className="h-40 rounded-lg border border-gray-200 bg-white shadow-md" />
            </div>
          ) : !profile ? null : (
            <>
              {/* Personal Information */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                      <FiUser size={20} />
                    </span>
                    <h2 className="text-lg font-bold text-text">Personal Information</h2>
                  </div>
                  {!isEditingProfile && (
                    <button
                      type="button"
                      onClick={startEditProfile}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:border-primary hover:text-accent"
                    >
                      <FiEdit2 size={14} />
                      Edit
                    </button>
                  )}
                </div>

                {!isEditingProfile ? (
                  <div className="flex gap-5">
                    <img
                      src={profile.profileImage}
                      alt={profile.name ?? 'User'}
                      className="h-20 w-20 shrink-0 rounded-full border-2 border-primary object-cover"
                    />
                    <div className="grid flex-1 grid-cols-1 gap-y-4 text-sm sm:grid-cols-2">
                      {profile.name && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Name</p>
                          <p className="mt-0.5 font-semibold text-text">{profile.name}</p>
                        </div>
                      )}
                      {profile.email && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</p>
                          <p className="mt-0.5 font-semibold text-text">{profile.email}</p>
                        </div>
                      )}
                      {profile.phone && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</p>
                          <p className="mt-0.5 font-semibold text-text">{profile.phone}</p>
                        </div>
                      )}
                      {profile.dob && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Date of Birth</p>
                          <p className="mt-0.5 font-semibold text-text">{formatDate(profile.dob)}</p>
                        </div>
                      )}
                      {profile.gender && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Gender</p>
                          <p className="mt-0.5 font-semibold capitalize text-text">{profile.gender}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={saveProfile} className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={previewImage ?? profile.profileImage}
                          alt="avatar"
                          className="h-20 w-20 rounded-full border-2 border-primary object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-accent"
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
                      <p className="text-xs text-gray-500">Click the camera icon to change your profile photo.</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>Name</label>
                        <input type="text" className={inputCls} value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" />
                      </div>
                      <div>
                        <label className={labelCls}>Email</label>
                        <input type="email" className={inputCls} value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="your@email.com" />
                      </div>
                      <div>
                        <label className={labelCls}>Phone</label>
                        <input type="tel" className={inputCls} value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="9876543210" />
                      </div>
                      <div>
                        <label className={labelCls}>Date of Birth</label>
                        <input type="date" className={inputCls} value={editDob} onChange={e => setEditDob(e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>Gender</label>
                        <select
                          className={inputCls}
                          value={editGender}
                          onChange={e => setEditGender(e.target.value as typeof editGender)}
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        label={isSavingProfile ? 'Saving...' : 'Save changes'}
                        icon={<FiSave size={16} />}
                        disabled={isSavingProfile}
                        className="py-2.5"
                      />
                      <button
                        type="button"
                        onClick={cancelEditProfile}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:border-primary hover:text-accent"
                      >
                        <FiX size={16} />
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Default Address */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                      <FiMapPin size={20} />
                    </span>
                    <h2 className="text-lg font-bold text-text">Default Address</h2>
                  </div>
                  {!isEditingAddress && !isAddingAddress && (
                    <div className="flex gap-2">
                      {profile.defaultAddress && (
                        <button
                          type="button"
                          onClick={startEditAddress}
                          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:border-primary hover:text-accent"
                        >
                          <FiEdit2 size={14} />
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={startAddAddress}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:border-primary hover:text-accent"
                      >
                        <FiPlus size={14} />
                        Add new
                      </button>
                    </div>
                  )}
                </div>

                {!isEditingAddress && !isAddingAddress ? (
                  profile.defaultAddress ? (
                    <div className="rounded-lg border border-primary bg-secondary p-4 text-sm">
                      <p className="font-bold text-text">{profile.defaultAddress.fullName}</p>
                      <p className="mt-1 text-gray-600">
                        {profile.defaultAddress.addressLine1}
                        {profile.defaultAddress.addressLine2 ? `, ${profile.defaultAddress.addressLine2}` : ''}
                      </p>
                      <p className="text-gray-600">
                        {profile.defaultAddress.city}, {profile.defaultAddress.state} – {profile.defaultAddress.pincode}
                      </p>
                      <p className="text-gray-600">{profile.defaultAddress.country}</p>
                      <p className="text-gray-600">Phone: {profile.defaultAddress.phone}</p>
                      <span className="mt-3 inline-block rounded-lg bg-primary px-2 py-0.5 text-xs font-bold text-white">
                        Default
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                      <FiMapPin className="mx-auto text-primary" size={28} />
                      <p className="mt-2 text-sm font-semibold text-text">No address saved</p>
                      <p className="mt-1 text-xs text-gray-500">Add a default shipping address to speed up checkout.</p>
                    </div>
                  )
                ) : (
                  <form onSubmit={saveAddress} className="space-y-4">
                    <p className="text-sm font-semibold text-accent">
                      {isEditingAddress ? 'Edit default address' : 'Add a new address'}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>Full name</label>
                        <input type="text" required className={inputCls} value={addrFullName} onChange={e => setAddrFullName(e.target.value)} placeholder="Full name" />
                      </div>
                      <div>
                        <label className={labelCls}>Phone</label>
                        <input type="tel" required className={inputCls} value={addrPhone} onChange={e => setAddrPhone(e.target.value)} placeholder="9876543210" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Address line 1</label>
                        <input type="text" required className={inputCls} value={addrLine1} onChange={e => setAddrLine1(e.target.value)} placeholder="Street / house number" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Address line 2 (optional)</label>
                        <input type="text" className={inputCls} value={addrLine2} onChange={e => setAddrLine2(e.target.value)} placeholder="Landmark, area" />
                      </div>
                      <div>
                        <label className={labelCls}>City</label>
                        <input type="text" required className={inputCls} value={addrCity} onChange={e => setAddrCity(e.target.value)} placeholder="City" />
                      </div>
                      <div>
                        <label className={labelCls}>State</label>
                        <input type="text" required className={inputCls} value={addrState} onChange={e => setAddrState(e.target.value)} placeholder="State" />
                      </div>
                      <div>
                        <label className={labelCls}>Pincode</label>
                        <input type="text" required className={inputCls} value={addrPincode} onChange={e => setAddrPincode(e.target.value)} placeholder="Pincode" />
                      </div>
                      {isAddingAddress && (
                        <div className="flex items-center gap-2 self-end pb-2">
                          <input
                            type="checkbox"
                            id="addrIsDefault"
                            checked={addrIsDefault}
                            onChange={e => setAddrIsDefault(e.target.checked)}
                            className="h-4 w-4 accent-primary"
                          />
                          <label htmlFor="addrIsDefault" className="cursor-pointer text-sm font-medium text-text">
                            Set as default
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-1">
                      <Button
                        type="submit"
                        label={isSavingAddress ? 'Saving...' : 'Save address'}
                        icon={<FiSave size={16} />}
                        disabled={isSavingAddress}
                        className="py-2.5"
                      />
                      <button
                        type="button"
                        onClick={cancelAddressForm}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:border-primary hover:text-accent"
                      >
                        <FiX size={16} />
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>ShopNow</p>
          <p>Discover and shop from thousands of products.</p>
        </div>
      </footer>
    </div>
  );
};

export default ProfilePage;
