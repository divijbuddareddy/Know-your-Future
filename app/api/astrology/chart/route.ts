import { NextRequest, NextResponse } from 'next/server';
import { calculateVedicChart } from '@/lib/astrology/chart-provider.ts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, birthDate, birthTime, latitude, longitude, timezoneOffset, timeConfidence } = body;

    if (!birthDate || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'birthDate, latitude, and longitude are required' }, { status: 400 });
    }

    const chart = calculateVedicChart({
      name: name || 'Native',
      birthDate,
      birthTime: birthTime || '12:00',
      latitude: Number(latitude),
      longitude: Number(longitude),
      timezoneOffset: Number(timezoneOffset ?? 5.5),
      timeConfidence: timeConfidence || 'exact'
    });

    return NextResponse.json({ chart });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to calculate chart: ' + err.message }, { status: 500 });
  }
}
