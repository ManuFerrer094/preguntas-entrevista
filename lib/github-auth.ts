import type { GitHubUser } from './interfaces/github-auth.interfaces.js';

export type { GitHubUser };

export function getClientId(): string {
  return process.env['GITHUB_CLIENT_ID'] || '';
}

export async function exchangeCodeForUser(code: string): Promise<GitHubUser> {
  const clientId = process.env['GITHUB_CLIENT_ID'] || '';
  const clientSecret = process.env['GITHUB_CLIENT_SECRET'] || '';

  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth no está configurado. Configura GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET.');
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    throw new Error(tokenData.error_description || 'Error al intercambiar el código de autorización.');
  }

  const accessToken = tokenData.access_token as string;

  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!userRes.ok) {
    throw new Error('No se pudo obtener el perfil de GitHub.');
  }

  const user = await userRes.json();

  return {
    token: accessToken,
    username: user.login,
    name: user.name || user.login,
    avatarUrl: user.avatar_url,
  };
}
