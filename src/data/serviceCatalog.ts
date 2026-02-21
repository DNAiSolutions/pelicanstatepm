export type ServiceCatalogItem = {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  category: 'Service' | 'Product' | 'Inspection';
};

export const SERVICE_CATALOG: ServiceCatalogItem[] = [
  {
    id: 'svc-free-assessment',
    name: 'Free Assessment',
    description: 'Site visit to evaluate needs and document conditions',
    unitPrice: 0,
    category: 'Inspection',
  },
  {
    id: 'svc-drywall-repair',
    name: 'Drywall Repair',
    description: 'Repair cracks, patch holes, sand, and prep for paint',
    unitPrice: 450,
    category: 'Service',
  },
  {
    id: 'svc-gutter-install',
    name: 'Gutter Installation',
    description: 'Seamless aluminum gutters incl. downspouts & miters',
    unitPrice: 3200,
    category: 'Service',
  },
  {
    id: 'svc-fence-install',
    name: 'Fence Installation',
    description: 'Wood or vinyl privacy fencing up to 6 ft tall',
    unitPrice: 5800,
    category: 'Service',
  },
  {
    id: 'svc-historic-clean',
    name: 'Historic Stone Cleaning',
    description: 'Gentle steam cleaning for masonry/stone facades',
    unitPrice: 2400,
    category: 'Service',
  },
  {
    id: 'svc-event-support',
    name: 'Event Support Crew',
    description: 'On-site labor for setup/strike (per day)',
    unitPrice: 1750,
    category: 'Service',
  },
  {
    id: 'svc-hvac-maint',
    name: 'HVAC Preventative Maintenance',
    description: 'Quarterly inspection, filter swap, coil cleaning',
    unitPrice: 950,
    category: 'Service',
  },
  {
    id: 'svc-lighting-upgrade',
    name: 'LED Lighting Upgrade',
    description: 'Fixture replacement + controls tuning per room',
    unitPrice: 1800,
    category: 'Product',
  },
];
