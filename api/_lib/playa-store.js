// The only Playa module allowed to access Blob. All callers must authorize first.
const ID = /^[0-9a-f]{64}$/;
const EMPTY_ETAG = '"empty"';
// Creates the same optimistic-concurrency failure for all stale writes.
const conflict = () => Object.assign(new Error('conflict'), { status: 412 });

// Builds an injectable private-store client without making a network request.
function createStore(client = require('@vercel/blob'), token = () => process.env.PLAYA_READ_WRITE_TOKEN) {
  // Requires the dedicated linked-store token for every Blob operation.
  function options() {
    const value = token();
    if (!value) throw new Error('store-unavailable');
    return { access: 'private', token: value };
  }
  // Uses uncached private reads and treats only Blob-not-found as absence.
  async function read(pathname, extra = {}) {
    try {
      return await client.get(pathname, { ...options(), useCache: false, ...extra });
    } catch (error) {
      if (client.BlobNotFoundError && error instanceof client.BlobNotFoundError) return null;
      throw error;
    }
  }
  // Returns validated stored IDs and the Blob ETag, or an empty initial state.
  async function shortlist() {
    const result = await read('state/shortlist.json');
    if (!result) return { ids: [], updated_at: null, etag: EMPTY_ETAG };
    const data = await new Response(result.stream).json();
    if (
      !Array.isArray(data.ids) ||
      data.ids.length > 5000 ||
      data.ids.some((id) => typeof id !== 'string' || id.length !== 64 || !ID.test(id))
    ) {
      throw new Error('invalid-state');
    }
    return { ids: [...new Set(data.ids)], updated_at: data.updated_at, etag: result.blob.etag };
  }
  return {
    // Forwards conditional reads only to the fixed catalog pathname.
    catalog: (etag) => read('catalog/catalog.json', etag ? { ifNoneMatch: etag } : {}),
    // Signs only the constructed derivative pathname with a five-minute GET grant.
    async media(size, id) {
      // Validate again at the signing boundary; no caller can sign an arbitrary path.
      if (!['thumb', 'preview'].includes(size) || typeof id !== 'string' || id.length !== 64 || !ID.test(id))
        throw new Error('invalid-media');
      const pathname = `${size}/${id.slice(0, 2)}/${id}.webp`;
      const validUntil = Date.now() + 5 * 60 * 1000;
      const signed = await client.issueSignedToken({ ...options(), pathname, operations: ['get'], validUntil });
      const { presignedUrl } = await client.presignUrl(signed, { access: 'private', operation: 'get', pathname, validUntil });
      return presignedUrl;
    },
    shortlist,
    // Preserves atomic first creation and ETag-conditional updates.
    async saveShortlist(ids, etag) {
      const current = await shortlist();
      if (!etag || etag !== current.etag) throw conflict();
      const data = { ids, updated_at: new Date().toISOString() };
      try {
        const result = await client.put('state/shortlist.json', JSON.stringify(data), {
          ...options(),
          addRandomSuffix: false,
          contentType: 'application/json',
          // First creation must also be atomic: never overwrite an intervening create.
          allowOverwrite: etag !== EMPTY_ETAG,
          ...(etag === EMPTY_ETAG ? {} : { ifMatch: etag }),
        });
        return { ...data, etag: result.etag };
      } catch (error) {
        if (client.BlobPreconditionFailedError && error instanceof client.BlobPreconditionFailedError) throw conflict();
        if (etag === EMPTY_ETAG && (await shortlist()).etag !== EMPTY_ETAG) throw conflict();
        throw error;
      }
    },
  };
}
module.exports = { createStore, ID };
