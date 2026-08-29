import { supabase } from '../lib/supabase';
import { emailAlertService } from './emailAlertService';

export const chatService = {

  // =====================================================
  // CREATE OR GET CONVERSATION
  // =====================================================
  async createOrGetConversation(
    lostItemId,
    foundItemId,
    reporterIdLost,
    reporterIdFound
  ) {
    try {
      // -------------------------------------------------
      // 1. CHECK CURRENT USER
      // -------------------------------------------------
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          'User must be authenticated to start a conversation.'
        );
      }

      const currentUserId = user.id;

      // -------------------------------------------------
      // 2. VALIDATE USERS
      // -------------------------------------------------
      if (!lostItemId || !foundItemId) {
        throw new Error(
          'Lost item ID and found item ID are required.'
        );
      }

      if (!reporterIdLost || !reporterIdFound) {
        throw new Error(
          'Item owner information is missing.'
        );
      }

      if (reporterIdLost === reporterIdFound) {
        throw new Error(
          'You cannot start a conversation with yourself.'
        );
      }

      // -------------------------------------------------
      // 3. CHECK IF CURRENT USER IS ONE OF THE OWNERS
      // -------------------------------------------------
      if (
        currentUserId !== reporterIdLost &&
        currentUserId !== reporterIdFound
      ) {
        throw new Error(
          'You are not allowed to start this conversation.'
        );
      }

      // -------------------------------------------------
      // 4. FIRST CHECK EXISTING CONVERSATION
      // -------------------------------------------------
      const {
        data: existingConversation,
        error: existingError
      } = await supabase
        .from('conversations')
        .select('*')
        .eq('lost_item_id', lostItemId)
        .eq('found_item_id', foundItemId)
        .maybeSingle();

      if (existingError) {
        console.error(
          'Error checking existing conversation:',
          existingError.message
        );
        throw existingError;
      }

      // Conversation already exists
      if (existingConversation) {
        return {
          data: existingConversation,
          error: null
        };
      }

      // -------------------------------------------------
      // 5. CHECK ITEM STATUS
      // -------------------------------------------------
      const {
        data: lostItem,
        error: lostItemError
      } = await supabase
        .from('items')
        .select('id, status, reported_by')
        .eq('id', lostItemId)
        .maybeSingle();

      if (lostItemError) {
        throw lostItemError;
      }

      const {
        data: foundItem,
        error: foundItemError
      } = await supabase
        .from('items')
        .select('id, status, reported_by')
        .eq('id', foundItemId)
        .maybeSingle();

      if (foundItemError) {
        throw foundItemError;
      }

      if (!lostItem || !foundItem) {
        throw new Error(
          'One or both items could not be found.'
        );
      }

      if (
        lostItem.status !== 'active' ||
        foundItem.status !== 'active'
      ) {
        throw new Error(
          'Cannot start a conversation because one of the items is no longer active.'
        );
      }

      // -------------------------------------------------
      // 6. CREATE CONVERSATION
      // -------------------------------------------------
      const {
        data: conversation,
        error: createError
      } = await supabase
        .from('conversations')
        .insert({
          lost_item_id: lostItemId,
          found_item_id: foundItemId,
          created_by: currentUserId,
          status: 'active'
        })
        .select()
        .single();

      // -------------------------------------------------
      // 7. HANDLE DUPLICATE CONVERSATION
      // IMPORTANT:
      // Another request may have created it at the same time.
      // -------------------------------------------------
      if (createError) {

        // PostgreSQL duplicate unique constraint error
        if (createError.code === '23505') {

          console.log(
            'Conversation already exists. Fetching existing conversation...'
          );

          const {
            data: duplicateConversation,
            error: duplicateError
          } = await supabase
            .from('conversations')
            .select('*')
            .eq('lost_item_id', lostItemId)
            .eq('found_item_id', foundItemId)
            .maybeSingle();

          if (duplicateError) {
            throw duplicateError;
          }

          if (duplicateConversation) {
            return {
              data: duplicateConversation,
              error: null
            };
          }
        }

        throw createError;
      }

      // -------------------------------------------------
      // 8. ADD PARTICIPANTS
      // -------------------------------------------------
      const participants = [
        {
          conversation_id: conversation.id,
          user_id: reporterIdLost
        },
        {
          conversation_id: conversation.id,
          user_id: reporterIdFound
        }
      ];

      const {
        error: participantError
      } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantError) {

        console.error(
          'Error adding participants:',
          participantError.message
        );

        // Try to remove incomplete conversation
        await supabase
          .from('conversations')
          .delete()
          .eq('id', conversation.id);

        throw participantError;
      }

      // -------------------------------------------------
      // 9. CREATE NOTIFICATION FOR OTHER USER
      // -------------------------------------------------
      const recipientUserId =
        reporterIdLost === currentUserId
          ? reporterIdFound
          : reporterIdLost;

      try {

        const {
          error: notificationError
        } = await supabase.rpc(
          'create_conversation_notification',
          {
            p_conversation_id: conversation.id,
            p_recipient_user_id: recipientUserId
          }
        );

        if (notificationError) {
          console.error(
            'Conversation notification error:',
            notificationError.message
          );
        }

      } catch (notificationException) {

        console.error(
          'Notification exception:',
          notificationException.message
        );

      }

      // -------------------------------------------------
      // 10. RETURN NEW CONVERSATION
      // -------------------------------------------------
      return {
        data: conversation,
        error: null
      };

    } catch (error) {

      console.error(
        'Error in createOrGetConversation:',
        error.message
      );

      return {
        data: null,
        error
      };
    }
  },


  // =====================================================
  // GET ALL CONVERSATIONS FOR CURRENT USER
  // =====================================================
  async getUserConversations() {

    try {

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error(
          'User must be authenticated to view messages.'
        );
      }

      const currentUserId = session.user.id;


      // -------------------------------------------------
      // GET CONVERSATION PARTICIPATION RECORDS
      // -------------------------------------------------
      const {
        data: links,
        error: linksError
      } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);

      if (linksError) {
        throw linksError;
      }

      if (!links || links.length === 0) {
        return {
          data: [],
          error: null
        };
      }


      const conversationIds = links.map(
        (link) => link.conversation_id
      );


      // -------------------------------------------------
      // GET CONVERSATIONS
      // -------------------------------------------------
      const {
        data: conversations,
        error: convError
      } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', {
          ascending: false
        });

      if (convError) {
        throw convError;
      }

      if (!conversations || conversations.length === 0) {
        return {
          data: [],
          error: null
        };
      }


      // -------------------------------------------------
      // GET ITEM IDS
      // -------------------------------------------------
      const itemIds = [
        ...new Set(
          conversations
            .flatMap((conversation) => [
              conversation.lost_item_id,
              conversation.found_item_id
            ])
            .filter(Boolean)
        )
      ];


      // -------------------------------------------------
      // GET ITEMS
      // -------------------------------------------------
      let items = [];

      if (itemIds.length > 0) {

        const {
          data: fetchedItems,
          error: itemsError
        } = await supabase
          .from('items')
          .select(
            'id, title, category, type, location'
          )
          .in('id', itemIds);

        if (itemsError) {
          throw itemsError;
        }

        items = fetchedItems || [];
      }


      const itemMap = {};

      items.forEach((item) => {
        itemMap[item.id] = item;
      });


      // -------------------------------------------------
      // GET ALL PARTICIPANTS
      // -------------------------------------------------
      const {
        data: allParticipants,
        error: partError
      } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', conversationIds);

      if (partError) {
        throw partError;
      }


      const otherUserIds = [];

      const conversationOtherUserMap = {};


      (allParticipants || []).forEach(
        (participant) => {

          if (
            participant.user_id !== currentUserId
          ) {

            otherUserIds.push(
              participant.user_id
            );

            conversationOtherUserMap[
              participant.conversation_id
            ] = participant.user_id;
          }
        }
      );


      // -------------------------------------------------
      // GET OTHER USER PROFILES
      // -------------------------------------------------
      const uniqueOtherUserIds = [
        ...new Set(otherUserIds)
      ];


      let profiles = [];


      if (uniqueOtherUserIds.length > 0) {

        const {
          data: fetchedProfiles,
          error: profileError
        } = await supabase
          .from('profiles')
          .select(
            'id, full_name, username, profile_image'
          )
          .in(
            'id',
            uniqueOtherUserIds
          );

        if (profileError) {
          throw profileError;
        }

        profiles =
          fetchedProfiles || [];
      }


      const profileMap = {};


      profiles.forEach((profile) => {

        profileMap[profile.id] =
          profile;

      });


      // -------------------------------------------------
      // GET LATEST MESSAGE FOR EACH CONVERSATION
      // -------------------------------------------------
      const combined = [];


      for (const conv of conversations) {

        const otherUserId =
          conversationOtherUserMap[
          conv.id
          ];


        const otherProfile =
          profileMap[
          otherUserId
          ] || null;


        const lostItem =
          itemMap[
          conv.lost_item_id
          ] || null;


        const foundItem =
          itemMap[
          conv.found_item_id
          ] || null;


        const {
          data: latestMessages,
          error: latestError
        } = await supabase
          .from('messages')
          .select('*')
          .eq(
            'conversation_id',
            conv.id
          )
          .order(
            'created_at',
            {
              ascending: false
            }
          )
          .limit(1);


        if (latestError) {
          console.error(
            'Error getting latest message:',
            latestError.message
          );
        }


        const latestMessage =
          latestMessages?.[0] ||
          null;


        combined.push({

          ...conv,

          otherParticipant:
            otherProfile,

          lostItem,

          foundItem,

          latestMessage

        });

      }


      return {

        data: combined,

        error: null

      };


    } catch (error) {

      console.error(
        'Error in getUserConversations:',
        error.message
      );

      return {

        data: null,

        error

      };

    }

  },


  // =====================================================
  // GET ONE CONVERSATION
  // =====================================================
  async getConversation(conversationId) {

    try {

      const {
        data: { session }
      } = await supabase.auth.getSession();


      if (!session?.user) {

        throw new Error(
          'User must be authenticated.'
        );

      }


      const currentUserId =
        session.user.id;


      // -------------------------------------------------
      // GET CONVERSATION
      // -------------------------------------------------
      const {
        data: conversation,
        error: conversationError
      } = await supabase
        .from('conversations')
        .select('*')
        .eq(
          'id',
          conversationId
        )
        .single();


      if (conversationError) {
        throw conversationError;
      }


      // -------------------------------------------------
      // GET PARTICIPANTS
      // -------------------------------------------------
      const {
        data: participants,
        error: participantError
      } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq(
          'conversation_id',
          conversationId
        );


      if (participantError) {
        throw participantError;
      }


      // -------------------------------------------------
      // CHECK ACCESS
      // -------------------------------------------------
      const isParticipant =
        participants?.some(
          (participant) =>
            participant.user_id ===
            currentUserId
        );


      if (!isParticipant) {

        throw new Error(
          'Access denied. You are not a participant in this conversation.'
        );

      }


      // -------------------------------------------------
      // GET LOST ITEM
      // -------------------------------------------------
      const {
        data: lostItem,
        error: lostItemError
      } = await supabase
        .from('items')
        .select('*')
        .eq(
          'id',
          conversation.lost_item_id
        )
        .maybeSingle();


      if (lostItemError) {
        throw lostItemError;
      }


      // -------------------------------------------------
      // GET FOUND ITEM
      // -------------------------------------------------
      const {
        data: foundItem,
        error: foundItemError
      } = await supabase
        .from('items')
        .select('*')
        .eq(
          'id',
          conversation.found_item_id
        )
        .maybeSingle();


      if (foundItemError) {
        throw foundItemError;
      }


      // -------------------------------------------------
      // GET OTHER PARTICIPANT
      // -------------------------------------------------
      const otherParticipant =
        participants?.find(
          (participant) =>
            participant.user_id !==
            currentUserId
        );


      let otherProfile = null;


      if (otherParticipant?.user_id) {

        const {
          data: profile,
          error: profileError
        } = await supabase
          .from('profiles')
          .select(
            'id, full_name, username, profile_image'
          )
          .eq(
            'id',
            otherParticipant.user_id
          )
          .maybeSingle();


        if (profileError) {
          console.error(
            'Error getting other profile:',
            profileError.message
          );
        }


        otherProfile =
          profile || null;

      }


      return {

        data: {

          ...conversation,

          lostItem,

          foundItem,

          otherParticipant:
            otherProfile

        },

        error: null

      };


    } catch (error) {

      console.error(
        'Error in getConversation:',
        error.message
      );

      return {

        data: null,

        error

      };

    }

  },


  // =====================================================
  // GET MESSAGES
  // =====================================================
  async getMessages(conversationId) {

    try {

      const {
        data,
        error
      } = await supabase
        .from('messages')
        .select('*')
        .eq(
          'conversation_id',
          conversationId
        )
        .order(
          'created_at',
          {
            ascending: true
          }
        );


      if (error) {
        throw error;
      }


      return {

        data: data || [],

        error: null

      };


    } catch (error) {

      console.error(
        'Error in getMessages:',
        error.message
      );

      return {

        data: null,

        error

      };

    }

  },


  // =====================================================
  // SEND MESSAGE
  // =====================================================
  async sendMessage(
    conversationId,
    messageText
  ) {

    try {

      const text =
        messageText?.trim();


      if (!text) {

        throw new Error(
          'Message cannot be empty.'
        );

      }


      const {
        data: { session }
      } = await supabase.auth.getSession();


      if (!session?.user) {

        throw new Error(
          'User must be authenticated.'
        );

      }


      const currentUserId =
        session.user.id;


      // -------------------------------------------------
      // CHECK CONVERSATION
      // -------------------------------------------------
      const {
        data: conversation,
        error: conversationError
      } = await supabase
        .from('conversations')
        .select('status, lost_item_id, found_item_id')
        .eq(
          'id',
          conversationId
        )
        .single();


      if (conversationError) {
        throw conversationError;
      }


      if (
        conversation?.status ===
        'resolved'
      ) {
        throw new Error(
          'Cannot send messages in a resolved conversation.'
        );
      }

      // -------------------------------------------------
      // FETCH AND CHECK BOTH RELATED ITEMS
      // -------------------------------------------------
      const { data: lostItem, error: lostItemError } = await supabase
        .from('items')
        .select('id, status')
        .eq('id', conversation.lost_item_id)
        .maybeSingle();

      if (lostItemError) {
        throw lostItemError;
      }

      const { data: foundItem, error: foundItemError } = await supabase
        .from('items')
        .select('id, status')
        .eq('id', conversation.found_item_id)
        .maybeSingle();

      if (foundItemError) {
        throw foundItemError;
      }

      if (!lostItem || !foundItem) {
        throw new Error(
          'One or both related item reports could not be found.'
        );
      }

      if (lostItem.status !== 'active' || foundItem.status !== 'active') {
        throw new Error(
          'Messaging is disabled because one of the related item reports is no longer active.'
        );
      }


      // -------------------------------------------------
      // INSERT MESSAGE
      // -------------------------------------------------
      const {
        data,
        error
      } = await supabase
        .from('messages')
        .insert({

          conversation_id:
            conversationId,

          sender_id:
            currentUserId,

          message:
            text

        })
        .select()
        .single();


      if (error) {
        throw error;
      }


      // -------------------------------------------------
      // UPDATE CONVERSATION TIME
      // -------------------------------------------------
      const {
        error: updateError
      } = await supabase
        .from('conversations')
        .update({

          updated_at:
            new Date().toISOString()

        })
        .eq(
          'id',
          conversationId
        );


      if (updateError) {
        console.error(
          'Error updating conversation timestamp:',
          updateError.message
        );
      }

      // Asynchronously dispatch email alert to recipient without blocking message flow (Stage 16)
      (async () => {
        try {
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conversationId)
            .neq('user_id', currentUserId);

          const recipientUserId = participants?.[0]?.user_id;
          if (recipientUserId) {
            const { data: recipientProfile } = await supabase
              .from('profiles')
              .select('email, full_name, username')
              .eq('id', recipientUserId)
              .maybeSingle();

            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('full_name, username')
              .eq('id', currentUserId)
              .maybeSingle();

            if (recipientProfile?.email) {
              emailAlertService.sendMessageEmailAlert({
                recipientEmail: recipientProfile.email,
                recipientName: recipientProfile.full_name || recipientProfile.username,
                senderName: senderProfile?.full_name || senderProfile?.username || 'Campus Student',
                messagePreview: text,
                conversationId
              });
            }
          }
        } catch (emailErr) {
          console.warn('[ChatService] Non-blocking email alert dispatch error:', emailErr.message);
        }
      })();

      return {
        data,
        error: null
      };


    } catch (error) {

      console.error(
        'Error in sendMessage:',
        error.message
      );

      return {

        data: null,

        error

      };

    }

  },


  // =====================================================
  // RESOLVE CONVERSATION
  // =====================================================
  async resolveConversation(
    conversationId
  ) {

    try {

      const {
        data,
        error
      } = await supabase
        .from('conversations')
        .update({

          status:
            'resolved',

          updated_at:
            new Date().toISOString()

        })
        .eq(
          'id',
          conversationId
        )
        .select()
        .single();


      if (error) {
        throw error;
      }


      return {

        data,

        error: null

      };


    } catch (error) {

      console.error(
        'Error in resolveConversation:',
        error.message
      );

      return {

        data: null,

        error

      };

    }

  },


  // =====================================================
  // REALTIME MESSAGE SUBSCRIPTION
  // =====================================================
  subscribeToMessages(
    conversationId,
    onMessageReceived
  ) {

    if (!conversationId) {

      return () => { };

    }


    const channel =
      supabase
        .channel(
          `conversation:${conversationId}`
        )
        .on(
          'postgres_changes',
          {

            event:
              'INSERT',

            schema:
              'public',

            table:
              'messages',

            filter:
              `conversation_id=eq.${conversationId}`

          },
          (payload) => {

            if (
              payload?.new
            ) {

              onMessageReceived(
                payload.new
              );

            }

          }
        )
        .subscribe();


    return () => {

      supabase.removeChannel(
        channel
      );

    };

  }

};