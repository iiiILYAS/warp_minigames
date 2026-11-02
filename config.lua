--[[
    ╔══════════════════════════════════════════════════════════════════════╗
    ║                                                                      ║
    ║        ██╗    ██╗  █████╗  ██████╗  ██████╗                          ║
    ║        ██║    ██║ ██╔══██╗ ██╔══██╗ ██╔══██╗                         ║
    ║        ██║ █╗ ██║ ███████║ ██████╔╝ ██████╔╝                         ║
    ║        ██║███╗██║ ██╔══██║ ██╔══██╗ ██╔═══╝                          ║
    ║        ╚███╔███╔╝ ██║  ██║ ██║  ██║ ██║                              ║
    ║         ╚══╝╚══╝  ╚═╝  ╚═╝ ╚═╝  ╚═╝ ╚═╝                              ║
    ║                                                                      ║
    ║        ━━━━━━━━━━━━  M I N I G A M E S  ·  v1.0.0  ━━━━━━━━━━━━      ║
    ║                                                                      ║
    ║        © WarP Scripts — All rights reserved                          ║
    ║        Discord  ›  discord.gg/w4p                                    ║
    ║        Store    ›  warp-scripts.pages.dev                            ║
    ║                                                                      ║
    ║        16 minigames · QBCore · Qbox · ESX · Standalone               ║
    ║        Docs, exports and examples  ›  README.md                      ║
    ║                                                                      ║
    ╚══════════════════════════════════════════════════════════════════════╝
]]

Config = {}

-- ┌──────────────────────────────────────────────────────────────────────┐
-- │  01 · GENERAL                                                        │
-- └──────────────────────────────────────────────────────────────────────┘

