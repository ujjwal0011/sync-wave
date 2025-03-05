import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  editingMessage: null,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessages: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  deleteMessage: async (messageId, deleteType) => {
    const { messages } = get();
    try {
      await axiosInstance.delete(`/messages/delete/${messageId}`, {
        data: { deleteType },
      });

      if (deleteType === "forEveryone") {
        set({
          messages: messages.map((msg) =>
            msg._id === messageId ? { ...msg, deletedForEveryone: true } : msg
          ),
        });
      } else if (deleteType === "forMe") {
        set({
          messages: messages.filter((msg) => msg._id !== messageId),
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  setEditingMessage: (message) => {
    set({ editingMessage: message });
  },

  cancelEditMessage: () => {
    set({ editingMessage: null });
  },

  editMessage: async (messageId, text) => {
    const { messages, selectedUser } = get();
    try {
      const res = await axiosInstance.put(`/messages/edit/${messageId}`, {
        text,
      });

      set({
        messages: messages.map((msg) =>
          msg._id === messageId ? { ...res.data } : msg
        ),
        editingMessage: null,
      });

      const socket = useAuthStore.getState().socket;
      socket.emit("editMessage", {
        messageId,
        text,
        receiverId: selectedUser._id,
      });

      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
      return false;
    }
  },

  handleEditedMessage: (data) => {
    const { messages } = get();
    set({
      messages: messages.map((msg) =>
        msg._id === data.messageId
          ? { ...msg, text: data.text, isEdited: true, editedAt: data.editedAt }
          : msg
      ),
    });
  },

  handleDeletedMessage: (data) => {
    const { messages } = get();
    if (data.deleteType === "forEveryone") {
      set({
        messages: messages.map((msg) =>
          msg._id === data.messageId
            ? { ...msg, deletedForEveryone: true }
            : msg
        ),
      });
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      if (newMessage.senderId !== selectedUser._id) return;
      set({ messages: [...get().messages, newMessage] });
    });

    socket.on("messageDeleted", (data) => {
      get().handleDeletedMessage(data);
    });

    socket.on("messageEdited", (data) => {
      get().handleEditedMessage(data);
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("messageEdited");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
