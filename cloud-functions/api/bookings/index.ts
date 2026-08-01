export async function onRequest(context: any) {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // POST - Create booking
    if (method === 'POST') {
      const body = await request.json();
      if (!body.tourId || !body.userId || !body.scheduleDate || !body.travelerCount) {
        return new Response(JSON.stringify({ error: 'กรุณากรอกข้อมูลให้ครบ' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const bookingId = `booking_${Date.now()}`;
      const booking = {
        id: bookingId,
        tourId: body.tourId,
        userId: body.userId,
        scheduleDate: body.scheduleDate,
        travelerCount: body.travelerCount,
        totalPrice: body.totalPrice || 0,
        status: 'pending',
        paymentProof: body.paymentProof || '',
        createdAt: new Date().toISOString(),
      };
      await env.BOOKINGS.put(bookingId, JSON.stringify(booking));
      // Also store by userId for easy lookup
      const userBookingsKey = `user_bookings_${body.userId}`;
      const existingList = await env.BOOKINGS.get(userBookingsKey, 'json') as string[] || [];
      existingList.push(bookingId);
      await env.BOOKINGS.put(userBookingsKey, JSON.stringify(existingList));

      return new Response(JSON.stringify(booking), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET - View user booking history
    if (method === 'GET') {
      const userId = url.searchParams.get('userId');
      if (!userId) {
        // Admin: list all bookings
        const list = await env.BOOKINGS.list({ prefix: 'booking_' });
        const bookings: any[] = [];
        for (const key of list.keys) {
          const data = await env.BOOKINGS.get(key.name, 'json');
          if (data) bookings.push(data);
        }
        return new Response(JSON.stringify(bookings), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // User: get their bookings
      const userBookingsKey = `user_bookings_${userId}`;
      const bookingIds = await env.BOOKINGS.get(userBookingsKey, 'json') as string[] || [];
      const bookings: any[] = [];
      for (const bid of bookingIds) {
        const data = await env.BOOKINGS.get(bid, 'json');
        if (data) bookings.push(data);
      }
      return new Response(JSON.stringify(bookings), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT - Admin update booking status
    if (method === 'PUT') {
      const id = pathParts[pathParts.length - 1];
      const body = await request.json();
      const existing = await env.BOOKINGS.get(id, 'json');
      if (!existing) {
        return new Response(JSON.stringify({ error: 'ไม่พบข้อมูลการจอง' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const allowedStatuses = ['pending', 'confirmed', 'cancelled'];
      if (body.status && !allowedStatuses.includes(body.status)) {
        return new Response(JSON.stringify({ error: 'สถานะไม่ถูกต้อง' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const updated = { ...existing, ...body, id };
      await env.BOOKINGS.put(id, JSON.stringify(updated));
      return new Response(JSON.stringify(updated), {
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
