import { KKVRecord } from "../data/data"
import { dbh } from "../handle/IndexedDB"

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
    type CheckerType = 'key' | '&' | '|' | '!'
    export class Checker {
        type: CheckerType
        read?: { mode: StoryCheckerMode, some: readonly string[] | null, all: readonly string[] | null }
        ended?: { mode: StoryCheckerMode, some: readonly string[] | null, all: readonly string[] | null }
        checkKeyName?: string
        constructor(keyName: string)
        constructor(readAndEndedConfig: [StoryCheckerMode, ...FixedArray<[] | [StoryCheckerMode, readonly string[], readonly string[]], 2>])
        constructor(args_0: string | [StoryCheckerMode, ...FixedArray<[] | [StoryCheckerMode, readonly string[], readonly string[]], 2>]) {
            if (typeof args_0 === 'string') {
                const [keyName] = [args_0]
                this.type = 'key'
                this.checkKeyName = keyName
            }
            else if (Array.isArray(args_0) && args_0.length === 3) {
                const [readAndEndedConfig] = [args_0]
                const [type, readConfig, endedConfig] = readAndEndedConfig
                this.type = type
                this.read = readConfig.length === 0 ?
                    Object.freeze({ mode: '!', some: null, all: null }) :
                    Object.freeze({
                        mode: readConfig[0] as StoryCheckerMode,
                        some: Object.freeze(readConfig[1]),
                        all: Object.freeze(readConfig[2])
                    })
                this.ended = endedConfig.length === 0 ?
                    Object.freeze({ mode: '!', some: null, all: null }) :
                    Object.freeze({
                        mode: endedConfig[0] as StoryCheckerMode,
                        some: Object.freeze(endedConfig[1]),
                        all: Object.freeze(endedConfig[2])
                    })
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
    type Category = 'BOOK' | 'STORY'
    const equationLineTest = Object.freeze({
        BOOK: {
            propNames: Object.freeze(['start', 'defaultStyle', 'end', 'cover', 'check']),
            RegExpMap: Object.freeze({
                start: /^".+?"$/,
                defaultStyle: /^".+?"$/,
                end: /^\[\[".+?",".+?"\](,\[".+?",".+?"\])*\]$/,
                cover: /^".+?"$/,
                check: /(^".+?"$)|(^\["[&|!]"(,\["[&|!]"(,(\[\]|\[".+?"(,".+?")*\])){2}\]){2}\]$)/
            })
        },
        STORY: {
            propNames: Object.freeze(['title', 'end', 'tips']),
            RegExpMap: Object.freeze({
                title: /^".+?"$/,
                end: /^\[".+?"(,".+?")*\]$/,
                tips: /^\[".+?"(,".+?")*\]$/,
                to: /^".+?"$/,
            })
        }
    })
    function readProps(VMLines: readonly string[], category: 'BOOK', check: boolean): [{ [propName in keyof typeof equationLineTest.BOOK.RegExpMap]: any }, number]
    function readProps(VMLines: readonly string[], category: 'STORY', check: boolean): [{ [propName in keyof typeof equationLineTest.STORY.RegExpMap]: any }, number]
    function readProps(VMLines: readonly string[], category: Category, check: boolean) {
        const re: any = [{}, VMLines.length]
        const props = re[0];
        if (check) {
            const RegExpMap = equationLineTest[category].RegExpMap
            for (let i = 1; i < VMLines.length; ++i) {
                const currentLine = VMLines[i];
                if (currentLine[0] !== '>') {
                    if (category === 'BOOK') throw new Error(`VM.readProps(): 非追加属性行于${category}-VM第 ${i} 行。\n"${VMLines[i]}"`)
                    re[1] = i
                    break;
                }
                const [ikey, ivalue] = equationLineToKV(currentLine)
                const reg = RegExpMap[ikey as keyof typeof RegExpMap]
                if (reg) {
                    if (!reg.test(ivalue)) {
                        throw new Error(`VM.readProps(): 追加属性${ikey}格式出错。\n\t匹配:${reg}\n\t读取到:${ivalue}`)
                    }
                }
                props[ikey] = JSON.parse(ivalue)
            }
        }
        else {
            for (let i = 1; i < VMLines.length; ++i) {
                const currentLine = VMLines[i];
                const [ikey, ivalue] = equationLineToKV(currentLine)
                props[ikey] = JSON.parse(ivalue)
            }
        }
        const propNames = equationLineTest[category].propNames
        let firstLost = propNames.find(name => !props[name])
        if (firstLost) throw new Error(`VM.readProps(): 构造${category}-VM时追加属性不足够或不对应。缺少:${firstLost}\n需要:${propNames.join(',')}。\n读取到:\n${(JSON.stringify(re, null, 2))}\n实际输入:\n${VMLines.slice(1).join('\n')}`)
        return re
    }
    export type KeyIDEnum = {
        [ID: number]: string,
        [key: string]: number | string
    }
    export class RuntimeStory {
        key: string
        constructor(key: string) {
            this.key = key

        }
    }

    export class RuntimeBook {
        key: string
        constructor(key: string) {
            this.key = key

        }
    }
    type fnProps = (string | fnProps)[]
    class StaticSentence {
        ID: number // 0x0000 ~ 0xffff
        // line: string
        charaKey: string
        text: string
        fns: [string, fnProps][]
        constructor(ID: number, sentenceLine: string) {
            this.ID = ID
            // this.line = sentenceLine
            const [charaKey, text, ...fnsStringList] = sentenceLine.slice(1).split('\x1e')
            this.charaKey = charaKey
            this.text = text
            this.fns = fnsStringList.map(fnString => {
                const firstLeftBracketIndex = fnString.indexOf('[')
                const [fnName, propsStr] = [fnString.slice(0, firstLeftBracketIndex), fnString.slice(firstLeftBracketIndex)]
                return [fnName, JSON.parse(propsStr)]
            })

            console.log(this)
        }
    }
    class Paragraph {
        key: string
        start: number // 0x0000 ~ 0xffff
        end: number // === start+para.len-1
        constructor(key: string, startSentenceID: number, endSentenceID: number) {
            this.key = key
            this.start = startSentenceID
            this.end = endSentenceID
        }
    }
    export class StaticStory {
        ID: number
        key: string
        title: string
        end: readonly string[]
        tips: readonly string[]
        ParagraphRecord?: KKVRecord<Paragraph>
        to?: string
        constructor(ID: number, key: string, VMLines: readonly string[]) {
            this.ID = ID
            this.key = key

            const [{ title, end, tips, to }, lastPropsLineIndex] = readProps(VMLines, 'STORY', true)
            this.title = title
            this.end = end
            this.tips = tips
            to !== void 0 && (this.to = to)

            const paragraphCache: Paragraph[] = []
            const sentenceCache: StaticSentence[] = []
            let nextSentenceID = (this.ID << 16) + 0x0000
            const maxSentenceID = (this.ID << 16) + 0xffff
            for (let i = lastPropsLineIndex; i < VMLines.length; ++i) {
                let currentLine = VMLines[i]
                if (currentLine[0] !== '\x02') {
                    throw new Error(`StaticStory构造: 未读到段落起始标识于行 ${i}。读取到:\n\t${currentLine}`)
                }
                const paragraphKey = currentLine.slice(1),
                    paragraphStartID = nextSentenceID
                currentLine = VMLines[++i]
                for (; currentLine[0] === '@'; currentLine = VMLines[++i]) {
                    if (nextSentenceID > maxSentenceID) throw new Error(`StaticStory构造: 故事 ${this.ID} 语句过多。`)
                    sentenceCache.push(new StaticSentence(nextSentenceID++, currentLine))
                }
                const paragraphEndID = nextSentenceID - 1
                if (paragraphStartID > paragraphEndID) throw new Error(`StaticStory构造: 空段落于行 ${i}。`)
                if (currentLine[0] !== '\x03') {
                    throw new Error(`StaticStory构造: 未读到段落结束标识于行 ${i}。读取到:\n\t${currentLine}`)
                }
                else if (paragraphKey !== currentLine.slice(1)) {
                    throw new Error(`StaticStory构造: 未读到段落结束标识不匹配于行 ${i}。读取到:\n\t${currentLine.slice(1)},\n应为:\n\t${paragraphKey}`)
                }
                paragraphCache.push(new Paragraph(paragraphKey, paragraphStartID, paragraphEndID))
            }
            this.ParagraphRecord = new KKVRecord(paragraphCache)
            // console.log(sentenceCache)
            dbh.putM('Sentence', sentenceCache)

            console.log(this)
        }
    }
    export class StaticBook {
        ID: number
        key: string
        start: string // Story's key
        defaultStyle: string
        end: FixedArray<string, 2>
        cover: string // homeResource's filekey
        check: GlobalSave.Checker
        Story_KeyIDEnum?: KeyIDEnum
        constructor(ID: number, key: string, [BookVM, StoryVMMap]: [string, { [StoryKey: string]: string }]) {
            this.ID = ID
            this.key = key
            const VMLines = BookVM.split('\n').map(l => l.trim()).filter(l => l)

            const [{ start, defaultStyle, end, cover, check }] = readProps(VMLines, 'BOOK', true)
            this.start = start
            this.defaultStyle = defaultStyle
            this.end = end
            this.cover = cover
            this.check = new GlobalSave.Checker(check)

            this.Story_KeyIDEnum = {}

            const storyCache: StaticStory[] = []
            let nextStoryID = (this.ID << 8) + 0x01
            const maxStoryID = (this.ID << 8) + 0xff
            for (const key in StoryVMMap) {
                if (nextStoryID > maxStoryID) throw new Error(`StaticBook构造: 故事过多。`)
                const newStoryID = key === this.start ? (this.ID << 8) + 0x00 : nextStoryID++
                this.Story_KeyIDEnum[newStoryID] = key
                this.Story_KeyIDEnum[key] = newStoryID
                storyCache.push(new StaticStory(newStoryID, key, StoryVMMap[key].split('\n').map(l => l.trim()).filter(l => l)))
            }
            dbh.putM('Story', storyCache)

            console.log(this)
        }
    }
    export function fromObject(vm: string) {
        const lines = vm.split('\n').map(l => l.trim()).filter(l => l)
        const firstLine = lines[0]
        if (firstLine[0] !== '=') throw new Error(`VM.fromObject(): 传入的vm字符串非空首行未以"="起始。\n错误的行:"${firstLine}"`)
        const [category, key] = firstLine.slice(1).split(':');
        switch (category as Category) {
            case 'BOOK':
            // return new StaticBook(-1, key, lines)
            case "STORY":
            // return new StaticStory(-1, key, lines)
            default: throw new Error(`VM.fromObject(): 传入的vm字符串类型字段值(${category})未定义。`)
        }
    }
    export function toObject() {

    }
}

// export const vmtoobj = (e: string) => console.log(VM.fromObject(e))