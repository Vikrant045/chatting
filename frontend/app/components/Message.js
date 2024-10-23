import React from 'react';

const Message = ({ message, sender }) => {
   return (
      <div className={`flex items-start mb-2 ${sender ? 'justify-end' : 'justify-start'}`}>
         <div className={`max-w-xs p-2 rounded-lg ${sender ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
            <p>{message.text}</p>
            <span className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleTimeString()}</span>
         </div>
      </div>
   );
};

export default Message;
