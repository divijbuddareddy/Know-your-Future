import * as Astronomy from 'astronomy-engine';
import {
  ZODIAC_SIGNS,
  NAKSHATRAS,
  NAKSHATRA_LORDS,
  DASHA_YEARS,
  DASHA_ORDER,
  BHAVA_TITLES
} from './vedic-definitions.ts';

export interface BirthInput {
  name?: string;
  birthDate: string; // "YYYY-MM-DD"
  birthTime: string; // "HH:MM"
  latitude: number;
  longitude: number;
  timezoneOffset: number; // e.g. +5.5 for India (UTC+5:30)
  timeConfidence?: 'exact' | 'approximate' | 'unknown';
}

export interface PlanetPosition {
  name: string;
  sanskritName: string;
  tropicalLon: number;
  siderealLon: number;
  rashi: string;
  rashiSanskrit: string;
  rashiIndex: number;
  degreeInSign: number;
  formattedDegree: string;
  nakshatra: string;
  nakshatraLord: string;
  pada: number;
  bhava: number;
  isRetrograde: boolean;
}

export interface Panchanga {
  tithi: {
    number: number;
    name: string;
    paksha: 'Shukla' | 'Krishna';
  };
  vara: string;
  nakshatra: string;
  yoga: string;
  karana: string;
}

export interface DashaPeriod {
  lord: string;
  startDate: string;
  endDate: string;
  subPeriods?: { lord: string; startDate: string; endDate: string }[];
}

export interface VedicChartData {
  calculationEngine: string;
  ayanamsaName: string;
  ayanamsaValueDeg: number;
  julianDate: number;
  utcDateTime: string;
  localDateTime: string;
  timeConfidence: string;
  lagna: PlanetPosition;
  planets: PlanetPosition[];
  panchanga: Panchanga;
  currentDasha: {
    mahadasha: string;
    antardasha: string;
    remainingYearsInMahadasha: number;
  };
  bhavas: {
    bhavaNumber: number;
    title: string;
    themes: string;
    rashi: string;
    rashiSanskrit: string;
    planetsInBhava: string[];
  }[];
}

const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashti', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima / Amavasya'
];

const YOGA_NAMES = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda',
  'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata',
  'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana', 'Parigha',
  'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'
];

const KARANA_NAMES = [
  'Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti (Bhadra)',
  'Shakuni', 'Chatushpada', 'Naga', 'Kintughna'
];

const DAY_NAMES = ['Sunday (Ravivara)', 'Monday (Somavara)', 'Tuesday (Mangalavara)', 'Wednesday (Budhavara)', 'Thursday (Guruvara)', 'Friday (Shukravara)', 'Saturday (Shanivara)'];

export function calculateLahiriAyanamsa(utcDate: Date): number {
  // Epoch J2000.0 is 2000-01-01T12:00:00Z
  const year = utcDate.getUTCFullYear();
  const dayOfYear = (Date.UTC(year, utcDate.getUTCMonth(), utcDate.getUTCDate()) - Date.UTC(year, 0, 0)) / 86400000;
  const decimalYear = year + dayOfYear / 365.25;
  // Standard Lahiri Ayanamsa formula: 23.856944 at epoch 2000.0 + 50.29 arcsec/yr (0.01396967 deg/yr)
  const ayanamsa = 23.856944 + 0.01396967 * (decimalYear - 2000.0);
  return ayanamsa;
}

export function formatDegree(deg: number): string {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  const s = Math.round(((deg - d) * 60 - m) * 60);
  return `${d}° ${m}' ${s}"`;
}

