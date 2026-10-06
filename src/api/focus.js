import focusService from './focusService'

export const focusApi = {
  logSession: (data) => focusService.saveSession(data),
  today: () => focusService.getTodaySessions(),
  weekly: () => focusService.getWeeklyStats(),
  history: (params) => focusService.getSessions(params),
}

export default focusService
