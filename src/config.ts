export const resourceBasePathRecord: Record<ApplicationResource, string> = {
    'SERVER': new URL('/vn-node/ex/', 'http://cdn.chong-chan.cn').toString(),
    // 'SAMPLE': new URL('/vn-node/sample/', 'http://cdn.chong-chan.cn').toString(),
    'SAMPLE': new URL('/vn-node/sample/', 'http://chong-chan.miunachan.top').toString(),
    'EDITOR': new URL('helper://localhost:8081/').toString()
} as const
export type ApplicationResource = 'SAMPLE' | 'SERVER' | 'EDITOR'
export const sourceMode: ApplicationResource = 'SAMPLE';
export const resourceBasePath: string = resourceBasePathRecord[sourceMode]
export const dataURL = new URL(resourceBasePath + 'data.json').toString()