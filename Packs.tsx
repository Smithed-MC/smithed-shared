// import customProtocolCheck from 'protocol-checker'
import React, { useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router'
import { database } from './ConfigureFirebase'
import Markdown, { MarkdownToJSX } from 'markdown-to-jsx';
import styled from 'styled-components';
import { MarkdownOptions } from './Markdown';

interface VersionData {
    name: '',
    supports: string[]
}

interface PackData {
    name: '',
    icon: '',
    webPage: '',
    description: '',
    versions: VersionData[],
    downloads: number,
    added: number,
    updated: number
}

function Packs(props: any) {
    const { owner, id } = props
    const history = useHistory();
    const [packData, setPackData] = useState<PackData>({ name: '', icon: '', webPage: '', description: '', versions: [], downloads: 0, added: 0, updated: 0 });
    const [ownerInfo, setOwnerInfo] = useState<{ displayName: string, donation?: { kofi: string, patreon: string, other: string } }>({ displayName: '', donation: { kofi: '', patreon: '', other: '' } })
    const [maxVersions, setMaxVersions] = useState(5)

    // const protocol = () => {
    //     customProtocolCheck(
    //         `smithed://packs/${owner}/${id}`,
    //         () => {
    //             alert('You haven\'t installed Smithed!')
    //             history.replace('/')
    //         }
    //     )
    // }

    useEffect(() => {
        database.ref(`/packs/${owner}:${id}`).get().then(async (entry) => {
            if (!entry.exists()) return;
            const uid = entry.val().owner
            const owner = (await database.ref(`/users/${uid}`).get()).val()
            if (owner === undefined) return;

            setOwnerInfo({
                displayName: owner.displayName,
                donation: owner.donation
            })

            const packs = owner.packs
            for (let p of packs) {
                if (p.id === id) {
                    if (p.versions instanceof Array)
                        p.display.versions = p.versions
                    else {
                        p.display.versions = []
                        for (let v in p.versions) {
                            const version = p.versions[v]
                            version.name = v.replaceAll('_', '.')
                            p.display.versions.push(version)
                        }
                    }

                    p.display.added = entry.val().added

                    const dateAdded = new Date(entry.val().updated !== undefined ? entry.val().updated : entry.val().added)
                    p.display.updated = Math.floor(Math.abs(dateAdded.getTime() - Date.now()) / (1000 * 3600 * 24))


                    let count = 0
                    entry.child('downloads').forEach((c) => {
                        count += c.numChildren()
                    })

                    p.display.downloads = count

                    console.log(p.versions)
                    if (p.display.webPage === '') {
                        p.display.webPage = p.display.description
                        setPackData(p.display)
                        return;
                    }

                    fetch(p.display.webPage, { cache: "no-store" }).then((resp) => {
                        if (resp.status === 200) {
                            resp.text().then(v => {
                                p.display.webPage = v
                                console.log(v)
                                setPackData(p.display)
                            })
                        } else {
                            throw resp.status
                        }
                    })
                }
            }

        })
    }, [owner, id, setPackData])

    const generateDownloads = () => {
        let versionElements: JSX.Element[] = []
        let versions = packData.versions

        for (let i = 0; i < versions.length && i < maxVersions; i++) {
            const v = versions[versions.length - i - 1]

            versionElements.push(<div className='flex flex-col items-left w-full'>
                <h3 style={{ color: 'var(--text)' }}>{v.name}</h3>
                <div className='flex flex-row gap-4 w-full'>
                    <label className='p-2 rounded-md' style={{ backgroundColor: 'var(--lightBackground)' }}>{v.supports.join(', ')}</label>
                    <button className='p-2 rounded-md' onClick={() => {
                        history.push(`/download?pack=${owner}:${id}@${v.name}`)
                    }}>DOWNLOAD</button>
                </div>
            </div>)

        }
        return versionElements;
    }

    if (packData.versions === undefined) return (<div className='flex flex-col justify-center items-center w-full'>
        <h1>Loading...</h1>
    </div>)


    const defaultDonationButton = 'p-2 rounded-md font-[Disket-Bold] text-center text-titlebar hover:brightness-75 active:brightness-60'

    const renderLeftPanel = () => {
        if (ownerInfo.donation === undefined) return (<div className='flex flex-col p-2 w-3/4 items-left'></div>)
        return (
            <div className='w-full flex flex-col'>
                <h2 className='text-text'>Donate</h2>
                <hr className='w-full h-2' />
                {ownerInfo.donation.kofi &&
                    <a className={defaultDonationButton + ' bg-[#0D8AC8]'} target='_blank' rel='norefferer' href={`https://ko-fi.com/${ownerInfo.donation?.kofi}`}>Kofi</a>}
                {ownerInfo.donation.patreon &&
                    <a className={defaultDonationButton + ' bg-[#FF424D]'} target='_blank' rel='norefferer' href={`https://patreon.com/${ownerInfo.donation?.patreon}`}>Patreon</a>}
                {ownerInfo.donation.other &&
                    <a className={defaultDonationButton} target='_blank' rel='norefferer' href={ownerInfo.donation?.other}>Other</a>}
            </div>
        )
    }

    const renderBrowserRightPanel = () => {
        return (<div>
            <h2 style={{ color: 'var(--text)' }}>Downloads</h2>
            <hr className='w-full h-2' />
            {/* <button className='p-2 rounded-md w-full mb-2' onClick={() => protocol()}>VIEW IN SMITHED</button> */}
            <button className='p-2 rounded-md w-full mb-2' onClick={() => {
                const supports = packData.versions[packData.versions.length - 1].supports
                history.push(`/download?pack=${owner}:${id}&version=${supports[0]}`)
            }}>DOWNLOAD LATEST</button>
            {generateDownloads()}
            {packData.versions.length > maxVersions && <button className='p-2 w-1/2 mt-2' onClick={() => { setMaxVersions(maxVersions + 5) }}>SHOW MORE</button>}
        </div>)
    }

    return (
        <div className='flex flex-col gap-4 font-[Inconsolata] text-text w-full'>
            <div className='flex flex-col p-2 xl:flex-row items-center xl:items-start xl:justify-center w-full xl:px-32'>
                <div className='flex flex-col gap-2 w-full xl:w-3/4'>
                    <div className='flex w-full gap-2 justify-left'>
                        <img style={{ width: 64, height: 64, border: `4px solid var(--lightAccent)`, borderRadius: 8 }} src={packData.icon} alt="Pack Icon" />
                        <label style={{ fontFamily: 'Disket-Bold', fontSize: 18, alignSelf: 'center', width: '100%', WebkitUserSelect: 'none' }}>{packData.name}</label>
                    </div>
                    <div className='w-full h-1' style={{ backgroundColor: 'var(--lightAccent)', borderRadius: 8 }}></div>
                    <Markdown className='h-full' style={{ width: '100%', marginBottom: 8, fontFamily: 'Inconsolata', padding: 8, borderRadius: 4, backgroundColor: 'var(--darkBackground)' }} options={MarkdownOptions()}>
                        {packData.webPage}
                    </Markdown>
                </div>
                <div className='flex w-full md:w-1/2 xl:w-1/4 justify-center px-4 gap-2 flex-col'>
                    <div className='flex flex-col p-2 items-left' style={{ borderRadius: 8, border: `4px solid var(--lightAccent)`, backgroundColor: 'var(--darkBackground)' }}>
                        {ownerInfo.donation !== undefined && renderLeftPanel()}
                    </div>
                    <div className='flex flex-col p-2 items-left' style={{ borderRadius: 8, border: `4px solid var(--lightAccent)`, backgroundColor: 'var(--darkBackground)' }}>
                        <h2 style={{ color: 'var(--text)' }}>About</h2>
                        <hr className='w-full h-2' />
                        <div className='flex flex-col gap-1'>
                            <div className='flex flex-row justify-between items-center w-full'>
                                <label style={{ color: 'var(--text)' }}>Author:</label>
                                <label className='p-1 rounded-md' style={{ backgroundColor: 'var(--lightBackground)' }}>{ownerInfo.displayName}</label>
                            </div>
                            <div className='flex flex-row justify-between items-center w-full'>
                                <label style={{ color: 'var(--text)' }}>Added:</label>
                                <label className='p-1 rounded-md' style={{ backgroundColor: 'var(--lightBackground)' }}>{new Date(packData.added).toLocaleDateString()}</label>
                            </div>

                            <div className='flex flex-row justify-between items-center w-full'>
                                <label style={{ color: 'var(--text)' }}>Updated:</label>
                                <label className='p-1 rounded-md' style={{ backgroundColor: 'var(--lightBackground)' }}>{packData.updated} day{packData.updated !== 1 && 's'} ago</label>
                            </div>

                            <div className='flex flex-row justify-between items-center w-full'>
                                <label style={{ color: 'var(--text)' }}>Downloads:</label>
                                <label className='p-1 rounded-md' style={{ backgroundColor: 'var(--lightBackground)' }}>{packData.downloads}</label>
                            </div>
                        </div>
                        <br />
                        {props.browser && renderBrowserRightPanel()}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Packs