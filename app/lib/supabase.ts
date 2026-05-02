import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload an avatar image to the `avatars` bucket and return its public URL.
 * - `file` can be a `File` or `Blob` from an <input type="file">.
 * - `userId` is used to namespace the file path.
 */
export async function uploadAvatar(file: File | Blob, userId: string): Promise<string> {
	const fileExt = file instanceof File && (file as File).name ? (file as File).name.split('.').pop() : 'png';
	const filePath = `avatars/${userId}/${Date.now()}.${fileExt}`;

	const uploadOptions: any = { upsert: true };
	if (file instanceof File && (file as File).type) uploadOptions.contentType = (file as File).type;

	const { error: uploadError } = await supabase.storage
		.from('avatars')
		.upload(filePath, file, uploadOptions);

	if (uploadError) {
		throw uploadError;
	}

	return filePath;
}

export function getAvatarPublicUrl(path: string): string {
	const { data } = supabase.storage.from('avatars').getPublicUrl(path);
	return data.publicUrl;
}

