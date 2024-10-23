"use client";
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import api from "../utils/api";
import { FaCheck, FaCheckDouble } from "react-icons/fa";

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
    <div className="w-2/3 bg-gray-800 p-6 shadow-md rounded-lg flex flex-col border border-gray-700">
      <h2 className="text-2xl font-semibold text-gray-200 mb-6 border-b border-gray-600 pb-4">
        {currentUser?.username} Chat with{" "}
        <span className="text-gray-400">{selectedUser?.username}</span>
      </h2>

      <div className="chat-messages mb-6 h-96 overflow-auto bg-gray-700 p-4 rounded-lg shadow-inner">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-3 flex ${
              msg.from === currentUser?.id ? "justify-end" : "justify-start"
            }`}
          >
            <span
              className={`text-lg p-2 rounded-lg ${
                msg.from === currentUser?.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-500 text-gray-200"
              }`}
            >
              <span className="flex flex-col items-start">
                {msg.content.type === "image" ? (
                  <img
                    src={`http://localhost:8002/${msg.content.url}`}
                    alt="sent-img"
                    style={{ width: "200px" }}
                  />
                ) : (
                  msg.content
                )}
                {msg.isRead !== true &&
                  msg.from === currentUser?.id &&
                  <FaCheck color="orange" className="ml-2" />}
                {(msg.isRead ) && msg.from === currentUser?.id && (
                  <FaCheckDouble color="orange" className="ml-2" />
                )}
              </span>
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input flex items-center">
        <input
          type="text"
          className="w-full p-4 text-[20px] bg-gray-600 text-gray-300 rounded-lg border-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <input type="file" onChange={(e) => setImage(e.target.files[0])} />

        <button
          className="ml-3 p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
