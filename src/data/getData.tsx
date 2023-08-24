import { dataURL } from "../config"
import { packageRecord, fileRecord, charaRecord, tipsGroupRecord } from "./data"
const data = {
    packageRecord,
    fileRecord,
    charaRecord,
    tipsGroupRecord
}
async function getDataJson (){
    // const obj = fetch(dataURL).then(e=>e.json())
    const obj = fetch(new URL('./sample.data.json',import.meta.url)).then(e=>e.json())
    return obj
}
export async function getData(){
    const json = await getDataJson()
    console.log(json)
    // write file&packageRecord
}
export {}