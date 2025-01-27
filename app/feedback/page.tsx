'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react'
import { getKeyPairFromLocalStorage } from '@/lib/utils'
import { ReplyToNote, ReactToNote, GetNoteReplies, GetNoteReactions } from '@/lib/nostr'

const ROOT_NOTE_ID = "note1ncuh36e6plfzaucmnyy9sma2c9lv9p2rzwlrpyn5jjs9gsqpphsqc2ylzd"

export default function FeedbackPage() {
  const [keyPair, setKeyPair] = useState<{ npub: string; nsec: string } | null>(null)
  const [feedback, setFeedback] = useState('')
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [reactions, setReactions] = useState<{[key: string]: {upvotes: number, downvotes: number, userVote: string | null}}>({})

  useEffect(() => {
    setKeyPair(getKeyPairFromLocalStorage())
    loadFeedbacks()
  }, [])

  const loadFeedbacks = async () => {
    const replies = await GetNoteReplies(ROOT_NOTE_ID)
    setFeedbacks(replies)
    
    // Load reactions for each feedback
    const reactionsMap: {[key: string]: {upvotes: number, downvotes: number, userVote: string | null}} = {}
    for (const reply of replies) {
      const reactions = await GetNoteReactions(reply.id)
      const upvotes = reactions.filter((r: { content: string }) => r.content === '+').length
      const downvotes = reactions.filter((r: { content: string }) => r.content === '-').length
      const userVote = keyPair ?
        reactions.find((r: { pubkey: string; content: string }) => r.pubkey === keyPair.npub)?.content || null :
        null
      reactionsMap[reply.id] = { upvotes, downvotes, userVote }
    }
    setReactions(reactionsMap)
  }

  const handleSubmit = async () => {
    if (!keyPair || !feedback.trim()) return

    try {
      await ReplyToNote(ROOT_NOTE_ID, feedback, keyPair.nsec)
      setFeedback('')
      await loadFeedbacks()
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  const handleVote = async (noteId: string, vote: string) => {
    if (!keyPair) return

    try {
      await ReactToNote(noteId, keyPair.nsec, vote)
      await loadFeedbacks()
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#368564] mb-4">Community Feedback</h1>
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
        {feedbacks.map((item) => (
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