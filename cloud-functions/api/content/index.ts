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
      // List content items by type
      const typeFilter = url.searchParams.get('type'); // news, article, review, banner
      const kv = env.CONTENT;
      const list = await kv.list();
      const items: any[] = [];
      for (const key of list.keys) {
        const data = await kv.get(key.name, 'json');
        if (data) {
          if (typeFilter && data.type !== typeFilter) continue;
          items.push(data);
        }
      }
      return new Response(JSON.stringify(items), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST') {
      // Create content item
      const body = await request.json();
      if (!body.title || !body.type) {
        return new Response(JSON.stringify({ error: 'กรุณากรอกข้อมูลให้ครบ' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const id = `content_${Date.now()}`;
      const item = {
        id,
        type: body.type,
        title: body.title,
        body: body.body || '',
        image: body.image || '',
        author: body.author || '',
        createdAt: new Date().toISOString(),
        seoTitle: body.seoTitle || '',
        seoDescription: body.seoDescription || '',
        seoUrl: body.seoUrl || '',
        shareImage: body.shareImage || '',
      };
      await env.CONTENT.put(id, JSON.stringify(item));
      return new Response(JSON.stringify(item), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'PUT') {
      // Update content item
      const id = pathParts[pathParts.length - 1];
      const body = await request.json();
      const existing = await env.CONTENT.get(id, 'json');
      if (!existing) {
        return new Response(JSON.stringify({ error: 'ไม่พบข้อมูล' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const updated = { ...existing, ...body, id };
      await env.CONTENT.put(id, JSON.stringify(updated));
      return new Response(JSON.stringify(updated), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'DELETE') {
      // Delete content item
      const id = pathParts[pathParts.length - 1];
      const existing = await env.CONTENT.get(id, 'json');
      if (!existing) {
        return new Response(JSON.stringify({ error: 'ไม่พบข้อมูล' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await env.CONTENT.delete(id);
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
