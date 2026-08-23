import type { WechatMessage } from '../dto/wechat.dto';

function cdata(value: string): string {
  return value.replaceAll(']]>', ']]]]><![CDATA[>');
}

function requiredMessageValue(
  message: WechatMessage,
  key: 'ToUserName' | 'FromUserName',
): string {
  const value = message[key];
  if (!value) {
    throw new Error(`微信消息缺少 ${key}`);
  }
  return cdata(value);
}

export function buildTextReply(
  message: WechatMessage,
  content: string,
): string {
  return `
<xml>
  <ToUserName><![CDATA[${requiredMessageValue(message, 'FromUserName')}]]></ToUserName>
  <FromUserName><![CDATA[${requiredMessageValue(message, 'ToUserName')}]]></FromUserName>
  <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${cdata(content)}]]></Content>
</xml>`.trim();
}

export function buildImageReply(
  message: WechatMessage,
  mediaId: string,
): string {
  return `
<xml>
  <ToUserName><![CDATA[${requiredMessageValue(message, 'FromUserName')}]]></ToUserName>
  <FromUserName><![CDATA[${requiredMessageValue(message, 'ToUserName')}]]></FromUserName>
  <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
  <MsgType><![CDATA[image]]></MsgType>
  <Image>
    <MediaId><![CDATA[${cdata(mediaId)}]]></MediaId>
  </Image>
</xml>`.trim();
}
