import type { Lead } from '../data/pipeline';

type ScheduleParams = {
  date: string;
  notes?: string;
};

type ScheduleResult = {
  eventId: string;
  calendarUrl: string;
};

export const walkthroughSchedulerService = {
  async schedule(lead: Lead, params: ScheduleParams): Promise<ScheduleResult> {
    // Placeholder for future calendar integration
    const eventId = `evt-${Date.now().toString(36)}`;
    const calendarUrl = `/calendar/events/${eventId}`;
    console.info('Scheduled walkthrough', { leadId: lead.id, ...params, eventId });
    return { eventId, calendarUrl };
  },
};
