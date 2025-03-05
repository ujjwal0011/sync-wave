import React, { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatMessage } from "../lib/utils";
import { Edit, Trash } from "lucide-react";
import toast from "react-hot-toast";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";

function ChatContainer() {
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
    editingMessage,
    setEditingMessage,
    editMessage,
    cancelEditMessage,
  } = useChatStore();

  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      subscribeToMessages();
    }

    return () => unsubscribeFromMessages();
  }, [
    selectedUser._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (editingMessage) {
      setEditText(editingMessage.text);
    }
  }, [editingMessage]);

  const handleDeleteForMe = (messageId, event) => {
    event.stopPropagation();
    deleteMessage(messageId, "forMe");
  };

  const handleDeleteForEveryone = (messageId, senderId, createdAt, event) => {
    event.stopPropagation();
    const messageTime = new Date(createdAt).getTime();
    const currentTime = new Date().getTime();
    const hoursDifference = (currentTime - messageTime) / (1000 * 60 * 60);

    if (senderId === authUser._id && hoursDifference <= 4) {
      deleteMessage(messageId, "forEveryone");
    } else {
      toast.error(
        "You can only delete your messages sent within the last 4 hours"
      );
    }
  };

  const handleEdit = (message, event) => {
    event.stopPropagation();
    setEditingMessage(message);
  };

  const handleSaveEdit = async () => {
    if (editText.trim() === "") {
      toast.error("Message cannot be empty");
      return;
    }

    const success = await editMessage(editingMessage._id, editText);
    if (success) {
      toast.success("Message updated");
    }
  };

  const getDateLabel = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const groupedMessages = messages.reduce((acc, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(message);
    return acc;
  }, {});

  if (isMessagesLoading)
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.keys(groupedMessages).map((dateString) => (
          <React.Fragment key={dateString}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <div className="border-t border-gray-300 flex-grow mx-4"></div>
              <span className="text-xs text-gray-500 bg-white px-2">
                {getDateLabel(dateString)}
              </span>
              <div className="border-t border-gray-300 flex-grow mx-4"></div>
            </div>

            {groupedMessages[dateString].map((message) => {
              if (message.deletedForEveryone) {
                return (
                  <div
                    key={message._id}
                    className={`chat ${
                      message.senderId === authUser._id
                        ? "chat-end"
                        : "chat-start"
                    }`}
                  >
                    <div className="chat-bubble bg-gray-300 text-gray-600 italic">
                      This message was deleted
                    </div>
                  </div>
                );
              }

              const isEditing =
                editingMessage && editingMessage._id === message._id;

              return (
                <div
                  key={message._id}
                  className={`chat ${
                    message.senderId === authUser._id
                      ? "chat-end"
                      : "chat-start"
                  } relative`}
                  ref={
                    message === messages[messages.length - 1]
                      ? messageEndRef
                      : null
                  }
                >
                  <div className="chat-image avatar">
                    <div className="size-10 rounded-full border">
                      <img
                        src={
                          message.senderId === authUser._id
                            ? authUser.profilePic || "/noavatar.png"
                            : selectedUser.profilePic || "/noavatar.png"
                        }
                        alt="Profile Pic"
                      />
                    </div>
                  </div>

                  {message.senderId === authUser._id && !isEditing && (
                    <div className="dropdown dropdown-left absolute right-0 top-0">
                      <div
                        tabIndex={0}
                        role="button"
                        className="btn btn-xs btn-circle m-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </div>
                      <ul
                        tabIndex={0}
                        className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52"
                      >
                        {message.text && (
                          <li>
                            <a
                              onClick={(e) => handleEdit(message, e)}
                              className="flex items-center"
                            >
                              <Edit size={16} className="mr-2" />
                              Edit message
                            </a>
                          </li>
                        )}
                        <li>
                          <a
                            onClick={(e) => handleDeleteForMe(message._id, e)}
                            className="flex items-center"
                          >
                            <Trash size={16} className="mr-2" />
                            Delete for me
                          </a>
                        </li>
                        
                        {message.senderId === authUser._id && (
                          <li>
                            <a
                              onClick={(e) =>
                                handleDeleteForEveryone(
                                  message._id,
                                  message.senderId,
                                  message.createdAt,
                                  e
                                )
                              }
                              className="flex items-center"
                            >
                              <Trash size={16} className="mr-2" />
                              Delete for everyone
                            </a>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="chat-bubble flex flex-col">
                    <div className="chat-header mb-1">
                      <time className="text-xs opacity-50 ml-1">
                        {formatMessage(message.createdAt)}
                        {message.isEdited && (
                          <span className="italic ml-1">(edited)</span>
                        )}
                      </time>
                    </div>

                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          className="textarea textarea-bordered w-full"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          autoFocus
                        ></textarea>
                        <div className="flex gap-2 justify-end">
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={cancelEditMessage}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={handleSaveEdit}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {message.images && (
                          <img
                            src={message.images}
                            alt="Attachment"
                            className="sm:max-w-[200px] rounded-md mb-2"
                          />
                        )}
                        {message.text && <p>{message.text}</p>}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <MessageInput />
    </div>
  );
}

export default ChatContainer;
