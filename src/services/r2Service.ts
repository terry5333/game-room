// Cloudflare R2 S3 API Service for User Avatars & Game Assets

export const R2_CONFIG = {
  accountId: 'd558bc3668f47cffacc35174026763ea',
  endpoint: 'https://d558bc3668f47cffacc35174026763ea.r2.cloudflarestorage.com',
  host: 'd558bc3668f47cffacc35174026763ea.r2.cloudflarestorage.com',
  bucket: 'rpg',
  accessKeyId: 'f6167ea2f77535b1274bae3145fb6eca',
  secretAccessKey: 'ba9e90aae22991dcc1a4cf3e7cd15866fbc12e92d8ae28d7a0edb6b860479a10',
  region: 'auto',
  service: 's3'
};

class R2Service {
  private textEncoder = new TextEncoder();

  // Helper for Web Crypto HMAC-SHA256
  private async hmacSha256(key: Uint8Array | string, data: Uint8Array | string): Promise<Uint8Array> {
    const rawKey = typeof key === 'string' ? this.textEncoder.encode(key) : key;
    const rawData = typeof data === 'string' ? this.textEncoder.encode(data) : data;

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      rawKey as any,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, rawData as any);
    return new Uint8Array(signature);
  }

  // Helper for Web Crypto SHA-256 Hex
  private async sha256Hex(data: ArrayBuffer | Uint8Array | string): Promise<string> {
    const rawData =
      typeof data === 'string'
        ? this.textEncoder.encode(data)
        : data instanceof Uint8Array
        ? data
        : new Uint8Array(data);

    const hash = await crypto.subtle.digest('SHA-256', rawData as any);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Helper to convert Uint8Array to hex string
  private toHex(buf: Uint8Array): string {
    return Array.from(buf)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Generate 7-day AWS SigV4 Presigned GET URL for an R2 key
  public async getPresignedUrl(
    key: string,
    bucket: string = R2_CONFIG.bucket,
    expiresIn: number = 604800 // 7 days (maximum allowed by S3 SigV4)
  ): Promise<string> {
    const cleanKey = key.replace(/^\/+/, '');
    const now = new Date();
    const amzdate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const datestamp = amzdate.slice(0, 8);
    const credentialScope = `${datestamp}/${R2_CONFIG.region}/${R2_CONFIG.service}/aws4_request`;
    const canonicalUri = `/${bucket}/${cleanKey}`;

    const queryParams: Record<string, string> = {
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${R2_CONFIG.accessKeyId}/${credentialScope}`,
      'X-Amz-Date': amzdate,
      'X-Amz-Expires': String(expiresIn),
      'X-Amz-SignedHeaders': 'host'
    };

    const sortedQuery = Object.keys(queryParams)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
      .join('&');

    const canonicalHeaders = `host:${R2_CONFIG.host}\n`;
    const signedHeaders = 'host';
    const canonicalRequest = `GET\n${canonicalUri}\n${sortedQuery}\n${canonicalHeaders}\n${signedHeaders}\nUNSIGNED-PAYLOAD`;

    const hashedCanonicalReq = await this.sha256Hex(canonicalRequest);
    const stringToSign = `AWS4-HMAC-SHA256\n${amzdate}\n${credentialScope}\n${hashedCanonicalReq}`;

    const kDate = await this.hmacSha256('AWS4' + R2_CONFIG.secretAccessKey, datestamp);
    const kRegion = await this.hmacSha256(kDate, R2_CONFIG.region);
    const kService = await this.hmacSha256(kRegion, R2_CONFIG.service);
    const kSigning = await this.hmacSha256(kService, 'aws4_request');
    const signature = this.toHex(await this.hmacSha256(kSigning, stringToSign));

    return `${R2_CONFIG.endpoint}${canonicalUri}?${sortedQuery}&X-Amz-Signature=${signature}`;
  }

  // Upload an avatar file to Cloudflare R2 bucket and return a permanent presigned URL
  public async uploadAvatar(file: File | Blob, uid: string): Promise<string> {
    const ext = file.type ? file.type.split('/')[1] || 'png' : 'png';
    const key = `avatars/${uid}_${Date.now()}.${ext}`;
    const contentType = file.type || 'image/png';
    const arrayBuffer = await file.arrayBuffer();

    const now = new Date();
    const amzdate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const datestamp = amzdate.slice(0, 8);
    const credentialScope = `${datestamp}/${R2_CONFIG.region}/${R2_CONFIG.service}/aws4_request`;
    const canonicalUri = `/${R2_CONFIG.bucket}/${key}`;

    const payloadHash = await this.sha256Hex(arrayBuffer);
    const headers: Record<string, string> = {
      'content-type': contentType,
      host: R2_CONFIG.host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzdate
    };

    const sortedKeys = Object.keys(headers).sort();
    const canonicalHeaders = sortedKeys.map((k) => `${k}:${headers[k]}\n`).join('');
    const signedHeaders = sortedKeys.join(';');
    const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    const hashedCanonicalReq = await this.sha256Hex(canonicalRequest);
    const stringToSign = `AWS4-HMAC-SHA256\n${amzdate}\n${credentialScope}\n${hashedCanonicalReq}`;

    const kDate = await this.hmacSha256('AWS4' + R2_CONFIG.secretAccessKey, datestamp);
    const kRegion = await this.hmacSha256(kDate, R2_CONFIG.region);
    const kService = await this.hmacSha256(kRegion, R2_CONFIG.service);
    const kSigning = await this.hmacSha256(kService, 'aws4_request');
    const signature = this.toHex(await this.hmacSha256(kSigning, stringToSign));

    const authHeader = `AWS4-HMAC-SHA256 Credential=${R2_CONFIG.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(`${R2_CONFIG.endpoint}${canonicalUri}`, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'x-amz-date': amzdate,
        'x-amz-content-sha256': payloadHash,
        Authorization: authHeader
      },
      body: arrayBuffer
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[R2 Upload Failed]', response.status, errText);
      throw new Error(`R2 上傳失敗 (${response.status}): ${errText}`);
    }

    // Return 7-day presigned URL
    return this.getPresignedUrl(key, R2_CONFIG.bucket, 604800);
  }

  // Ensures an avatar URL is signed if it's an R2 reference
  public async ensureSignedAvatarUrl(photoURL: string): Promise<string> {
    if (!photoURL) return '';
    if (photoURL.startsWith('data:') || photoURL.includes('googleusercontent.com') || photoURL.includes('dicebear.com') || photoURL.includes('unsplash.com')) {
      return photoURL;
    }

    // If it's an R2 URL or key
    if (photoURL.includes(R2_CONFIG.host)) {
      try {
        const urlObj = new URL(photoURL);
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        // /rpg/avatars/... -> bucket is pathSegments[0], key is remaining
        if (pathSegments.length >= 2) {
          const bucket = pathSegments[0];
          const key = pathSegments.slice(1).join('/');
          return this.getPresignedUrl(key, bucket);
        }
      } catch {}
    } else if (photoURL.startsWith('avatars/')) {
      return this.getPresignedUrl(photoURL, R2_CONFIG.bucket);
    }

    return photoURL;
  }
}

export const r2Service = new R2Service();
