import { describe, expect, it } from 'vitest';
import { buildImageReply, buildTextReply } from './wechat';

describe('微信 XML 回复', () => {
  const message = {
    ToUserName: 'service-account',
    FromUserName: 'openid',
  };

  it('构造文本回复并安全拆分 CDATA 结束标记', () => {
    const xml = buildTextReply(message, 'hello ]]> world');

    expect(xml).toContain('<ToUserName><![CDATA[openid]]></ToUserName>');
    expect(xml).toContain('<FromUserName><![CDATA[service-account]]>');
    expect(xml).toContain('hello ]]]]><![CDATA[> world');
  });

  it('构造图片回复', () => {
    const xml = buildImageReply(message, 'media-id');

    expect(xml).toContain('<MsgType><![CDATA[image]]></MsgType>');
    expect(xml).toContain('<MediaId><![CDATA[media-id]]></MediaId>');
  });
});
