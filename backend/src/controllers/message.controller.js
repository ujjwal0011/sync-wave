import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in Get Users for Sidebar controller: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    const filteredMessages = messages.filter(message => {
      if (message.deletedForEveryone) {
        return true;
      }
      
      if (message.senderId.toString() === myId.toString() && message.deletedForSender) {
        return false;
      }

      if (message.receiverId.toString() === myId.toString() && message.deletedForReceiver) {
        return false;
      }

      return true;
    });

    res.status(200).json(filteredMessages);
  } catch (error) {
    console.log("Error in Get Messages controller: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      images: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in Send Message controller: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteType } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (deleteType === "forEveryone") {
      if (message.senderId.toString() !== userId.toString()) {
        return res
          .status(403)
          .json({
            message: "You can only delete your own messages for everyone",
          });
      }

      const messageTime = new Date(message.createdAt).getTime();
      const currentTime = new Date().getTime();
      const hoursDifference = (currentTime - messageTime) / (1000 * 60 * 60);

      if (hoursDifference > 4) {
        return res
          .status(400)
          .json({
            message:
              "Messages older than 4 hours cannot be deleted for everyone",
          });
      }

      message.deletedForEveryone = true;
      await message.save();

      const receiverSocketId = getReceiverSocketId(message.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", {
          messageId,
          deleteType: "forEveryone",
        });
      }

      return res.status(200).json({ message: "Message deleted for everyone" });
    }

    if (deleteType === "forMe") {
      if (message.senderId.toString() === userId.toString()) {
        message.deletedForSender = true;
      } else if (message.receiverId.toString() === userId.toString()) {
        message.deletedForReceiver = true;
      } else {
        return res
          .status(403)
          .json({ message: "Unauthorized to delete this message" });
      }

      await message.save();
      return res.status(200).json({ message: "Message deleted for you" });
    }

    res.status(400).json({ message: "Invalid delete type" });
  } catch (error) {
    console.log("Error in Delete Message controller: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: "You can only edit your own messages" 
      });
    }

    if (message.deletedForEveryone) {
      return res.status(400).json({ 
        message: "Cannot edit a message that has been deleted for everyone" 
      });
    }

    if (!message.isEdited) {
      message.originalText = message.text;
    }

    message.text = text;
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", message);
    }

    return res.status(200).json(message);
  } catch (error) {
    console.log("Error in Edit Message controller: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


