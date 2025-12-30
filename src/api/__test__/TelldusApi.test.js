import { describe, expect, it, vi } from 'vitest';
import TelldusApi from '../TelldusApi.js';

vi.mock('homebridge-lib/HttpClient', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => {
      return {
        apiClient: vi.fn().mockImplementation(() => {
          return {
            on: vi.fn(),
          };
        }),
        setAccessToken: vi.fn(),
        errorHandler: vi.fn(),
        requestHandler: vi.fn(),
        responseHandler: vi.fn(),
        lastError: vi.fn(),
        lastResponse: vi.fn(),
      };
    }),
  };
});
const host = '192.168.1.254';
const accessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImF1ZCI6ImhvbWVicmlkZ2UtdGVsbGR1cyIsImV4cCI6MTc3MTc5NTk1OH0.eyJyZW5ldyI6dHJ1ZSwidHRsIjozMTUzNjAwMH0._rrko5klp6pAsvEhOWQNw9hiNZVpBJbLpLS0I0bOAqQ';

describe('Test API functions', () => {
  it('gets device info', async () => {
    const httpClient = new TelldusApi(host, accessToken);

    const deviceInfo = await httpClient.getDeviceInfo();
    console.log('Device info:', deviceInfo);
    expect(deviceInfo.ok).toBeFalsy();
  });
});
