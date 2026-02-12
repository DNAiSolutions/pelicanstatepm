import { useEffect, useMemo, useState } from 'react';
import { contactService } from '../services/contactService';
import { mockCampuses, type Contact } from '../data/pipeline';
import { Plus, Search, Filter, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<Contact['type'] | ''>('');
  const [campusFilter, setCampusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    type: 'Client' as Contact['type'],
    campusId: mockCampuses[0]?.id || '',
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await contactService.list();
        setContacts(data);
      } catch (error) {
        toast.error('Failed to load contacts');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch =
        contact.name.toLowerCase().includes(search.toLowerCase()) ||
        contact.company.toLowerCase().includes(search.toLowerCase());
      const matchesType = !typeFilter || contact.type === typeFilter;
      const matchesCampus = !campusFilter || contact.campusId === campusFilter;
      return matchesSearch && matchesType && matchesCampus;
    });
  }, [contacts, search, typeFilter, campusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const contact = await contactService.create({
        ...form,
        company: 'Pelican State',
        projectIds: [],
        leadIds: [],
        preferredChannel: 'Email',
        notes: 'Added via contacts page',
      });
      setContacts((prev) => [...prev, contact]);
      setForm({ name: '', title: '', email: '', phone: '', type: 'Client', campusId: mockCampuses[0]?.id || '' });
      toast.success('Contact added');
    } catch (error) {
      toast.error('Failed to add contact');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-[#143352]/20 border-t-[#143352] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Network</p>
          <h1 className="text-3xl font-heading font-bold text-neutral-900">Contacts</h1>
        </div>
        <button
          onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
          className="inline-flex items-center gap-2 bg-[#143352] text-white px-4 py-2.5 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </header>

      <section className="bg-white border border-neutral-200 p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-neutral-600 text-sm">
          <Filter className="w-4 h-4" /> Search and filter your stakeholders
        </div>
        <div className="flex flex-col gap-3 w-full lg:w-auto lg:flex-row">
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts"
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#143352]"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as Contact['type'] | '')} className="px-3 py-2 border border-neutral-300">
            <option value="">All Types</option>
            {['Client', 'Internal', 'Vendor', 'Partner'].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)} className="px-3 py-2 border border-neutral-300">
            <option value="">All Campuses</option>
            {mockCampuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((contact) => (
          <div key={contact.id} className="bg-white border border-neutral-200 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-heading font-semibold text-neutral-900">{contact.name}</p>
                <p className="text-sm text-neutral-500">{contact.title}</p>
              </div>
              <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600">{contact.type}</span>
            </div>
            <p className="flex items-center gap-2 text-sm text-neutral-600"><Mail className="w-4 h-4" /> {contact.email}</p>
            <p className="flex items-center gap-2 text-sm text-neutral-600"><Phone className="w-4 h-4" /> {contact.phone}</p>
            <p className="text-xs text-neutral-500">Campus: {mockCampuses.find((c) => c.id === contact.campusId)?.name || 'Multiple'}</p>
          </div>
        ))}
      </section>

      <section id="contact-form" className="bg-white border border-neutral-200 p-6 space-y-4">
        <h2 className="text-lg font-heading font-semibold text-neutral-900">Create Contact</h2>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleCreate}>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="border border-neutral-300 px-3 py-2" />
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="border border-neutral-300 px-3 py-2" />
          <input required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border border-neutral-300 px-3 py-2" />
          <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="border border-neutral-300 px-3 py-2" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Contact['type'] })} className="border border-neutral-300 px-3 py-2">
            {['Client', 'Internal', 'Vendor', 'Partner'].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select value={form.campusId} onChange={(e) => setForm({ ...form, campusId: e.target.value })} className="border border-neutral-300 px-3 py-2">
            {mockCampuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>
          <button type="submit" className="bg-[#143352] text-white px-4 py-2 font-medium flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Save Contact
          </button>
        </form>
      </section>
    </div>
  );
}
