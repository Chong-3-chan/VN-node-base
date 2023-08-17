type WorkerState = 'ready' | 'working' | 'done' | 'error'
interface WorkerMessage {
    state: WorkerState
    [key: string]: any
}
let lastWorkerID = 0x1234
export class WorkerHandle {
    ID: number
    functionName: string
    state: WorkerState
    lastMessage?: WorkerMessage
    totalMessage: WorkerMessage
    worker: Worker
    constructor(fnName: string, props: {}, onmessage: (msg: WorkerMessage) => void | any) {
        this.ID = ++lastWorkerID
        this.functionName = fnName
        this.state = 'ready'
        this.totalMessage = {
            state: 'ready'
        }
        this.worker = new Worker(workerRecord[fnName].url)
        this.worker.onmessage = e => {
            const msg: WorkerMessage = e.data;
            this.lastMessage = msg
            this.state = workerRecord[this.functionName].states[msg.state]
            this.totalMessage = { ...this.totalMessage, ...msg } // co?
            onmessage(msg)
        }

    }
}
interface workerInfo { url: URL, states: { [key: string]: WorkerState } }
const workerRecord: { [functionName: string]: workerInfo } = {
    'getZip': {
        url: new URL('./getZip.worker', import.meta.url),
        states: {
            'ready': 'ready',
            'downloading': 'working',
            'loading': 'working',
            'done': 'done',
            'error': 'error'
        }
    }
}