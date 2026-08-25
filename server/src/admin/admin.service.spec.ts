import { describe, expect, it, vi } from 'vitest';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  it('只统计正在进行的模拟面试', async () => {
    const model = { countDocuments: vi.fn().mockResolvedValue(3) };
    const service = new AdminService(model as never);

    await expect(service.getActiveInterviewCount()).resolves.toEqual({
      count: 3,
    });
    expect(model.countDocuments).toHaveBeenCalledWith({
      status: 'in_progress',
    });
  });
});
