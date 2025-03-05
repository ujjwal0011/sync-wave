import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    images: {
      type: String,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    originalText: {
      type: String,
      default: null,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    deletedForSender: {
      type: Boolean,
      default: false,
    },
    deletedForReceiver: {
      type: Boolean,
      default: false,
    },
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
