import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';

describe('AppModule (smoke)', () => {
  beforeAll(() => {
    process.env.PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY ?? 'test-paymongo-sk';
    process.env.PAYMONGO_WEBHOOK_SECRET =
      process.env.PAYMONGO_WEBHOOK_SECRET ?? 'test-paymongo-wh';
    process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? 'test-stripe-sk';
    process.env.STRIPE_WEBHOOK_SECRET =
      process.env.STRIPE_WEBHOOK_SECRET ?? 'test-stripe-wh';
    process.env.XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY ?? 'test-xendit-sk';
    process.env.XENDIT_CALLBACK_TOKEN =
      process.env.XENDIT_CALLBACK_TOKEN ?? 'test-xendit-cb';
  });

  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(module).toBeDefined();
  });
});
