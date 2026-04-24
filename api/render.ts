import { renderMediaOnVercel } from '@remotion/vercel';
import { bundle } from '@remotion/bundler';
import path from 'path';

// Note: This function runs in Vercel's serverless environment.
// It uses Vercel Sandbox to provision a machine with FFmpeg and Chrome.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { inputProps } = req.body;

    // 1. Bundle the Remotion project
    // In Vercel, we might need to bundle differently or use a pre-bundled URL.
    // For simplicity, we'll assume the client sends the data to renderMediaOnVercel.
    
    // 2. Trigger the render on Vercel Sandbox
    const result = await renderMediaOnVercel({
      region: 'cdg1', // Choose a region close to your users
      indexHtml: path.resolve('index.html'),
      compositionId: 'Reel',
      inputProps,
      codec: 'h264',
    });

    // 3. Status is polling-based 
    return res.json({ 
      success: true, 
      renderId: result.renderId,
      msg: 'Render started on Vercel Sandbox. Polling needed for final URL.' 
    });

  } catch (error) {
    console.error('Vercel Render Error:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
}
