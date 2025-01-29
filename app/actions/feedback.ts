'use server'

import { unstable_cache } from 'next/cache'
import { GetNoteReplies, GetNoteReactions } from '@/lib/nostr'

const ROOT_NOTE_ID = "note1ncuh36e6plfzaucmnyy9sma2c9lv9p2rzwlrpyn5jjs9gsqpphsqc2ylzd"

type ReactionMap = {
  [key: string]: {
    upvotes: number;
    downvotes: number;
    userVote: string | null;
  }
}

export const loadFeedbacks = unstable_cache(
  async (userNpub: string | null = null) => {
    const replies = await GetNoteReplies(ROOT_NOTE_ID, true)
    
    // Load reactions for each feedback
    const reactionsMap: ReactionMap = {}
    for (const reply of replies) {
      const reactions = await GetNoteReactions(reply.id)
      const upvotes = reactions.filter((r: { content: string }) => r.content === '+').length
      const downvotes = reactions.filter((r: { content: string }) => r.content === '-').length
      const userVote = userNpub ?
        reactions.find((r: { pubkey: string; content: string }) => r.pubkey === userNpub)?.content || null :
        null
      reactionsMap[reply.id] = { upvotes, downvotes, userVote }
    }

    return {
      feedbacks: replies,
      reactions: reactionsMap
    }
  },
  ['feedbacks'],
  {
    revalidate: 300, // Revalidate every minute
    tags: ['feedbacks']
  }
)