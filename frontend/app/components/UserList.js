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
    <div className="w-1/3 bg-gray-900 p-4 border-r border-gray-700">

      <h2 className="text-xl font-semibold text-gray-200 mb-4">Users</h2>
      <ul className="space-y-2">
        {sortedUsers.map((user) => (
          <li
            key={user._id}
            // className={`p-2 py-3 font-semibold rounded-lg cursor-pointer hover:bg-gray-700 }`}
            className={`p-2 py-3 font-semibold rounded-lg cursor-pointer ${
              selectedUser?._id === user._id
                ? "bg-green-600"
                : "hover:bg-gray-700 "
            }`}
            onClick={() => handleUserSelect(user)}
          >
            <span className="text-gray-300">{user.username}</span>
            {unreadCounts[user._id] > 0 && selectedUser?._id !== user._id &&(
              <span className=" text-white bg-green-600 p-1 px-2 rounded-full  font-semibold ml-48">
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
