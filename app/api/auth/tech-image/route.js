import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const technology = (body.technology || '').trim()

    if (!technology) {
      return Response.json({ error: 'Technology is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('technology_images')
      .select('image_url')
      .eq('technology', technology)
      .single()

    if (error || !data) {
      return Response.json({ imageUrl: null })
    }

    return Response.json({ imageUrl: data.image_url })
  } catch (err) {
    console.error('tech-image error:', err)
    return Response.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}