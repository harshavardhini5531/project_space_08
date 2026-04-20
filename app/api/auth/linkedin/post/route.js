// app/api/auth/linkedin/post/route.js
export async function POST(request) {
  try {
    const { accessToken, userUrn, text, imageBase64 } = await request.json()
    if (!accessToken || !userUrn || !text) {
      return Response.json({ error: 'Missing required data' }, { status: 400 })
    }

    let mediaAssetUrn = null

    // Step 1: If image provided, upload it to LinkedIn first
    if (imageBase64) {
      // Register upload
      const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: userUrn,
            serviceRelationships: [{
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent'
            }]
          }
        })
      })
      const registerData = await registerRes.json()
      if (!registerData.value?.uploadMechanism) {
        console.error('LinkedIn register upload failed:', registerData)
        return Response.json({ error: 'Failed to register image upload' }, { status: 500 })
      }
      const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl
      mediaAssetUrn = registerData.value.asset

      // Upload binary image
      const imageBuffer = Buffer.from(imageBase64.split(',')[1] || imageBase64, 'base64')
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: imageBuffer
      })
      if (!uploadRes.ok) {
        console.error('Image upload failed:', uploadRes.status)
        return Response.json({ error: 'Image upload failed' }, { status: 500 })
      }
    }

    // Step 2: Create the post
    const postBody = {
      author: userUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: mediaAssetUrn ? 'IMAGE' : 'NONE',
          ...(mediaAssetUrn && {
            media: [{
              status: 'READY',
              description: { text: 'Project Space showcase' },
              media: mediaAssetUrn,
              title: { text: 'Project Space' }
            }]
          })
        }
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
    }

    const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(postBody)
    })

    const postData = await postRes.json()
    if (!postRes.ok) {
      console.error('LinkedIn post failed:', postData)
      return Response.json({ error: postData.message || 'Post failed' }, { status: 500 })
    }

    return Response.json({ success: true, postId: postData.id })
  } catch (err) {
    console.error('LinkedIn post error:', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}