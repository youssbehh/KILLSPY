import axios, { AxiosAdapter, AxiosError, InternalAxiosRequestConfig } from 'axios';

const tokens = { token: 'old-access', refreshToken: 'old-refresh' as string | null };
jest.mock('../stores/authStore', () => ({
  getToken: async () => tokens.token,
  getRefreshToken: async () => tokens.refreshToken,
  saveTokens: async (next: { token: string; refreshToken: string }) => {
    tokens.token = next.token;
    tokens.refreshToken = next.refreshToken;
  },
}));

import { apiClient, refreshSession, setUnauthorizedHandler } from './client';

/** Fake server: 401 for an expired token, 200 for the fresh one. */
const seen: string[] = [];
const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  const auth = String(config.headers.Authorization ?? '');
  seen.push(auth);
  if (auth === 'Bearer new-access') {
    return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
  }
  const response = { data: { message: 'Session expirée.' }, status: 401, statusText: 'Unauthorized', headers: {}, config };
  throw new AxiosError('401', 'ERR_BAD_REQUEST', config, null, response);
};

const onUnauthorized = jest.fn(async () => undefined);
const refreshCall = jest.spyOn(axios, 'post');

beforeAll(() => {
  apiClient.defaults.adapter = adapter;
  setUnauthorizedHandler(onUnauthorized);
});

beforeEach(() => {
  tokens.token = 'old-access';
  tokens.refreshToken = 'old-refresh';
  seen.length = 0;
  onUnauthorized.mockClear();
  refreshCall.mockReset();
});

describe('renouvellement automatique de la session', () => {
  it('renouvelle le jeton expiré puis rejoue la requête', async () => {
    refreshCall.mockResolvedValue({ data: { token: 'new-access', refreshToken: 'new-refresh' } });

    const res = await apiClient.get('/users/me');

    expect(res.data).toEqual({ ok: true });
    expect(seen).toEqual(['Bearer old-access', 'Bearer new-access']);
    expect(refreshCall).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/refresh$/), { refreshToken: 'old-refresh' }, expect.anything());
    expect(tokens).toEqual({ token: 'new-access', refreshToken: 'new-refresh' });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("plusieurs requêtes en échec ne déclenchent qu'un seul renouvellement", async () => {
    refreshCall.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { token: 'new-access', refreshToken: 'r2' } }), 20)),
    );
    await Promise.all([apiClient.get('/a'), apiClient.get('/b'), apiClient.get('/c')]);
    expect(refreshCall).toHaveBeenCalledTimes(1);
  });

  it('ferme la session quand le serveur refuse le renouvellement', async () => {
    refreshCall.mockRejectedValue(new AxiosError('401', 'ERR_BAD_REQUEST', undefined, null, {
      data: {}, status: 401, statusText: 'Unauthorized', headers: {}, config: {} as InternalAxiosRequestConfig,
    }));
    await expect(apiClient.get('/users/me')).rejects.toBeTruthy();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('garde la session si le serveur est injoignable (réseau coupé)', async () => {
    refreshCall.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'));
    await expect(apiClient.get('/users/me')).rejects.toBeTruthy();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('sans jeton de renouvellement (ancienne session), la session se ferme', async () => {
    tokens.refreshToken = null;
    expect(await refreshSession()).toBe('rejected');
    await expect(apiClient.get('/users/me')).rejects.toBeTruthy();
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it("une erreur 401 du formulaire de connexion n'est pas une session expirée", async () => {
    await expect(apiClient.post('/auth/login', {})).rejects.toBeTruthy();
    expect(refreshCall).not.toHaveBeenCalled();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
