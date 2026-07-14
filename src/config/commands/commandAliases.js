/**
 * Command Aliases Configuration
 * Maps shortened command names to their full command names
 * Ultra-organized • 300+ aliases • Optimized lookups
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_ALIAS_LENGTH = 32;

// ─── Command Aliases ──────────────────────────────────────────────────────────

export const commandAliases = {
  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Economy (25 aliases) ───────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  bal: 'balance',
  money: 'balance',
  cash: 'balance',
  wallet: 'balance',
  bank: 'balance',
  dep: 'deposit',
  deposit: 'deposit',
  with: 'withdraw',
  withdrawal: 'withdraw',
  work: 'work',
  job: 'work',
  daily: 'daily',
  dailies: 'daily',
  claim: 'daily',
  gamble: 'gamble',
  bet: 'gamble',
  slots: 'gamble',
  dicegame: 'gamble',
  rob: 'rob',
  steal: 'rob',
  heist: 'rob',
  crime: 'crime',
  illegal: 'crime',
  pay: 'pay',
  give: 'pay',
  send: 'pay',
  transfer: 'pay',
  share: 'pay',
  donate: 'pay',
  beg: 'beg',
  plead: 'beg',
  search: 'search',
  scout: 'search',
  hunt: 'hunt',
  fish: 'fish',
  mine: 'mine',
  chop: 'chop',
  woodcutting: 'chop',
  sell: 'sell',
  market: 'sell',
  buyitem: 'buyitem',
  use: 'use',
  consume: 'use',
  leaderboard: 'leaderboard',
  lb: 'leaderboard',
  top: 'leaderboard',
  richest: 'leaderboard',
  networth: 'networth',
  nw: 'networth',
  profile: 'profile',
  card: 'profile',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Core / System (20 aliases) ─────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  ping: 'ping',
  latency: 'ping',
  pong: 'ping',
  help: 'help',
  h: 'help',
  info: 'help',
  about: 'help',
  commands: 'help',
  cmds: 'help',
  manual: 'help',
  docs: 'help',
  invite: 'invite',
  addbot: 'invite',
  support: 'support',
  server: 'support',
  donate: 'donate',
  premium: 'premium',
  patreon: 'premium',
  vote: 'vote',
  upvote: 'vote',
  stats: 'stats',
  botinfo: 'stats',
  status: 'status',
  uptime: 'uptime',
  shard: 'shard',
  pingall: 'pingall',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Moderation (30 aliases) ──────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  ban: 'ban',
  b: 'ban',
  banuser: 'ban',
  unban: 'unban',
  ub: 'unban',
  kick: 'kick',
  k: 'kick',
  removeuser: 'kick',
  mute: 'timeout',
  timeout: 'timeout',
  to: 'timeout',
  tempmute: 'timeout',
  unmute: 'untimeout',
  untimeout: 'untimeout',
  uto: 'untimeout',
  warn: 'warn',
  w: 'warn',
  strike: 'warn',
  unwarn: 'unwarn',
  rmwarn: 'unwarn',
  warnings: 'warnings',
  warns: 'warnings',
  strikes: 'warnings',
  clear: 'purge',
  purge: 'purge',
  prune: 'purge',
  clean: 'purge',
  delete: 'purge',
  del: 'purge',
  clearchat: 'purge',
  slowmode: 'slowmode',
  sm: 'slowmode',
  slow: 'slowmode',
  rate: 'slowmode',
  lock: 'lock',
  unlock: 'unlock',
  hide: 'hide',
  unhide: 'unhide',
  announce: 'announce',
  broadcast: 'announce',
  say: 'say',
  echo: 'say',
  embed: 'embed',
  role: 'role',
  giverole: 'role',
  takerole: 'takerole',
  removerole: 'takerole',
  addrole: 'role',
  nick: 'nickname',
  nickname: 'nickname',
  setnick: 'nickname',
  modlog: 'modlog',
  cases: 'modlog',
  reason: 'reason',
  editreason: 'reason',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Auto-Moderation (25 aliases) ───────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  automod: 'automoderation',
  am: 'automoderation',
  automodconfig: 'automoderation',
  amconfig: 'automoderation',
  antispam: 'automoderation',
  antiraid: 'automoderation',
  caps: 'automoderation',
  invites: 'automoderation',
  links: 'automoderation',
  mentions: 'automoderation',
  'anti-spam': 'automoderation',
  'anti-raid': 'automoderation',
  'auto-mod': 'automoderation',
  amsetup: 'automoderation',
  filter: 'automoderation',
  profanity: 'automoderation',
  blacklistwords: 'automoderation',
  badwords: 'automoderation',
  scam: 'automoderation',
  antiscam: 'automoderation',
  antiphish: 'automoderation',
  selfbot: 'automoderation',
  antighost: 'automoderation',
  dehoist: 'automoderation',
  antihoist: 'automoderation',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Leveling & XP (20 aliases) ─────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  rank: 'rank',
  lvl: 'rank',
  level: 'rank',
  xp: 'rank',
  exp: 'rank',
  card: 'rank',
  leaderboard: 'leaderboard',
  lb: 'leaderboard',
  top: 'leaderboard',
  levels: 'leaderboard',
  xplb: 'leaderboard',
  lvllb: 'leaderboard',
  resetxp: 'resetxp',
  resetlevel: 'resetxp',
  addxp: 'addxp',
  givexp: 'addxp',
  removexp: 'removexp',
  takexp: 'removexp',
  xpmultiplier: 'xpmultiplier',
  xpmult: 'xpmultiplier',
  boost: 'xpmultiplier',
  doublexp: 'xpmultiplier',
  rolelevel: 'rolelevel',
  lvlrole: 'rolelevel',
  stackroles: 'stackroles',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Shop & Inventory (15 aliases) ────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  shop: 'shop',
  store: 'shop',
  market: 'shop',
  catalog: 'shop',
  buy: 'buy',
  purchase: 'buy',
  inventory: 'inventory',
  inv: 'inventory',
  items: 'inventory',
  bag: 'inventory',
  backpack: 'inventory',
  equip: 'equip',
  wear: 'equip',
  useitem: 'useitem',
  sellitem: 'sellitem',
  trade: 'trade',
  gift: 'gift',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Utility & Tools (35 aliases) ─────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  user: 'userinfo',
  userinfo: 'userinfo',
  whois: 'userinfo',
  ui: 'userinfo',
  lookup: 'userinfo',
  memberinfo: 'userinfo',
  avatar: 'avatar',
  pfp: 'avatar',
  icon: 'avatar',
  av: 'avatar',
  banner: 'banner',
  serverinfo: 'serverinfo',
  guildinfo: 'serverinfo',
  si: 'serverinfo',
  gi: 'serverinfo',
  servericon: 'servericon',
  guildicon: 'servericon',
  emojis: 'emojis',
  emoji: 'emojis',
  emotes: 'emojis',
  roles: 'roles',
  rolelist: 'roles',
  channels: 'channels',
  channellist: 'channels',
  members: 'members',
  memberlist: 'members',
  invites: 'invites',
  invitelist: 'invites',
  boosters: 'boosters',
  boosts: 'boosters',
  calc: 'calculate',
  math: 'calculate',
  calculate: 'calculate',
  calculator: 'calculate',
  weather: 'weather',
  forecast: 'weather',
  w: 'weather',
  time: 'time',
  timezone: 'time',
  tz: 'time',
  translate: 'translate',
  tr: 'translate',
  t: 'translate',
  remind: 'remind',
  reminder: 'remind',
  remindme: 'remind',
  timer: 'timer',
  stopwatch: 'stopwatch',
  poll: 'poll',
  vote: 'poll',
  strawpoll: 'poll',
  quote: 'quote',
  q: 'quote',
  stealemoji: 'stealemoji',
  addemoji: 'stealemoji',
  enlarge: 'enlarge',
  bigemoji: 'enlarge',
  snipe: 'snipe',
  esnipe: 'esnipe',
  editsnipe: 'esnipe',
  afk: 'afk',
  away: 'afk',
  note: 'note',
  sticky: 'sticky',
  stickymsg: 'sticky',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Birthday (10 aliases) ──────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  bd: 'birthday',
  bday: 'birthday',
  birthday: 'birthday',
  b: 'birthday',
  setbirthday: 'birthday',
  nextbd: 'nextbirthday',
  nextbday: 'nextbirthday',
  birthdays: 'birthdays',
  bdlb: 'birthdayleaderboard',
  birthdaylb: 'birthdayleaderboard',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Fun & Games (30 aliases) ─────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  flip: 'flip',
  coin: 'flip',
  coinflip: 'flip',
  toss: 'flip',
  roll: 'roll',
  dice: 'roll',
  rolldice: 'roll',
  d20: 'roll',
  rps: 'rps',
  rockpaperscissors: 'rps',
  fight: 'fight',
  battle: 'fight',
  duel: 'fight',
  pvp: 'fight',
  hug: 'hug',
  cuddle: 'hug',
  kiss: 'kiss',
  slap: 'slap',
  punch: 'punch',
  kill: 'kill',
  murder: 'kill',
  ship: 'ship',
  love: 'ship',
  match: 'ship',
  rate: 'rate',
  waifu: 'waifu',
  husbando: 'husbando',
  marry: 'marry',
  divorce: 'divorce',
  pet: 'pet',
  feed: 'feed',
  tickle: 'tickle',
  poke: 'poke',
  highfive: 'highfive',
  hf: 'highfive',
  wave: 'wave',
  wink: 'wink',
  dance: 'dance',
  cry: 'cry',
  laugh: 'laugh',
  lmao: 'laugh',
  meme: 'meme',
  reddit: 'meme',
  joke: 'joke',
  dadjoke: 'joke',
  roast: 'roast',
  burn: 'roast',
  8ball: '8ball',
  ask: '8ball',
  fortune: '8ball',
  choose: 'choose',
  pick: 'choose',
  random: 'random',
  rng: 'random',
  trivia: 'trivia',
  quiz: 'trivia',
  question: 'trivia',
  hangman: 'hangman',
  wordle: 'wordle',
  guess: 'wordle',
  blackjack: 'blackjack',
  bj: 'blackjack',
  21: 'blackjack',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Giveaway (15 aliases) ──────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  gcreate: 'gcreate',
  gstart: 'gcreate',
  gbegin: 'gcreate',
  gend: 'gend',
  gstop: 'gend',
  gfinish: 'gend',
  gdelete: 'gdelete',
  gremove: 'gdelete',
  greroll: 'greroll',
  groll: 'greroll',
  glist: 'glist',
  giveaways: 'glist',
  gentries: 'gentries',
  gwinners: 'gwinners',
  gedit: 'gedit',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Ticket System (15 aliases) ─────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  ticket: 'ticket',
  t: 'ticket',
  new: 'ticket',
  create: 'ticket',
  open: 'ticket',
  close: 'close',
  end: 'close',
  resolve: 'close',
  add: 'add',
  remove: 'remove',
  ticketpanel: 'ticketpanel',
  tpanel: 'ticketpanel',
  ticketsetup: 'ticketsetup',
  tsetup: 'ticketsetup',
  transcript: 'transcript',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Verification (10 aliases) ──────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  ver: 'verify',
  verify: 'verify',
  vadmin: 'verification',
  verification: 'verification',
  verifysetup: 'verification',
  av: 'autoverify',
  autoverify: 'autoverify',
  verifyrole: 'verifyrole',
  captcha: 'captcha',
  verifylog: 'verifylog',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Welcome & Goodbye (15 aliases) ─────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  welcome: 'welcome',
  greet: 'greet',
  welcomemsg: 'welcome',
  welcomeimg: 'welcomeimg',
  welcomecard: 'welcomeimg',
  goodbye: 'goodbye',
  leave: 'goodbye',
  leavemsg: 'goodbye',
  goodbyecard: 'goodbyecard',
  autorole: 'autorole',
  joinrole: 'autorole',
  defaultrole: 'autorole',
  welcometest: 'welcometest',
  goodbyetest: 'goodbyetest',
  welcomelb: 'welcomelb',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Music (25 aliases) ─────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  np: 'nowplaying',
  now: 'nowplaying',
  playing: 'nowplaying',
  current: 'nowplaying',
  song: 'nowplaying',
  play: 'play',
  p: 'play',
  yt: 'play',
  youtube: 'play',
  spotify: 'play',
  soundcloud: 'play',
  sc: 'play',
  skip: 'skip',
  s: 'skip',
  next: 'skip',
  fs: 'skip',
  forceskip: 'skip',
  queue: 'queue',
  q: 'queue',
  list: 'queue',
  songs: 'queue',
  pause: 'pause',
  stop: 'pause',
  resume: 'resume',
  r: 'resume',
  unpause: 'resume',
  continue: 'resume',
  stop: 'stop',
  end: 'stop',
  leave: 'stop',
  disconnect: 'disconnect',
  dc: 'disconnect',
  quit: 'disconnect',
  volume: 'volume',
  vol: 'volume',
  v: 'volume',
  loop: 'loop',
  repeat: 'loop',
  l: 'loop',
  shuffle: 'shuffle',
  shuff: 'shuffle',
  randomize: 'shuffle',
  lyrics: 'lyrics',
  lyric: 'lyrics',
  words: 'lyrics',
  search: 'search',
  find: 'search',
  lookup: 'search',
  remove: 'remove',
  rm: 'remove',
  deq: 'remove',
  move: 'move',
  mv: 'move',
  jump: 'move',
  skipto: 'skipto',
  playnext: 'playnext',
  pn: 'playnext',
  playskip: 'playskip',
  ps: 'playskip',
  bassboost: 'bassboost',
  bb: 'bassboost',
  nightcore: 'nightcore',
  nc: 'nightcore',
  vaporwave: 'vaporwave',
  vw: 'vaporwave',
  speed: 'speed',
  tempo: 'speed',
  pitch: 'pitch',
  seek: 'seek',
  goto: 'seek',
  rewind: 'rewind',
  rw: 'rewind',
  forward: 'forward',
  ff: 'forward',
  savequeue: 'savequeue',
  loadqueue: 'loadqueue',
  playlist: 'playlist',
  pl: 'playlist',
  autoplay: 'autoplay',
  related: 'autoplay',
  radio: 'radio',
  station: 'radio',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Server Stats / Logging (10 aliases) ────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  serverstats: 'serverstats',
  ss: 'serverstats',
  sstats: 'serverstats',
  statschannel: 'serverstats',
  membercount: 'membercount',
  mc: 'membercount',
  boostcount: 'boostcount',
  bc: 'boostcount',
  logsetup: 'logsetup',
  auditlog: 'auditlog',
  messagelog: 'messagelog',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Reaction Roles (10 aliases) ──────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  rr: 'reactroles',
  reactionroles: 'reactroles',
  reactionrole: 'reactroles',
  rrpanel: 'rrpanel',
  rrsetup: 'rrsetup',
  rradd: 'rradd',
  rrremove: 'rrremove',
  rrlist: 'rrlist',
  rredit: 'rredit',
  rrclear: 'rrclear',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Join-To-Create / Voice (10 aliases) ────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  jtc: 'jointocreate',
  jointocreate: 'jointocreate',
  vctemp: 'jointocreate',
  tempvc: 'jointocreate',
  jtcsetup: 'jtcsetup',
  jtcconfig: 'jtcconfig',
  voiceclaim: 'voiceclaim',
  vcclaim: 'voiceclaim',
  voicetransfer: 'voicetransfer',
  vclock: 'vclock',
  vclimit: 'vclimit',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Suggestions (10 aliases) ───────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  suggest: 'suggest',
  idea: 'suggest',
  feedback: 'suggest',
  suggestion: 'suggest',
  suggestsetup: 'suggestsetup',
  suggestchannel: 'suggestchannel',
  suggestapprove: 'suggestapprove',
  suggestdeny: 'suggestdeny',
  suggestconsider: 'suggestconsider',
  suggestimplement: 'suggestimplement',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Starboard (8 aliases) ──────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  starboard: 'starboard',
  sb: 'starboard',
  star: 'starboard',
  starsetup: 'starsetup',
  staremoji: 'staremoji',
  starthreshold: 'starthreshold',
  starlb: 'starlb',
  starleaderboard: 'starlb',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Counting / Leveling Games (8 aliases) ──────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  counting: 'counting',
  count: 'counting',
  countsetup: 'countsetup',
  countlb: 'countlb',
  countinglb: 'countlb',
  guessnumber: 'guessnumber',
  gn: 'guessnumber',
  numbergame: 'guessnumber',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Logging & Reports (8 aliases) ──────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  report: 'report',
  reports: 'report',
  reportuser: 'reportuser',
  reportsetup: 'reportsetup',
  ticketreport: 'ticketreport',
  feedback: 'feedback',
  bugreport: 'bugreport',
  bug: 'bugreport',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Custom Commands / Tags (8 aliases) ───────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  tag: 'tag',
  tags: 'tags',
  cc: 'customcommand',
  customcommand: 'customcommand',
  addtag: 'addtag',
  edittag: 'edittag',
  deletetag: 'deletetag',
  taglist: 'taglist',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Reminders & Timers (8 aliases) ─────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  remind: 'remind',
  reminder: 'remind',
  remindme: 'remind',
  remindall: 'remindall',
  timer: 'timer',
  countdown: 'timer',
  alarm: 'alarm',
  remindlist: 'remindlist',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Todo (10 aliases) ──────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  todo: 'todo',
  task: 'todo',
  tasks: 'todo',
  checklist: 'todo',
  todoadd: 'todoadd',
  addtask: 'todoadd',
  todoremove: 'todoremove',
  todolist: 'todolist',
  todoclear: 'todoclear',
  tododone: 'tododone',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Social / Profile (10 aliases) ──────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  rep: 'reputation',
  reputation: 'reputation',
  respect: 'reputation',
  repgive: 'repgive',
  repboard: 'repboard',
  profile: 'profile',
  bio: 'bio',
  setbio: 'bio',
  background: 'background',
  bg: 'background',
  badge: 'badge',
  badges: 'badges',
  title: 'title',
  customstatus: 'customstatus',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Admin / Owner (10 aliases) ─────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  eval: 'eval',
  execute: 'eval',
  exec: 'exec',
  shell: 'exec',
  reload: 'reload',
  restart: 'restart',
  reboot: 'restart',
  shutdown: 'shutdown',
  maintenance: 'maintenance',
  setprefix: 'setprefix',
  prefix: 'setprefix',
  blacklistuser: 'blacklistuser',
  blacklistguild: 'blacklistguild',
  whitelist: 'whitelist',
  owner: 'owner',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Image / Manipulation (8 aliases) ───────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  trigger: 'trigger',
  triggered: 'trigger',
  blur: 'blur',
  pixelate: 'pixelate',
  invert: 'invert',
  greyscale: 'greyscale',
  grayscale: 'greyscale',
  wanted: 'wanted',
  jail: 'jail',
  rip: 'rip',
  trash: 'trash',
  beautiful: 'beautiful',
  facepalm: 'facepalm',
  affect: 'affect',
  bobross: 'bobross',
  deleteimg: 'deleteimg',
  hitler: 'hitler',
  kissimg: 'kissimg',
  slapimg: 'slapimg',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Anime / Manga (8 aliases) ──────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  anime: 'anime',
  manga: 'manga',
  character: 'character',
  char: 'character',
  anilist: 'anilist',
  mal: 'mal',
  myanimelist: 'mal',
  animequote: 'animequote',
  waifupic: 'waifupic',
  neko: 'neko',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Minecraft / Gaming (8 aliases) ───────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  mcserver: 'mcserver',
  minecraft: 'mcserver',
  mcskin: 'mcskin',
  mcuser: 'mcuser',
  steam: 'steam',
  fortnite: 'fortnite',
  fn: 'fortnite',
  apex: 'apex',
  valorant: 'valorant',
  val: 'valorant',
  lol: 'lol',
  league: 'lol',
  osu: 'osu',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── NSFW / 18+ (6 aliases) ─────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  nsfw: 'nsfw',
  lewd: 'nsfw',
  rule34: 'rule34',
  r34: 'rule34',
  gelbooru: 'gelbooru',
  danbooru: 'danbooru',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Misc / Extra (10 aliases) ──────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  color: 'color',
  colour: 'color',
  hex: 'color',
  rgb: 'rgb',
  password: 'password',
  passgen: 'password',
  shorten: 'shorten',
  url: 'shorten',
  base64: 'base64',
  encode: 'encode',
  decode: 'decode',
  binary: 'binary',
  morse: 'morse',
  ascii: 'ascii',
  figlet: 'figlet',
  textart: 'figlet',
  firstmsg: 'firstmsg',
  firstmessage: 'firstmsg',
  permissions: 'permissions',
  perms: 'permissions',
  botperms: 'botperms',
  inviteinfo: 'inviteinfo',
  invinfo: 'inviteinfo',
  vanity: 'vanity',
  splash: 'splash',
  discover: 'discover',
  bump: 'bump',
  review: 'review',
  serverreview: 'review',
  serverlist: 'serverlist',
  partners: 'partners',
};

// ─── Subcommand Aliases ─────────────────────────────────────────────────────

export const subcommandAliases = {
  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Generic (12 aliases) ───────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  l: 'list',
  ls: 'list',
  all: 'list',
  s: 'set',
  set: 'set',
  update: 'set',
  edit: 'set',
  i: 'info',
  details: 'info',
  view: 'info',
  show: 'info',
  r: 'remove',
  rm: 'remove',
  del: 'remove',
  delete: 'remove',
  n: 'next',
  next: 'next',
  sc: 'setchannel',
  setchannel: 'setchannel',
  setrole: 'setrole',
  sr: 'setrole',
  enable: 'enable',
  on: 'enable',
  disable: 'disable',
  off: 'disable',
  reset: 'reset',
  default: 'reset',
  toggle: 'toggle',
  t: 'toggle',
  create: 'create',
  new: 'create',
  add: 'add',
  a: 'add',
  remove: 'remove',
  rm: 'remove',
  clear: 'clear',
  purge: 'clear',
  config: 'config',
  cfg: 'config',
  settings: 'config',
  setup: 'setup',
  init: 'setup',
  test: 'test',
  preview: 'test',
  export: 'export',
  import: 'import',
  backup: 'backup',
  restore: 'restore',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Todo (6 aliases) ───────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  a: 'add',
  c: 'complete',
  done: 'complete',
  finish: 'complete',
  d: 'complete',
  check: 'complete',
  uncheck: 'uncheck',
  prioritize: 'prioritize',
  urgent: 'prioritize',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Giveaway (6 aliases) ───────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  start: 'create',
  begin: 'create',
  launch: 'create',
  stop: 'end',
  finish: 'end',
  terminate: 'end',
  roll: 'reroll',
  reroll: 'reroll',
  redraw: 'reroll',
  entries: 'entries',
  participants: 'entries',
  requirements: 'requirements',
  reqs: 'requirements',
  prize: 'prize',
  winners: 'winners',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Reaction Roles (6 aliases) ───────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  add: 'add',
  create: 'add',
  remove: 'remove',
  delete: 'remove',
  list: 'list',
  view: 'list',
  edit: 'edit',
  update: 'edit',
  type: 'type',
  style: 'type',
  unique: 'unique',
  max: 'max',
  min: 'min',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Auto-Moderation (18 aliases) ───────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  enable: 'enable',
  on: 'enable',
  activate: 'enable',
  disable: 'disable',
  off: 'disable',
  deactivate: 'disable',
  config: 'configure',
  cfg: 'configure',
  settings: 'configure',
  configure: 'configure',
  logs: 'logs',
  logchannel: 'logs',
  whitelist: 'whitelist',
  wl: 'whitelist',
  allow: 'whitelist',
  blacklist: 'blacklist',
  bl: 'blacklist',
  block: 'blacklist',
  deny: 'blacklist',
  threshold: 'threshold',
  limit: 'threshold',
  max: 'threshold',
  action: 'action',
  punish: 'action',
  punishment: 'action',
  exempt: 'exempt',
  ignore: 'exempt',
  bypass: 'exempt',
  exemptrole: 'exemptrole',
  exemptchannel: 'exemptchannel',
  duration: 'duration',
  time: 'duration',
  cooldown: 'cooldown',
  cd: 'cooldown',
  notify: 'notify',
  dm: 'notify',
  message: 'message',
  msg: 'message',
  reason: 'reason',
  custommsg: 'custommsg',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Music Subcommands (10 aliases) ─────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  now: 'now',
  next: 'next',
  prev: 'prev',
  previous: 'prev',
  loopone: 'loopone',
  loopall: 'loopall',
  loopoff: 'loopoff',
  loopqueue: 'loopqueue',
  looptrack: 'looptrack',
  clearqueue: 'clearqueue',
  cq: 'clearqueue',
  remove: 'remove',
  deq: 'remove',
  skipto: 'skipto',
  jumpto: 'skipto',
  moveto: 'moveto',
  swap: 'swap',
  replay: 'replay',
  restart: 'restart',
  lyrics: 'lyrics',
  related: 'related',
  similar: 'related',
  filter: 'filter',
  eq: 'filter',
  equalizer: 'filter',
  bass: 'bass',
  treble: 'treble',
  karaoke: 'karaoke',
  tremolo: 'tremolo',
  vibrato: 'vibrato',
  earrape: 'earrape',
  superslow: 'superslow',
  superspeed: 'superspeed',
  reverse: 'reverse',
  '8d': '8d',
  '3d': '3d',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Leveling Subcommands (8 aliases) ─────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  setchannel: 'setchannel',
  setmessage: 'setmessage',
  setimage: 'setimage',
  setcolor: 'setcolor',
  setbg: 'setbg',
  doublexp: 'doublexp',
  weekendxp: 'weekendxp',
  noxprole: 'noxprole',
  resetuser: 'resetuser',
  resetall: 'resetall',
  import: 'import',
  export: 'export',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Welcome Subcommands (8 aliases) ────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  setchannel: 'setchannel',
  setmessage: 'setmessage',
  setimage: 'setimage',
  setcolor: 'setcolor',
  setfooter: 'setfooter',
  setdm: 'setdm',
  test: 'test',
  preview: 'test',
  reset: 'reset',
  default: 'reset',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Ticket Subcommands (8 aliases) ─────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  open: 'open',
  reopen: 'reopen',
  close: 'close',
  claim: 'claim',
  unclaim: 'unclaim',
  assign: 'assign',
  priority: 'priority',
  note: 'note',
  transcript: 'transcript',
  archive: 'archive',
  category: 'category',
  panel: 'panel',
  button: 'button',
  modal: 'modal',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Moderation Subcommands (8 aliases) ─────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  history: 'history',
  modstats: 'modstats',
  duration: 'duration',
  extend: 'extend',
  reduce: 'reduce',
  reason: 'reason',
  edit: 'edit',
  appeal: 'appeal',
  revoke: 'revoke',
  softban: 'softban',
  tempban: 'tempban',
  massban: 'massban',
  masskick: 'masskick',
  massmute: 'massmute',
  voicemute: 'voicemute',
  voicekick: 'voicekick',
  move: 'move',
  drag: 'move',
  deafen: 'deafen',
  undeafen: 'undeafen',
  disconnect: 'disconnect',
  dc: 'disconnect',

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Economy Subcommands (8 aliases) ──────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  work: 'work',
  crime: 'crime',
  slut: 'slut',
  whore: 'slut',
  rob: 'rob',
  steal: 'rob',
  deposit: 'deposit',
  withdraw: 'withdraw',
  give: 'give',
  share: 'share',
  slots: 'slots',
  roulette: 'roulette',
  blackjack: 'blackjack',
  bj: 'blackjack',
  coinflip: 'coinflip',
  cf: 'coinflip',
  horse: 'horse',
  bet: 'bet',
  lottery: 'lottery',
  lotto: 'lottery',
  scratch: 'scratch',
  invest: 'invest',
  stock: 'stock',
  crypto: 'crypto',
  bitcoin: 'bitcoin',
  btc: 'bitcoin',
  pet: 'pet',
  petbuy: 'petbuy',
  petfeed: 'petfeed',
  pettrain: 'pettrain',
  petfight: 'petfight',
  petlist: 'petlist',
  marry: 'marry',
  divorce: 'divorce',
  family: 'family',
  adopt: 'adopt',
  disown: 'disown',
  shop: 'shop',
  buy: 'buy',
  sell: 'sell',
  use: 'use',
  inventory: 'inventory',
  inv: 'inventory',
  craft: 'craft',
  recipe: 'recipe',
  leaderboard: 'leaderboard',
  lb: 'leaderboard',
  rich: 'rich',
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
  vote: 'vote',
  streak: 'streak',
  achievements: 'achievements',
  badges: 'badges',
  title: 'title',
  titles: 'titles',
  background: 'background',
  card: 'card',
  customize: 'customize',
  reset: 'reset',
  prestige: 'prestige',
  rebirth: 'prestige',
  loan: 'loan',
  bankrob: 'bankrob',
  heist: 'heist',
  bounty: 'bounty',
  contract: 'contract',
  hit: 'hit',
  job: 'job',
  jobs: 'jobs',
  apply: 'apply',
  resign: 'resign',
  promote: 'promote',
  demote: 'demote',
  company: 'company',
  business: 'company',
  shopcreate: 'shopcreate',
  shopedit: 'shopedit',
  shopdelete: 'shopdelete',
  auction: 'auction',
  bid: 'bid',
  trade: 'trade',
  market: 'market',
  fish: 'fish',
  hunt: 'hunt',
  dig: 'dig',
  chop: 'chop',
  mine: 'mine',
  explore: 'explore',
  adventure: 'adventure',
  quest: 'quest',
  dungeon: 'dungeon',
  raid: 'raid',
  boss: 'boss',
  battle: 'battle',
  training: 'training',
  train: 'train',
  levelup: 'levelup',
  skill: 'skill',
  skills: 'skills',
  skilltree: 'skilltree',
  upgrade: 'upgrade',
  enchant: 'enchant',
  forge: 'forge',
  repair: 'repair',
  durability: 'durability',
  stats: 'stats',
  profile: 'profile',
  settings: 'settings',
  config: 'config',
};

// ─── Auto-Moderation Rule Aliases ─────────────────────────────────────────────

export const automodRuleAliases = {
  // Spam detection
  spam: 'antiSpam',
  'anti-spam': 'antiSpam',
  flood: 'antiSpam',
  flooding: 'antiSpam',
  repetition: 'antiSpam',
  repeat: 'antiSpam',
  copypaste: 'antiSpam',
  chain: 'antiSpam',

  // Raid protection
  raid: 'antiRaid',
  'anti-raid': 'antiRaid',
  'mass-join': 'antiRaid',
  joinstorm: 'antiRaid',
  joinflood: 'antiRaid',
  botraid: 'antiRaid',
  altraid: 'antiRaid',
  nuke: 'antiRaid',

  // Caps lock
  caps: 'antiCaps',
  'all-caps': 'antiCaps',
  uppercase: 'antiCaps',
  'caps-lock': 'antiCaps',
  screaming: 'antiCaps',
  yell: 'antiCaps',

  // Invite links
  invites: 'antiInvite',
  'discord-invites': 'antiInvite',
  'server-ads': 'antiInvite',
  'guild-invites': 'antiInvite',
  inviteads: 'antiInvite',
  selfpromo: 'antiInvite',
  externalinvite: 'antiInvite',

  // External links
  links: 'antiLink',
  urls: 'antiLink',
  'external-links': 'antiLink',
  phishing: 'antiLink',
  scamlinks: 'antiLink',
  malware: 'antiLink',
  ipgrabber: 'antiLink',
  suspicious: 'antiLink',

  // Mentions
  mentions: 'mentionSpam',
  'mass-mentions': 'mentionSpam',
  'everyone-spam': 'mentionSpam',
  'here-spam': 'mentionSpam',
  pingspam: 'mentionSpam',
  mentionabuse: 'mentionSpam',
  roleping: 'mentionSpam',

  // NSFW / inappropriate
  nsfw: 'antiNsfw',
  inappropriate: 'antiNsfw',
  lewd: 'antiNsfw',
  porn: 'antiNsfw',
  hentai: 'antiNsfw',
  sexual: 'antiNsfw',
  gore: 'antiNsfw',
  violence: 'antiNsfw',

  // Zalgo / unicode abuse
  zalgo: 'antiZalgo',
  unicode: 'antiZalgo',
  'special-chars': 'antiZalgo',
  diacritics: 'antiZalgo',
  glitchtext: 'antiZalgo',
  cursed: 'antiZalgo',
  weirdtext: 'antiZalgo',

  // Profanity / bad words
  profanity: 'antiProfanity',
  swear: 'antiProfanity',
  slurs: 'antiProfanity',
  badwords: 'antiProfanity',
  cursing: 'antiProfanity',
  language: 'antiProfanity',
  toxicity: 'antiProfanity',
  insult: 'antiProfanity',

  // Self-bot / ghost pings
  selfbot: 'antiSelfbot',
  ghostping: 'antiGhostPing',
  'ghost-ping': 'antiGhostPing',
  pingdelete: 'antiGhostPing',

  // Dehoist / nickname abuse
  dehoist: 'antiDehoist',
  hoisting: 'antiDehoist',
  'z-name': 'antiDehoist',
  symbolname: 'antiDehoist',

  // Emoji spam
  emojispam: 'antiEmojiSpam',
  'emoji-spam': 'antiEmojiSpam',
  emoteflood: 'antiEmojiSpam',
  'emoji-abuse': 'antiEmojiSpam',

  // Newline / wall spam
  newline: 'antiNewline',
  'newline-spam': 'antiNewline',
  walltext: 'antiNewline',
  'wall-of-text': 'antiNewline',
  enterspam: 'antiNewline',

  // Sticker / GIF spam
  sticker: 'antiStickerSpam',
  'sticker-spam': 'antiStickerSpam',
  gifspam: 'antiGifSpam',
  'gif-spam': 'antiGifSpam',
  imageflood: 'antiImageFlood',
  'image-spam': 'antiImageFlood',

  // Spam bots / webhook spam
  webhookspam: 'antiWebhookSpam',
  'webhook-spam': 'antiWebhookSpam',
  botspam: 'antiBotSpam',
  'bot-spam': 'antiBotSpam',
  tokenleak: 'antiTokenLeak',
  'token-leak': 'antiTokenLeak',
  doxxing: 'antiDoxxing',
  'doxx-protection': 'antiDoxxing',
};

// ─── Auto-Moderation Action Aliases ─────────────────────────────────────────

export const automodActionAliases = {
  none: 'none',
  off: 'none',
  disable: 'none',
  nothing: 'none',
  ignore: 'none',

  log: 'logOnly',
  'log-only': 'logOnly',
  record: 'logOnly',
  audit: 'logOnly',
  monitor: 'logOnly',

  warn: 'warnUser',
  'warn-user': 'warnUser',
  alert: 'warnUser',
  caution: 'warnUser',
  notify: 'warnUser',
  dm: 'warnUser',

  delete: 'deleteMessage',
  'delete-msg': 'deleteMessage',
  remove: 'deleteMessage',
  del: 'deleteMessage',
  purge: 'deleteMessage',
  erase: 'deleteMessage',

  'warn-delete': 'warnAndDelete',
  'delete-warn': 'warnAndDelete',
  'warn-del': 'warnAndDelete',
  'del-warn': 'warnAndDelete',
  'alert-delete': 'warnAndDelete',

  mute: 'timeoutUser',
  'timeout-user': 'timeoutUser',
  'temp-mute': 'timeoutUser',
  silence: 'timeoutUser',
  restrict: 'timeoutUser',
  quarantine: 'timeoutUser',
  shadowban: 'timeoutUser',

  kick: 'kickUser',
  'kick-user': 'kickUser',
  remove: 'kickUser',
  eject: 'kickUser',
  boot: 'kickUser',

  ban: 'banUser',
  'ban-user': 'banUser',
  permaban: 'banUser',
  hackban: 'banUser',
  'force-ban': 'banUser',
  'id-ban': 'banUser',

  softban: 'softbanUser',
  'soft-ban': 'softbanUser',
  'temp-ban': 'tempbanUser',
  tempban: 'tempbanUser',
  'short-ban': 'softbanUser',

  strikemute: 'strikeMute',
  'strike-mute': 'strikeMute',
  'warn-mute': 'strikeMute',
  '3-strike': 'strikeMute',
  '3-warn': 'strikeMute',

  strikemute: 'strikeBan',
  'strike-ban': 'strikeBan',
  '3-strike-ban': 'strikeBan',
  '3-warn-ban': 'strikeBan',
};

// ─── Resolve Functions ───────────────────────────────────────────────────────

/**
 * Resolve a command alias to its full command name
 * @param {string} commandName - The command name (could be an alias)
 * @returns {string} - The full command name, or the original if not an alias
 */
