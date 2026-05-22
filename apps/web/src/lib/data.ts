import type { Category, Person, Issue, Comment, TimelineItem, Notification, StatusDef, PriorityDef } from './types';

export const CATEGORIES: Category[] = [
  { id: 'hostel',    label: 'Hostel & Residence',  color: 'oklch(0.62 0.13 25)' },
  { id: 'mess',      label: 'Cafeteria & Mess',     color: 'oklch(0.7 0.13 75)' },
  { id: 'wifi',      label: 'Wi-Fi & IT',           color: 'oklch(0.6 0.13 245)' },
  { id: 'class',     label: 'Classrooms & AV',      color: 'oklch(0.58 0.13 290)' },
  { id: 'library',   label: 'Library',              color: 'oklch(0.55 0.1 155)' },
  { id: 'maint',     label: 'Maintenance',          color: 'oklch(0.55 0.1 60)' },
  { id: 'sports',    label: 'Sports & Gym',         color: 'oklch(0.6 0.14 195)' },
  { id: 'transport', label: 'Transport',            color: 'oklch(0.62 0.14 130)' },
  { id: 'safety',    label: 'Safety & Security',    color: 'oklch(0.55 0.18 15)' },
];

export const LOCATIONS: string[] = [
  'Block A — Boys Hostel',
  'Block B — Boys Hostel',
  'Block C — Girls Hostel',
  'Block D — Girls Hostel',
  'Main Mess',
  'North Wing Academic',
  'South Wing Academic',
  'Library — 2nd floor',
  'Sports Complex',
  'Auditorium',
  'Admin Building',
  'Parking Lot',
];

export const PEOPLE: Person[] = [
  { id: 'u1', name: 'Aarav Mehta',    role: 'student', avatar: 'AM', color: 'oklch(0.6 0.13 25)' },
  { id: 'u2', name: 'Sara Iqbal',     role: 'student', avatar: 'SI', color: 'oklch(0.62 0.13 145)' },
  { id: 'u3', name: 'Rohan Das',      role: 'student', avatar: 'RD', color: 'oklch(0.55 0.13 265)' },
  { id: 'u4', name: 'Priya Sharma',   role: 'student', avatar: 'PS', color: 'oklch(0.6 0.14 320)' },
  { id: 'u5', name: 'Kabir Singh',    role: 'student', avatar: 'KS', color: 'oklch(0.58 0.13 60)' },
  { id: 'u6', name: 'Ananya Rao',     role: 'student', avatar: 'AR', color: 'oklch(0.6 0.13 195)' },
  { id: 's1', name: 'Vikram Joshi',   role: 'admin',   title: 'Facilities Lead',   avatar: 'VJ', color: 'oklch(0.4 0.1 265)' },
  { id: 's2', name: 'Meera Krishnan', role: 'admin',   title: 'IT Operations',     avatar: 'MK', color: 'oklch(0.4 0.1 195)' },
  { id: 's3', name: 'Rajesh Kumar',   role: 'admin',   title: 'Hostel Warden',     avatar: 'RK', color: 'oklch(0.4 0.1 25)' },
];

export const STATUS: Record<string, StatusDef> = {
  open:     { label: 'Open',        cls: 'badge--open' },
  progress: { label: 'In Progress', cls: 'badge--progress' },
  resolved: { label: 'Resolved',    cls: 'badge--resolved' },
  closed:   { label: 'Closed',      cls: 'badge--closed' },
};

export const PRIORITY: Record<string, PriorityDef> = {
  low:    { label: 'Low',    color: 'oklch(0.6 0.008 80)' },
  med:    { label: 'Medium', color: 'oklch(0.65 0.13 245)' },
  high:   { label: 'High',   color: 'oklch(0.7 0.15 75)' },
  urgent: { label: 'Urgent', color: 'oklch(0.58 0.2 25)' },
};

