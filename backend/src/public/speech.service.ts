import { Injectable, ServiceUnavailableException } from '@nestjs/common';

// Aisha AI (aisha.group) — o'zbek tilidagi TTS (klonlangan ovoz ham).
// Oqim: POST /tts/post/ (multipart) -> id -> GET /tts/status/{id}/ -> audio URL.
@Injectable()
export class SpeechService {
  private readonly key = process.env.AISHA_API_KEY;
  private readonly base = process.env.AISHA_BASE_URL ?? 'https://back.aisha.group';
  // Klonlangan ovoz id si (Space kabinetidan, "READY" bo'lganda). Bo'sh bo'lsa
  // tayyor "Gulnoza" modeli ishlatiladi.
  private readonly voiceId = process.env.AISHA_VOICE_ID?.trim();
  private readonly model = process.env.AISHA_MODEL ?? 'Gulnoza';
  private readonly mood = process.env.AISHA_MOOD ?? 'Neutral';
  private readonly speed = process.env.AISHA_SPEED ?? '1.0';
  private readonly language = process.env.AISHA_LANGUAGE ?? 'uz';

  get configured(): boolean {
    return !!this.key;
  }

  async synthesize(text: string): Promise<{ audio: Buffer; mime: string }> {
    if (!this.key) {
      throw new ServiceUnavailableException('Aisha API sozlanmagan');
    }

    // 1) TTS topshirig'ini yaratamiz (multipart/form-data)
    const form = new FormData();
    form.append('transcript', text);
    form.append('language', this.language);
    form.append('speed', this.speed);
    if (this.voiceId) {
      // Klonlangan (custom) ovoz
      form.append('voice_id', this.voiceId);
    } else {
      // Tayyor model (mood faqat Gulnoza uchun)
      form.append('model', this.model);
      form.append('mood', this.mood);
    }

    const created = await this.postForm('/api/v1/tts/post/', form);
    const id = created.id ?? created.data?.id ?? created.task_id;
    if (!id) {
      const direct = this.extractAudioUrl(created);
      if (direct) return this.fetchAudio(direct);
      throw new ServiceUnavailableException('Aisha TTS: id qaytmadi');
    }

    // 2) Tayyor bo'lguncha kutamiz (maks ~15s)
    for (let i = 0; i < 30; i++) {
      const status = await this.get(`/api/v1/tts/status/${id}/`);
      const url = this.extractAudioUrl(status);
      if (url) return this.fetchAudio(url);
      const state = String(status.status ?? '').toLowerCase();
      if (state === 'failed' || state === 'error') {
        throw new ServiceUnavailableException('Aisha TTS xatosi');
      }
      await sleep(500);
    }
    throw new ServiceUnavailableException('Aisha TTS: vaqt tugadi');
  }

  // Javobning turli mumkin bo'lgan maydonlaridan audio URL ni topadi
  private extractAudioUrl(obj: any): string | null {
    const data = obj?.data ?? obj;
    const candidate =
      data?.audio ??
      data?.audio_url ??
      data?.audio_path ??
      data?.url ??
      data?.result?.audio ??
      data?.file ??
      data?.path;
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate.startsWith('http')
        ? candidate
        : `${this.base}${candidate.startsWith('/') ? '' : '/'}${candidate}`;
    }
    return null;
  }

  private async fetchAudio(url: string): Promise<{ audio: Buffer; mime: string }> {
    const res = await fetch(url, {
      headers: { 'X-Api-Key': this.key as string },
    });
    if (!res.ok) {
      throw new ServiceUnavailableException(
        `Aisha audio yuklanmadi (${res.status})`,
      );
    }
    // Aisha .wav qaytaradi; CDN content-type ni bermaydi, shuning uchun
    // fayl kengaytmasidan aniqlaymiz
    const mime = url.toLowerCase().includes('.mp3')
      ? 'audio/mpeg'
      : 'audio/wav';
    return { audio: Buffer.from(await res.arrayBuffer()), mime };
  }

  private async postForm(path: string, form: FormData): Promise<any> {
    // Content-Type ni qo'lda qo'ymaymiz — fetch boundary bilan o'zi qo'yadi
    const res = await fetch(`${this.base}${path}`, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.key as string,
        'Accept-Language': this.language,
      },
      body: form,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new ServiceUnavailableException(
        `Aisha TTS so'rov xatosi (${res.status}) ${detail.slice(0, 200)}`,
      );
    }
    return res.json();
  }

  private async get(path: string): Promise<any> {
    const res = await fetch(`${this.base}${path}`, {
      headers: {
        'X-Api-Key': this.key as string,
        'Accept-Language': this.language,
      },
    });
    if (!res.ok) {
      throw new ServiceUnavailableException(
        `Aisha status xatosi (${res.status})`,
      );
    }
    return res.json();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
