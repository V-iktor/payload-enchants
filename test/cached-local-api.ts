import { buildCachedPayload } from '@payload-enchants/cached-local-api';
import { revalidateTag, unstable_cache } from 'next/cache';

export const { cachedPayloadPlugin, getCachedPayload } = buildCachedPayload({
  collections: [
    {
      findOneFields: ['slug'],
      slug: 'posts',
    },
  ],
  revalidateTag,
  unstable_cache,
});