export function resolveCommandAlias(commandName) {
  if (!commandName || typeof commandName !== 'string') {
    return commandName;
  }
  const normalized = commandName.trim().toLowerCase().substring(0, MAX_ALIAS_LENGTH);
  return commandAliases[normalized] || normalized;
}

/**
 * Resolve a subcommand alias to its full subcommand name
 * @param {string} subcommandName - The subcommand name (could be an alias)
 * @returns {string} - The full subcommand name, or the original if not an alias
 */
export function resolveSubcommandAlias(subcommandName) {
  if (!subcommandName || typeof subcommandName !== 'string') {
    return subcommandName;
  }
  const normalized = subcommandName.trim().toLowerCase().substring(0, MAX_ALIAS_LENGTH);
  return subcommandAliases[normalized] || normalized;
}

/**
 * Resolve an auto-moderation rule alias
 * @param {string} ruleName
 * @returns {string}
 */
export function resolveAutomodRule(ruleName) {
  if (!ruleName || typeof ruleName !== 'string') {
    return ruleName;
  }
  const normalized = ruleName.trim().toLowerCase();
  return automodRuleAliases[normalized] || normalized;
}

/**
 * Resolve an auto-moderation action alias
 * @param {string} actionName
 * @returns {string}
 */
export function resolveAutomodAction(actionName) {
  if (!actionName || typeof actionName !== 'string') {
    return actionName;
  }
  const normalized = actionName.trim().toLowerCase();
  return automodActionAliases[normalized] || normalized;
}

