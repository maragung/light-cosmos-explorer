import { bech32 } from 'bech32';

/**
 * Mendekode string Base64 menjadi string teks biasa.
 * Digunakan untuk melihat data mentah transaksi.
 */
export const decodeBase64 = (base64) => {
    if (!base64) return 'N/A';
    try {
        // Menggunakan window.atob jika di browser, atau Buffer jika di node/ssr
        const binaryString = typeof window !== 'undefined' 
            ? window.atob(base64) 
            : Buffer.from(base64, 'base64').toString('binary');
        
        return binaryString;
    } catch (e) {
        console.error('Base64 decode error:', e);
        return base64.substring(0, 15) + '...';
    }
};

/**
 * Memformat voting power atau jumlah token (n_token / 10^decimals)
 */
export const convertRawVotingPower = (tokens, decimals = 18) => {
    if (!tokens) return '0';
    try {
        const val = parseFloat(tokens);
        const divisor = Math.pow(10, decimals);
        return (val / divisor).toLocaleString(undefined, { 
            maximumFractionDigits: 2,
            minimumFractionDigits: 0
        });
    } catch (e) {
        return '0';
    }
};

/**
 * Fungsi fetch dengan mekanisme retry
 */
export const fetchWithRetry = async (url, retries = 3, timeout = 10000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(id);
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (err) {
            if (i === retries - 1) throw err;
            // Exponential backoff
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
};

/**
 * Konversi Address Bech32 (Contoh: wardenvaloper -> warden)
 */
export const convertBech32Address = (address, targetPrefix) => {
    if (!address) return 'N/A';
    try {
        const decoded = bech32.decode(address);
        return bech32.encode(targetPrefix, decoded.words);
    } catch (error) {
        return address;
    }
};