import { supabaseAdmin } from '../lib/supabase-admin';

export class StorageService {
  private bucketName = 'recordings';

  async uploadAudio(
    file: Blob, 
    userId: string, 
    recordingId?: string
  ): Promise<string> {
    try {
      const filename = recordingId 
        ? `${userId}/${recordingId}.webm`
        : `${userId}/${Date.now()}.webm`;
      
      const { data, error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .upload(filename, file, {
          contentType: 'audio/webm',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }
      return filename;
    } catch (error) {
      console.error('Storage upload error:', error);
      throw error;
    }
  }
  async deleteAudio(filePath: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Storage delete error:', error);
      throw error;
    }
  }

  async downloadAudio(filePath: string): Promise<Blob> {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .download(filePath);

      if (error) {
        throw new Error(`Download failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Storage download error:', error);
      throw error;
    }
  }

  getPublicUrl(filePath: string): string {
    const { data } = supabaseAdmin.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }
}

export const storageService = new StorageService();