// ─── Introspection ───────────────────────────────────────────────────────────

/**
 * Check if a command name is a known alias
 * @param {string} commandName
 * @returns {boolean}
 */
export function isCommandAlias(commandName) {
  if (!commandName || typeof commandName !== 'string') return false;
  return commandName.trim().toLowerCase() in commandAliases;
}

/**
 * Check if a subcommand name is a known alias
 * @param {string} subcommandName
 * @returns {boolean}
 */
export function isSubcommandAlias(subcommandName) {
  if (!subcommandName || typeof subcommandName !== 'string') return false;
  return subcommandName.trim().toLowerCase() in subcommandAliases;
}

/**
 * Check if an auto-moderation rule name is a known alias
 * @param {string} ruleName
 * @returns {boolean}
 */
export function isAutomodRuleAlias(ruleName) {
  if (!ruleName || typeof ruleName !== 'string') return false;
  return ruleName.trim().toLowerCase() in automodRuleAliases;
}

/**
 * Check if an auto-moderation action name is a known alias
 * @param {string} actionName
 * @returns {boolean}
 */
export function isAutomodActionAlias(actionName) {
  if (!actionName || typeof actionName !== 'string') return false;
  return actionName.trim().toLowerCase() in automodActionAliases;
}

/**
 * Get all aliases for a given command name
 * @param {string} fullCommandName
 * @returns {string[]} - Array of aliases (empty if none)
 */
