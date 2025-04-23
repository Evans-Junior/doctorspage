import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';

export default function SignUp() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const name = formData.get('name') as string;
    const specialization = formData.get('specialization') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let imageUrl = '';
      if (imageFile) {
        const imageRef = ref(storage, `profile_images/${user.uid}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      await updateProfile(user, {
        displayName: name,
        photoURL: imageUrl || undefined,
      });

      await setDoc(doc(db, 'doctors', user.uid), {
        uid: user.uid,
        name,
        email,
        specialization,
        country,
        region,
        imageUrl,
        experience: formData.get('experience'),
        description: formData.get('description'),
        reviews: [],
        rating: 0,
        createdAt: new Date(),
      });

      navigate('/');
    } catch (err) {
      console.error('Sign up failed:', err);
      setError('Sign up failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="flex justify-center">
          <UserPlus className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                  Specialization
                </label>
                <input
                  id="specialization"
                  name="specialization"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                />
              </div>

              <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <select
                id="experience"
                name="experience"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
              >
                <option value="" disabled selected>
                  Select experience
                </option>
                {[...Array(51)].map((_, i) => (
                  <option key={i} value={i}>
                    {i} {i === 1 ? 'year' : 'years'}
                  </option>
                ))}
              </select>
            </div>


              <div>
                <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700">
                  Upload Profile Image
                </label>
                <input

// ::contentReference[oaicite:8]{index=8}
      
      id="profileImage"
      name="profileImage"
      type="file"
      accept="image/*"
      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
      className="mt-1 block w-full text-sm text-gray-500"
      />
      </div>

      <div>
      <label className="block text-sm font-medium text-gray-700">
      Country
      </label>
      <CountryDropdown
      value={country}
      onChange={(val) => setCountry(val)}
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
      />
      </div>

      <div>
      <label className="block text-sm font-medium text-gray-700">
      Region / State
      </label>
      <RegionDropdown
      country={country}
      value={region}
      onChange={(val) => setRegion(val)}
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
      />
      </div>
      <div className="md:col-span-2">
  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
    Description
  </label>
  <textarea
    id="description"
    name="description"
    rows={4}
    placeholder="Tell us about your expertise or experience..."
    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm resize-none"
  ></textarea>
</div>

      </div>

      <div>
      <button
      type="submit"
      disabled={loading}
      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition duration-200 ${
      loading
        ? 'bg-indigo-400 cursor-not-allowed'
        : 'bg-indigo-600 hover:bg-indigo-700'
      }`}
      >
      {loading ? (
      <span className="flex items-center gap-2">
        <svg
          className="animate-spin h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
        Signing up...
      </span>
      ) : (
      'Sign Up'
      )}
      </button>
      </div>
      </form>
      </div>
      </div>
      </div>
      );
      }
// Compare this snippet from src/components/Layout.tsx: