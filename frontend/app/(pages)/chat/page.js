"use client"; // Ensure you are using a client component

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import UserList from '@/app/components/UserList';
import ChatBox from '@/app/components/ChatBox';
import api from '@/app/utils/api';

const Page = () => {
   const [selectedUser, setSelectedUser] = useState(null);
   const [currentUser, setCurrentUser] = useState(null); // State for current user

   // Fetch current user data from the backend
   useEffect(() => {
      const fetchCurrentUser = async () => {
         const token = localStorage.getItem('token'); // Get the token from local storage or wherever you store it
         try {
            const response = await api.get('chat/currentUser', {
               headers: {
                  Authorization: `Bearer ${token}`, // Set the Authorization header
               },
            });
            setCurrentUser(response.data); // Assuming response.data contains the current user information
         } catch (error) {
            console.error('Error fetching current user:', error.response?.data || error.message);
         }
      };

      fetchCurrentUser();
   }, []);

   const selectUser = (user) => {
      setSelectedUser(user);
   };

   return (
      <div>
         <Header />
         <div className="flex h-screen">
            {currentUser ? (
               <UserList selectUser={selectUser} currentUser={currentUser} />
            ) : (
               "loading..."
            )}
            {selectedUser ? (
               <ChatBox currentUser={currentUser} selectedUser={selectedUser} />
            ) : (
               <div className="w-2/3 flex justify-center items-center">
                  <p>Select a user to start chatting</p>
               </div>
            )}
         </div>
      </div>
   );
};

export default Page; // Change made here to default export
