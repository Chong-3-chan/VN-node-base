const fadeDelay = 1000;
// const pool = [];
let playCallback: (() => void)[] | void = [];
['click'].forEach((e) =>
  window.addEventListener(
    e,
    () => {
      playCallback!.forEach((cb) => cb());
      playCallback = void 0;
    },
    { once: true }
  )
);
export class Player {
  volume: number;
  audioRecord: Record<number, { volume: number; audio: HTMLAudioElement; animationFrame?: number }> = {};
  count: number = 0;
  fade: boolean = false;
  setVolume(volume: number) {
    this.volume = volume / 100;
    Object.entries(this.audioRecord).forEach(([key, value]) => {
      value.animationFrame === void 0 && (value.volume = this.volume);
      value.audio.volume = value.volume * this.volume;
    });
  }
  private allFadeOut(delay: number = fadeDelay) {
    Object.entries(this.audioRecord).forEach(([key, value]) => {
      const volumeDown = () => {
        const { animationFrame } = value;
        if (animationFrame !== void 0) {
          cancelAnimationFrame(animationFrame);
          value.animationFrame = void 0;
        }

        if ((value.volume -= 1 / ((60 * delay) / 1000)) <= 0) {
          value.volume = 0;
          value.animationFrame = requestAnimationFrame(() => {
            value.audio.onended = null;
            value.audio.removeAttribute('src');
            value.audio.load();
            delete this.audioRecord[key as any];
          });
        } else {
          value.animationFrame = requestAnimationFrame(volumeDown);
        }
        value.audio.volume = value.volume * this.volume;
      };

      if (value.animationFrame !== void 0) cancelAnimationFrame(value.animationFrame);
      value.animationFrame = requestAnimationFrame(volumeDown);
    });
  }
  play(src: string, loop?: boolean) {
    // if (!src) throw new Error(`play(): src为空`);
    if (!src) {
      this.allFadeOut();
      return;
    }
    const audio = new Audio(src);
    // pool.push(audio);

    const index = this.count++;
    if (this.fade) {
      this.allFadeOut();

      // fadeIn
      this.audioRecord[index] = { volume: 0, audio };
      audio.volume = 0;

      const volumeUp = () => {
        if ((this.audioRecord[index].volume += 1 / ((60 * fadeDelay) / 1000)) >= 1) {
          this.audioRecord[index].volume = 1;
          this.audioRecord[index].animationFrame = void 0;
        } else {
          const { animationFrame } = this.audioRecord[index];
          if (animationFrame !== void 0) cancelAnimationFrame(animationFrame);
          this.audioRecord[index].animationFrame = requestAnimationFrame(volumeUp);
        }
        audio.volume = this.audioRecord[index].volume * this.volume;
      };

      const fadeIn = () => {
        if (this.audioRecord[index] !== void 0) {
          this.audioRecord[index].animationFrame === void 0 && (this.audioRecord[index].animationFrame = requestAnimationFrame(volumeUp));
          audio.play().catch(() => playCallback!.push(() => audio.play()));
        }
      };
      Object.keys(this.audioRecord).length ? setTimeout(fadeIn, fadeDelay) : fadeIn();
    } else {
      this.allFadeOut(0);
      this.audioRecord[index] = { volume: 1, audio };
      audio.volume = this.audioRecord[index].volume * this.volume;
      audio.play().catch(() => playCallback!.push(() => audio.play()));
    }

    loop !== void 0 && (audio.loop = loop);
    audio.onended = () => {
      const { animationFrame } = this.audioRecord[index];
      if (animationFrame !== void 0) cancelAnimationFrame(animationFrame);
      audio.onended = null;
      audio.removeAttribute('src');
      audio.load();
      delete this.audioRecord[index];
    };
  }
  stop(force?: boolean) {
    this.allFadeOut(force ? 0 : void 0);
  }
  constructor(volume: number, fade?: boolean) {
    this.volume = volume / 100;
    fade && (this.fade = true);
  }
}
export function play(src: string, volume: number) {
  if (!src) throw new Error(`play(): src为空`);
  const audio = new Audio(src);
  // pool.push(audio);

  audio.volume = volume / 100;
  audio.play();
}
