"use client"
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import api from '@/app/utils/api';
import Link from 'next/link';
 const Page = () => {
   const [username, setUsername] = useState('');
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const router = useRouter();

   const handleSignup = async () => {
      try {
         await api.post('auth/signup', { username, email, password });
         router.push('/');
      } catch (err) {
         console.error('Signup failed', err);
      }
   };
   return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
         <div className="w-1/3 p-6 bg-gray-800 shadow-xl rounded-lg border border-gray-700">
            <h2 className="text-3xl mb-6 text-gray-200 font-semibold">Sign Up</h2>
            <input
               type="text"
               placeholder="Username"
               value={username}
               onChange={(e) => setUsername(e.target.value)}
               className="border border-gray-600 p-3 mb-4 w-full bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
            />
            <input
               type="email"
               placeholder="Email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="border border-gray-600 p-3 mb-4 w-full bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
            />
            <input
               type="password"
               placeholder="Password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="border border-gray-600 p-3 mb-6 w-full bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
            />
            <button onClick={handleSignup} className="bg-blue-600 text-white p-3 w-full rounded-lg hover:bg-blue-700 transition-all duration-300">
               Sign Up
            </button>
            <p className="text-gray-400 mt-4 text-center">
               Already have an account?{' '}
               <Link href="/" className="text-blue-500 hover:underline">Log in</Link>
            </p>
            
         </div>
      </div>
   );
};

export default Page;