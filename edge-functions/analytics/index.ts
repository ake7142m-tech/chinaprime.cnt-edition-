export default async function onRequest(context: any) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '/';
    const referrer = request.headers.get('Referer') || 'direct';
    const today = new Date().toISOString().split('T')[0];
    const monthKey = today.substring(0, 7);

    // Increment page view counter - daily
    const dailyKey = `daily_${today}`;
    const dailyData = await env.STATS.get(dailyKey, 'json') as any || { pageViews: {}, referrers: {}, buttonClicks: {} };
    dailyData.pageViews[page] = (dailyData.pageViews[page] || 0) + 1;
    await env.STATS.put(dailyKey, JSON.stringify(dailyData));

    // Increment page view counter - monthly
    const monthlyKey = `monthly_${monthKey}`;
    const monthlyData = await env.STATS.get(monthlyKey, 'json') as any || { pageViews: {}, referrers: {}, buttonClicks: {} };
    monthlyData.pageViews[page] = (monthlyData.pageViews[page] || 0) + 1;
    await env.STATS.put(monthlyKey, JSON.stringify(monthlyData));

    // Increment total
    const totalData = await env.STATS.get('total', 'json') as any || { pageViews: {}, referrers: {}, buttonClicks: {} };
    totalData.pageViews[page] = (totalData.pageViews[page] || 0) + 1;
    await env.STATS.put('total', JSON.stringify(totalData));

    // Extract and store referrer source
    let source = 'direct';
    if (referrer) {
      try {
        const refUrl = new URL(referrer);
        const host = refUrl.hostname;
        if (host.includes('google')) source = 'Google';
        else if (host.includes('facebook') || host.includes('fb')) source = 'Facebook';
        else if (host.includes('tiktok')) source = 'TikTok';
        else if (host.includes('line')) source = 'LINE';
        else source = host;
      } catch { source = referrer; }
    }

    dailyData.referrers[source] = (dailyData.referrers[source] || 0) + 1;
    monthlyData.referrers[source] = (monthlyData.referrers[source] || 0) + 1;
    totalData.referrers[source] = (totalData.referrers[source] || 0) + 1;
    await env.STATS.put(dailyKey, JSON.stringify(dailyData));
    await env.STATS.put(monthlyKey, JSON.stringify(monthlyData));
    await env.STATS.put('total', JSON.stringify(totalData));

    return new Response(JSON.stringify({ message: 'บันทึกเรียบร้อย', page, source }), {
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
