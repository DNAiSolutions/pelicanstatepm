import { supabase } from './supabaseClient';
import type { SiteWalkthrough, SiteFinding } from '../types';

function mapWalkthrough(row: any): SiteWalkthrough {
  return {
    id: row.id,
    property_id: row.property_id,
    scheduled_date: row.scheduled_date,
    completed_date: row.completed_date ?? undefined,
    status: row.status,
    findings: row.findings ?? [],
    priority_list: row.priority_list ?? [],
    notes: row.notes ?? undefined,
  };
}

export const siteWalkthroughService = {
  async getSiteWalkthroughs(filters?: {
    property_id?: string;
    property_ids?: string[];
    status?: 'Scheduled' | 'In Progress' | 'Complete';
  }): Promise<SiteWalkthrough[]> {
    if (filters?.property_ids && filters.property_ids.length === 0) {
      return [];
    }

    let query = supabase.from('site_walkthroughs').select('*');

    if (filters?.property_ids && filters.property_ids.length > 0) {
      query = query.in('property_id', filters.property_ids);
    } else if (filters?.property_id) {
      query = query.eq('property_id', filters.property_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('scheduled_date', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapWalkthrough);
  },

  // Get single site walkthrough
  async getSiteWalkthrough(id: string): Promise<SiteWalkthrough> {
    const { data, error } = await supabase
      .from('site_walkthroughs')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapWalkthrough(data);
  },

  // Create new site walkthrough
  async createSiteWalkthrough(
    walkthrough: Omit<SiteWalkthrough, 'id' | 'findings'> & { findings?: SiteFinding[]; priority_list?: string[] }
  ): Promise<SiteWalkthrough> {
    const { data, error } = await supabase
      .from('site_walkthroughs')
      .insert([{ ...walkthrough, findings: walkthrough.findings ?? [], priority_list: walkthrough.priority_list ?? [] }])
      .select()
      .single();
    if (error) throw error;
    return mapWalkthrough(data);
  },

  // Update site walkthrough
  async updateSiteWalkthrough(
    id: string,
    updates: Partial<SiteWalkthrough>
  ): Promise<SiteWalkthrough> {
    const { data, error } = await supabase
      .from('site_walkthroughs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapWalkthrough(data);
  },

  // Update walkthrough status
  async updateStatus(id: string, status: 'Scheduled' | 'In Progress' | 'Complete') {
    return this.updateSiteWalkthrough(id, { status });
  },

  // Mark walkthrough as completed
  async markAsComplete(id: string) {
    return this.updateSiteWalkthrough(id, {
      status: 'Complete',
      completed_date: new Date().toISOString(),
    });
  },

  // Add findings
  async addFindings(id: string, findings: SiteFinding[]) {
    return this.updateSiteWalkthrough(id, { findings });
  },

  // Generate priority list from findings
  async generatePriorityList(id: string): Promise<string[]> {
    const walkthrough = await this.getSiteWalkthrough(id);
    if (!walkthrough) throw new Error('Walkthrough not found');

    // Sort findings by severity and generate priority items
    const priorityItems = walkthrough.findings
      ?.sort((a: SiteFinding, b: SiteFinding) => {
        const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        return severityOrder[a.severity as keyof typeof severityOrder] - 
               severityOrder[b.severity as keyof typeof severityOrder];
      })
      .map((finding: SiteFinding) => `[${finding.severity}] ${finding.description}`)
      || [];

    return priorityItems;
  },

  // Update priority list
  async updatePriorityList(id: string, priorityList: string[]) {
    return this.updateSiteWalkthrough(id, { priority_list: priorityList });
  },

  // Delete site walkthrough
  async deleteSiteWalkthrough(id: string) {
    const { error } = await supabase
      .from('site_walkthroughs')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Get upcoming walkthroughs
  async getUpcomingWalkthroughs(days: number = 30) {
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('site_walkthroughs')
      .select('*')
      .gte('scheduled_date', today.toISOString())
      .lte('scheduled_date', futureDate.toISOString())
      .eq('status', 'Scheduled')
      .order('scheduled_date', { ascending: true });
    if (error) throw error;
    return data;
  },

  // Get critical findings
  async getCriticalFindings(propertyId?: string) {
    const walkthroughs = await this.getSiteWalkthroughs({ property_id: propertyId });
    const criticalFindings: SiteFinding[] = [];
    walkthroughs.forEach((walkthrough) => {
      walkthrough.findings?.forEach((finding) => {
        if (finding.severity === 'Critical') {
          criticalFindings.push(finding);
        }
      });
    });
    return criticalFindings;
  },

  // Get walkthrough summary by property
  async getWalkthroughSummary(propertyId: string) {
    const walkthroughs = await this.getSiteWalkthroughs({ property_id: propertyId });

    const summary = {
      totalWalkthroughs: walkthroughs?.length || 0,
      completed: walkthroughs?.filter(w => w.status === 'Complete').length || 0,
      scheduled: walkthroughs?.filter(w => w.status === 'Scheduled').length || 0,
      inProgress: walkthroughs?.filter(w => w.status === 'In Progress').length || 0,
      totalFindings: 0,
      criticalFindings: 0,
    };

    walkthroughs?.forEach((walkthrough: SiteWalkthrough) => {
      if (walkthrough.findings) {
        summary.totalFindings += walkthrough.findings.length;
        summary.criticalFindings += walkthrough.findings.filter(
          f => f.severity === 'Critical'
        ).length;
      }
    });

    return summary;
  },
};
