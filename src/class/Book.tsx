export type FixedArray<T, N extends number> = [T, ...T[]] & { length: N }


// function vmtoobj(wm: string) {
//     let obj: any = {};
//     let lines = wm.split('\n');
//     let paraNum: string = '';
//     for (let line of lines) {
//         switch (line[0]) {
//             case '=': // 如果是=，表示文件的类别和名称
//                 // 提取类别和名称，并用':'连接成name属性值
//                 let [category, id] = line.slice(1).split(':');
//                 obj.category = category;
//                 obj.id = id
//                 break;
//             case '>': // 如果是>，表示文件的追加属性
//                 let [key, value]: any[] = line.slice(1).split('=');
//                 value = JSON.parse(value);
//                 obj[key] = value;
//                 break;
//             case '~': // 如果是~，表示文件内新起或结束一个段落
//                 // 提取段落号，并判断是否为结束标志（去掉冒号）
//                 paraNum = line.slice(1).split(' ')[0].replace(':', '');
//                 if (line.endsWith('end')) { // 如果是结束标志，则不做任何操作
//                     break;
//                 } else { // 如果不是结束标志，则新建一个空数组存储段落内容，并添加到para属性中（如果没有para属性，则先创建）
//                     if (!obj.para) {
//                         obj.para = {};
//                     }
//                     obj.para[paraNum] = [];
//                 }
//                 break;
//             case '@': // 如果是@，表示段落中的一个语句
//                 // 提取语句中的各个属性，并用##分割成数组
//                 let statement = line.slice(1).split('##');
//                 // 创建一个空对象存储语句属性，并添加到当前段落数组中（如果没有当前段落，则先创建）
//                 if (!obj.para[paraNum]) {
//                     obj.para[paraNum] = [];
//                 }
//                 let statementObj: any = {};
//                 // 判断第一个元素是否为空字符串（表示cn属性为空）
//                 if (statement[0] === '') {
//                     statementObj.cn = '';
//                 } else {
//                     statementObj.cn = statement[0];
//                 }
//                 // 判断第二个元素是否存在（表示tx属性）
//                 if (statement[1]) {
//                     statementObj.tx = statement[1];
//                 }
//                 // 判断第三个元素及以后是否存在（表示fn属性）
//                 if (statement.length > 2) {
//                     statementObj.fn = [];
//                     for (let i = 2; i < statement.length; i++) {
//                         statementObj.fn.push(statement[i]);
//                     }
//                 }
//                 obj.para[paraNum].push(statementObj);
//                 break;
//             default:
//                 break;
//         }
//     }
//     console.log('vmtoobj', obj);
//     return obj;
// }

export namespace GlobalSave {
    type StoryCheckerMode = '&' | '|' | '!'
    type CheckerType = 'key' | 'read&ended' | 'read|ended' | 'disable'
    export class Checker {
        type: CheckerType
        read?: { mode: StoryCheckerMode, some: string[] | null, all: string[] | null }
        ended?: { mode: StoryCheckerMode, some: string[] | null, all: string[] | null }
        checkKeyName?: string
        constructor(keyName: string)
        constructor(readAndEndedConfig: [StoryCheckerMode, ...FixedArray<[StoryCheckerMode, string[], string[]], 2>])
        constructor(args_0: any) {
            if (typeof args_0 === 'string') {
                const [keyName] = [args_0]
                this.type = 'key'
                this.checkKeyName = keyName
            }
            else if (Array.isArray(args_0) && args_0.length === 3) {
                if (
                    !(Array.isArray(args_0[1])
                        && (args_0[1].length === 3 || args_0[1].length === 0)
                        && Array.isArray(args_0[2])
                        && (args_0[2].length === 3 || args_0[2].length === 0))
                ) throw new Error(`Checker构造:传入的readConfig和endConfig应是三元组或空数组。实际为\n${JSON.stringify({ readConfig: args_0[1], endConfig: args_0[2] })}`)
                const [readAndEndedConfig] = [args_0]
                const [type, readConfig, endedConfig] = readAndEndedConfig
                switch (type) {
                    case '&': this.type = 'read&ended'; break;
                    case '|': this.type = 'read|ended'; break;
                    case '!': this.type = 'disable'; return;
                    default: throw new Error(`Checker构造:传入的type有误（应为 “all” | “some”，实际为${type}）`)
                }
                // readConfig
                if (readConfig.length === 0) {
                    this.read = Object.freeze({ mode: '!', some: null, all: null })
                }
                else if (
                    !(typeof readConfig[0] === 'string'
                        && Array.isArray(readConfig[1])
                        && Array.isArray(readConfig[2])
                        && ['&', '|', '!'].includes(readConfig[0]))
                ) throw new Error(`Checker构造:传入的readConfig有误。实际为\n${JSON.stringify(readConfig)}`)
                else {
                    this.read = Object.freeze({ mode: readConfig[0] as StoryCheckerMode, some: readConfig[1], all: readConfig[2] })
                }
                // endedConfig
                if (endedConfig.length === 0) {
                    this.ended = Object.freeze({ mode: '!', some: null, all: null })
                }
                else if (
                    !(typeof endedConfig[0] === 'string'
                        && Array.isArray(endedConfig[1])
                        && Array.isArray(endedConfig[2])
                        && ['&', '|', '!'].includes(endedConfig[0]))
                ) throw new Error(`Checker构造:传入的endedConfig有误。实际为\n${JSON.stringify(endedConfig)}`)
                else {
                    this.ended = Object.freeze({ mode: endedConfig[0] as StoryCheckerMode, some: endedConfig[1], all: endedConfig[2] })
                }

                // endConfig[0] !== '!' ?
                //     this.ended = Object.freeze({ mode: endConfig[0], some: endConfig[1], all: endConfig[2] }) :
                //     this.ended = void 0
            }
            else throw new Error(`Checker构造:参数类型有误。实际为:\n${JSON.stringify(args_0)}`)
            Object.freeze(this)
        }
    }
}

