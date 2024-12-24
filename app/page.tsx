"use client"
import Link from "next/link";
import { GetNoteReplies } from "@/lib/nostr";
import { useEffect, useState } from "react";

function parseAppDetailsFromJSON(text: string) {
  try {
    // Attempt to parse the JSON string
    const json = JSON.parse(text);

    // Check if `appUrl` exists in the parsed object and return it
    if (json && typeof json === 'object' && 'appURL' in json) {
      return {appURL: json.appURL, appName: json.appName};
    } else {
      return null; // appUrl key does not exist
    }
  } catch (error) {
    return null; // Not a valid JSON string
  }
}

export default function PageComponent() {
  const [appDetails, setAppDetails] = useState<any[]>([]);
  useEffect(() => {
    const init = async () => {
      const results = (await GetNoteReplies("note187j8dxwta5zvxle446uqutxue764q79vxmtv85dw7fnujlqgdm2qm7kelc") as any[])
      const parsedResults = results.map((result) => {return {...parseAppDetailsFromJSON(result.content), created_at: result.created_at}}).filter((n: any) => n)
      const ids = new Set(); // temp variable to keep track of accepted ids
      const uniqueResults = parsedResults.sort((a: any, b: any) => b.created_at - a.created_at).filter(({ appURL }: any) => appURL && !ids.has(appURL) && ids.add(appURL)) as any[];
      console.log(uniqueResults)
      setAppDetails(uniqueResults)
    }
    init()

  }, [])
  return (
    <div className="flex w-full h-screen">
      <div className="m-auto">
        <p>
          You can reply to note: <b>note187j8dxwta5zvxle446uqutxue764q79vxmtv85dw7fnujlqgdm2qm7kelc</b> in the following format to list your application below
        </p>

        <br></br>

        <pre>
{`{
    "appURL": "<APPLICATION_URL>",
    "appName": "<APPLICATION_NAME>"
}`}
       </pre>

        <br></br>
        <br></br>
        {
          appDetails.map((appDetail) => {
            return (<li key={appDetail.appURL}><Link href={`/social?miniAppUrl=${appDetail.appURL}`}><b>{appDetail.appName}</b></Link></li>)
          })
        }

      </div>
    </div>
  );
}
