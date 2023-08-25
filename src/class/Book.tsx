

export function vmtoobj(wm: string) {
    let obj: any = {};
    let lines = wm.split('\n');
    let paraNum: string = '';
    for (let line of lines) {
        switch (line[0]) {
            case '=': // 如果是=，表示文件的类别和名称
                // 提取类别和名称，并用':'连接成name属性值
                let [category, id] = line.slice(1).split(':');
                obj.category = category;
                obj.id = id
                break;
            case '>': // 如果是>，表示文件的追加属性
                let [key, value]: any[] = line.slice(1).split('=');
                value = JSON.parse(value);
                obj[key] = value;
                break;
            case '~': // 如果是~，表示文件内新起或结束一个段落
                // 提取段落号，并判断是否为结束标志（去掉冒号）
                paraNum = line.slice(1).split(' ')[0].replace(':', '');
                if (line.endsWith('end')) { // 如果是结束标志，则不做任何操作
                    break;
                } else { // 如果不是结束标志，则新建一个空数组存储段落内容，并添加到para属性中（如果没有para属性，则先创建）
                    if (!obj.para) {
                        obj.para = {};
                    }
                    obj.para[paraNum] = [];
                }
                break;
            case '@': // 如果是@，表示段落中的一个语句
                // 提取语句中的各个属性，并用##分割成数组
                let statement = line.slice(1).split('##');
                // 创建一个空对象存储语句属性，并添加到当前段落数组中（如果没有当前段落，则先创建）
                if (!obj.para[paraNum]) {
                    obj.para[paraNum] = [];
                }
                let statementObj: any = {};
                // 判断第一个元素是否为空字符串（表示cn属性为空）
                if (statement[0] === '') {
                    statementObj.cn = '';
                } else {
                    statementObj.cn = statement[0];
                }
                // 判断第二个元素是否存在（表示tx属性）
                if (statement[1]) {
                    statementObj.tx = statement[1];
                }
                // 判断第三个元素及以后是否存在（表示fn属性）
                if (statement.length > 2) {
                    statementObj.fn = [];
                    for (let i = 2; i < statement.length; i++) {
                        statementObj.fn.push(statement[i]);
                    }
                }
                obj.para[paraNum].push(statementObj);
                break;
            default:
                break;
        }
    }
    console.log('vmtoobj', obj);
    return obj;
}

export namespace GlobalSave {
    type StoryCheckerMode = 'some' | 'all'
    type CheckerType = 'key' | 'read' | 'ended' | 'both'
    class Checker {
        type: CheckerType
        read: {mode:StoryCheckerMode,list:string[]}
        ended: {mode:StoryCheckerMode,list:string[]}
        constructor(type:'key',key:string)
        constructor(type:'read'|'ended',mode:StoryCheckerMode,storyKeyList:string[])
        constructor(type:'both',modes:{read:StoryCheckerMode,ended:StoryCheckerMode},storyKeyLists:{read:string[],ended:string[]},)
        constructor(args_0:CheckerType,args_1:string|StoryCheckerMode|{read:StoryCheckerMode,ended:StoryCheckerMode},args_2?:string[]|{read:string[],ended:string[]}){
            
        }
    }
}

export namespace VM {
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
        end: [string,string][]
        cover: string // homeResource's filekey
        check: 
        constructor(key: string, VMLines: string[]) {
            this.key = key
            for (let i = 1; i < VMLines.length; ++i) {
                const currentLine = VMLines[i];
                if (currentLine[0] !== '>') throw new Error(`StaticBook构造: 非追加属性行于BOOK:${this.key} 第 ${i} 行。\n"${VMLines[i]}"`)
                const [ikey, ivalue] = ((equationStr) => {
                    const signIndex = equationStr.indexOf('=');
                    return [equationStr.slice(0, signIndex), equationStr.slice(signIndex + 1)]
                })(currentLine.slice(1));
                this[ikey] = JSON.parse(ivalue)
            }
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