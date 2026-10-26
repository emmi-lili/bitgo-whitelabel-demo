import { useState } from 'react'
import type { Contact } from '../data/mock'

export default function ContactAvatar({ contact }: { contact: Contact }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className="flex flex-col items-center flex-shrink-0 group cursor-pointer">
      <div className="w-[58px] h-[58px] rounded-full p-[2px] bg-white ring-2 ring-neutral-200 overflow-hidden shadow-sm">
        {failed ? (
          <div className="w-full h-full rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-semibold">
            {contact.name.charAt(0)}
          </div>
        ) : (
          <img
            alt={contact.name}
            src={contact.avatar}
            onError={() => setFailed(true)}
            className={`w-full h-full rounded-full object-cover${contact.filter ? ` ${contact.filter}` : ''}`}
          />
        )}
      </div>
      <span className="text-[12px] font-medium text-neutral-600 mt-1.5 tracking-tight group-hover:text-black">
        {contact.name}
      </span>
    </div>
  )
}
