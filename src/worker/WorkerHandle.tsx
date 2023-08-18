import { imurl } from ".."
import { Worker_getZipProps, Worker_getZipState } from "./getZip.worker"
type WorkerState = 'ready' | 'working' | 'done' | 'error'
export interface WorkerMessage {
    state: WorkerState | Worker_getZipState
    [key: string]: any
}
type WorkerOnmessage = (msg: WorkerMessage) => void | any
let lastWorkerID = 0x1234
export class WorkerHandle {
    ID: number
    functionName: WorkerNames
    state: WorkerState
    lastMessage?: WorkerMessage
    totalMessage: WorkerMessage
    worker: Worker
    constructor(fnName: WorkerNames, props: {}, onmessage: WorkerOnmessage) {
        this.ID = ++lastWorkerID
        this.functionName = fnName
        this.state = 'ready'
        this.totalMessage = {
            state: 'ready'
        }
        this.worker = new Worker(workerRecord[fnName].getUrl())
        this.worker.onmessage = e => {
            const msg: WorkerMessage = e.data;
            this.lastMessage = msg
            this.state = workerRecord[this.functionName].states[msg.state]
            this.totalMessage = { ...this.totalMessage, ...msg } // co?
            onmessage(msg)
        }
        this.worker.postMessage(props)

    }
}


type WorkerNames = 'getZip'
interface workerInfo { getUrl:()=>URL, states: { [key: string]: WorkerState } }
export const workerRecord: { [fnName in WorkerNames]: workerInfo } = {
    'getZip': {
        getUrl: ()=>new URL('./getZip.worker', import.meta.url),
        states: {
            'ready': 'ready',
            'downloading': 'working',
            'loading': 'working',
            'done': 'done',
            'error': 'error'
        }
    }
} as const

export class Worker_getZip extends WorkerHandle {
    constructor(props: Worker_getZipProps, onmessage: WorkerOnmessage) {
        super('getZip', props, onmessage)
    }
}