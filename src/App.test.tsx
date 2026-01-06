import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { vi, describe, it, expect } from 'vitest';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn> };

describe('App Component', () => {
    
    it('powinien wyświetlić tytuł aplikacji po załadowaniu danych', async () => {
        const fakeEnergyData = [
            {
                date: '2025-01-01',
                metrics: { solar: 50, wind: 50 },
                clean_energy_percent: 100
            }
        ];

        const fakeOptimalData = {
            start: '2025-01-01T12:00:00Z',
            end: '2025-01-01T15:00:00Z',
            average: 85
        };

        mockedAxios.get.mockImplementation((url) => {
            if (url.includes('/energy')) {
                return Promise.resolve({ data: fakeEnergyData });
            }
            if (url.includes('/optimal-charging')) {
                return Promise.resolve({ data: fakeOptimalData });
            }
            return Promise.resolve({ data: {} });
        });

        render(<App />);

        expect(screen.getByText(/Ładowanie danych/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/UK Clean Energy Tracker/i)).toBeInTheDocument();
        });
    });
});