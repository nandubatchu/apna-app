import { SimplePool, Event } from "nostr-tools";
import { ComponentType, LazyExoticComponent, lazy, useEffect, useState } from "react";

import { init, loadRemote, registerRemotes } from '@module-federation/enhanced/runtime';

const a = JSON.parse(localStorage.getItem("test")!)
console.log(a)

const remotes = [
  {
    name: "app2",
    entry: "http://localhost:3002/mf-manifest.json",
  },
  {
    name: "apna_module_test",
    entry: "https://cdn.jsdelivr.net/npm/@nandubatchu/apna-module-test@1.0.6/dist/mf-manifest.json",
  },
]

init({
  name: '@demo/app-main',
  remotes,
});


export const RELAYS = ["wss://relay.damus.io"];

interface AuthorMetadata {
  name?: string;
  picture?: string;
  nip05?: string;
}

export default function Social() {
  const [pool, setPool] = useState<SimplePool>();
  const [notes, setNotes] = useState<any[]>([]);
  const [authorMetadata, setAuthorMetadata] = useState<
    Record<string, AuthorMetadata>
  >({});
  const [BtnEl, setBtnEl] = useState<LazyExoticComponent<ComponentType<any>>>();
  const [btnSelection, setBtnSelection] = useState<string>();
  const [NoteEl, setNoteEl] = useState<LazyExoticComponent<ComponentType<any>>>();
  const [noteSelection, setNoteSelection] = useState<string>();

  useEffect(() => {
    if (btnSelection) {
      const done = async () => {
        // @ts-ignore
        const btnEl = await lazy(() => loadRemote(btnSelection));
        setBtnEl(btnEl)
      }
      done()
    }
    
  }, [btnSelection])

  useEffect(() => {
    if (noteSelection) {
      const done = async () => {
        // @ts-ignore
        const noteEl = await lazy(() => loadRemote(noteSelection));
        setNoteEl(noteEl)
      }
      done()
    }

  }, [noteSelection])

  // setup relay pool
  useEffect(() => {
    // @ts-ignore
    const entry = JSON.parse(localStorage.getItem("test"))
    setBtnSelection(`${entry.name}/Button`)
    // setNoteSelection(`${entry.name}/Note`)

    const _pool = new SimplePool();
    setPool(_pool);

    return () => {
      _pool.close(RELAYS);
    };
  }, []);

  // subscribe to note events
  useEffect(() => {
    if (!pool) return;

    const sub = pool.subscribeMany(
      RELAYS,
      [
        {
          kinds: [1],
          limit: 2,
        },
      ],
      {
        onevent(evt) {
          setNotes((notes) => {
            if (!authorMetadata[evt.pubkey]) {
              const sub1 = pool.subscribeMany(
                RELAYS,
                [
                  {
                    kinds: [0],
                    authors: [evt.pubkey],
                  },
                ],
                {
                  onevent(evt1: Event) {
                    const metadata = JSON.parse(evt1.content) as AuthorMetadata;
                    setAuthorMetadata((authorMetadata) => ({
                      ...authorMetadata,
                      [evt.pubkey]: metadata,
                    }));
                  },
                  oneose() {
                    sub1.close();
                  },
                }
              );
            }
            return [evt, ...notes];
          });
        },
      }
    );

    return () => {
      sub.close();
    };
  }, [pool]);

  const onChangeHander = (e: any) => {
    console.log(e.target.value)
    const c = e.target.value
    localStorage.setItem("test", JSON.stringify(remotes.find(a => a.name === e.target.value)))
    const rRemotes = []
    rRemotes.push(remotes.find(a => a.name === e.target.value)!)
    registerRemotes(rRemotes, {force: true})
    setBtnSelection(c === "app2" ? "app2/Button" : "apna_module_test/Button")
    // setNoteSelection(c === "app2" ? "app2/Note" : "test_provider/Note")
    // window.location.reload()
  }


  return (
    <>
      Social Feed

      {/* @ts-ignore */}
      {/* <Button test="one">testing</Button> */}
      {/* @ts-ignore */}
      { BtnEl ? <BtnEl test="one">testing</BtnEl> : null}
      <select onChange={onChangeHander}>
        <option >dummy</option>
        <option >app2</option>
        <option >apna_module_test</option>
      </select>
      {/* {notes.map((note, index) => (
        
          NoteEl 
          ? (<NoteEl 
            key={index}
            imgSrc={authorMetadata[note.pubkey]?.picture ?? "https://www.kindpng.com/picc/m/252-2524695_dummy-profile-image-jpg-hd-png-download.png"}
            content={note.content}
            author={authorMetadata[note.pubkey]?.name ?? note.pubkey}
            created_at={note.created_at}
          />) 
        : null
        // <div key={index} style={{ border: "solid 1px" }}>
        // <Image width={50} height={50} alt="author" src={authorMetadata[note.pubkey]?.picture ?? "https://www.kindpng.com/picc/m/252-2524695_dummy-profile-image-jpg-hd-png-download.png"}/>
        //   <li>{note.content}</li>
        //   <li>{authorMetadata[note.pubkey]?.name ?? note.pubkey}</li>
        //   <li>{note.created_at}</li>
        // </div>
      ))} */}
    </>
  );
}
