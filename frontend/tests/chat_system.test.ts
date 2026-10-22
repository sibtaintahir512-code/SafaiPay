import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getConversationsForUser,
  getConversationById,
  createDirectConversation,
  createGroupConversation,
  getMessages,
  sendChatMessage,
  editChatMessage,
  deleteChatMessage,
  toggleMessageReaction,
  markConversationAsRead,
  setTypingStatus,
  setUserPresence,
  getUserPresence,
  blockUser,
  unblockUser,
  isUserBlocked,
  reportChatMessage,
  getChatReports,
  getTotalUnreadChatCount,
  searchChatUsers,
  loadDatabase,
} from '../lib/db';
import { processAndSaveUploadedFile } from '../lib/storageEngine';
import { UserRole } from '../lib/chatTypes';

describe('SafaiPay Real-Time Chat System Automated Test Suite', () => {
  // Setup test identities
  const customerUser = {
    id: 'usr_guest_cust',
    name: 'Amina Khan',
    role: 'customer' as UserRole,
    phone: '+92 300 1234567',
  };

  const collectorUser = {
    id: 'usr_guest_coll',
    name: 'Tariq Mehmood',
    role: 'collector' as UserRole,
    phone: '+92 311 2345678',
  };

  const recyclerUser = {
    id: 'usr_guest_recy',
    name: 'GreenCycle Processing Hub 4',
    role: 'recycler' as UserRole,
    phone: '+92 322 3456789',
  };

  const adminUser = {
    id: 'usr_admin_001',
    name: 'SafaiPay Platform Superadmin',
    role: 'admin' as UserRole,
    phone: '+92 300 0009999',
  };

  describe('1. Conversation Management & Privacy Isolation', () => {
    test('retrieves seeded conversations for authenticated users', () => {
      const convs = getConversationsForUser(customerUser.id);
      assert.ok(convs.length >= 2, 'Customer should have at least 2 seeded conversations');

      // Check all returned conversations actually contain the user
      for (const c of convs) {
        assert.ok(c.participant_ids.includes(customerUser.id), 'Conversation must include user ID');
      }
    });

    test('creates or retrieves 1-to-1 direct conversation idempotently', () => {
      // First call: returns existing or creates
      const conv1 = createDirectConversation(customerUser, collectorUser);
      assert.ok(conv1.id, 'Conversation must have an ID');
      assert.equal(conv1.type, 'direct');
      assert.ok(conv1.participant_ids.includes(customerUser.id));
      assert.ok(conv1.participant_ids.includes(collectorUser.id));

      // Second call: must return exact same conversation without duplicating
      const conv2 = createDirectConversation(customerUser, collectorUser);
      assert.equal(conv2.id, conv1.id, 'Should return existing conversation idempotently');
    });

    test('creates multi-user group chat with custom title and admin role', () => {
      const title = 'Phase 2 Plastic Recovery Operations';
      const group = createGroupConversation(adminUser, title, [collectorUser, recyclerUser]);

      assert.equal(group.type, 'group');
      assert.equal(group.title, title);
      assert.equal(group.created_by, adminUser.id);
      assert.equal(group.participant_ids.length, 3);

      const adminParticipant = group.participants.find((p) => p.user_id === adminUser.id);
      assert.equal(adminParticipant?.is_admin, true, 'Creator should have group admin status');
    });
  });

  describe('2. Message Sending, Deduplication & Pagination', () => {
    test('sends a direct text message and increments recipient unread count', () => {
      const conv = createDirectConversation(customerUser, collectorUser);
      const text = 'Testing real-time pickup dispatch alert ' + Date.now();

      const initialCollectorUnread = conv.unread_counts?.[collectorUser.id] || 0;

      const sent = sendChatMessage({
        conversation_id: conv.id,
        sender_id: customerUser.id,
        sender_name: customerUser.name,
        sender_role: customerUser.role,
        content: text,
      });

      assert.ok(sent.id.startsWith('msg-'), 'Message should have valid ID');
      assert.equal(sent.content, text);
      assert.equal(sent.sender_id, customerUser.id);
      assert.equal(sent.status, 'sent');

      // Check conversation updated
      const updatedConv = getConversationById(conv.id);
      assert.ok(updatedConv);
      assert.equal(updatedConv.last_message?.id, sent.id);
      assert.equal(updatedConv.unread_counts[collectorUser.id], initialCollectorUnread + 1);
    });

    test('deduplicates messages with identical client_temp_id', () => {
      const conv = createDirectConversation(customerUser, collectorUser);
      const tempId = `temp-dedup-${Date.now()}`;

      const msg1 = sendChatMessage({
        conversation_id: conv.id,
        sender_id: customerUser.id,
        sender_name: customerUser.name,
        sender_role: customerUser.role,
        content: 'Original submission',
        client_temp_id: tempId,
      });

      const msg2 = sendChatMessage({
        conversation_id: conv.id,
        sender_id: customerUser.id,
        sender_name: customerUser.name,
        sender_role: customerUser.role,
        content: 'Duplicate retry submission',
        client_temp_id: tempId,
      });

      assert.equal(msg1.id, msg2.id, 'Duplicate temp_id should return original message');
    });

    test('paginates message history with limit and chronological ordering', () => {
      const conv = createDirectConversation(customerUser, collectorUser);
      const res = getMessages(conv.id, { limit: 5 });

      assert.ok(Array.isArray(res.messages));
      assert.ok(res.messages.length <= 5);

      // Verify chronological sorting (oldest to newest)
      for (let i = 1; i < res.messages.length; i++) {
        const prevTime = new Date(res.messages[i - 1].created_at).getTime();
        const currTime = new Date(res.messages[i].created_at).getTime();
        assert.ok(currTime >= prevTime, 'Messages must be sorted in ascending order');
      }
    });
  });

  describe('3. Message Editing, Soft Deletion & Reactions', () => {
    test('allows sender to edit message and flags is_edited', () => {
      const conv = createDirectConversation(customerUser, collectorUser);
      const msg = sendChatMessage({
        conversation_id: conv.id,
        sender_id: customerUser.id,
        sender_name: customerUser.name,
        sender_role: customerUser.role,
        content: 'Text before edit',
      });

      const updated = editChatMessage(msg.id, customerUser.id, 'Text after successful edit');
      assert.equal(updated.content, 'Text after successful edit');
      assert.equal(updated.is_edited, true);
      assert.ok(updated.edited_at);
    });

    test('blocks non-sender from editing someone else message', () => {
      const conv = createDirectConversation(customerUser, collectorUser);
      const msg = sendChatMessage({
        conversation_id: conv.id,
        sender_id: customerUser.id,
        sender_name: customerUser.name,
        sender_role: customerUser.role,
        content: 'Immutable to unauthorized users',
      });

      assert.throws(
        () => editChatMessage(msg.id, collectorUser.id, 'Hacked text'),
        /Unauthorized/
      );
    });

    test('soft-deletes message with placeholder and clears attachments', () => {
      const conv = createDirectConversation(customerUser, collectorUser);
      const msg = sendChatMessage({
        conversation_id: conv.id,
        sender_id: customerUser.id,
        sender_name: customerUser.name,
        sender_role: customerUser.role,
        content: 'Sensitive message to delete',
        attachments: [
          {
            id: 'file-temp-1',
            file_url: '/api/v1/storage/files/file-temp-1',
            filename: 'secret.jpg',
            mime_type: 'image/jpeg',
            size_bytes: 1200,
          },
        ],
      });

      const deleted = deleteChatMessage(msg.id, customerUser.id);
      assert.equal(deleted.is_deleted, true);
      assert.equal(deleted.content, 'This message was deleted');
      assert.equal(deleted.attachments?.length, 0);

      // Verify that getMessages also returns sanitized placeholder
      const history = getMessages(conv.id);
      const fetched = history.messages.find((m) => m.id === msg.id);
      assert.equal(fetched?.content, 'This message was deleted');
    });

    test('toggles emoji reactions accurately', () => {
      const conv = createDirectConversation(customerUser, collectorUser);
      const msg = sendChatMessage({
        conversation_id: conv.id,
        sender_id: customerUser.id,
        sender_name: customerUser.name,
        sender_role: customerUser.role,
        content: 'React to this recyclable deal',
      });

      // 1. Add reaction 👍
      const reacted = toggleMessageReaction(msg.id, collectorUser.id, '👍');
      assert.ok(reacted.reactions['👍']?.includes(collectorUser.id));

      // 2. Toggle again removes reaction 👍
      const unreacted = toggleMessageReaction(msg.id, collectorUser.id, '👍');
      assert.equal(unreacted.reactions['👍'], undefined);
    });
  });

  describe('4. Read Receipts & Unread Counters', () => {
    test('marks conversation as read and resets unread count to 0', () => {
      const conv = createDirectConversation(customerUser, collectorUser);

      // Collector sends message to customer
      sendChatMessage({
        conversation_id: conv.id,
        sender_id: collectorUser.id,
        sender_name: collectorUser.name,
        sender_role: collectorUser.role,
        content: 'Hello customer! Need your confirmed scale reading.',
      });

      assert.ok(
        (getConversationById(conv.id)?.unread_counts[customerUser.id] || 0) > 0,
        'Customer should have unread message'
      );

      // Customer marks conversation as read
      const res = markConversationAsRead(conv.id, customerUser.id);
      assert.equal(res.success, true);
      assert.equal(res.unreadCount, 0);

      const afterRead = getConversationById(conv.id);
      assert.equal(afterRead?.unread_counts[customerUser.id], 0);
    });

    test('calculates total unread chat count across all user conversations', () => {
      const totalUnread = getTotalUnreadChatCount(customerUser.id);
      assert.equal(typeof totalUnread, 'number');
      assert.ok(totalUnread >= 0);
    });
  });

  describe('5. Safety Guardrails: Blocking & Moderation Reporting', () => {
    test('blocks user and prevents further messages between participants', () => {
      const conv = createDirectConversation(customerUser, collectorUser);

      // Customer blocks collector
      blockUser(customerUser.id, collectorUser.id, 'Unprofessional communication');
      assert.equal(isUserBlocked(customerUser.id, collectorUser.id), true);

      // Collector attempts to send message to customer -> should be blocked
      assert.throws(
        () =>
          sendChatMessage({
            conversation_id: conv.id,
            sender_id: collectorUser.id,
            sender_name: collectorUser.name,
            sender_role: collectorUser.role,
            content: 'Message after block',
          }),
        /blocked/
      );

      // Customer unblocks collector -> restores communication
      const unblocked = unblockUser(customerUser.id, collectorUser.id);
      assert.equal(unblocked, true);
      assert.equal(isUserBlocked(customerUser.id, collectorUser.id), false);

      const allowedMsg = sendChatMessage({
        conversation_id: conv.id,
        sender_id: collectorUser.id,
        sender_name: collectorUser.name,
        sender_role: collectorUser.role,
        content: 'Message after unblock works!',
      });
      assert.ok(allowedMsg.id);
    });

    test('records moderation report in database', () => {
      const conv = createDirectConversation(customerUser, collectorUser);
      const rep = reportChatMessage({
        reporter_id: customerUser.id,
        reported_id: collectorUser.id,
        conversation_id: conv.id,
        reason: 'spam',
        notes: 'Excessive promotional messages',
      });

      assert.ok(rep.id.startsWith('rep-'));
      assert.equal(rep.status, 'pending');

      const allReports = getChatReports('pending');
      assert.ok(allReports.some((r) => r.id === rep.id));
    });
  });

  describe('6. Voice Note & File Attachment Processing', () => {
    test('processes and validates audio voice note upload', async () => {
      const dummyAudio = Buffer.from('RIFF....WAVEfmt ....data....test-voice-note');
      const mockFile = {
        name: 'voice_note_1.webm',
        type: 'audio/webm',
        size: dummyAudio.length,
        arrayBuffer: async () => dummyAudio.buffer.slice(dummyAudio.byteOffset, dummyAudio.byteOffset + dummyAudio.byteLength),
      };

      const result = await processAndSaveUploadedFile(
        mockFile,
        {
          uploaded_by_user_id: customerUser.id,
          uploaded_by_role: customerUser.role,
        },
        { allowChatMedia: true }
      );

      assert.ok(result.file_id);
      assert.equal(result.mime_type, 'audio/webm');
      assert.ok(result.file_url.startsWith('/api/v1/storage/files/'));
    });

    test('processes document attachment upload (e.g. PDF)', async () => {
      const dummyPdf = Buffer.from('%PDF-1.4 dummy invoice and weighbridge certificate data');
      const mockFile = {
        name: 'weighbridge_receipt.pdf',
        type: 'application/pdf',
        size: dummyPdf.length,
        arrayBuffer: async () => dummyPdf.buffer.slice(dummyPdf.byteOffset, dummyPdf.byteOffset + dummyPdf.byteLength),
      };

      const result = await processAndSaveUploadedFile(
        mockFile,
        {
          uploaded_by_user_id: collectorUser.id,
          uploaded_by_role: collectorUser.role,
        },
        { allowChatMedia: true }
      );

      assert.ok(result.file_id);
      assert.equal(result.mime_type, 'application/pdf');
    });
  });

  describe('7. User Directory Search & Online Presence', () => {
    test('searches users by name or role excluding current user', () => {
      const results = searchChatUsers('Tariq', customerUser.id);
      assert.ok(results.length >= 1);
      assert.ok(results.some((u) => u.id === collectorUser.id));
      assert.ok(!results.some((u) => u.id === customerUser.id), 'Search must exclude requester');
    });

    test('sets and gets user presence accurately', () => {
      setUserPresence(customerUser.id, true);
      const presence = getUserPresence(customerUser.id);
      assert.equal(presence.is_online, true);
      assert.ok(presence.last_seen);
    });
  });
});
