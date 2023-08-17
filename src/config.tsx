export const resourceBasePathRecord: Record<ApplicationFrom, URL> = {
    'SERVER': new URL('/resource/ex/', 'https://chong-chan.cn'),
    'SAMPLE': new URL('/resource/extra_test_active', 'https://chong-chan.cn'),
    'EDITOR': new URL('helper://localhost:8081')
} as const
export type ApplicationFrom = 'SAMPLE' | 'SERVER' | 'EDITOR'
export const sourceMode: ApplicationFrom = 'SAMPLE';
export const resourceBasePath: URL = resourceBasePathRecord[sourceMode]