export namespace VM {
    function equationLineToKV(equationLine: string) {
        const signIndex = equationLine.indexOf('=');
        if (signIndex <= 0) throw new Error(`equationLineToKV():输入了非等式行\n${equationLine}`)
        return [equationLine.slice(1, signIndex), equationLine.slice(signIndex + 1)]
    }
    export class RuntimeStory {
        key: string
        constructor(key: string) {
            this.key = key

        }
    }
    export class StaticStory {
        key: string
        constructor(key: string, VMLines: string[]) {
            this.key = key

        }
    }

    export class RuntimeBook {
        key: string
        constructor(key: string) {
            this.key = key

        }
    }
    export class StaticBook {
        key: string
        start: string // Story's key
        defaultStyle: string
        end: FixedArray<string, 2>
        cover: string // homeResource's filekey
        check: GlobalSave.Checker
        constructor(key: string, VMLines: string[]) {
            this.key = key
            const readProps: any = {}
            for (let i = 1; i < VMLines.length; ++i) {
                const currentLine = VMLines[i];
                if (currentLine[0] !== '>') throw new Error(`StaticBook构造: 非追加属性行于BOOK:${this.key} 第 ${i} 行。\n"${VMLines[i]}"`)
                const [ikey, ivalue] = equationLineToKV(currentLine)
                readProps[ikey] = JSON.parse(ivalue)
            }
            if (
                'start' in readProps &&
                'defaultStyle' in readProps &&
                'end' in readProps &&
                'cover' in readProps &&
                'check' in readProps
            ) {
                this.start = readProps['start']
                this.defaultStyle = readProps['defaultStyle']
                this.end = readProps['end']
                this.cover = readProps['cover']
                this.check = new GlobalSave.Checker(readProps['check'])
            }
            else throw new Error(`StaticBook构造: 追加属性不足够或不对应。需要"start","defaultStyle","end","cover","check"，读取到:\n${(JSON.stringify(readProps, null, 2))}\n实际输入:\n${VMLines.slice(1).join('\n')}`)
        }
    }
    export function fromObject(vm: string) {
        const lines = vm.split('\n').map(l => l.trim()).filter(l => l)
        const firstLine = lines[0]
        if (firstLine[0] !== '=') throw new Error(`VM.fromObject(): 传入的vm字符串非空首行未以"="起始。\n错误的行:"${firstLine}"`)
        const [category, key] = firstLine.slice(1).split(':');
        switch (category as 'STORY' | 'BOOK') {
            case 'BOOK':
                return new VM.StaticBook(key, lines)
            case "STORY":
                return new VM.StaticStory(key, lines)
            default: throw new Error(`VM.fromObject(): 传入的vm字符串类型字段值(${category})未定义。`)
        }
    }
    export function toObject() {

    }
}

export const vmtoobj = (e: string) => console.log(VM.fromObject(e))