export async function onRequest(context: any) {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (method === 'GET') {
      // List tours with optional filters
      const categoryFilter = url.searchParams.get('category');
      const regionFilter = url.searchParams.get('region');
      const slugFilter = url.searchParams.get('slug');
      const kv = env.TOURS;
      const list = await kv.list();
      const items: any[] = [];
      for (const key of list.keys) {
        const data = await kv.get(key.name, 'json');
        if (data) {
          if (categoryFilter && data.category !== categoryFilter) continue;
          if (regionFilter && data.region !== regionFilter) continue;
          if (slugFilter && data.slug !== slugFilter) continue;
          items.push(data);
        }
      }
      return new Response(JSON.stringify(items), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST') {
      // Create tour
      const body = await request.json();
      if (!body.title || !body.slug || !body.price || !body.duration || !body.category || !body.region) {
        return new Response(JSON.stringify({ error: 'กรุณากรอกข้อมูลให้ครบ (title, slug, price, duration, category, region)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const id = `tour_${Date.now()}`;
      const item = {
        id,
        title: body.title,
        slug: body.slug,
        description: body.description || '',
        itinerary: body.itinerary || [],
        price: body.price,
        duration: body.duration,
        category: body.category,
        region: body.region,
        image: body.image || '',
        seatsAvailable: body.seatsAvailable || 0,
        schedules: body.schedules || [],
        createdAt: new Date().toISOString(),
        seoTitle: body.seoTitle || '',
        seoDescription: body.seoDescription || '',
        seoUrl: body.seoUrl || '',
        shareImage: body.shareImage || '',
      };
      await env.TOURS.put(id, JSON.stringify(item));
      return new Response(JSON.stringify(item), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'PUT') {
      // Update tour
      const id = pathParts[pathParts.length - 1];
      const body = await request.json();
      const existing = await env.TOURS.get(id, 'json');
      if (!existing) {
        return new Response(JSON.stringify({ error: 'ไม่พบทัวร์' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const updated = { ...existing, ...body, id };
      await env.TOURS.put(id, JSON.stringify(updated));
      return new Response(JSON.stringify(updated), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'DELETE') {
      // Delete tour
      const id = pathParts[pathParts.length - 1];
      const existing = await env.TOURS.get(id, 'json');
      if (!existing) {
        return new Response(JSON.stringify({ error: 'ไม่พบทัวร์' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await env.TOURS.delete(id);
      return new Response(JSON.stringify({ message: 'ลบทัวร์เรียบร้อย' }), {
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
