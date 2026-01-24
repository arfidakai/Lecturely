// Subject slug to UUID mapping
export const SUBJECT_MAPPING: Record<string, string> = {
  'computer-science': '11111111-1111-1111-1111-111111111111',
  'mathematics': '22222222-2222-2222-2222-222222222222',
  'physics': '33333333-3333-3333-3333-333333333333',
  'literature': '44444444-4444-4444-4444-444444444444',
};

// Reverse mapping: UUID to slug
export const UUID_TO_SLUG: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': 'computer-science',
  '22222222-2222-2222-2222-222222222222': 'mathematics',
  '33333333-3333-3333-3333-333333333333': 'physics',
  '44444444-4444-4444-4444-444444444444': 'literature',
};

export function getUUIDFromSlug(slug: string): string | undefined {
  return SUBJECT_MAPPING[slug];
}

export function getSlugFromUUID(uuid: string): string | undefined {
  return UUID_TO_SLUG[uuid];
}
