export const TOOLS = [
  {
    name: 'tour_lookup',
    description: 'ค้นหาทัวร์จากคำค้นหา เช่น ชื่อทัวร์ ภาค จังหวัด',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'คำค้นหา เช่น เชียงใหม่ ภูเก็ต ภาคเหนือ' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'schedule_check',
    description: 'ตรวจสอบวันเดินทางและจำนวนที่นั่งของทัวร์',
    input_schema: {
      type: 'object',
      properties: {
        tourId: { type: 'string', description: 'รหัสทัวร์' },
      },
      required: ['tourId'],
    },
  },
  {
    name: 'customer_info_save',
    description: 'บันทึกชื่อ เบอร์โทร และทัวร์ที่สนใจของลูกค้า',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'ชื่อลูกค้า' },
        phone: { type: 'string', description: 'เบอร์โทรลูกค้า' },
        interestedTour: { type: 'string', description: 'ทัวร์ที่ลูกค้าสนใจ' },
      },
      required: ['name', 'phone'],
    },
  },
];

export async function executeTool(name: string, input: any, env: any): string {
  if (name === 'tour_lookup') {
    const keyword = input.keyword.toLowerCase();
    const list = await env.TOURS.list();
    const results: any[] = [];
    for (const key of list.keys) {
      const tour = await env.TOURS.get(key.name, 'json') as any;
      if (tour) {
        const text = `${tour.title} ${tour.region} ${tour.category} ${tour.description}`.toLowerCase();
        if (text.includes(keyword)) {
          results.push({
            id: tour.id,
            title: tour.title,
            price: tour.price,
            duration: tour.duration,
            seatsAvailable: tour.seatsAvailable,
          });
        }
      }
    }
    if (results.length === 0) return 'ไม่พบทัวร์ที่ตรงกับคำค้นหา';
    return results.map(r => `${r.title} - ราคา ${r.price} บาท, ${r.duration}, เหลือ ${r.seatsAvailable} ที่นั่ง`).join('\n');
  }

  if (name === 'schedule_check') {
    const tourId = input.tourId;
    const tour = await env.TOURS.get(tourId, 'json') as any;
    if (!tour) return 'ไม่พบทัวร์นี้';
    if (!tour.schedules || tour.schedules.length === 0) return 'ยังไม่มีวันเดินทางที่เปิดรับจอง';
    return tour.schedules.map((s: any) => `${s.date} - ราคา ${s.price} บาท, เหลือ ${s.seatsAvailable} ที่นั่ง`).join('\n');
  }

  if (name === 'customer_info_save') {
    const sessionId = `customer_${Date.now()}`;
    const data = {
      id: sessionId,
      name: input.name,
      phone: input.phone,
      interestedTour: input.interestedTour || '',
      createdAt: new Date().toISOString(),
    };
    await env.CHAT_SESSIONS.put(sessionId, JSON.stringify(data));
    return 'บันทึกข้อมูลลูกค้าเรียบร้อย';
  }

  return 'ไม่รู้จัก tool นี้';
}
