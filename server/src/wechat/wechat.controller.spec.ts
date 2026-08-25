import { describe, expect, it, vi } from 'vitest';
import { WechatController } from './wechat.controller';

describe('WechatController menu management', () => {
  function createController() {
    const wechatService = {
      createMenu: vi.fn().mockResolvedValue({ errcode: 0, errmsg: 'ok' }),
      deleteMenu: vi.fn().mockResolvedValue({ errcode: 0, errmsg: 'ok' }),
      getMenu: vi.fn().mockResolvedValue({ menu: { button: [] } }),
    };
    return {
      controller: new WechatController(wechatService as never),
      wechatService,
    };
  }

  it('创建、删除和查询菜单都返回统一成功响应', async () => {
    const { controller, wechatService } = createController();

    await expect(controller.createMenu()).resolves.toMatchObject({
      code: 200,
      message: '创建菜单成功',
    });
    await expect(controller.deleteMenu()).resolves.toMatchObject({
      code: 200,
      message: '删除菜单成功',
    });
    await expect(controller.getMenu()).resolves.toMatchObject({
      code: 200,
      message: '获取菜单成功',
    });
    expect(wechatService.createMenu).toHaveBeenCalledOnce();
    expect(wechatService.deleteMenu).toHaveBeenCalledOnce();
    expect(wechatService.getMenu).toHaveBeenCalledOnce();
  });
});
