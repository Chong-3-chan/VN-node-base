export type options_FULL = {
  volume_all: number;
  volume_BGM: number;
  volume_voice: number;
  volume_effect: number;

  text_appearSpeed: number;
  text_autoPlaySpeed: number;
};
export type optionsGroupItemType = 'range' | 'switch' | 'option';
export type optionsGroupItem =
  | {
      ch: string;
      defaultValue: number;
      type: optionsGroupItemType & 'range';
      icon: string;

      // number
      max: number;
      min: number;
      step: number;
    }
  | {
      ch: string;
      defaultValue: string;
      type: optionsGroupItemType & 'option';
      icon: string;

      // option
      options?: [string, ch: string][];
    }
  | { ch: string; defaultValue: boolean; type: optionsGroupItemType & 'switch'; icon: string };
export type optionsGroup<T> = {
  [P in keyof T]?: optionsGroupItem;
};
export const optionsGroups: {
  ch: string;
  group: optionsGroup<options_FULL>;
}[] = [
  {
    ch: '声音设置',
    group: {
      volume_all: {
        ch: '全体音量',
        defaultValue: 6,
        type: 'range',
        icon: 'volume',
        max: 10,
        min: 0,
        step: 1,
      },
      volume_BGM: {
        ch: '背景音乐音量',
        defaultValue: 10,
        type: 'range',
        icon: 'volume',
        max: 10,
        min: 0,
        step: 1,
      },
      volume_voice: {
        ch: '语音音量',
        defaultValue: 10,
        type: 'range',
        icon: 'volume',
        max: 10,
        min: 0,
        step: 1,
      },
      volume_effect: {
        ch: '音效音量',
        defaultValue: 2,
        type: 'range',
        icon: 'volume',
        max: 10,
        min: 0,
        step: 1,
      },
    },
  },
  {
    ch: '文本设置',
    group: {
      text_appearSpeed: {
        ch: '文字出现速度',
        defaultValue: 1,
        type: 'range',
        icon: 'speed',
        max: 10,
        min: 1,
        step: 1,
      },
      text_autoPlaySpeed: {
        ch: '自动播放速度',
        defaultValue: 5, // * 500
        type: 'range',
        icon: 'speed',
        max: 10,
        min: 1,
        step: 1,
      },
    },
  },
];
export const optionsdefaultValues = Object.freeze(
  Object.fromEntries(optionsGroups.map(({ group }) => Object.entries(group).map(([k, { defaultValue }]) => [k, defaultValue])).flat(1))
);
