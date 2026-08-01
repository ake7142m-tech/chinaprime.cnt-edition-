export async function onRequest(context: any) {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,makers-conversation-id',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Get conversation ID from header or query
    const conversationId = request.headers.get('makers-conversation-id') || url.searchParams.get('conversationId');

    if (method === 'GET') {
      // List chat sessions for a user
      const userId = url.searchParams.get('userId');
      if (!userId) {
        return new Response(JSON.stringify({ error: 'กรุณาระบุ userId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const sessionsKey = `sessions_${userId}`;
      const sessionIds = await env.CHAT_SESSIONS.get(sessionsKey, 'json') as string[] || [];
      const sessions: any[] = [];
      for (const sid of sessionIds) {
        const data = await env.CHAT_SESSIONS.get(sid, 'json');
        if (data) sessions.push(data);
      }
      return new Response(JSON.stringify(sessions), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST') {
      // Save/update chat session preferences
      const body = await request.json();
      if (!conversationId) {
        return new Response(JSON.stringify({ error: 'กรุณาระบุ conversation id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const sessionKey = `session_${conversationId}`;
      const existing = await env.CHAT_SESSIONS.get(sessionKey, 'json') as any || {};
      const updated = { ...existing, ...body, conversationId, updatedAt: new Date().toISOString() };
      await env.CHAT_SESSIONS.put(sessionKey, JSON.stringify(updated));

      // Track session by user if userId provided
      if (body.userId) {
        const sessionsKey = `sessions_${body.userId}`;
        const sessionIds = await env.CHAT_SESSIONS.get(sessionsKey, 'json') as string[] || [];
        if (!sessionIds.includes(sessionKey)) {
          sessionIds.push(sessionKey);
          await env.CHAT_SESSIONS.put(sessionsKey, JSON.stringify(sessionIds));
        }
      }

      return new Response(JSON.stringify(updated), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'DELETE') {
      // Clear chat history for a session
      if (!conversationId) {
        return new Response(JSON.stringify({ error: 'กรุณาระบุ conversation id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const sessionKey = `session_${conversationId}`;
      await env.CHAT_SESSIONS.delete(sessionKey);
      return new Response(JSON.stringify({ message: 'ลบเรียบร้อย' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
