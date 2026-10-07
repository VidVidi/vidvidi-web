import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YOUTUBE_KEY = process.env.YOUTUBE_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Pradinis Lietuvos kanalų sąrašas su jų oficialiais YouTube ID
const CHANNELS_TO_TRACK = [
  { id: 'UCbZqKCdF0bK-Q5Kx9t_r2Zw', category: 'Kovos', title: 'UTMA Lietuva' },
  { id: 'UCiGf_8c5JzYw19Q18rV2H0Q', category: 'Kovos', title: 'Sergej Maslobojev' },
  { id: 'UC9bTqE4jK4M_8e6d2pW3R4A', category: 'Pramogos', title: 'deMiko' },
  { id: 'UCtGf6_Q1gqH0iE0f2ZkLq8Q', category: 'Pramogos', title: 'Vėlyvas Vakaras' },
  { id: 'UC_xZl8eP2-3fUvKq5wE9b4w', category: 'Tinklalaidės', title: 'Klajumas Podcast' },
  { id: 'UC1Gg2_8b8yA0f_Z2aQpL6aw', category: 'Geimingas', title: 'LT Geimeris' }
];

async function updateChannels() {
  console.log('Pradedamas YouTube duomenų atnaujinimas...');
  
  for (const item of CHANNELS_TO_TRACK) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${item.id}&key=${YOUTUBE_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.items || data.items.length === 0) {
        console.warn(`Kanalas nerastas: ${item.title} (${item.id})`);
        continue;
      }

      const info = data.items[0];
      const subs = parseInt(info.statistics.subscriberCount || '0', 10);
      const views = parseInt(info.statistics.viewCount || '0', 10);
      const videos = parseInt(info.statistics.videoCount || '0', 10);
      const avatar = info.snippet.thumbnails.high?.url || info.snippet.thumbnails.default?.url;
      const title = info.snippet.title;
      const handle = info.snippet.customUrl || '';

      const { error } = await supabase.from('channels').upsert({
        youtube_id: item.id,
        title: title,
        handle: handle,
        category: item.category,
        subscribers: subs,
        total_views: views,
        video_count: videos,
        avatar_url: avatar,
        updated_at: new Date().toISOString()
      }, { onConflict: 'youtube_id' });

      if (error) console.error(`Klaida įrašant ${title}:`, error.message);
      else console.log(`Atnaujinta: ${title} | Prenumeratoriai: ${subs.toLocaleString()}`);

    } catch (err) {
      console.error(`Klaida apdorojant ${item.title}:`, err.message);
    }
  }
  console.log('Atnaujinimas baigtas.');
}

updateChannels();