export function calculateVedicChart(input: BirthInput): VedicChartData {
  const [yearStr, monthStr, dayStr] = input.birthDate.split('-');
  const [hourStr, minStr] = (input.birthTime || '12:00').split(':');

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minStr, 10);

  // Compute UTC time by subtracting timezone offset
  const localMs = Date.UTC(year, month, day, hour, minute);
  const offsetMs = (input.timezoneOffset || 5.5) * 3600 * 1000;
  const utcMs = localMs - offsetMs;
  const utcDate = new Date(utcMs);

  const observer = new Astronomy.Observer(input.latitude, input.longitude, 0);
  const ayanamsa = calculateLahiriAyanamsa(utcDate);

  // 1. Calculate Lagna (Ascendant)
  // Local Sidereal Time in degrees = (GAST in hours * 15 + Longitude) % 360
  const gastHours = Astronomy.SiderealTime(utcDate);
  let ramcDeg = (gastHours * 15 + input.longitude) % 360;
  if (ramcDeg < 0) ramcDeg += 360;

  // True Obliquity of the Ecliptic
  const tCenturies = (utcMs / 86400000 - 10957.5) / 36525.0; // from J2000
  const epsDeg = 23.439291 - 0.0130042 * tCenturies;
  const epsRad = (epsDeg * Math.PI) / 180;
  const ramcRad = (ramcDeg * Math.PI) / 180;
  const latRad = (input.latitude * Math.PI) / 180;

  // Ascendant formula
  const sinRAMC = Math.sin(ramcRad);
  const cosRAMC = Math.cos(ramcRad);
  const tanLat = Math.tan(latRad);
  const sinEps = Math.sin(epsRad);
  const cosEps = Math.cos(epsRad);

  const y = -cosRAMC;
  const x = sinRAMC * cosEps + tanLat * sinEps;
  let tropicalLagnaLon = (Math.atan2(y, x) * 180) / Math.PI;
  if (tropicalLagnaLon < 0) tropicalLagnaLon += 360;

  let siderealLagnaLon = (tropicalLagnaLon - ayanamsa) % 360;
  if (siderealLagnaLon < 0) siderealLagnaLon += 360;

  const lagnaRashiIndex = Math.floor(siderealLagnaLon / 30);
  const lagnaSign = ZODIAC_SIGNS[lagnaRashiIndex];
  const lagnaDegInSign = siderealLagnaLon % 30;
  const lagnaNakshatraIdx = Math.floor(siderealLagnaLon / (360 / 27));
  const lagnaPada = Math.floor((siderealLagnaLon % (360 / 27)) / (360 / 108)) + 1;

  const lagnaPos: PlanetPosition = {
    name: 'Ascendant',
    sanskritName: 'Lagna',
    tropicalLon: tropicalLagnaLon,
    siderealLon: siderealLagnaLon,
    rashi: lagnaSign.english,
    rashiSanskrit: lagnaSign.sanskrit,
    rashiIndex: lagnaRashiIndex,
    degreeInSign: lagnaDegInSign,
    formattedDegree: formatDegree(lagnaDegInSign),
    nakshatra: NAKSHATRAS[lagnaNakshatraIdx],
    nakshatraLord: NAKSHATRA_LORDS[lagnaNakshatraIdx % 9],
    pada: lagnaPada,
    bhava: 1,
    isRetrograde: false
  };

  // 2. Calculate Planets
  const planetDefs = [
    { key: 'Sun', sanskrit: 'Surya' },
    { key: 'Moon', sanskrit: 'Chandra' },
    { key: 'Mars', sanskrit: 'Mangala' },
    { key: 'Mercury', sanskrit: 'Budha' },
    { key: 'Jupiter', sanskrit: 'Guru' },
    { key: 'Venus', sanskrit: 'Shukra' },
    { key: 'Saturn', sanskrit: 'Shani' }
  ];

  const planets: PlanetPosition[] = [];

  for (const p of planetDefs) {
    let tropLon: number;
    let isRetro = false;

    if (p.key === 'Sun') {
      const sunEcl = Astronomy.SunPosition(utcDate);
      tropLon = sunEcl.elon;
    } else {
      const vec = Astronomy.GeoVector(p.key as any, utcDate, true);
      const ecl = Astronomy.Ecliptic(vec);
      tropLon = ecl.elon;

      // Check retrograde by sampling 6 hours later
      const nextDate = new Date(utcMs + 6 * 3600 * 1000);
      const nextVec = Astronomy.GeoVector(p.key as any, nextDate, true);
      const nextEcl = Astronomy.Ecliptic(nextVec);
      let diff = nextEcl.elon - tropLon;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      if (diff < 0) isRetro = true;
    }

    let siderealLon = (tropLon - ayanamsa) % 360;
    if (siderealLon < 0) siderealLon += 360;

    const rashiIdx = Math.floor(siderealLon / 30);
    const sign = ZODIAC_SIGNS[rashiIdx];
    const degInSign = siderealLon % 30;
    const nakshatraIdx = Math.floor(siderealLon / (360 / 27));
    const pada = Math.floor((siderealLon % (360 / 27)) / (360 / 108)) + 1;

    // Bhava relative to Lagna Rashi (Whole Sign / Equal House from Lagna)
    let bhava = ((rashiIdx - lagnaRashiIndex + 12) % 12) + 1;

    planets.push({
      name: p.key,
      sanskritName: p.sanskrit,
      tropicalLon: tropLon,
      siderealLon: siderealLon,
      rashi: sign.english,
      rashiSanskrit: sign.sanskrit,
      rashiIndex: rashiIdx,
      degreeInSign: degInSign,
      formattedDegree: formatDegree(degInSign),
      nakshatra: NAKSHATRAS[nakshatraIdx],
      nakshatraLord: NAKSHATRA_LORDS[nakshatraIdx % 9],
      pada,
      bhava,
      isRetrograde: isRetro
    });
  }

  // 3. Rahu & Ketu (True/Mean Lunar Node)
  // Mean ascending node formula
  const T = (utcMs / 86400000 - 10957.5) / 36525.0;
  let rahuTropLon = (125.04452 - 1934.136261 * T + 0.0020708 * T * T) % 360;
  if (rahuTropLon < 0) rahuTropLon += 360;

  let rahuSidLon = (rahuTropLon - ayanamsa) % 360;
  if (rahuSidLon < 0) rahuSidLon += 360;

  const rahuRashiIdx = Math.floor(rahuSidLon / 30);
  const rahuSign = ZODIAC_SIGNS[rahuRashiIdx];
  const rahuDeg = rahuSidLon % 30;
  const rahuNakIdx = Math.floor(rahuSidLon / (360 / 27));
  const rahuPada = Math.floor((rahuSidLon % (360 / 27)) / (360 / 108)) + 1;
  const rahuBhava = ((rahuRashiIdx - lagnaRashiIndex + 12) % 12) + 1;

  planets.push({
    name: 'Rahu (North Node)',
    sanskritName: 'Rahu',
    tropicalLon: rahuTropLon,
    siderealLon: rahuSidLon,
    rashi: rahuSign.english,
    rashiSanskrit: rahuSign.sanskrit,
    rashiIndex: rahuRashiIdx,
    degreeInSign: rahuDeg,
    formattedDegree: formatDegree(rahuDeg),
    nakshatra: NAKSHATRAS[rahuNakIdx],
    nakshatraLord: NAKSHATRA_LORDS[rahuNakIdx % 9],
    pada: rahuPada,
    bhava: rahuBhava,
    isRetrograde: true // Nodes are naturally retrograde
  });

  // Ketu is always exactly opposite Rahu
  let ketuSidLon = (rahuSidLon + 180) % 360;
  const ketuRashiIdx = Math.floor(ketuSidLon / 30);
  const ketuSign = ZODIAC_SIGNS[ketuRashiIdx];
  const ketuDeg = ketuSidLon % 30;
  const ketuNakIdx = Math.floor(ketuSidLon / (360 / 27));
  const ketuPada = Math.floor((ketuSidLon % (360 / 27)) / (360 / 108)) + 1;
  const ketuBhava = ((ketuRashiIdx - lagnaRashiIndex + 12) % 12) + 1;

  planets.push({
    name: 'Ketu (South Node)',
    sanskritName: 'Ketu',
    tropicalLon: (rahuTropLon + 180) % 360,
    siderealLon: ketuSidLon,
    rashi: ketuSign.english,
    rashiSanskrit: ketuSign.sanskrit,
    rashiIndex: ketuRashiIdx,
    degreeInSign: ketuDeg,
    formattedDegree: formatDegree(ketuDeg),
    nakshatra: NAKSHATRAS[ketuNakIdx],
    nakshatraLord: NAKSHATRA_LORDS[ketuNakIdx % 9],
    pada: ketuPada,
    bhava: ketuBhava,
    isRetrograde: true
  });

  // 4. Panchanga Calculation
  const sunPos = planets.find(p => p.name === 'Sun')!;
  const moonPos = planets.find(p => p.name === 'Moon')!;

  // Tithi: (Moon Lon - Sun Lon) / 12 deg
  let tithiDiff = (moonPos.siderealLon - sunPos.siderealLon + 360) % 360;
  const tithiIndex = Math.floor(tithiDiff / 12); // 0 to 29
  const isShukla = tithiIndex < 15;
  const tithiNumInPaksha = (tithiIndex % 15) + 1;
  const tithiName = `${TITHI_NAMES[tithiNumInPaksha - 1]} (${isShukla ? 'Shukla' : 'Krishna'} Paksha)`;

  // Yoga: (Sun Lon + Moon Lon) / (360 / 27)
  const yogaLon = (sunPos.siderealLon + moonPos.siderealLon) % 360;
  const yogaIndex = Math.floor(yogaLon / (360 / 27));
  const yogaName = YOGA_NAMES[yogaIndex % 27];

  // Karana: half tithi
  const karanaIndex = Math.floor(tithiDiff / 6);
  let karanaName: string;
  if (karanaIndex === 0) karanaName = 'Kintughna';
  else if (karanaIndex >= 57) {
    const fixedKaranas = ['Shakuni', 'Chatushpada', 'Naga'];
    karanaName = fixedKaranas[karanaIndex - 57] || 'Vishti';
  } else {
    karanaName = KARANA_NAMES[(karanaIndex - 1) % 7];
  }

  const vara = DAY_NAMES[new Date(year, month, day).getDay()];

  const panchanga: Panchanga = {
    tithi: {
      number: tithiNumInPaksha,
      name: tithiName,
      paksha: isShukla ? 'Shukla' : 'Krishna'
    },
    vara,
    nakshatra: moonPos.nakshatra,
    yoga: yogaName,
    karana: karanaName
  };

  // 5. Vimshottari Dasha calculation for today
  const moonDegInNak = moonPos.siderealLon % (360 / 27);
  const nakTotalDeg = 360 / 27; // 13.3333 degrees
  const elapsedFraction = moonDegInNak / nakTotalDeg;
  const birthNakIdx = Math.floor(moonPos.siderealLon / (360 / 27));
  const birthDashaLord = NAKSHATRA_LORDS[birthNakIdx % 9];
  const birthLordTotalYears = DASHA_YEARS[birthDashaLord];
  const balanceAtBirthYears = birthLordTotalYears * (1 - elapsedFraction);

  // Determine current dasha from age today
  const today = new Date();
  const ageYears = (today.getTime() - localMs) / (365.25 * 86400000);

  let currentMahadasha = birthDashaLord;
  let remainingInMaha = balanceAtBirthYears;
  let passedYears = 0;

  if (ageYears <= balanceAtBirthYears) {
    remainingInMaha = balanceAtBirthYears - ageYears;
    currentMahadasha = birthDashaLord;
  } else {
    passedYears = balanceAtBirthYears;
    let lordIdx = (DASHA_ORDER.indexOf(birthDashaLord) + 1) % 9;
    while (true) {
      const nextLord = DASHA_ORDER[lordIdx];
      const nextYears = DASHA_YEARS[nextLord];
      if (passedYears + nextYears >= ageYears) {
        currentMahadasha = nextLord;
        remainingInMaha = (passedYears + nextYears) - ageYears;
        break;
      }
      passedYears += nextYears;
      lordIdx = (lordIdx + 1) % 9;
    }
  }

  // Current Antardasha approximation
  const mahaTotal = DASHA_YEARS[currentMahadasha];
  const elapsedInMaha = mahaTotal - remainingInMaha;
  let antarElapsed = 0;
  let currentAntardasha = currentMahadasha;
  const startAntarIdx = DASHA_ORDER.indexOf(currentMahadasha);
  for (let i = 0; i < 9; i++) {
    const antarLord = DASHA_ORDER[(startAntarIdx + i) % 9];
    const antarDurationYears = (mahaTotal * DASHA_YEARS[antarLord]) / 120;
    if (antarElapsed + antarDurationYears >= elapsedInMaha) {
      currentAntardasha = antarLord;
      break;
    }
    antarElapsed += antarDurationYears;
  }

  // 6. 12 Bhavas Assembly
  const bhavas = BHAVA_TITLES.map(b => {
    const bhavaRashiIdx = (lagnaRashiIndex + b.bhava - 1) % 12;
    const sign = ZODIAC_SIGNS[bhavaRashiIdx];
    const planetsInThisBhava = planets
      .filter(p => p.bhava === b.bhava)
      .map(p => `${p.sanskritName} (${p.formattedDegree}${p.isRetrograde ? ' [R]' : ''})`);

    return {
      bhavaNumber: b.bhava,
      title: b.name,
      themes: b.themes,
      rashi: sign.english,
      rashiSanskrit: sign.sanskrit,
      planetsInBhava: planetsInThisBhava
    };
  });

  return {
    calculationEngine: 'Astronomy-Engine v2 + Lahiri Precision Ephemeris',
    ayanamsaName: 'Lahiri (Chitrapaksha)',
    ayanamsaValueDeg: parseFloat(ayanamsa.toFixed(4)),
    julianDate: (utcMs / 86400000) + 2440587.5,
    utcDateTime: utcDate.toISOString(),
    localDateTime: `${input.birthDate} ${input.birthTime || '12:00'}`,
    timeConfidence: input.timeConfidence || 'exact',
    lagna: lagnaPos,
    planets,
    panchanga,
    currentDasha: {
      mahadasha: currentMahadasha,
      antardasha: currentAntardasha,
      remainingYearsInMahadasha: parseFloat(remainingInMaha.toFixed(2))
    },
    bhavas
  };
}
