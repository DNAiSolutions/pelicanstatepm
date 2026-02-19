import {
  mockContacts,
  type Contact,
  getContacts,
  getContactById,
} from '../data/pipeline';

function cloneContact(contact: Contact): Contact {
  return JSON.parse(JSON.stringify(contact));
}

export const contactService = {
  async list(): Promise<Contact[]> {
    return getContacts().map(cloneContact);
  },

  async getById(id: string): Promise<Contact | undefined> {
    const contact = getContactById(id);
    return contact ? cloneContact(contact) : undefined;
  },

  async create(payload: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const newContact: Contact = {
      ...payload,
      id: `contact-${Date.now()}`,
      clientPortalEnabled: payload.clientPortalEnabled ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockContacts.push(newContact);
    return cloneContact(newContact);
  },

  async update(id: string, updates: Partial<Contact>): Promise<Contact | undefined> {
    const contact = getContactById(id);
    if (!contact) return undefined;
    Object.assign(contact, updates, { updatedAt: new Date().toISOString() });
    return cloneContact(contact);
  },
};

export type ContactService = typeof contactService;
