// app/api/student-image/route.js
// Serves student profile images with background removed
// Caches processed images in public/student-images/

import { execSync } from 'child_process';
import { existsSync, readFileSync, mkdirSync } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const roll = (searchParams.get('roll') || '').trim().toUpperCase();

  if (!roll) {
    return new Response('Roll number required', { status: 400 });
  }

  const cacheDir = path.join(process.cwd(), 'public', 'student-images');
  const cachedPath = path.join(cacheDir, `${roll}.png`);

  // Check if already cached
  if (existsSync(cachedPath)) {
    const imageBuffer = readFileSync(cachedPath);
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  // Ensure cache directory exists
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  // Get image URL — try Supabase first, then Technical Hub
  let imageUrl = '';
  try {
    const { data } = await supabase
      .from('student_profiles')
      .select('image_url')
      .eq('roll_number', roll)
      .single();
    if (data?.image_url) imageUrl = data.image_url;
  } catch {}

  if (!imageUrl) {
    imageUrl = `https://myprofile.technicalhub.io/student-info/${roll}.png`;
  }

  // Run background removal
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'remove-bg.py');
    
    // Set SSL bypass for the python script
    const result = execSync(
      `PYTHONHTTPSVERIFY=0 python3 "${scriptPath}" "${imageUrl}" "${cachedPath}"`,
      { timeout: 60000, encoding: 'utf-8', env: { ...process.env, PYTHONHTTPSVERIFY: '0', CURL_CA_BUNDLE: '' } }
    );

    if (result.includes('OK') && existsSync(cachedPath)) {
      const imageBuffer = readFileSync(cachedPath);
      return new Response(imageBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } else {
      // Fallback: redirect to original image
      return Response.redirect(imageUrl, 302);
    }
  } catch (error) {
    console.error('Background removal error:', error.message);
    // Fallback: redirect to original image
    return Response.redirect(imageUrl, 302);
  }
}