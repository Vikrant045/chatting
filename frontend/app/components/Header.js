"use client"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const Header = () => {
   const router = useRouter();

   const logout = () => {
      localStorage.removeItem('token');
      router.push('/');
   };

   return (
      <div className="flex justify-between p-4 bg-blue-600 text-white">
         <h1 className="text-2xl">Chat App</h1>
         <button onClick={logout} className="bg-red-500 px-4 py-2 rounded">
            Logout
         </button>
      </div>
   );
};

export default Header;
