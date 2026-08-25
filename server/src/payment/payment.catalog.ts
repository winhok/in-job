export interface PaymentPlan {
  id: string;
  name: string;
  priceFen: number;
  wwCoins: number;
  resumeCount: number;
  specialCount: number;
  behaviorCount: number;
}

export const PAYMENT_PLANS: Readonly<Record<string, PaymentPlan>> =
  Object.freeze({
    single: {
      id: 'single',
      name: '单次包',
      priceFen: 1880,
      wwCoins: 0,
      resumeCount: 0,
      specialCount: 1,
      behaviorCount: 0,
    },
    pro: {
      id: 'pro',
      name: '突击包',
      priceFen: 2880,
      wwCoins: 0,
      resumeCount: 1,
      specialCount: 1,
      behaviorCount: 1,
    },
    max: {
      id: 'max',
      name: '冲刺包',
      priceFen: 6880,
      wwCoins: 0,
      resumeCount: 3,
      specialCount: 3,
      behaviorCount: 3,
    },
    ultra: {
      id: 'ultra',
      name: '上岸包',
      priceFen: 12880,
      wwCoins: 0,
      resumeCount: 6,
      specialCount: 16,
      behaviorCount: 8,
    },
  });
