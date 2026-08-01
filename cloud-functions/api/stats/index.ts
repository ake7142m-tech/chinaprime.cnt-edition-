export async function onRequest(context: any) {
  const { request, env } = context;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (method === 'GET') {
      // Read aggregated statistics
      const today = new Date().toISOString().split('T')[0];
      const monthKey = today.substring(0, 7); // YYYY-MM

      const dailyData = await env.STATS.get(`daily_${today}`, 'json') as any || { pageViews: {}, referrers: {}, buttonClicks: {} };
      const monthlyData = await env.STATS.get(`monthly_${monthKey}`, 'json') as any || { pageViews: {}, referrers: {}, buttonClicks: {} };
      const totalData = await env.STATS.get('total', 'json') as any || { pageViews: {}, referrers: {}, buttonClicks: {} };

      // Sum up totals
      const dailyTotal = Object.values(dailyData.pageViews || {}).reduce((a: number, b: number) => a + b, 0);
      const monthlyTotal = Object.values(monthlyData.pageViews || {}).reduce((a: number, b: number) => a + b, 0);
      const totalTotal = Object.values(totalData.pageViews || {}).reduce((a: number, b: number) => a + b, 0);

      // Sort popular pages
      const popularPages = Object.entries(dailyData.pageViews || {})
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([page, views]) => ({ page, views }));

      // Sort referrers
      const referrers = Object.entries(monthlyData.referrers || {})
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .map(([source, count]) => ({ source, count }));

      // Sort button clicks
      const buttonClicks = Object.entries(monthlyData.buttonClicks || {})
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .map(([button, clicks]) => ({ button, clicks }));

      return new Response(JSON.stringify({
        daily: dailyTotal,
        monthly: monthlyTotal,
        total: totalTotal,
        popularPages,
        popularTours: [],
        referrers,
        buttonClicks,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST') {
      // Record a click event
      const body = await request.json();
      const today = new Date().toISOString().split('T')[0];
      const monthKey = today.substring(0, 7);
      const type = body.type; // 'click' or 'pageview'

      if (type === 'click') {
        const dailyKey = `daily_${today}`;
        const dailyData = await env.STATS.get(dailyKey, 'json') as any || { pageViews: {}, referrers: {}, buttonClicks: {} };
        const category = body.category || 'unknown';
        const label = body.label || 'unknown';
        const key = `${category}:${label}`;
        dailyData.buttonClicks[key] = (dailyData.buttonClicks[key] || 0) + 1;
        await env.STATS.put(dailyKey, JSON.stringify(dailyData));

        const monthlyKey = `monthly_${monthKey}`;
        const monthlyData = await env.STATS.get(monthlyKey, 'json') as any || { pageViews: {}, referrers: {}, buttonClicks: {} };
        monthlyData.buttonClicks[key] = (monthlyData.buttonClicks[key] || 0) + 1;
        await env.STATS.put(monthlyKey, JSON.stringify(monthlyData));

        const totalData = await env.STATS.get('total', 'json') as any || { pageViews: {}, referrers: {}, buttonClicks: {} };
        totalData.buttonClicks[key] = (totalData.buttonClicks[key] || 0) + 1;
        await env.STATS.put('total', JSON.stringify(totalData));
      }

      return new Response(JSON.stringify({ message: 'บันทึกเรียบร้อย' }), {
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