export function getAliasesForCommand(fullCommandName) {
  const target = fullCommandName.toLowerCase();
  return Object.entries(commandAliases)
    .filter(([, full]) => full === target)
    .map(([alias]) => alias);
}

/**
 * Get all aliases for a given subcommand name
 * @param {string} fullSubcommandName
 * @returns {string[]}
 */
export function getAliasesForSubcommand(fullSubcommandName) {
  const target = fullSubcommandName.toLowerCase();
  return Object.entries(subcommandAliases)
    .filter(([, full]) => full === target)
    .map(([alias]) => alias);
}

/**
 * Get all aliases for a given auto-moderation rule
 * @param {string} fullRuleName
 * @returns {string[]}
 */
export function getAliasesForAutomodRule(fullRuleName) {
  const target = fullRuleName.toLowerCase();
  return Object.entries(automodRuleAliases)
    .filter(([, full]) => full === target)
    .map(([alias]) => alias);
}

/**
 * Get all aliases for a given auto-moderation action
 * @param {string} fullActionName
 * @returns {string[]}
 */
export function getAliasesForAutomodAction(fullActionName) {
  const target = fullActionName.toLowerCase();
  return Object.entries(automodActionAliases)
    .filter(([, full]) => full === target)
    .map(([alias]) => alias);
}

