import { supabase } from '../supabase/client';
import { CostumeEntry, CostumeResult, VoteSubmission, VotingSettings } from '../types';

function generateVoterId(): string {
  let voterId = localStorage.getItem('costume_voter_id');
  
  if (!voterId) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('costume-voting', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      window.screen.width + 'x' + window.screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    voterId = Math.abs(hash).toString(36);
    localStorage.setItem('costume_voter_id', voterId);
  }
  
  return voterId;
}

export async function uploadCostumeImage(file: File): Promise<string> {
  try {
    // Create a canvas to process the image and maintain quality
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Calculate dimensions to maintain aspect ratio while limiting size
        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;
        
        // Scale down if too large, but maintain aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image with high quality settings
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = 'high';
        ctx!.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with high quality
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to process image'));
            return;
          }
          
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { error } = await supabase.storage
            .from('costume-images')
            .upload(fileName, blob, {
              contentType: blob.type,
              cacheControl: '3600',
              upsert: false
            });
          
          if (error) {
            reject(new Error(`Failed to upload image: ${error.message}`));
            return;
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('costume-images')
            .getPublicUrl(fileName);
          
          resolve(publicUrl);
        }, 'image/jpeg', 0.95); // High quality JPEG (95%)
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  } catch (error) {
    throw error;
  }
}

export async function addCostumeEntry(name: string, imageFile: File): Promise<CostumeEntry> {
  try {
    const imageUrl = await uploadCostumeImage(imageFile);
    
    const { data, error } = await supabase
      .from('costume_entries')
      .insert({
        name,
        image_url: imageUrl,
        created_by: 'admin'
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to add costume entry: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getCostumeEntries(): Promise<CostumeEntry[]> {
  try {
    const { data, error } = await supabase
      .from('costume_entries')
      .select('*')
      .order('uploaded_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch costume entries: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    throw error;
  }
}

export async function submitVote(vote: VoteSubmission): Promise<boolean> {
  try {
    const voterId = generateVoterId();
    
    const { data: existingVote } = await supabase
      .from('costume_votes')
      .select('id')
      .eq('voter_id', voterId)
      .single();
    
    if (existingVote) {
      throw new Error('You have already voted!');
    }
    
    const { error } = await supabase
      .from('costume_votes')
      .insert({
        voter_id: voterId,
        first_choice: vote.first_choice,
        second_choice: vote.second_choice,
        third_choice: vote.third_choice
      });
    
    if (error) {
      throw new Error(`Failed to submit vote: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    throw error;
  }
}

export async function hasUserVoted(): Promise<boolean> {
  try {
    const voterId = generateVoterId();
    
    const { data, error } = await supabase
      .from('costume_votes')
      .select('id')
      .eq('voter_id', voterId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check vote status: ${error.message}`);
    }
    
    return !!data;
  } catch (error) {
    return false;
  }
}

export async function getCostumeResults(): Promise<CostumeResult[]> {
  try {
    try {
      const { data, error } = await supabase.rpc('get_costume_results');
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (functionError) {
      const { data: entries, error: entriesError } = await supabase
        .from('costume_entries')
        .select('id, name, image_url');
      
      if (entriesError) {
        throw new Error(`Failed to fetch costume entries: ${entriesError.message}`);
      }
      
      const { data: votes, error: votesError } = await supabase
        .from('costume_votes')
        .select('first_choice, second_choice, third_choice');
      
      if (votesError) {
        throw new Error(`Failed to fetch votes: ${votesError.message}`);
      }
      
      const results: CostumeResult[] = (entries || []).map(entry => {
        const firstVotes = (votes || []).filter(v => v.first_choice === entry.id).length;
        const secondVotes = (votes || []).filter(v => v.second_choice === entry.id).length;
        const thirdVotes = (votes || []).filter(v => v.third_choice === entry.id).length;
        const totalPoints = firstVotes * 3 + secondVotes * 2 + thirdVotes * 1;
        
        return {
          costume_id: entry.id,
          costume_name: entry.name,
          costume_image_url: entry.image_url,
          first_place_votes: firstVotes,
          second_place_votes: secondVotes,
          third_place_votes: thirdVotes,
          total_points: totalPoints
        };
      });
      
      return results.sort((a, b) => b.total_points - a.total_points);
    }
  } catch (error) {
    throw error;
  }
}

export async function deleteCostumeEntry(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('costume_entries')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete costume entry: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    throw error;
  }
}

export async function getTotalVoteCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('costume_votes')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw new Error(`Failed to get vote count: ${error.message}`);
    }
    
    return count || 0;
  } catch (error) {
    return 0;
  }
}

export async function getVotingSettings(): Promise<VotingSettings> {
  try {
    const { data, error } = await supabase
      .from('voting_settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch voting settings: ${error.message}`);
    }
    
    if (!data) {
      return { voting_enabled: false, last_updated: new Date().toISOString() };
    }
    
    return {
      voting_enabled: data.voting_enabled,
      last_updated: data.last_updated
    };
  } catch (error) {
    return { voting_enabled: false, last_updated: new Date().toISOString() };
  }
}

export async function updateVotingSettings(enabled: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('voting_settings')
      .upsert({
        id: 1,
        voting_enabled: enabled,
        last_updated: new Date().toISOString()
      });
    
    if (error) {
      throw new Error(`Failed to update voting settings: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    throw error;
  }
}