export const ISSUES: Issue[] = [
  {
    id: 'RU-2384', title: 'Hot water unavailable in Block A second floor',
    category: 'hostel', status: 'progress', priority: 'high',
    location: 'Block A — Boys Hostel', reporter: 'u1', assignee: 's3',
    upvotes: 42, comments: 8, createdAt: '2 hours ago', daysOpen: 0,
    description: 'Hot water has been unavailable in showers on the second floor of Block A since Monday morning. Affects roughly 60 students. The geyser appears to be powered on but only delivers cold water. Maintenance was informed verbally but no update.',
    votedByMe: true,
  },
  {
    id: 'RU-2383', title: 'Wi-Fi keeps disconnecting in Library reading area',
    category: 'wifi', status: 'open', priority: 'med',
    location: 'Library — 2nd floor', reporter: 'u2', assignee: null,
    upvotes: 38, comments: 12, createdAt: '5 hours ago', daysOpen: 0,
    description: 'Wi-Fi drops every 5–10 minutes in the silent reading area. Sitting near the printer corner is worst.',
  },
  {
    id: 'RU-2380', title: 'Mess dinner served cold for three days running',
    category: 'mess', status: 'open', priority: 'high',
    location: 'Main Mess', reporter: 'u4', assignee: null,
    upvotes: 87, comments: 24, createdAt: '1 day ago', daysOpen: 1,
    description: 'Rotis are cold and rice undercooked at dinner. Lunch is fine. Started Thursday this week.',
    votedByMe: true,
  },
  {
    id: 'RU-2378', title: 'Projector in Room 204 not working',
    category: 'class', status: 'progress', priority: 'med',
    location: 'North Wing Academic', reporter: 'u3', assignee: 's2',
    upvotes: 14, comments: 4, createdAt: '1 day ago', daysOpen: 1,
    description: 'Projector boots but shows no signal regardless of input source. Tested 3 different laptops.',
  },
  {
    id: 'RU-2376', title: 'Streetlight broken near Sports Complex entry',
    category: 'safety', status: 'open', priority: 'urgent',
    location: 'Sports Complex', reporter: 'u5', assignee: null,
    upvotes: 56, comments: 9, createdAt: '2 days ago', daysOpen: 2,
    description: 'Whole stretch from gate to gym is dark after 7pm. Genuinely unsafe for evening practice.',
  },
  {
    id: 'RU-2371', title: 'Washing machine #3 in Block C eats coins',
    category: 'hostel', status: 'resolved', priority: 'low',
    location: 'Block C — Girls Hostel', reporter: 'u6', assignee: 's3',
    upvotes: 21, comments: 6, createdAt: '3 days ago', daysOpen: 3,
    description: 'Coin slot accepts payment but cycle never starts. Lost ₹40 over two attempts.',
  },
  {
    id: 'RU-2369', title: 'Gym treadmill belt slipping',
    category: 'sports', status: 'progress', priority: 'med',
    location: 'Sports Complex', reporter: 'u1', assignee: 's1',
    upvotes: 9, comments: 2, createdAt: '4 days ago', daysOpen: 4,
  },
  {
    id: 'RU-2365', title: 'Shuttle to metro running late every morning',
    category: 'transport', status: 'open', priority: 'med',
    location: 'Parking Lot', reporter: 'u2', assignee: null,
    upvotes: 34, comments: 7, createdAt: '5 days ago', daysOpen: 5,
  },
  {
    id: 'RU-2360', title: 'Library AC too cold — 18°C all day',
    category: 'library', status: 'resolved', priority: 'low',
    location: 'Library — 2nd floor', reporter: 'u4', assignee: 's1',
    upvotes: 18, comments: 5, createdAt: '1 week ago', daysOpen: 7,
  },
  {
    id: 'RU-2355', title: 'Leaking ceiling in Auditorium green room',
    category: 'maint', status: 'progress', priority: 'high',
    location: 'Auditorium', reporter: 'u3', assignee: 's1',
    upvotes: 11, comments: 3, createdAt: '1 week ago', daysOpen: 7,
  },
  {
    id: 'RU-2348', title: 'Smart-card door reader at Admin frozen',
    category: 'safety', status: 'resolved', priority: 'med',
    location: 'Admin Building', reporter: 'u5', assignee: 's2',
    upvotes: 8, comments: 2, createdAt: '2 weeks ago', daysOpen: 14,
  },
  {
    id: 'RU-2340', title: 'Filtered water dispenser in Block B out of service',
    category: 'hostel', status: 'closed', priority: 'low',
    location: 'Block B — Boys Hostel', reporter: 'u6', assignee: 's3',
    upvotes: 24, comments: 6, createdAt: '3 weeks ago', daysOpen: 22,
  },
];

export const COMMENTS: Comment[] = [
  { id: 'c1', issueId: 'RU-2384', author: 'u2', time: '1h ago', text: 'Same here, third floor also affected. Tried at 7am and 6pm — cold both times.' },
  { id: 'c2', issueId: 'RU-2384', author: 's3', time: '45m ago', text: 'Got it — sending the technician at 10am tomorrow. The geyser thermostat is likely tripped. Will keep this thread updated.' },
  { id: 'c3', issueId: 'RU-2384', author: 'u3', time: '20m ago', text: 'Thanks for the quick turnaround. Could we also check Block A\'s third floor at the same time?' },
];

export const TIMELINE: TimelineItem[] = [
  { issueId: 'RU-2384', icon: 'plus',  text: 'Aarav Mehta opened the issue',                time: '2h ago' },
  { issueId: 'RU-2384', icon: 'tag',   text: 'Auto-categorized as Hostel & Residence',      time: '2h ago' },
  { issueId: 'RU-2384', icon: 'user',  text: 'Assigned to Rajesh Kumar (Hostel Warden)',    time: '1h ago' },
  { issueId: 'RU-2384', icon: 'arrow-right', text: 'Status changed to In Progress',         time: '55m ago' },
  { issueId: 'RU-2384', icon: 'msg',   text: '3 comments added',                            time: '20m ago' },
];

export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', text: 'Rajesh Kumar moved RU-2384 to In Progress',         time: '5m ago',    unread: true,  type: 'status' },
  { id: 'n2', text: 'Sara Iqbal commented on RU-2384',                   time: '1h ago',    unread: true,  type: 'comment' },
  { id: 'n3', text: 'Your issue RU-2371 was resolved',                   time: 'Yesterday', unread: false, type: 'resolved' },
  { id: 'n4', text: '12 students upvoted RU-2380 since you reported it', time: '2 days ago', unread: false, type: 'upvote' },
  { id: 'n5', text: 'Weekly digest: 4 issues opened, 6 resolved',        time: '3 days ago', unread: false, type: 'system' },
];

export const peopleById = Object.fromEntries(PEOPLE.map(p => [p.id, p]));
export const categoryById = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