/**
 * Get all available auto-moderation rules
 * @returns {string[]}
 */
export function getAvailableAutomodRules() {
  return [...new Set(Object.values(automodRuleAliases))];
}

/**
 * Get all available auto-moderation actions
 * @returns {string[]}
 */
export function getAvailableAutomodActions() {
  return [...new Set(Object.values(automodActionAliases))];
}

/**
 * Get all available command names (unique full commands)
 * @returns {string[]}
 */
export function getAvailableCommands() {
  return [...new Set(Object.values(commandAliases))];
}

/**
 * Get all available subcommand names (unique full subcommands)
 * @returns {string[]}
 */
export function getAvailableSubcommands() {
  return [...new Set(Object.values(subcommandAliases))];
}

/**
 * Get total alias count statistics
 * @returns {{commands: number, subcommands: number, automodRules: number, automodActions: number, total: number}}
 */
export function getAliasStats() {
  return {
    commands: Object.keys(commandAliases).length,
    subcommands: Object.keys(subcommandAliases).length,
    automodRules: Object.keys(automodRuleAliases).length,
    automodActions: Object.keys(automodActionAliases).length,
    total: Object.keys(commandAliases).length + Object.keys(subcommandAliases).length + Object.keys(automodRuleAliases).length + Object.keys(automodActionAliases).length,
  };
}

// ─── Default Export ─────────────────────────────────────────────────────────

export default {
  commandAliases,
  subcommandAliases,
  automodRuleAliases,
  automodActionAliases,
  resolveCommandAlias,
  resolveSubcommandAlias,
  resolveAutomodRule,
  resolveAutomodAction,
  isCommandAlias,
  isSubcommandAlias,
  isAutomodRuleAlias,
  isAutomodActionAlias,
  getAliasesForCommand,
  getAliasesForSubcommand,
  getAliasesForAutomodRule,
  getAliasesForAutomodAction,
  getAvailableCommands,
  getAvailableSubcommands,
  getAvailableAutomodRules,
  getAvailableAutomodActions,
  getAliasStats,
};
