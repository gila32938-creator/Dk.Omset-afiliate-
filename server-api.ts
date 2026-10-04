import { GoogleGenAI, Type } from '@google/genai';

export interface AffiliateAccountItem {
  accountId: string;
  accountName: string;
  active: boolean;
}

export interface ParseRequestPayload {
  prompt: string;
  accounts: AffiliateAccountItem[];
  currentDate: string; // e.g. "2026-10-01"
  currentDayName?: string; // e.g. "Kamis"
}

export interface ParseResult {
  action: 'RECORD_INCOME' | 'CORRECT_INCOME' | 'ADD_INCOME' | 'QUERY_REKAP' | 'PROMPT_REKAP_OPTIONS' | 'UNKNOWN';
  targetDate?: string; // YYYY-MM-DD
  items?: {
    accountId: string;
    accountName: string;
    amount: number;
    mode: 'set' | 'add';
  }[];
  queryType?: 'daily' | 'weekly' | 'monthly' | 'all_time' | 'account_specific';
  queryPeriod?: {
    month?: string; // e.g. "2026-09"
    week?: string;
    targetAccountName?: string;
  };
  explanation: string;
  confidence: number;
}

export async function parseAffiliateCommand(payload: ParseRequestPayload): Promise<ParseResult> {
  const { prompt, accounts, currentDate } = payload;
  const trimmed = (prompt || '').trim();

  // Rule 32: If user only says "Rekap" or "rekap", do not guess.
  if (/^rekap\b/i.test(trimmed) && trimmed.toLowerCase().split(/\s+/).length <= 1) {
    return {
      action: 'PROMPT_REKAP_OPTIONS',
      explanation: 'Silakan pilih jenis laporan yang ingin ditampilkan:',
      confidence: 1.0,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `
Anda adalah asisten AI keuangan profesional untuk DK AFFILIATE MANAGER PRO, aplikasi pencatat penghasilan kotor TikTok Affiliate.
Tugas Anda adalah memahami perintah bahasa Indonesia pengguna dan mengekstrak data terstruktur untuk database.

Daftar Akun Affiliate milik pengguna saat ini:
${JSON.stringify(accounts, null, 2)}

Tanggal hari ini (Sistem Aktual): ${currentDate}

ATURAN PENTING:
1. Konversi nominal:
   - "ribu" / "rb" / "k" = dikalikan 1.000 (contoh: "50 ribu" -> 50000, "75k" -> 75000)
   - "juta" / "jt" = dikalikan 1.000.000 (contoh: "1.5 juta" -> 1500000, "2jt" -> 2000000)
   - "ratus ribu" = dikalikan 100.000 (contoh: "2 ratus ribu" -> 200000)
   - angka murni seperti "50000" -> 50000
2. Penentuan Akun:
   - Cocokkan nama atau singkatan dengan daftar akun pengguna (misal: "DK" -> "DK Grosir", "Velora" -> "Velorawear", "Nana" -> "Nana Cantika", "Virion" -> "Viriondfinds").
   - Jika akun tidak ditemukan di daftar, carikan yang paling mendekati atau abaikan.
   - Aturan kolom kosong: Jika user mencatat beberapa akun tapi tidak menyebut akun lain, akun yang tidak disebutkan TIDAK perlu dimasukkan atau bernilai 0.
3. Aksi:
   - "RECORD_INCOME": Mencatat pendapatan baru pada tanggal tertentu (default: hari ini ${currentDate}). Mode = 'set'.
   - "CORRECT_INCOME": Mengoreksi/mengubah pendapatan akun (misal: "Koreksi DK hari ini jadi 75 ribu", "Ubah Velora tanggal 1 Oktober jadi 50 ribu"). Mode = 'set'.
   - "ADD_INCOME": Menambahkan nilai ke pendapatan yang sudah ada (misal: "Tambahkan 10 ribu ke Nana hari ini"). Mode = 'add'.
   - "QUERY_REKAP": Pengguna meminta data rekap (misal: "Rekap hari ini", "Rekap minggu ini", "Rekap minggu lalu", "Rekap bulan ini", "Rekap September 2026", "Berapa total semua akun?", "Berapa total DK bulan ini?", "Berapa penghasilan saya sejak awal?").
   - "PROMPT_REKAP_OPTIONS": Pengguna hanya mengetik "Rekap" tanpa periode.
4. Tanggal:
   - "hari ini" -> ${currentDate}
   - "kemarin" -> tanggal kemarin relatif terhadap ${currentDate}
   - jika tanggal disebutkan spesifik (misal "1 Oktober 2026" atau "tanggal 28 September"), konversikan ke format YYYY-MM-DD dengan tahun yang relevan.
5. Nominal tidak boleh mengarang. Hanya gunakan data dari perintah pengguna.
6. Berikan penjelasan singkat, ramah, dan profesional dalam Bahasa Indonesia.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: {
                type: Type.STRING,
                description: 'RECORD_INCOME, CORRECT_INCOME, ADD_INCOME, QUERY_REKAP, PROMPT_REKAP_OPTIONS, atau UNKNOWN',
              },
              targetDate: {
                type: Type.STRING,
                description: 'Format YYYY-MM-DD tanggal transaksi',
              },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    accountId: { type: Type.STRING },
                    accountName: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    mode: { type: Type.STRING, description: "'set' atau 'add'" },
                  },
                  required: ['accountName', 'amount'],
                },
              },
              queryType: {
                type: Type.STRING,
                description: "'daily', 'weekly', 'monthly', 'all_time', 'account_specific'",
              },
              queryPeriod: {
                type: Type.OBJECT,
                properties: {
                  month: { type: Type.STRING },
                  week: { type: Type.STRING },
                  targetAccountName: { type: Type.STRING },
                },
              },
              explanation: {
                type: Type.STRING,
                description: 'Penjelasan dalam Bahasa Indonesia yang menjelaskan aksi yang dilakukan',
              },
              confidence: { type: Type.NUMBER },
            },
            required: ['action', 'explanation'],
          },
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as ParseResult;
        // Map accountIds if missing or unmatched
        if (parsed.items) {
          parsed.items = parsed.items.map(item => {
            const matched = accounts.find(
              a => a.accountName.toLowerCase().includes(item.accountName.toLowerCase()) ||
                   item.accountName.toLowerCase().includes(a.accountName.toLowerCase())
            );
            return {
              ...item,
              accountId: matched ? matched.accountId : (item.accountId || ''),
              accountName: matched ? matched.accountName : item.accountName,
              mode: (item.mode as 'set' | 'add') || (parsed.action === 'ADD_INCOME' ? 'add' : 'set'),
            };
          });
        }
        return parsed;
      }
    } catch (err) {
      console.error('Gemini API parse failed, falling back to local heuristic parser:', err);
    }
  }

  // Fallback heuristic parser for offline/resilience
  return localFallbackParser(prompt, accounts, currentDate);
}

function localFallbackParser(
  prompt: string,
  accounts: AffiliateAccountItem[],
  currentDate: string
): ParseResult {
  const p = prompt.toLowerCase();

  if (/^rekap\s*$/i.test(p)) {
    return {
      action: 'PROMPT_REKAP_OPTIONS',
      explanation: 'Silakan pilih jenis laporan: Harian, Mingguan, atau Bulanan.',
      confidence: 1.0,
    };
  }

  if (p.includes('rekap hari ini') || p.includes('hari ini') && p.includes('berapa')) {
    return {
      action: 'QUERY_REKAP',
      queryType: 'daily',
      targetDate: currentDate,
      explanation: 'Menampilkan rekap penghasilan hari ini.',
      confidence: 0.9,
    };
  }

  if (p.includes('rekap minggu ini') || p.includes('minggu ini')) {
    return {
      action: 'QUERY_REKAP',
      queryType: 'weekly',
      explanation: 'Menampilkan rekap penghasilan minggu ini.',
      confidence: 0.9,
    };
  }

  if (p.includes('rekap minggu lalu')) {
    return {
      action: 'QUERY_REKAP',
      queryType: 'weekly',
      queryPeriod: { week: 'last' },
      explanation: 'Menampilkan rekap penghasilan minggu lalu.',
      confidence: 0.9,
    };
  }

  if (p.includes('rekap bulan ini') || p.includes('bulan ini')) {
    return {
      action: 'QUERY_REKAP',
      queryType: 'monthly',
      explanation: 'Menampilkan rekap penghasilan bulan ini.',
      confidence: 0.9,
    };
  }

  if (p.includes('sejak awal') || p.includes('total semua akun')) {
    return {
      action: 'QUERY_REKAP',
      queryType: 'all_time',
      explanation: 'Menampilkan total penghasilan keseluruhan akun sejak awal.',
      confidence: 0.9,
    };
  }

  const isCorrection = p.includes('koreksi') || p.includes('ubah') || p.includes('ganti');
  const isAddition = p.includes('tambahkan') || p.includes('tambah');

  const items: ParseResult['items'] = [];

  for (const acc of accounts) {
    const nameLower = acc.accountName.toLowerCase();
    const shortNames = [nameLower, nameLower.split(' ')[0]];
    for (const s of shortNames) {
      if (s.length >= 2 && p.includes(s)) {
        // extract nominal after or before name
        const match = p.match(new RegExp(`${s}[^0-9]*([0-9]+[.,]?[0-9]*)\\s*(ribu|rb|k|juta|jt)?`, 'i')) ||
                      p.match(new RegExp(`([0-9]+[.,]?[0-9]*)\\s*(ribu|rb|k|juta|jt)?[^a-z0-9]*${s}`, 'i'));
        if (match) {
          let num = parseFloat(match[1].replace(',', '.'));
          const unit = (match[2] || '').toLowerCase();
          if (unit === 'juta' || unit === 'jt') {
            num *= 1000000;
          } else {
            num *= 1000;
          }
          items.push({
            accountId: acc.accountId,
            accountName: acc.accountName,
            amount: Math.round(num),
            mode: isAddition ? 'add' : 'set',
          });
          break;
        }
      }
    }
  }

  if (items.length > 0) {
    return {
      action: isCorrection ? 'CORRECT_INCOME' : isAddition ? 'ADD_INCOME' : 'RECORD_INCOME',
      targetDate: currentDate,
      items,
      explanation: `Berhasil memahami ${items.length} akun penghasilan untuk tanggal ${currentDate}.`,
      confidence: 0.85,
    };
  }

  return {
    action: 'UNKNOWN',
    explanation: 'Perintah belum dapat dipahami. Coba contoh: "Catat hari ini DK 50 ribu, Velora 30 ribu" atau "Rekap hari ini".',
    confidence: 0.3,
  };
}
