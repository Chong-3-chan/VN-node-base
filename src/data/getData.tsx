import { vmtoobj } from "../class/Book"
import { dataURL } from "../config"
import { packageRecord, fileRecord, charaRecord, tipsGroupRecord } from "./data"
const data = {
    packageRecord,
    fileRecord,
    charaRecord,
    tipsGroupRecord
}
async function getDataObject(){
    // const obj = fetch(dataURL).then(e=>e.json())
    const obj = await fetch(new URL('./sample/sample.data.json',import.meta.url)).then(e=>e.json())
    return obj
}
export async function getData(){
    const dataobj = await getDataObject()
    console.log(dataobj.book['书「一」'])
    vmtoobj(dataobj.book['书「一」'][0])
    Object.values(dataobj.book['书「一」'][1]).map((e)=>vmtoobj(e as string))
    
    vmtoobj(dataobj.book['书「二」'][0])
    Object.values(dataobj.book['书「二」'][1]).map((e)=>vmtoobj(e as string))
    console.log(dataobj)
    // write file&packageRecord
}
export {}