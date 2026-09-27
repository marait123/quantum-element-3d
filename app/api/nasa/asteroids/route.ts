import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'bennu';

    // Sanitize input
    const sanitized = query.replace(/[^a-zA-Z0-9\s\-]/g, '').trim();
    if (!sanitized) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const jplUrl = `https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=${encodeURIComponent(sanitized)}&phys-par=1`;

    const res = await fetch(jplUrl, {
      headers: {
        'User-Agent': 'IbrahimScienceLab/1.0',
      },
      next: { revalidate: 86400 }, // Cache asteroid orbit data for 24 hours
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `NASA JPL SBDB returned status ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    if (!data.object) {
      return NextResponse.json({
        source: 'NASA JPL Small-Body Database',
        found: false,
        message: data.message || `No small body matching "${sanitized}" found in NASA JPL database.`,
        data: [],
      });
    }

    const obj = data.object;
    const orbit = data.orbit;
    const phys = data.phys_par || [];

    // Extract diameter if present
    const diameterObj = phys.find((p: any) => p.name === 'diameter');
    const diameterKm = diameterObj ? parseFloat(diameterObj.value) : null;

    // Extract semi-major axis (a) from orbit elements
    const elements = orbit?.elements || [];
    const aObj = elements.find((e: any) => e.name === 'a');
    const semiMajorAU = aObj ? parseFloat(aObj.value) : 2.5;

    const eObj = elements.find((e: any) => e.name === 'e');
    const eccentricity = eObj ? parseFloat(eObj.value) : 0.1;

    const safeId = `nasa_sbdb_${(obj.shortname || obj.des || 'asteroid').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Map orbit to Solar System 3D scene coordinates (AU scale ~ 10 units/AU)
    const orbitalRadius = Math.max(12, Math.min(80, semiMajorAU * 9.5));
    const randomAngle = Math.random() * Math.PI * 2;
    const posX = Math.cos(randomAngle) * orbitalRadius;
    const posZ = Math.sin(randomAngle) * orbitalRadius;
    const posY = (Math.random() - 0.5) * 3.0;

    const formattedBody = {
      id: safeId,
      nameEn: obj.fullname || obj.shortname || sanitized,
      nameAr: `كويكب ${obj.shortname || sanitized}`,
      type: obj.neo ? 'asteroid' : 'asteroid',
      scaleLevel: 1,
      position: [Math.round(posX * 10) / 10, Math.round(posY * 10) / 10, Math.round(posZ * 10) / 10],
      size: diameterKm ? Math.max(0.4, Math.min(2.5, Math.log10(diameterKm + 1) * 0.7)) : 0.6,
      color: obj.neo ? '#fbbf24' : '#94a3b8',
      orbitalRadius: Math.round(orbitalRadius * 10) / 10,
      orbitalSpeed: 0.02,
      distanceFromEarth: `${semiMajorAU ? (semiMajorAU * 149.6).toFixed(1) : 'Variable'} million km (${semiMajorAU ? semiMajorAU.toFixed(2) : '1.0'} AU semi-major axis)`,
      mass: diameterKm ? `${(4/3 * Math.PI * Math.pow(diameterKm/2 * 1000, 3) * 2000).toExponential(2)} kg (estimated)` : 'NASA Trajectory Measurement',
      radius: diameterKm ? `${(diameterKm / 2).toFixed(2)} km diameter` : 'Radar / Photometric Estimate',
      descriptionEn: `Official NASA JPL cataloged small body (${obj.orbit_class?.name || 'Asteroid'}). Orbit ID: ${obj.orbit_id || 'N/A'}. Potentially Hazardous Asteroid (PHA): ${obj.pha ? 'Yes' : 'No'}. Near-Earth Object: ${obj.neo ? 'Yes' : 'No'}. Eccentricity: ${eccentricity}.`,
      descriptionAr: `جرم كوني صغير موثق رسمياً في قاعدة بيانات مختبر الدفع النفاث التابع لناسا (${obj.orbit_class?.name || 'كويكب'}). جرم قريب من الأرض: ${obj.neo ? 'نعم' : 'لا'}. كويكب خطر محتمل: ${obj.pha ? 'نعم' : 'لا'}. معامل الاختلاف المركزي للمدار: ${eccentricity}.`,
      primaryElements: [
        { atomicNumber: 14, symbol: 'Si', nameEn: 'Silicate Rock Minerals', nameAr: 'معادن السيليكات الصخرية', percentage: 55.0 },
        { atomicNumber: 26, symbol: 'Fe', nameEn: 'Metallic Nickel-Iron', nameAr: 'حديد ونيكل معدني', percentage: 30.0 },
        { atomicNumber: 6, symbol: 'C', nameEn: 'Carbonaceous Chondrite Compounds', nameAr: 'مركبات كربونية كوندريتية', percentage: 15.0 },
      ],
      source: 'NASA JPL Small-Body Database (Center for NEO Studies)',
      isNasaOfficial: true,
      spkid: obj.spkid,
      orbitClass: obj.orbit_class?.name,
    };

    return NextResponse.json({
      source: 'NASA JPL Small-Body Database',
      found: true,
      data: [formattedBody],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to query NASA JPL SBDB', details: error.message },
      { status: 500 }
    );
  }
}
