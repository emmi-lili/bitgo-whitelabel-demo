import { contacts } from '../data/mock'
import ContactAvatar from './ContactAvatar'
import { PlusIcon } from './icons'

export default function QuickSend() {
  return (
    <section className="pt-2 pb-4">
      {/* Section Title & Plus Action */}
      <div className="px-6 flex items-center justify-between mb-3">
        <h3 className="text-[17px] font-bold text-[#141518] tracking-tight">Quick Send</h3>
        <button
          aria-label="Add recipient"
          className="w-7 h-7 rounded-full bg-[#121316] text-white flex items-center justify-center hover:bg-neutral-800 transition active:scale-90"
          type="button"
        >
          <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
      {/* Horizontal Scrollable Avatars */}
      <div className="flex items-center space-x-3.5 overflow-x-auto no-scrollbar px-6">
        {contacts.map((contact) => (
          <ContactAvatar key={contact.id} contact={contact} />
        ))}
      </div>
    </section>
  )
}
