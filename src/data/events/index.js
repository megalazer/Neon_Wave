import { FLAVOR_EVENTS } from './flavor';
import { CHOICE_EVENTS } from './choices';

export const ALL_FLAVOR_EVENTS = FLAVOR_EVENTS;
export const ALL_CHOICE_EVENTS = CHOICE_EVENTS;
export const ALL_EVENTS = [...FLAVOR_EVENTS, ...CHOICE_EVENTS];
