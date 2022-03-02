import DefaultResourcepackBuilder from "slimeball/out/resourcepack"
import { PackBuilder } from "slimeball/out/util"
import { WeldDatapackBuilder } from "smithed-weld/out/datapack"
import { database } from "./ConfigureFirebase"
export default class PackDownloader {
    private datapacks: [string, Buffer][] = []
    private resourcepacks: [string, Buffer][] = []
    private packIds: string[] = []
    private gameVersion: string = '1.18.1'
    private onStatus: (element: string, spam?: boolean) => void

    private dpBlob: [string, Blob] = ['', new Blob()]
    private rpBlob: [string, Blob] = ['', new Blob()]

    constructor(onStatus: (message: string, spam?: boolean) => void, gameVersion?: string) {
        this.onStatus = onStatus
        if (gameVersion) this.gameVersion = gameVersion
    }

    private async getPackData(uid: string, id: string) {
        const ownerPacks = (await database.ref(`users/${uid}/packs`).get()).val() as any[]

        for (let p of ownerPacks) {
            if (p.id === id) {
                if (p.versions instanceof Array) {
                    return p;
                } else {
                    let versions: any[] = []
                    for (let v in p.versions) {
                        let version = p.versions[v]
                        version.name = v.replaceAll('_', '.');
                        versions.push(version)
                    }
                    p.versions = versions;
                    return p
                }
            }
        }
        return null;
    }

    // async function getLatestVersionNumber(pack: any): Promise<string | undefined> {
    //     return pack.versions[pack.versions.length - 1].name;
    // }
    private async getVersionData(pack: any, version?: string): Promise<any> {
        var versionData
        // console.log(version)
        // console.log(pack.versions)
        if (version != null && version !== '' && pack.versions.find((v: any) => v.name === version) != null) {
            // console.log('did we make it')
            versionData = pack.versions.find((v: any) => v.name === version)
        } else {
            let versions: { name: string, supports: string[] }[] = pack.versions;
            versionData = versions.reverse().find((v) => v.supports.includes(this.gameVersion))
            if (versionData == null) {
                let supports: string[] = []
                for (let v of versions)
                    for (let s of v.supports)
                        if (!supports.includes(s)) supports.push(s)

                alert(`Valid version could not be found for pack '${pack.id}' on Minecraft Version ${this.gameVersion}!\n'${pack.id}' supports: ${supports.join(', ')}\nTry adding '&version=<gameVersion>' to resolve the issue!`)
                return null
            }
        }
        return versionData
    }

    private async fetchFile(url: string): Promise<Buffer | null> {
        try {
            const resp = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
            if (resp.ok) {
                const buffer = await resp.arrayBuffer()
                return buffer as Buffer;
            } else {
                throw new Error(`Error while downloading pack! ${resp.json()}`)
            }
        } catch (e: any) {
            // console.log(e)
            return null;
        }
    }

    private async downloadPack(entry: any, id: string, version?: string) {
        const pack = await this.getPackData(entry["owner"], id);
        // console.log('made it ')
        // console.log(pack)

        const versionData = await this.getVersionData(pack, version)
        // console.log(versionData)
        if (versionData != null) {
            if (versionData["downloads"] != null) {
                const { datapack, resourcepack }: { datapack: string, resourcepack: string } = versionData["downloads"]
                // console.log(datapack)
                // console.log(resourcepack)
                if (datapack !== undefined && datapack !== '') {
                    const zip = await this.fetchFile(datapack)
                    if (zip != null)
                        this.datapacks.push([id, zip])
                }
                if (resourcepack !== undefined && resourcepack !== '') {
                    const zip = await this.fetchFile(resourcepack)
                    if (zip != null)
                        this.resourcepacks.push([id, zip])
                }
            }

            if (versionData["dependencies"] != null && versionData["dependencies"].length > 0) {
                for (var d of versionData["dependencies"]) {
                    // console.log(d)
                    const [owner, id] = d.id.split(':')
                    const version = d.version
                    await this.startDownload(owner, id, version)
                }
            }
        }
    }


    private async startDownload(owner: string, id: string, version?: string) {
        const dbEntry = (await database.ref(`packs/${owner}:${id}`).get()).val()
        this.packIds.push(owner + ':' + id)

        this.onStatus(`Downloading pack:\n${owner}:${id}`)

        if (dbEntry != null) {
            await this.downloadPack(dbEntry, id, version)
        }
    }

    private async generateFinal(builder: PackBuilder, packs: [string, Buffer][], state?: string) {
        console.log('loading')
        await builder.loadBuffers(packs)
        this.onStatus(`Building\n${state ? state : ''}`)
        console.log('done loading\nbuilding')
        const r = await builder.build(this.onStatus)
        console.log('done building')

        let lastPercent = 0
        const blob = await r.zip.close(undefined, {
            'onprogress': (p, total, entry) => {
                const percent = Math.ceil(p * 100 / total)
                if (lastPercent < percent) {
                    console.log(percent)
                    lastPercent = percent
                }
            }
        })
        console.log(blob)
        return blob
    }
    private incrementDownloads() {
        fetch(`https://vercel.smithed.dev/api/update-download?packs=${JSON.stringify(this.packIds)}`, { mode: 'no-cors' })
    }

    public async downloadAndMerge(packs: { id: string, owner: string, version?: string }[], callback: (dpBlob: [string, Blob], rpBlob: [string, Blob], packIds: string[]) => void) {
        this.datapacks = []
        this.resourcepacks = []
        this.dpBlob[0] = ''
        this.rpBlob[0] = ''

        this.packIds = []

        for (let p of packs) {

            await this.startDownload(p.owner, p.id, p.version)
        }

        this.onStatus(`Done downloading packs`)

        this.incrementDownloads()


        this.onStatus(`Incremented download counts`)


        if (this.datapacks.length > 0) {
            // const jarLink = (await database.ref(`meta/vanilla/${gameVersion.replace(/[.]+/g, '_')}`).get()).val()
            // const jar = await fetchFile(jarLink);
            // if (jar != null) {
            //     console.log(jar);
            const dpb = new WeldDatapackBuilder(this.gameVersion)


            this.onStatus('Starting to merge datapacks')

            const blob = await this.generateFinal(dpb, this.datapacks, 'Datapack')
            const name = packs.length === 1 ? `${packs[0].id}-datapack.zip` : 'datapacks.zip'
            this.dpBlob = [name, blob]
          
            this.onStatus(`Finished merging datapacks`)

            // }
        }
        if (this.resourcepacks.length > 0) {


            this.onStatus(`Started to merge resourcepacks`)

            const rpb = new DefaultResourcepackBuilder();

            const blob = await this.generateFinal(rpb, this.resourcepacks, 'Resourcepack')
            const name = packs.length === 1 ? `${packs[0].id}-resourcepack.zip` : 'resourcepack.zip'
            this.rpBlob = [name, blob]


            this.onStatus(`Finished merging resourcepacks`)
        }
        callback(this.dpBlob, this.rpBlob, this.packIds)
    }

}