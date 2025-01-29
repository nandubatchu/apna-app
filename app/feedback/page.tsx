'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react'
import { getKeyPairFromLocalStorage } from '@/lib/utils'
import { ReplyToNote, ReactToNote, GetNoteReactions, GetNoteReplies } from '@/lib/nostr'
import { revalidateTags } from '../actions/feedback'
// import { loadFeedbacks, revalidateFeedbacks } from '../actions/feedback'

const ROOT_NOTE_ID = "9e3978eb3a0fd22ef31b9908586faac17ec2854313be30927494a05440010de0"

const loadFeedbacks = async () => {
  const replies = await GetNoteReplies(ROOT_NOTE_ID, true)
      
      // Load raw reactions for each feedback in parallel
      const reactionsMap: any = {}
      const reactionPromises = replies.map(async (reply: any) => {
        const reactions = await GetNoteReactions(reply.id)
        reactionsMap[reply.id] = reactions
      })
      
      await Promise.all(reactionPromises)
  
      return {
        feedbacks: replies,
        reactions: reactionsMap
      }
}

export default function FeedbackPage() {
  const [keyPair, setKeyPair] = useState<{ npub: string; nsec: string } | null>(null)
  const [feedback, setFeedback] = useState('')
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  type ProcessedReactions = {
    [key: string]: {
      upvotes: number;
      downvotes: number;
      userVote: string | null;
    }
  }

  const [reactions, setReactions] = useState<ProcessedReactions>({})

  const processReactions = (rawReactions: {[key: string]: Array<{pubkey: string; content: string}>}, userNpub: string | null) => {
    const processed: ProcessedReactions = {}
    
    Object.entries(rawReactions).forEach(([noteId, reactions]) => {
      const upvotes = reactions.filter(r => r.content === '+').length
      const downvotes = reactions.filter(r => r.content === '-').length
      const userVote = userNpub ?
        reactions.find(r => r.pubkey === userNpub)?.content || null :
        null
      
      processed[noteId] = { upvotes, downvotes, userVote }
    })
    
    return processed
  }

  useEffect(() => {
    const kp = getKeyPairFromLocalStorage()
    setKeyPair(kp)
    refreshFeedbacks(kp?.npub!)
  }, [])

  const refreshFeedbacks = async (userNpub: string | null) => {
    const result = await loadFeedbacks()
    setFeedbacks(result.feedbacks)
    setReactions(processReactions(result.reactions, userNpub))
  }

  const handleSubmit = async () => {
    if (!keyPair || !feedback.trim()) return

    try {
      revalidateTags([ROOT_NOTE_ID])
      await ReplyToNote(ROOT_NOTE_ID, feedback, keyPair.nsec)
      setFeedback('')
      await refreshFeedbacks(keyPair.npub)
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  const handleVote = async (noteId: string, vote: string) => {
    if (!keyPair) return

    try {
      revalidateTags([noteId])
      await ReactToNote(noteId, keyPair.nsec, vote)
      await refreshFeedbacks(keyPair.npub)
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={keyPair ? "Share your feedback..." : "Please sign in to share feedback"}
            disabled={!keyPair}
            className="w-full min-h-[100px] p-3 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-[#368564]"
          />
          <Button
            onClick={handleSubmit}
            disabled={!keyPair || !feedback.trim()}
            className="bg-[#368564] hover:bg-[#2c6b51] text-white"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Submit Feedback
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {[...feedbacks].sort((a, b) =>
          (reactions[b.id]?.upvotes || 0) - (reactions[a.id]?.upvotes || 0)
        ).map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-700 mb-4">{item.content}</p>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(item.id, '+')}
                disabled={!keyPair}
                className={reactions[item.id]?.userVote === '+' ? 'bg-[#e6efe9]' : ''}
              >
                <ThumbsUp className={`w-4 h-4 mr-2 ${reactions[item.id]?.userVote === '+' ? 'text-[#368564]' : 'text-gray-500'}`} />
                <span className="text-gray-500">{reactions[item.id]?.upvotes || 0}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(item.id, '-')}
                disabled={!keyPair}
                className={reactions[item.id]?.userVote === '-' ? 'bg-[#ffe6e6]' : ''}
              >
                <ThumbsDown className={`w-4 h-4 mr-2 ${reactions[item.id]?.userVote === '-' ? 'text-red-500' : 'text-gray-500'}`} />
                <span className="text-gray-500">{reactions[item.id]?.downvotes || 0}</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}