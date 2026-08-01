export async function onRequest(context: any) {
  const { request } = context;

  try {
    // Frontend must send makers-conversation-id header AND body conversation_id
    const headerConvId = request.headers.get('makers-conversation-id');
    const body = await request.json();
    const bodyConvId = body.conversation_id;

    if (!headerConvId || !bodyConvId) {
      return new Response(JSON.stringify({ error: 'กรุณาระบุ conversation id ใน header และ body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (headerConvId !== bodyConvId) {
      return new Response(JSON.stringify({ error: 'conversation id ใน header และ body ไม่ตรงกัน' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // The agent runtime handles abort via context.request.signal
    // This endpoint confirms the stop request
    return new Response(JSON.stringify({ message: 'หยุดการตอบแล้ว', conversation_id: headerConvId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
