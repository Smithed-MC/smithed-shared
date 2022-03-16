export interface Palette { 
    darkAccent: string, 
    lightAccent: string, 
    badAccent: string,
    darkBackground: string, 
    lightBackground: string, 
    text: string, 
    subText: string, 
    titlebar: string,
    codeText: string,
    [key: string]: any
}


const defaultDark: Palette = {
    darkAccent: '#1B48C4',
    lightAccent: '#216BEA',
    badAccent: '#FF282F',
    darkBackground: '#24232B',
    lightBackground: '#2F2F38',
    text: '#FFFFFF',
    subText: '#A0A0A0',
    codeText: '#E2C052',
    titlebar: '#FFFFFF',
}
const mccDark: Palette = {
    darkAccent: '#02ADEE',
    lightAccent: '#54CBF7',
    badAccent: '#FF282F',
    darkBackground: defaultDark.darkBackground,
    lightBackground: defaultDark.lightBackground,
    text: defaultDark.text,
    subText: defaultDark.subText,
    titlebar: defaultDark.titlebar,
    codeText: defaultDark.codeText
}
const creeperMagnet: Palette = {
    darkAccent: '#006F1C',
    lightAccent: '#008721',
    badAccent: '#FF282F',
    darkBackground: defaultDark.darkBackground,
    lightBackground: defaultDark.lightBackground,
    text: defaultDark.text,
    subText: defaultDark.subText,
    titlebar: defaultDark.titlebar,
    codeText: defaultDark.codeText
}
const defaultLight: Palette = {
    darkAccent: '#1B48C4',
    lightAccent: '#216BEA',
    badAccent: '#DD0037',
    lightBackground: '#C0C0CF',
    darkBackground: '#D9D9E0',
    text: '#2F2F2F',
    subText: '#2F2F38',
    titlebar: '#FFFFFF',
    codeText: '#725D33',
}

export let registeredPalettes: { [key: string]: Palette } = {
    defaultDark: defaultDark,
    defaultLight: defaultLight,
    mccDark: mccDark,
    creeperMagnet: creeperMagnet
}

export function addPalette(name: string, palette: Palette) {
    registeredPalettes[name] = palette
}

let palette = defaultDark
setPalette(defaultDark)

export function setPalette(p: Palette) {
    palette = p;
    const root = document.getElementById("root")
    const style = root?.style

    console.log(p)
    
    for(let k in p) {
        style?.setProperty(`--${k}`, p[k])
    }
}


export default palette

