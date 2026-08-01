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
    // POST - Register
    if (method === 'POST' && pathParts[pathParts.length - 1] === 'register') {
      const body = await request.json();
      if (!body.name || !body.email || !body.phone || !body.password) {
        return new Response(JSON.stringify({ error: 'กรุณากรอกข้อมูลให้ครบ' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if email already exists
      const existingList = await env.USERS.list();
      for (const key of existingList.keys) {
        const user = await env.USERS.get(key.name, 'json');
        if (user && user.email === body.email) {
          return new Response(JSON.stringify({ error: 'อีเมลนี้มีอยู่แล้ว' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Simple hash (in production use proper bcrypt/argon2 via a library)
      const passwordHash = await hashPassword(body.password);
      const userId = `user_${Date.now()}`;
      const user = {
        id: userId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      await env.USERS.put(userId, JSON.stringify(user));
      // Also store by email for lookup
      await env.USERS.put(`email_${body.email}`, userId);

      return new Response(JSON.stringify({
        id: userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST - Login
    if (method === 'POST' && pathParts[pathParts.length - 1] === 'login') {
      const body = await request.json();
      if (!body.email || !body.password) {
        return new Response(JSON.stringify({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userIdKey = await env.USERS.get(`email_${body.email}`, 'text');
      if (!userIdKey) {
        return new Response(JSON.stringify({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const user = await env.USERS.get(userIdKey, 'json');
      if (!user) {
        return new Response(JSON.stringify({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const valid = await verifyPassword(body.password, user.passwordHash);
      if (!valid) {
        return new Response(JSON.stringify({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate simple JWT-like token (in production use proper JWT library)
      const token = generateToken(user.id);

      return new Response(JSON.stringify({
        token,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET - Profile
    if (method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'กรุณาเข้าสู่ระบบ' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const userId = verifyToken(authHeader.replace('Bearer ', ''));
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Token ไม่ถูกต้อง' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const user = await env.USERS.get(userId, 'json');
      if (!user) {
        return new Response(JSON.stringify({ error: 'ไม่พบผู้ใช้' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({
        id: user.id, name: user.name, email: user.email, phone: user.phone,
      }), {
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

async function hashPassword(password: string): string {
  // Simple hash using Web Crypto API (SHA-256 + salt)
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const data = encoder.encode(password + Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''));
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashStr = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  const saltStr = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltStr}:${hashStr}`;
}

async function verifyPassword(password: string, stored: string): boolean {
  const [saltStr, _] = stored.split(':');
  const encoder = new TextEncoder();
  const data = encoder.encode(password + saltStr);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashStr = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return stored === `${saltStr}:${hashStr}`;
}

function generateToken(userId: string): string {
  // Simple base64 token (in production use proper JWT)
  const payload = { userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  return btoa(JSON.stringify(payload));
}

function verifyToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) return null;
    return payload.userId;
  } catch {
    return null;
  }
}
