import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VehicleForm } from './VehicleForm';

afterEach(cleanup);

describe('CRLV review form', () => {
  it('submits extracted numeric values only after explicit confirmation', async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<VehicleForm onSubmit={submit} busy={false} error={null} initialValues={{
      placa: 'DQA1A23', marca: 'Toyota', modelo: 'Corolla', ano: 2023,
      chassi: '9BWZZZ377VT004251', anoFabricacao: 2022, cilindrada: 1800,
    }} />);
    expect(submit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Modelo'), { target: { value: 'Corolla revisado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar veículo' }));
    await waitFor(() => expect(submit).toHaveBeenCalled());
    expect(submit.mock.calls[0]?.[0]).toMatchObject({ modelo: 'Corolla revisado', ano: 2023, anoFabricacao: 2022, cilindrada: 1800 });
  });

  it('highlights missing required data and clears the highlight when it is filled', async () => {
    const submit = vi.fn();
    render(<VehicleForm onSubmit={submit} busy={false} error={null} missingFields={['placa']} />);
    expect(screen.getByLabelText('Placa')).toHaveAttribute('aria-invalid', 'true');
    fireEvent.change(screen.getByLabelText('Placa'), { target: { value: 'DQA1A23' } });
    expect(screen.getByLabelText('Placa')).not.toHaveAttribute('aria-invalid');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar veículo' }));
    await waitFor(() => expect(screen.getByLabelText('Marca')).toHaveAttribute('aria-invalid', 'true'));
    expect(submit).not.toHaveBeenCalled();
  });
});
