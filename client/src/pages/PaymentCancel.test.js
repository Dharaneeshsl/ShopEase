import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PaymentCancel from './PaymentCancel';
import api from '../services/api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: { put: jest.fn() },
}));

const renderAt = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <PaymentCancel />
    </MemoryRouter>
  );

describe('PaymentCancel', () => {
  beforeEach(() => {
    api.put.mockReset();
  });

  test('releases the reservation by cancelling the unpaid order once', async () => {
    api.put.mockResolvedValue({ data: { success: true } });
    renderAt('/payment/cancel?gateway=stripe&orderId=ord-123');

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith('/orders/ord-123/cancel', {
        reason: 'Payment cancelled at the gateway',
        ifUnpaid: true,
      })
    );
    expect(api.put).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/released back to stock/i)).toBeInTheDocument();
  });

  test('does nothing when no order id is present', async () => {
    renderAt('/payment/cancel');
    await waitFor(() => screen.getByText(/payment cancelled/i));
    expect(api.put).not.toHaveBeenCalled();
  });

  test('shows a fallback note when the order cannot be auto-cancelled', async () => {
    api.put.mockRejectedValue(new Error('already cancelled'));
    renderAt('/payment/cancel?orderId=ord-456');

    expect(await screen.findByText(/could not auto-cancel/i)).toBeInTheDocument();
  });
});
