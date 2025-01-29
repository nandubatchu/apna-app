'use server'

import { revalidateTag, unstable_cache } from 'next/cache'
// import { GetNoteReplies, GetNoteReactions } from '@/lib/nostr'

// const ROOT_NOTE_ID = "note1ncuh36e6plfzaucmnyy9sma2c9lv9p2rzwlrpyn5jjs9gsqpphsqc2ylzd"

// type NostrNote = {
//   id: string;
//   content: string;
//   pubkey: string;
// }

// type NostrReaction = {
//   pubkey: string;
//   content: string;
// }

// type ReactionMap = {
//   [key: string]: NostrReaction[];
// }

// export const loadFeedbacks = unstable_cache(
//   async () => {
//     const replies = await GetNoteReplies(ROOT_NOTE_ID, true)
    
//     // Load raw reactions for each feedback in parallel
//     const reactionsMap: ReactionMap = {}
//     const reactionPromises = replies.map(async (reply: NostrNote) => {
//       const reactions = await GetNoteReactions(reply.id)
//       reactionsMap[reply.id] = reactions
//     })
    
//     await Promise.all(reactionPromises)

//     return {
//       feedbacks: replies,
//       reactions: reactionsMap
//     }
//   },
//   ['feedbacks'],
//   {
//     revalidate: 86400, // Revalidate every 24 hours
//     tags: ['feedbacks']
//   }
// )

// Helper function to revalidate feedbacks
export const revalidateTags = (tags: string[]): void => {
  tags.forEach((tag) => revalidateTag(tag))
}