Config.Framework    = 'auto'       -- 'auto' | 'qb' | 'qbx' | 'esx' | 'standalone'
Config.CoreResource = 'auto'       -- 'auto', or the name of your core if you renamed it (it must have the QBCore API)
Config.Locale       = 'en'         -- 'en' | 'ar'   (files in web/locales/*.json - add your own)
Config.Debug        = false        -- prints every start / result in F8 and the server console

Config.DefaultDifficulty = 'normal' -- 'easy' | 'normal' | 'hard'  (used when a script does not pass one)
Config.SequenceGap       = 400      -- ms between two games of a Sequence()

-- ┌──────────────────────────────────────────────────────────────────────┐
-- │  02 · THEME  —  every colour of the UI lives here                    │
-- └──────────────────────────────────────────────────────────────────────┘
--  Ready accents:  WarP '#FFFFFF' · Gold '#E6B04E' · Red '#FF3B4E' · Blue '#3D8BFF'
--                  Green '#2EE59D' · Purple '#9B6BFF' · Orange '#FF8A3D' · Cyan '#22D3EE'

Config.Theme = {
    accent     = '#FFFFFF',   -- active pieces, timer bar, highlights
    success    = '#2EE59D',   -- "ACCESS GRANTED" screen
    danger     = '#FF4D5E',   -- mistakes, low timer, "FAILED" screen
    background = '#0D0E10',   -- card body
    header     = '#121316',   -- card header
    surface    = '#17191C',   -- inner panels / canvases
    cell       = '#202328',   -- tiles, tracks, empty slots
    text       = '#F4F5F7',   -- titles
    muted      = '#868C96',   -- hints, labels
    backdrop   = 0.70,        -- 0.0 - 1.0  darkness behind the card
    radius     = 8,           -- card corner radius (px)
}

-- ┌──────────────────────────────────────────────────────────────────────┐
-- │  03 · INTERFACE                                                      │
-- └──────────────────────────────────────────────────────────────────────┘

Config.UI = {
    position  = 'center',     -- 'center' | 'left' | 'right'
    scale     = 1.0,          -- 0.8 - 1.3
    keyHints  = true,         -- key hints under the card
    sounds    = true,
    volume    = 0.6,          -- 0.0 - 1.0
    brand     = 'WARP',       -- small label on the top-left of the card ('' = hidden)
    kicker    = 'auto',       -- line above the title: 'auto' = from the language file, '' = hidden, or your own text
}

-- ┌──────────────────────────────────────────────────────────────────────┐
-- │  04 · CANCEL RULES                                                   │
-- └──────────────────────────────────────────────────────────────────────┘

Config.Cancel = {
    escape    = true,         -- ESC gives up (counts as a fail)
    onDeath   = true,         -- dying ends the game as a fail
    onRagdoll = false,        -- getting knocked down ends the game as a fail
}

-- ┌──────────────────────────────────────────────────────────────────────┐
-- │  05 · SECURITY  —  for server-side starts (exports on the server)    │
-- └──────────────────────────────────────────────────────────────────────┘

Config.Security = {
    minTime = 1.2,            -- seconds; a "win" faster than this per game is rejected as a cheat
    timeout = 300,            -- seconds; the server stops waiting after this
    kick    = false,          -- kick players that send forged results
    webhook = '',             -- Discord webhook for cheat logs ('' = off)
}

-- ┌──────────────────────────────────────────────────────────────────────┐
-- │  06 · NOTIFICATIONS                                                  │
-- └──────────────────────────────────────────────────────────────────────┘

Config.Notify = {
    onResult = false,         -- show a notification after every game
    system   = 'auto',        -- 'auto' | 'ox' | 'qb' | 'qbx' | 'esx' | 'native' | 'custom'
    custom   = function(message, kind)    -- used when system = 'custom' (client side)
        -- exports['my-notify']:Show(message, kind)
    end,
}

-- ┌──────────────────────────────────────────────────────────────────────┐
-- │  07 · PREVIEW COMMAND  —  /minigames opens the gallery               │
-- └──────────────────────────────────────────────────────────────────────┘

Config.Command = {
    enabled    = true,
    name       = 'minigames',  -- /minigames            -> gallery
                               -- /minigames lock hard  -> one game
    permission = 'admin',      -- framework group (qb/qbx/esx)  ·  ACE 'warp_minigames.preview' also works
    everyone   = false,        -- true = every player can open the gallery
}

-- ┌──────────────────────────────────────────────────────────────────────┐
-- │  08 · ANIMATIONS  —  pass  anim = 'hack'  when you start a game      │
-- └──────────────────────────────────────────────────────────────────────┘

Config.Animations = {
    hack = {
        dict = 'amb@code_human_in_bus_passenger_idles@female@tablet@base', clip = 'base', flag = 49,
        prop = { model = 'prop_cs_tablet', bone = 60309, pos = vec3(0.03, 0.002, -0.0), rot = vec3(10.0, 160.0, 0.0) },
    },
    lockpick = { dict = 'mp_common_heist', clip = 'pick_door', flag = 49 },
    keypad   = { dict = 'anim@heists@keypad@', clip = 'idle_a', flag = 49 },
    phone    = {
        dict = 'cellphone@', clip = 'cellphone_text_read_base', flag = 49,
        prop = { model = 'prop_npc_phone_02', bone = 28422, pos = vec3(0.0, 0.0, 0.0), rot = vec3(0.0, 0.0, 0.0) },
    },
    drill    = {
        dict = 'anim@heists@fleeca_bank@drilling', clip = 'drill_straight_idle', flag = 49,
        prop = { model = 'hei_prop_heist_drill', bone = 57005, pos = vec3(0.14, 0.0, -0.01), rot = vec3(90.0, -90.0, 180.0) },
    },
    mechanic = { dict = 'mini@repair', clip = 'fixing_a_ped', flag = 49 },
}

-- ┌──────────────────────────────────────────────────────────────────────┐
-- │  09 · GAMES  —  enable / disable and tune every difficulty           │
-- └──────────────────────────────────────────────────────────────────────┘
--  time = seconds on the clock. Every other key is explained next to the game.
--  A script can still override any value:  Start('lock', { difficulty = 'hard', pins = 8 })

Config.Games = {

    -- 01 · Lockpick — stop the marker inside the zone, one pin at a time
    lock = { enabled = true,     -- pins, speed (track/sec), zone (0-1 width)
        easy   = { time = 25, pins = 3, speed = 0.65, zone = 0.20 },
        normal = { time = 20, pins = 4, speed = 0.85, zone = 0.16 },
        hard   = { time = 18, pins = 6, speed = 1.10, zone = 0.12 },
    },

    -- 02 · Circle — lock the dot inside the arc
    circle = { enabled = true,   -- rounds, speed (deg/sec), arc (deg)
        easy   = { time = 25, rounds = 3, speed = 150, arc = 56 },
        normal = { time = 20, rounds = 4, speed = 190, arc = 46 },
        hard   = { time = 18, rounds = 6, speed = 240, arc = 36 },
    },

    -- 03 · Skill check — press the shown key when the ring meets the target
    skill = { enabled = true,    -- rounds, speed (sec per shrink), window (px), keys
        easy   = { time = 25, rounds = 4, speed = 1.6, window = 12, keys = { 'E' } },
        normal = { time = 22, rounds = 6, speed = 1.25, window = 9, keys = { 'E', 'Q', 'R' } },
        hard   = { time = 20, rounds = 8, speed = 0.95, window = 7, keys = { 'W', 'A', 'S', 'D', 'E', 'Q' } },
    },

    -- 04 · Thread the wire — hold to rise through the gaps
    thread = { enabled = true,   -- gates, gap (px), speed (px/sec)
        easy   = { time = 35, gates = 6, gap = 84, speed = 100 },
        normal = { time = 30, gates = 8, gap = 74, speed = 115 },
        hard   = { time = 30, gates = 12, gap = 62, speed = 140 },
    },

    -- 05 · Other side — jump when the next gap lines up
    bars = { enabled = true,     -- cols, gap (px)
        easy   = { time = 30, cols = 6, gap = 66 },
        normal = { time = 25, cols = 8, gap = 58 },
        hard   = { time = 25, cols = 10, gap = 50 },
    },

    -- 06 · Remember — memorise the lit tiles
    remember = { enabled = true, -- size (grid), rounds, start (lit tiles in round 1)
        easy   = { time = 30, size = 5, rounds = 2, start = 4 },
        normal = { time = 25, size = 6, rounds = 3, start = 5 },
        hard   = { time = 25, size = 6, rounds = 4, start = 7 },
    },

    -- 07 · Count — how many highlighted tiles were there?
    count = { enabled = true,    -- rounds, cols, rows, show (ms)
        easy   = { time = 30, rounds = 2, cols = 6, rows = 5, show = 1900 },
        normal = { time = 25, rounds = 3, cols = 7, rows = 6, show = 1500 },
        hard   = { time = 25, rounds = 4, cols = 8, rows = 6, show = 1200 },
    },

    -- 08 · Find code — remember the code, find it in the grid
    find = { enabled = true,     -- rounds, cells, show (ms), similar (0-1 look-alikes), slide
        easy   = { time = 35, rounds = 1, cells = 18, show = 3000, similar = 0.2, slide = false },
        normal = { time = 30, rounds = 2, cells = 24, show = 2600, similar = 0.3, slide = false },
        hard   = { time = 30, rounds = 3, cells = 30, show = 2000, similar = 0.45, slide = true },
    },

    -- 09 · Rewire — rotate tiles to connect both nodes
    pipes = { enabled = true,    -- rows, cols
        easy   = { time = 45, rows = 4, cols = 4 },
        normal = { time = 40, rows = 5, cols = 5 },
        hard   = { time = 40, rows = 6, cols = 6 },
    },

    -- 10 · Patch the line — drag the right tiles into the gaps
    connect = { enabled = true,  -- rows, cols, missing
        easy   = { time = 40, rows = 4, cols = 4, missing = 2 },
        normal = { time = 35, rows = 4, cols = 5, missing = 3 },
        hard   = { time = 35, rows = 5, cols = 6, missing = 4 },
    },

    -- 11 · Wires — connect every wire to its colour
    wires = { enabled = true,    -- wires (3-6), penalty (sec per wrong wire)
        easy   = { time = 30, wires = 4, penalty = 2 },
        normal = { time = 25, wires = 5, penalty = 3 },
        hard   = { time = 22, wires = 6, penalty = 4 },
    },

    -- 12 · Calibration — hold the reading inside the target
    knobs = { enabled = true,    -- band (±%), hold (sec)
        easy   = { time = 35, band = 6, hold = 2.0 },
        normal = { time = 30, band = 4, hold = 2.6 },
        hard   = { time = 30, band = 3, hold = 3.4 },
    },

    -- 13 · Safe cracker — find every number of the combination
    safe = { enabled = true,     -- digits, tolerance (±), penalty (sec per wrong try)
        easy   = { time = 45, digits = 2, tolerance = 2, penalty = 3 },
        normal = { time = 40, digits = 3, tolerance = 1, penalty = 4 },
        hard   = { time = 40, digits = 4, tolerance = 1, penalty = 5 },
    },

    -- 14 · Override — type the arrow sequence
    arrows = { enabled = true,   -- len (arrows in round 1), rounds
        easy   = { time = 22, len = 5, rounds = 2 },
        normal = { time = 18, len = 6, rounds = 3 },
        hard   = { time = 18, len = 8, rounds = 3 },
    },

    -- 15 · Match pairs — flip and match every pair
    pairs = { enabled = true,    -- cols, rows (cols*rows must be even), misses (0 = unlimited)
        easy   = { time = 45, cols = 4, rows = 3, misses = 0 },
        normal = { time = 40, cols = 4, rows = 4, misses = 0 },
        hard   = { time = 40, cols = 5, rows = 4, misses = 8 },
    },

    -- 16 · Firewall — type the letters before they fall
    letters = { enabled = true,  -- count, lives
        easy   = { time = 45, count = 10, lives = 4 },
        normal = { time = 45, count = 12, lives = 3 },
        hard   = { time = 45, count = 16, lives = 2 },
    },
}
