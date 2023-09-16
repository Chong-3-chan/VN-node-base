import { useState, type FC, useEffect, useCallback, useRef } from 'react'
import './LoadingP.less'
import { fileRecord, homeResource, packageRecord } from '../data/data'

enum LoadingPPhase { 'in' = 0, 'loading' = 1, 'out' = 2, 'done' = 3 }
const lastPhase = LoadingPPhase['done'], defaultPhase = LoadingPPhase['in']
type LoadingProgress = { loadedList: string[], needList: readonly string[], currentLoadedPercentage: number }
const defaultLoadingProgess: LoadingProgress = { loadedList: [], needList: [], currentLoadedPercentage: 0 }
type Phase_LoadingWaitProps = { loadList: string[], setProgress: (progress: LoadingProgress) => void }
const LoadingPConfig: Record<LoadingPPhase, { delay?: number, wait?: ((props: Phase_LoadingWaitProps) => Promise<any>)[] }> = {
    [LoadingPPhase['in']]: {
        delay: 1000
    },
    [LoadingPPhase['loading']]: {
        delay: 1000,
        wait: [(props: Phase_LoadingWaitProps) => {
            const { loadList, setProgress } = props
            const needPackageKeys: readonly string[] = Array.from(new Set(loadList.map(fileKey => fileRecord[fileKey]?.fromPackage).filter(e => e)))
            console.warn('need', needPackageKeys)
            // const progressCount = Object.fromEntries(needPackageKeys.map(packageKey => {
            //     const downloadInfo: { downloaded: number, downloadTotal: null | number } = { downloaded: 0, downloadTotal: null }
            //     return [packageKey, downloadInfo]
            // }))
            // function getPercentage() {
            //     let downloadedAccumulator = 0, downloadTotalAccumulator = 0
            //     Object.values(progressCount).forEach(({ downloaded, downloadTotal }) => {
            //         downloaded && (downloadedAccumulator += downloaded)
            //         downloadTotal && (downloadTotalAccumulator += downloadTotal)
            //     })
            //     return downloadedAccumulator ? (downloadedAccumulator * 100 / downloadTotalAccumulator) : 0
            // }
            const loadedList: string[] = [];
            const progress: LoadingProgress = {
                loadedList: loadedList,
                needList: needPackageKeys,
                currentLoadedPercentage: 0
            }
            function updateProgress() { setProgress({ ...progress }) }
            const progressUpdateDelay = 200 as const
            let progressUpdateInterval = window.setInterval(() => {
                updateProgress()
            }, progressUpdateDelay)
            function refreshProgressUpdateInterval() {
                window.clearInterval(progressUpdateInterval)
                progressUpdateInterval = window.setInterval(() => {
                    updateProgress()
                }, progressUpdateDelay)
            }
            return (needPackageKeys.map((packageKey) => {
                return () => packageRecord[packageKey].load({
                    ready: () => {
                        progress.currentLoadedPercentage = 0
                        updateProgress()
                        refreshProgressUpdateInterval()
                    },
                    downloading: (msg) => {
                        const { downloadTotal, downloaded } = msg as { downloadTotal: number | null, downloaded: number }
                        if (downloadTotal === null)
                            progress.currentLoadedPercentage = 0
                        else
                            progress.currentLoadedPercentage = Math.floor(downloaded * 100 / downloadTotal)
                    },
                    done: () => {
                        progress.currentLoadedPercentage = 100
                        loadedList.push(packageKey)
                        updateProgress()
                    }
                })
            }).reduce((lastPromise, nextLoad) => {
                return lastPromise.then(() => nextLoad())
            }, Promise.resolve()))
                .then((data) => {
                    progress.loadedList = Array.from(needPackageKeys)
                    progress.currentLoadedPercentage = 100
                    updateProgress()
                    window.clearInterval(progressUpdateInterval)
                    return data
                })
        }]
    },
    [LoadingPPhase['out']]: {
        delay: 1000
    },
    [LoadingPPhase['done']]: {
        // delay: null
    }
}
interface LoadingResult {
    phase: LoadingPPhase,
    progress: LoadingProgress
}
function useLoadingResult(loadList: string[]): LoadingResult {
    const loadListRef = useRef(loadList)
    const [phase, setPhase] = useState(defaultPhase)
    const [progress, setProgress]: [LoadingProgress, React.Dispatch<React.SetStateAction<LoadingProgress>>] = useState(defaultLoadingProgess)
    const [delayOver, setDelayOver] = useState(!LoadingPConfig[defaultPhase].delay)
    const [waitOver, setWaitOver] = useState(!LoadingPConfig[defaultPhase].wait)
    useEffect(() => {
        const newDelay = LoadingPConfig[phase].delay
        if (newDelay !== void 0) {
            setDelayOver(false)
            setTimeout(() => setDelayOver(true), newDelay)
        }
        const newWait = LoadingPConfig[phase].wait
        if (newWait !== void 0) {
            setWaitOver(false)
            Promise.all(newWait.map(fn => fn({ loadList: loadListRef.current, setProgress }))).then(() => setWaitOver(true))
        }
    }, [phase])
    useEffect(() => {
        if (delayOver && waitOver) {
            if (phase === lastPhase) return
            const nextPhase = (phase + 1) as LoadingPPhase
            setPhase(nextPhase)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [delayOver, waitOver])
    return {
        phase,
        progress
    }
}
interface LoadingPProps {
    onStepCase?: Partial<Record<LoadingPPhase, () => void>>, loadList: string[]
}
export const LoadingP: FC<LoadingPProps> = ({ onStepCase, loadList }: LoadingPProps) => {
    const { phase, progress } = useLoadingResult(loadList)
    return <h1>{LoadingPPhase[phase]} - {progress.loadedList.length}/{progress.needList.length} {progress.currentLoadedPercentage}</h1>
}
// class HooksPromise {
//     _resolve!: (e: any) => void
//     _reject!: (e: any) => void
//     promise: Promise<any>
//     constructor() {
//         let _resolve, _reject
//         this.promise = new Promise((resolve, reject) => {
//             _resolve = (e: any) => resolve(e);
//             _reject = (e: any) => reject(e)
//         })
//         this._resolve = _resolve as any
//         this._reject = _reject as any
//     }
// }
// const hp = new HooksPromise();
// (window as any).hp = hp
export default LoadingP