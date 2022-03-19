
export interface Dependency {
    id: string
    version: string
}

export default interface Profile {
    name: string,
    version: string,
    img?: string,
    packs?: Dependency[],
    directory?: string,
    author?: string,
    setup?: boolean
}
