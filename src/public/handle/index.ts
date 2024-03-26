export function classNames(...list: (string | void)[]) {
  return list.filter(Boolean).join(' ');
}
export const QsaveloadThrottle = ((delay = 1000) => {
  let timeout: NodeJS.Timeout | null = null;
  return (fn: () => any): ReturnType<typeof fn> => {
    if (timeout) return;
    else {
      timeout = setTimeout(() => {
        timeout = null;
      }, delay);
      return fn();
    }
  };
})();
function getDeepCloneMain() {
  const cache = new Map();
  const main = function (val: any) {
    if (typeof val !== 'object' || val === null) {
      return val;
    }
    const fromCache = cache.get(val);
    if (fromCache) {
      return fromCache;
    }
    const re: typeof val = Array.isArray(val) ? [] : {};
    Object.setPrototypeOf(re, Object.getPrototypeOf(val));
    cache.set(val, re);
    for (let key in val) {
      val.hasOwnProperty(key) && (re[key] = main(val[key]));
    }
    Object.isFrozen(val) && Object.freeze(re);
    return re;
  };
  return main;
}
export function deepClone<T>(val: T): T {
  const main = getDeepCloneMain();
  return main(val);
}
