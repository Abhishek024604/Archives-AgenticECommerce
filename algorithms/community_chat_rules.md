# Community Chat Rules & Algorithms

## 1. Chat Action Button Logic

The community chat panel implements role-based access control for its primary action button (Join / Leave / Delete). The algorithm to determine which button to display is as follows:

1. **Admin/Creator Check:**
   - If the currently authenticated user is the creator of the community (i.e., `user._id === community.createdBy._id`), they are identified as the Admin.
   - **Action Rendered:** **[Delete Community]**
   - *Constraint:* Admins cannot "Leave" their own community; they must delete it if they no longer wish to manage it.

2. **Membership Check (Non-Admins):**
   - If the user is not the Admin, the system checks if their `user._id` exists within the `community.members` array.
   - **Condition True (User is a member):**
     - **Action Rendered:** **[Leave]**
   - **Condition False (User is not a member):**
     - **Action Rendered:** **[Join]**

## 2. Real-Time Chat Message Grouping

To improve chat readability, messages are grouped visually by their creation date, inspired by standard messaging platforms like WhatsApp.

**Date Label Algorithm:**
For each message rendered in the chat stream:
1. Extract the `createdAt` timestamp of the message.
2. If it is the first message in the list, format the date.
3. Compare the formatted date of the current message against the formatted date of the *previous* message in the list.
4. If the formatted date differs, a date separator badge is rendered directly above the current message.

**Formatting Rules:**
- **Today:** If the message date matches the current local date.
- **Yesterday:** If the message date matches exactly one day prior to the current local date.
- **Specific Date:** If the message is older than yesterday, it falls back to a long localized date format (e.g., `August 1, 2026`).

## 3. Real-Time Interactions (Socket.io)

- **Joining/Leaving:** When a user clicks Join or Leave, a REST API call updates their membership status in the database, followed immediately by a UI refresh.
- **Messaging:** Messages are emitted via `sendMessage` through a WebSocket connection. The server broadcasts `newMessage` to the specific community room, instantly updating the UI for all connected participants without requiring a manual refresh.
