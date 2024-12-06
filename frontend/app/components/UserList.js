"use client";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import api from "../utils/api";

const UserList = ({ selectUser, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({}); // Track unread message counts
  const [lastMessageTimestamps, setLastMessageTimestamps] = useState({}); // Track the last message timestamps
  const [socket, setSocket] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null); // State to track the selected user

  useEffect(() => {
    const newSocket = io("http://localhost:8002");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.connected);
      newSocket.emit("register", currentUser.id);
    });

    // Listen for unread message updates
    newSocket.on("update-unread-count", ({ from, count, timestamp }) => {
      setUnreadCounts((prevCounts) => ({
        ...prevCounts,
        [from]: count,
      }));
         
      console.log("unread counts ",unreadCounts)

      // Update the last message timestamp for sorting
      setLastMessageTimestamps((prevTimestamps) => ({
        ...prevTimestamps,
        [from]: timestamp,
      }));
    });

    return () => {
      newSocket.off("update-unread-count");
      newSocket.off("receive-message");
      newSocket.disconnect();
    };
  }, [currentUser.id, unreadCounts]);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await api.get("chat/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const arrayOfUsers = response.data.filter(
          (item) => item._id !== currentUser?.id
        );
        setUsers(arrayOfUsers);
      } catch (error) {
        console.error(
          "Error fetching users:",
          error.response ? error.response.data : error.message
        );
      }
    };
    fetchUsers();
  }, [currentUser]);

  const handleUserSelect = (user) => {
    selectUser(user);
    setSelectedUser(user); // Set the selected user

    setUnreadCounts((prevCounts) => ({
      ...prevCounts,
      [user._id]: 0, // Reset the count to 0 when a user is selected
    }));

    socket.emit("reset-unread-count", { to: currentUser.id, from: user._id });
    socket.emit("join-room", { from: currentUser.id, to: user._id });
  };

  // Sort users by last message timestamp
  const sortedUsers = users.sort((a, b) => {
    const lastMessageA = lastMessageTimestamps[a._id] || 0;
    const lastMessageB = lastMessageTimestamps[b._id] || 0;

    return new Date(lastMessageB) - new Date(lastMessageA); // Sort by the most recent message timestamp
  });

  return (
    <div className="w-1/3 bg-gradient-to-b from-gray-800 to-gray-900 p-6 border-r border-gray-700 min-h-screen">
      <h2 className="text-2xl font-bold text-white mb-6 tracking-wide">
        Chats
      </h2>
      <ul className="space-y-3">
        {sortedUsers.map((user) => (
          <li
            key={user._id}
            className={`flex items-center justify-between p-4 rounded-lg shadow-sm transition-all duration-300 cursor-pointer ${
              selectedUser?._id === user._id
                ? "bg-green-700 shadow-lg"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => handleUserSelect(user)}
          >
            <span className="text-gray-200 font-medium text-lg">
              {user.username}
            </span>
            {unreadCounts[user._id] > 0 && selectedUser?._id !== user._id && (
              <span className="text-white bg-red-600 text-sm font-semibold px-3 py-1 rounded-full">
                {unreadCounts[user._id]}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
