import { describe, expect, it, vi } from 'vitest';
import { QdrantVectorStore } from './qdrant-vector-store.service';

describe('QdrantVectorStore', () => {
  it('查询必须携带 ownerId 过滤器', async () => {
    const client = {
      getCollections: vi.fn().mockResolvedValue({
        collections: [{ name: 'knowledge' }],
      }),
      getCollection: vi.fn().mockResolvedValue({
        config: { params: { vectors: { size: 2, distance: 'Cosine' } } },
      }),
      query: vi.fn().mockResolvedValue({ points: [] }),
    };
    const service = new QdrantVectorStore({
      get: vi.fn((key: string) =>
        key === 'QDRANT_COLLECTION' ? 'knowledge' : undefined,
      ),
    } as never);
    Object.defineProperty(service, 'client', { value: client });

    await service.search('owner-1', [0.1, 0.2], 4);

    expect(client.query).toHaveBeenCalledWith('knowledge', {
      query: [0.1, 0.2],
      filter: {
        must: [{ key: 'ownerId', match: { value: 'owner-1' } }],
      },
      limit: 4,
      with_payload: true,
      with_vector: false,
    });
  });

  it('拒绝复用维度不匹配的 collection', async () => {
    const client = {
      getCollections: vi.fn().mockResolvedValue({
        collections: [{ name: 'knowledge' }],
      }),
      getCollection: vi.fn().mockResolvedValue({
        config: { params: { vectors: { size: 1536, distance: 'Cosine' } } },
      }),
    };
    const service = new QdrantVectorStore({
      get: vi.fn((key: string) =>
        key === 'QDRANT_COLLECTION' ? 'knowledge' : undefined,
      ),
    } as never);
    Object.defineProperty(service, 'client', { value: client });

    await expect(service.search('owner-1', [0.1, 0.2], 4)).rejects.toThrow(
      '维度或距离配置不匹配',
    );
  });
});
