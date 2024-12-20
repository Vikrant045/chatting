"use client";
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import api from "../utils/api";
import { FaCheck, FaCheckDouble } from "react-icons/fa";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const socket = io("http://localhost:8002"); // Ensure this points to your backend URL

const ChatBox = ({ currentUser, selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null); // Reference for scrolling
  const [msgStatus, setMsgStatus] = useState(false);
  const [image, setImage] = useState(null); // New state for image

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      console.log("Scrolled to bottom"); // Debugging line
    }
  };

  useEffect(() => {
    socket.on("active-chat", ({ from, to }) => {
      console.log("Active chat detected between", from, to);
      const fetchMessages = async () => {
        try {
          const response = await api.get(
            `chat/messages/${currentUser.id}/${selectedUser._id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          setMessages(response.data);
        } catch (error) {
          console.error(
            "Error fetching messages:",
            error.response ? error.response.data : error.message
          );
        }
      };
      fetchMessages();

      // Check if the current user is part of the active chat
      if (
        (currentUser.id === from && selectedUser._id === to) ||
        (currentUser.id === to && selectedUser._id === from)
      ) {
        console.log("Inside the active chat");
        setMsgStatus(true);
      }
    });

    return () => {
      socket.off("active-chat");
    };
  }, [currentUser, selectedUser]);

  useEffect(() => {
    socket.emit("register", currentUser.id);

    const fetchMessages = async () => {
      try {
        const response = await api.get(
          `chat/messages/${currentUser.id}/${selectedUser._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setMessages(response.data);
      } catch (error) {
        console.error(
          "Error fetching messages:",
          error.response ? error.response.data : error.message
        );
      }
    };

    if (selectedUser) {
      fetchMessages();
      socket.emit("reset-unread-count", {
        to: currentUser.id,
        from: selectedUser._id,
      });
      socket.emit("join-room", { from: currentUser.id, to: selectedUser._id });
    }
  }, [selectedUser]);

  useEffect(() => {
    const handleReceiveMessage = (newMessage) => {
      if (
        newMessage.from !== currentUser.id &&
        newMessage.from === selectedUser._id
      ) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    };

    socket.on("receive-message", handleReceiveMessage);

    return () => {
      socket.off("receive-message", handleReceiveMessage); // Cleanup
    };
  }, [currentUser, selectedUser]);

  useEffect(() => {
    scrollToBottom(); // Scroll to the bottom whenever messages change
  }, [messages]);

  const sendMessage = async () => {
    if (!message && !image) return; // Prevent sending an empty message

    const newMessage = {
      from: currentUser.id,
      to: selectedUser._id,
      content: message,
      timestamp: new Date().toISOString(),
    };

    if (image) {
      // Handle image upload
      const formData = new FormData();
      formData.append("image", image);
      formData.append("from", currentUser.id);
      formData.append("to", selectedUser._id);

      try {
        const response = await api.post("/chat/messages/image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        socket.emit("send-message", response.data);
        setMessages((prevMessages) => [...prevMessages, response.data]);
        setImage(null); // Clear image after sending
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    } else {
      // Handle text message
      try {
        const response = await api.post("/chat/messages", newMessage, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        socket.emit("send-message", response.data);
        setMessages((prevMessages) => [...prevMessages, response.data]);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }

    setMessage(""); // Clear input field
  };

  return (
    <div className="w-full md:w-2/3 bg-gray-900 p-6 shadow-lg rounded-lg flex flex-col border border-gray-700">
      <h2 className="text-2xl font-semibold text-green-400 mb-6 border-b border-gray-600 pb-4">
        {currentUser?.username} Chat with{" "}
        <span className="text-gray-400">{selectedUser?.username}</span>
      </h2>
      <div className="chat-messages mb-6 h-96 overflow-auto bg-gray-800 p-4 rounded-lg shadow-inner">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-3 flex ${
              msg.from === currentUser?.id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`text-lg p-3 rounded-2xl max-w-xs ${
                msg.from === currentUser?.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-200"
              }`}
            >
              <div className="flex flex-col items-start">
                {msg.content.type === "image" ? (
                  <img
                    src={`http://localhost:8002/${msg.content.url}`}
                    alt="sent-img"
                    className="rounded-md mb-2 border border-gray-500 shadow-lg"
                    style={{ maxWidth: "250px" }}
                  />
                ) : (
                  <p>{msg.content}</p>
                )}

                <div className="flex items-center justify-end mt-1">
                  <span className="text-xs text-gray-400">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                  {msg.isRead !== true && msg.from === currentUser?.id && (
                    <FaCheck color="orange" className="ml-2" />
                  )}
                  {msg.isRead && msg.from === currentUser?.id && (
                    <FaCheckDouble color="orange" className="ml-2" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="message-input flex items-center space-x-3">
        <input
          type="text"
          className="flex-grow p-4 text-lg bg-gray-700 text-gray-300 rounded-full border-none focus:ring-2 focus:ring-green-500"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={(e) => setImage(e.target.files[0])}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-300 hover:text-green-400 transition duration-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 16v-5a4 4 0 014-4h10a4 4 0 014 4v5M8 12h.01M12 12h.01M16 12h.01M12 16v5m-4-5h8"
            />
          </svg>
        </label>
        <button
          className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition duration-300 focus:outline-none"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
      {/* <SkeletonTheme baseColor="green" highlightColor="#444">
        <div className="flex space-x-3  items-center">
          <Skeleton
            count={1}
            height={55}
            width={850}
            borderRadius={50}
            containerClassName="flex flex-col "
          />
          <Skeleton
            count={1}
            height={22}
            width={25}
            borderRadius={30}
            containerClassName="flex flex-col "
          />
          <Skeleton
            count={1}
            height={50}
            width={65}
            borderRadius={30}
            containerClassName="flex flex-col "
          />
        </div>
      </SkeletonTheme> */}
    </div>
  );
};

export default ChatBox;
