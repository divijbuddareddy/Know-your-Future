import { NextRequest, NextResponse } from 'next/server';
import { getSavedBirthProfile, saveBirthProfile, deleteBirthProfile } from '@/lib/db/store.ts';

export async function GET() {
  try {
    const profile = getSavedBirthProfile();
    return NextResponse.json({ profile });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve birth profile' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, gender, birthDate, birthTime, timeConfidence, birthPlace, latitude, longitude, timezoneOffset, consentToSave } = body;

    if (!fullName || !birthDate || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing required birth profile fields (fullName, birthDate, coordinates)' }, { status: 400 });
    }

    const saved = saveBirthProfile({
      fullName,
      gender: gender || 'unspecified',
      birthDate,
      birthTime: birthTime || '12:00',
      timeConfidence: timeConfidence || 'exact',
      birthPlace: birthPlace || 'Unknown Location',
      latitude: Number(latitude),
      longitude: Number(longitude),
      timezoneOffset: Number(timezoneOffset ?? 5.5),
      consentToSave: Boolean(consentToSave)
    });

    return NextResponse.json({ profile: saved }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to save birth profile: ' + err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    deleteBirthProfile();
    return NextResponse.json({ success: true, message: 'Birth profile removed successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to remove birth profile' }, { status: 500 });
  }
}
