import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server';

describe('Miyanji API End-to-End Tests', () => {
  it('should return wallet balance', async () => {
    const res = await request(app).get('/api/wallet/balance');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('available_balance');
  });

  it('should create a new contract draft', async () => {
    const res = await request(app)
      .post('/api/contracts')
      .send({
        title: 'تست قرارداد هوشمند',
        amount: 500000,
        category: 'DEV',
        as_draft: true
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('تست قرارداد هوشمند');
    expect(res.body.status).toBe('draft');
  });
});
