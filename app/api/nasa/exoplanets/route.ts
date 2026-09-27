import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    // Sanitize input for ADQL query (only letters, numbers, hyphens, spaces, and plus signs)
    const sanitized = query.replace(/[^a-zA-Z0-9\s\-+]/g, '').trim();

    let adql: string;
    if (sanitized.length > 0) {
      const upperSanitized = sanitized.toUpperCase();
      adql = `select top ${limit} pl_name, hostname, discoverymethod, disc_year, pl_orbper, pl_rade, pl_bmasse, pl_eqt, sy_dist from ps where default_flag=1 and (upper(pl_name) like '%${upperSanitized}%' or upper(hostname) like '%${upperSanitized}%') order by disc_year desc`;
    } else {
      // Default curated NASA landmark exoplanet query
      adql = `select top ${limit} pl_name, hostname, discoverymethod, disc_year, pl_orbper, pl_rade, pl_bmasse, pl_eqt, sy_dist from ps where default_flag=1 and pl_rade is not null and sy_dist is not null order by disc_year desc`;
    }

    const tapUrl = `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=${encodeURIComponent(adql)}&format=json`;

    const res = await fetch(tapUrl, {
      headers: {
        'User-Agent': 'IbrahimScienceLab/1.0',
      },
      next: { revalidate: 3600 }, // Cache on edge/server for 1 hour
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `NASA TAP query returned status ${res.status}` },
        { status: res.status }
      );
    }

    const records = await res.json();

    if (!Array.isArray(records)) {
      return NextResponse.json({ error: 'Unexpected response from NASA', raw: records }, { status: 502 });
    }

    // Standardize to Ibrahim Science Lab CelestialBody format
    const formatted = records.map((r: any, idx: number) => {
      const plName = r.pl_name || `Exoplanet ${idx + 1}`;
      const safeId = `nasa_exo_${plName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const rade = r.pl_rade || 1.0;
      const distLy = r.sy_dist ? Math.round(r.sy_dist * 3.26156) : null;
      const eqt = r.pl_eqt || 300;

      // Color based on equilibrium temperature
      let color = '#38bdf8'; // temperate / ocean blue
      if (eqt > 1500) color = '#f97316'; // ultra-hot jupiter lava/amber
      else if (eqt > 700) color = '#eab308'; // warm jupiter/sub-neptune gold
      else if (eqt < 200) color = '#c084fc'; // frozen ice giant violet
      else if (rade < 1.6) color = '#34d399'; // habitable super-earth emerald

      // Spread positions in 3D stellar neighborhood sphere
      const phi = (idx * 137.5 * Math.PI) / 180;
      const theta = Math.acos(1 - (2 * (idx + 0.5)) / records.length);
      const rDist = 450 + (idx % 10) * 120;
      const posX = Math.round(rDist * Math.sin(theta) * Math.cos(phi));
      const posY = Math.round((rDist * 0.4) * Math.cos(theta));
      const posZ = Math.round(rDist * Math.sin(theta) * Math.sin(phi));

      return {
        id: safeId,
        nameEn: plName,
        nameAr: `كوكب ${plName}`,
        type: 'planet',
        scaleLevel: 2,
        position: [posX, posY, posZ],
        size: Math.max(0.8, Math.min(3.2, rade * 0.75)),
        color,
        distanceFromEarth: distLy ? `${distLy} light-years (${Math.round(r.sy_dist)} pc)` : 'Confirmed Distance in Catalog',
        mass: r.pl_bmasse ? `${r.pl_bmasse} M_Earth` : 'Transit Detection (Mass Pending)',
        radius: `${rade} R_Earth`,
        temperature: `${eqt} K (${Math.round(eqt - 273.15)}°C)`,
        descriptionEn: `Official confirmed exoplanet discovered by NASA missions in ${r.disc_year || 'recent years'} using the ${r.discoverymethod || 'Transit'} method around host star ${r.hostname || 'Host Star'}. Orbital period is ${r.pl_orbper ? r.pl_orbper.toFixed(2) : 'N/A'} days.`,
        descriptionAr: `كوكب خارجي مؤكد رسمياً من وكالة ناسا اكتُشف في عام ${r.disc_year || 'حديثاً'} عبر طريقة ${r.discoverymethod || 'العبور'} حول النجم المضيف ${r.hostname || 'النجم المضيف'}. فترة مداره ${r.pl_orbper ? r.pl_orbper.toFixed(2) : 'غير محددة'} يوماً.`,
        primaryElements: [
          { atomicNumber: 1, symbol: 'H', nameEn: 'Atmospheric Hydrogen', nameAr: 'هيدروجين الغلاف الجوي', percentage: 75.0 },
          { atomicNumber: 2, symbol: 'He', nameEn: 'Helium', nameAr: 'هيليوم', percentage: 20.0 },
          { atomicNumber: 8, symbol: 'O', nameEn: 'Water Vapor / Oxygen Species', nameAr: 'بخار ماء وأكسجين', percentage: 5.0 },
        ],
        source: 'NASA Exoplanet Archive (Caltech / IPAC)',
        discoveryMethod: r.discoverymethod,
        discoveryYear: r.disc_year,
        hostStar: r.hostname,
        isNasaOfficial: true,
      };
    });

    return NextResponse.json({
      source: 'NASA Exoplanet Archive (Caltech / NExScI)',
      total: formatted.length,
      query: sanitized,
      data: formatted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to query NASA Exoplanet Archive', details: error.message },
      { status: 500 }
    );
  }
}
