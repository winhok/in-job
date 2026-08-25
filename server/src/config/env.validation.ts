const requireKeys = (
  config: Record<string, unknown>,
  keys: string[],
  context: string,
): void => {
  const missing = keys.filter((key) => !hasConfigValue(config[key]));
  if (missing.length > 0) {
    throw new Error(`${context}配置不完整，缺少: ${missing.join(', ')}`);
  }
};

const hasConfigValue = (value: unknown): boolean =>
  typeof value === 'string' ? value.trim().length > 0 : value !== undefined;

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  if (config.NODE_ENV === 'production') {
    requireKeys(
      config,
      ['MONGODB_URI', 'JWT_SECRET', 'CORS_ORIGINS'],
      '生产基础',
    );
    const provider =
      typeof config.AI_PROVIDER === 'string' ? config.AI_PROVIDER : 'deepseek';
    if (provider === 'deepseek') {
      requireKeys(config, ['DEEPSEEK_API_KEY'], 'DeepSeek');
    } else if (provider === 'openai') {
      requireKeys(config, ['OPENAI_API_KEY'], 'OpenAI');
    } else {
      throw new Error(`不支持的 AI_PROVIDER: ${provider}`);
    }
    if (
      typeof config.JWT_SECRET !== 'string' ||
      config.JWT_SECRET.length < 32
    ) {
      throw new Error('生产 JWT_SECRET 长度必须至少为 32 个字符');
    }
    if (config.RAG_ENABLED !== 'false') {
      requireKeys(config, ['QDRANT_URL'], '向量 RAG');
      if (
        !hasConfigValue(config.EMBEDDING_API_KEY) &&
        !hasConfigValue(config.OPENAI_API_KEY)
      ) {
        throw new Error(
          '向量 RAG 配置不完整，缺少 EMBEDDING_API_KEY 或 OPENAI_API_KEY',
        );
      }
    }
  }

  const optionalGroups: Array<[string, string[]]> = [
    [
      '支付宝',
      [
        'ALIPAY_APP_ID',
        'ALIPAY_PRIVATE_KEY',
        'ALIPAY_PUBLIC_KEY',
        'ALIPAY_NOTIFY_URL',
      ],
    ],
    [
      '微信支付',
      [
        'WECHAT_PAY_APP_ID',
        'WECHAT_PAY_MCH_ID',
        'WECHAT_PAY_MCH_SERIAL',
        'WECHAT_PAY_PRIVATE_KEY',
        'WECHAT_PAY_PLATFORM_PUBLIC_KEY',
        'WECHAT_PAY_API_V3_KEY',
        'WECHAT_PAY_NOTIFY_URL',
      ],
    ],
    [
      'OSS STS',
      [
        'ALIYUN_ACCESS_KEY_ID',
        'ALIYUN_ACCESS_KEY_SECRET',
        'ALIYUN_STS_ROLE_ARN',
        'ALIYUN_OSS_BUCKET',
        'ALIYUN_OSS_REGION',
      ],
    ],
    [
      '钉钉告警',
      ['ALERT_RELAY_TOKEN', 'DINGTALK_WEBHOOK_URL', 'DINGTALK_SECRET'],
    ],
  ];
  for (const [context, keys] of optionalGroups) {
    if (keys.some((key) => hasConfigValue(config[key]))) {
      requireKeys(config, keys, context);
    }
  }
  return config;
}
