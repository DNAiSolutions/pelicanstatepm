import { Mail, Phone, Plus } from 'lucide-react';
import type { Contact } from '../../data/pipeline';

export interface ProjectContactsProps {
  contacts: Contact[];
  onAddContact?: () => void;
  onContactClick?: (contact: Contact) => void;
}

export function ProjectContacts({ contacts, onAddContact, onContactClick }: ProjectContactsProps) {
  return (
    <div className="bg-white border border-neutral-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading font-semibold text-neutral-900">Project Contacts</h3>
          <p className="text-sm text-neutral-500">{contacts.length} contacts</p>
        </div>
        {onAddContact && (
          <button
            onClick={onAddContact}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#143352] rounded-lg hover:bg-[#143352]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        )}
      </div>

      {contacts.length === 0 ? (
        <p className="text-sm text-neutral-500">No contacts yet.</p>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="border border-neutral-200 p-3 rounded hover:bg-neutral-50 cursor-pointer transition-colors"
              onClick={() => onContactClick?.(contact)}
            >
              <p className="font-medium text-neutral-900">{contact.name}</p>
              <p className="text-xs text-neutral-500 mb-2">{contact.title}</p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-neutral-600">
                  <Mail className="w-4 h-4" />
                  <span>{contact.email}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-600">
                  <Phone className="w-4 h-4" />
                  <span>{contact.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
