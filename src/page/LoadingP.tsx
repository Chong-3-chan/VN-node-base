import { useState, type FC, useEffect, useCallback, useRef } from 'react'
import './LoadingP.less'
import { fileRecord, homeResource, packageRecord } from '../data/data'

type LoadingPPhase = 'in' | 'loading' | 'out' | 'done'
interface LoadingPResult {
    phase: LoadingPPhase
    percentage: number
}
const minDelay: Partial<Record<LoadingPPhase, number>> = {
    in: 5000,
    loading: 500,
    out: 500
}
const phaseOrder: Record<LoadingPPhase, number> = {
    in: 0,
    loading: 1,
    out: 2,
    done: 3
}
function useLoadResult(loadList: string[]): LoadingPResult {
    const phaseFinished: React.MutableRefObject<Record<LoadingPPhase, { delay: boolean, [key: string]: boolean }>> = useRef({
        in: {
            delay: false
        },
        loading: {
            delay: false,
            finished: false
        },
        out: {
            delay: false
        },
        done: {
            delay: false
        }
    })
    const phaseDelayEffected: React.MutableRefObject<Partial<Record<LoadingPPhase, number | null>>> = useRef({})
    const [phase, setPhase] = useState('in' as LoadingPPhase)
    const lastPhaseOrder = useRef(0)
    const updatePhaseFinished = useCallback(
        function (phase: LoadingPPhase, key: string, value: boolean = true) {
            phaseFinished.current[phase][key] = value
            const ableToNext = !Object.values(phaseFinished.current[phase]).some(e => !e)
            if (!ableToNext) return false
            const nextPhase: LoadingPPhase = ({ 'in': 'loading', 'loading': 'out', 'out': 'done', 'done': 'done' } as Record<LoadingPPhase, LoadingPPhase>)[phase]
            if (phaseOrder[nextPhase] <= lastPhaseOrder.current) throw new Error('为什么加载页状态会倒着走？反思一下。')
            setPhase(nextPhase)
            return true
        }, []
    )
    useEffect(() => {
        lastPhaseOrder.current = phaseOrder[phase]
        if (phase === 'done' || phaseDelayEffected.current[phase]) return
        phaseDelayEffected.current[phase] = window.setTimeout(() => {
            updatePhaseFinished(phase, 'delay', true)
        }, minDelay[phase]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])

    const [percentage, setPercentage] = useState(0)
    useEffect(() => {
        const needPackageKeys = Array.from(new Set(loadList.map(fileKey => fileRecord[fileKey]?.fromPackage).filter(e => e)))
        console.warn(needPackageKeys)
        const progressCount = Object.fromEntries(needPackageKeys.map(packageKey => {
            const downloadInfo: { downloaded: number, downloadTotal: null | number } = { downloaded: 0, downloadTotal: null }
            return [packageKey, downloadInfo]
        }))
        function getPercentage() {
            let downloadedAccumulator = 0, downloadTotalAccumulator = 0
            Object.values(progressCount).forEach(({ downloaded, downloadTotal }) => {
                downloaded && (downloadedAccumulator += downloaded)
                downloadTotal && (downloadTotalAccumulator += downloadTotal)
            })
            return downloadedAccumulator ? (downloadedAccumulator * 100 / downloadTotalAccumulator) : 100
        }
        Promise.all(
            needPackageKeys.map((packageKey) => {
                return packageRecord[packageKey].load({
                    downloading: (msg) => {
                        const { downloadTotal, downloaded }: any = msg
                        progressCount[packageKey].downloaded = downloaded
                        progressCount[packageKey].downloadTotal === null && (progressCount[packageKey].downloadTotal = downloadTotal)
                        // console.log('progressCount', progressCount, getPercentage())
                    }
                })
            })
        ).then(() => {
            updatePhaseFinished('loading', 'finished', true)
        })
        const percentUpdate = setInterval(() => {
            setPercentage(getPercentage())
        }, 200)
        return () => clearInterval(percentUpdate)
    }, [])
    useEffect(() => console.log("load percentage", percentage, phase), [percentage, phase])

    return {
        phase,
        percentage
    };
}
interface LoadingPProps {
    onStepCase?: Partial<Record<LoadingPPhase, () => void>>, loadList: string[]
}
export const LoadingP: FC<LoadingPProps> = ({ onStepCase, loadList }: LoadingPProps) => {
    const { phase, percentage } = useLoadResult(loadList)
    return <h1>{percentage}</h1>
}

// function getHooksPromise() {
//     let resolve, reject;
//     const promise = new Promise((_resolve, _reject) => {
//         resolve = _resolve;
//         reject = _reject;
//     })
//     const re = {
//         promise,resolve,reject
//     }
//     re.__proto__ = 
//     return
// }
class HooksPromise {
    _resolve!: (e: any) => void
    _reject!: (e: any) => void
    promise: Promise<any>
    constructor() {
        let _resolve, _reject
        this.promise = new Promise((resolve, reject) => {
            _resolve = (e: any) => resolve(e);
            _reject = (e: any) => reject(e)
        })
        this._resolve = _resolve as any
        this._reject = _reject as any
    }
}
const hp = new HooksPromise();
(window as any).hp = hp
// class HooksPromise extends Promise<any>{
//     resolve!: (e: any) => void
//     reject!: (e: any) => void
//     constructor() {
//         let _resolve, _reject
//         super((resolve, reject) => {
//             _resolve = resolve;
//             _reject = reject
//         })
//         this.resolve = _resolve as any
//         this.reject = _reject as any
//     }
// }
export default LoadingP