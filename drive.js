/* Integração Google Drive API v3 via Google Identity Services (OAuth no navegador). */
(() => {
  const SCOPE = 'https://www.googleapis.com/auth/drive.file';
  const BACKUP_PREFIX = 'CD-Controle-de-Diarias-backup-';
  let clientId = window.APP_CONFIG?.GOOGLE_CLIENT_ID || localStorage.getItem('CD_GOOGLE_CLIENT_ID') || '';
  let tokenClient = null;
  let accessToken = null;
  let tokenExpiresAt = 0;

  function configure(id) {
    if (id) clientId = id.trim();
    if (!clientId) throw new Error('OAuth Client ID não configurado.');
    if (!window.google?.accounts?.oauth2) throw new Error('Biblioteca de login do Google ainda não carregou. Atualize a página e tente novamente.');
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: () => {}
    });
  }

  function isConnected() { return Boolean(accessToken && Date.now() < tokenExpiresAt - 30000); }

  function connect() {
    return new Promise((resolve, reject) => {
      try {
        configure(clientId);
        tokenClient.callback = response => {
          if (response.error) { accessToken = null; reject(new Error(response.error_description || response.error)); return; }
          accessToken = response.access_token;
          tokenExpiresAt = Date.now() + Number(response.expires_in || 3600) * 1000;
          resolve(response);
        };
        tokenClient.requestAccessToken({ prompt: '' });
      } catch (error) { reject(error); }
    });
  }

  function disconnect() {
    if (accessToken && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(accessToken, () => {});
    accessToken = null; tokenExpiresAt = 0;
  }

  async function api(url, options = {}) {
    if (!isConnected()) throw new Error('Sua autorização expirou. Conecte o Gmail novamente.');
    const response = await fetch(url, { ...options, headers: { Authorization: `Bearer ${accessToken}`, ...(options.headers || {}) } });
    if (!response.ok) {
      let detail = ''; try { detail = (await response.json()).error?.message || ''; } catch (_) {}
      if (response.status === 401) { accessToken = null; tokenExpiresAt = 0; }
      throw new Error(detail || `Google Drive respondeu com erro ${response.status}.`);
    }
    return response;
  }

  async function uploadBackup(payload) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = `${BACKUP_PREFIX}${stamp}.json`;
    const boundary = 'cd_backup_boundary_2026';
    const metadata = { name, mimeType: 'application/json', description: 'Backup do aplicativo CD - Controle de Diárias' };
    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(payload)}\r\n--${boundary}--`;
    const response = await api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime', {
      method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body
    });
    return response.json();
  }

  async function listBackups() {
    const q = `name contains '${BACKUP_PREFIX}' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?spaces=drive&pageSize=100&orderBy=createdTime%20desc&q=${encodeURIComponent(q)}&fields=files(id,name,createdTime,modifiedTime,size)`;
    const response = await api(url);
    const data = await response.json();
    return data.files || [];
  }

  async function downloadBackup(fileId) {
    const response = await api(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`);
    return response.json();
  }

  window.CDDrive = { configure, connect, disconnect, isConnected, uploadBackup, listBackups, downloadBackup };
})();
