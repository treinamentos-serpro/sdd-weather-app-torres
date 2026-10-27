import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EmptyState from '../../../src/components/states/EmptyState';
import ErrorState from '../../../src/components/states/ErrorState';
import LoadingState from '../../../src/components/states/LoadingState';

describe('Estados de UI', () => {
  it('anuncia carregamento por status', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando previsão');
  });
  it('mostra erro e permite retry por teclado', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Falha de teste" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falha de teste');
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onRetry).toHaveBeenCalledOnce();
  });
  it('mostra título e dica no estado vazio', () => {
    render(<EmptyState title="Sem dados" hint="Tente outra cidade." />);
    expect(screen.getByRole('heading', { name: 'Sem dados' })).toBeInTheDocument();
    expect(screen.getByText('Tente outra cidade.')).toBeInTheDocument();
  });
});
