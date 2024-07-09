\import { SimplePool, Event } from "nostr-tools";
import { useEffect, useState } from "react";
import Image from "next/image"

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

  // setup relay pool
  useEffect(() => {
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
          limit: 10,
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


  return (
    <>
      Social Feed
      {notes.map((note, index) => (
        <div key={index} style={{ border: "solid 1px" }}>
        <Image width={50} height={50} alt="author" src={authorMetadata[note.pubkey]?.picture ?? "https://www.kindpng.com/picc/m/252-2524695_dummy-profile-image-jpg-hd-png-download.png"}/>
          <li>{note.content}</li>
          <li>{authorMetadata[note.pubkey]?.name ?? note.pubkey}</li>
          <li>{note.created_at}</li>
        </div>
      ))}
    </>
  );
}
