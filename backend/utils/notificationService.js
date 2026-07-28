const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * Creates an in-app notification record in MongoDB / Mock DB
 */
const createInAppNotification = async ({ recipientId, senderId, folderId, type, message }) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      folder: folderId,
      type: type || "folder_invite",
      message,
      read: false,
      createdAt: new Date(),
    });
    return notification;
  } catch (err) {
    console.error("Error creating in-app notification:", err.message);
    return null;
  }
};

/**
 * Simulates sending an email notification to folder member
 */
const sendNotificationEmail = async ({ recipientEmail, recipientName, senderName, folderName, permission }) => {
  try {
    const roleText = permission === "write" ? "Editor (Can Add/Remove)" : "Viewer (Read Only)";
    const subject = `Folder Invitation: "${folderName}"`;
    const emailBody = `Hello ${recipientName || recipientEmail},\n\n` +
      `${senderName} has invited you to collaborate on the folder "${folderName}" as ${roleText}.\n` +
      `Log into EduReach Network to view and access shared learning resources.`;

    console.log(`[EMAIL NOTIFICATION SENT] To: ${recipientEmail} | Subject: "${subject}"`);
    console.log(`[EMAIL BODY]:\n${emailBody}`);

    return {
      success: true,
      recipientEmail,
      subject,
      sentAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Error sending notification email:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * High-level helper to trigger both in-app notification & email notification when member is added/invited
 */
const notifyFolderMemberAdded = async ({ recipientUser, senderUser, folder, permission }) => {
  try {
    if (!recipientUser || !senderUser || !folder) return null;

    const senderName = senderUser.name || senderUser.email || "An educator";
    const recipientName = recipientUser.name || recipientUser.email || "Educator";
    const folderName = folder.name || "Collaborative Folder";
    const roleText = permission === "write" ? "an Editor" : "a Viewer";

    const message = `${senderName} invited you to collaborate on folder "${folderName}" as ${roleText}.`;

    // 1. In-app notification
    const notification = await createInAppNotification({
      recipientId: recipientUser._id || recipientUser.id,
      senderId: senderUser._id || senderUser.id,
      folderId: folder._id || folder.id,
      type: "folder_invite",
      message,
    });

    // 2. Email notification
    const emailResult = await sendNotificationEmail({
      recipientEmail: recipientUser.email,
      recipientName,
      senderName,
      folderName,
      permission,
    });

    return {
      notification,
      emailSent: emailResult.success,
    };
  } catch (err) {
    console.error("Error in notifyFolderMemberAdded:", err.message);
    return null;
  }
};

module.exports = {
  createInAppNotification,
  sendNotificationEmail,
  notifyFolderMemberAdded,
};
