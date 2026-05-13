/**
 * Compatibility shim. Birthday/date helpers were merged into `dates.ts`.
 * Existing imports `from '../utils/dateUtils'` continue to work via re-export.
 */
export {
  formatBirthdayPretty,
  formatDateTimePtBr,
  initialsOf,
  isBirthdayToday,
} from './dates';
