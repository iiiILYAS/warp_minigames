-- WarP Minigames · shared helpers  ·  discord.gg/w4p

WarP = WarP or {}
WarP.Resource = GetCurrentResourceName()

-- the game list in display order (the gallery and Random() use it)
WarP.Order = {
    'lock', 'circle', 'skill', 'thread', 'bars', 'remember', 'count', 'find',
    'pipes', 'connect', 'wires', 'knobs', 'safe', 'arrows', 'pairs', 'letters',
}

-- ---------------------------------------------------------------- framework
-- not cached: if this resource starts before the core, the next call still finds it
function WarP.Framework()
    local fw = Config.Framework
    if fw and fw ~= 'auto' then return fw end
    local core = Config.CoreResource
    if core and core ~= 'auto' and GetResourceState(core) == 'started' then return 'qb' end   -- renamed QBCore
    if GetResourceState('qbx_core') == 'started' then return 'qbx' end      -- before qb-core: qbx ships a qb-core bridge
    if GetResourceState('qb-core') == 'started' then return 'qb' end
    if GetResourceState('es_extended') == 'started' then return 'esx' end
    return 'standalone'
end

-- the resource whose exports the bridge calls
function WarP.CoreName(fw)
    local core = Config.CoreResource
    if core and core ~= 'auto' then return core end
    return ({ qb = 'qb-core', qbx = 'qbx_core', esx = 'es_extended' })[fw] or 'qb-core'
end

-- ---------------------------------------------------------------- locale (web/locales/<code>.json - one file for Lua and the UI)
local strings
local function loadLocale(code)
    local raw = LoadResourceFile(WarP.Resource, ('web/locales/%s.json'):format(code))
    local ok, data = pcall(json.decode, raw or '')
    return ok and type(data) == 'table' and data or nil
end

function WarP.Strings()
    if not strings then
        strings = loadLocale(Config.Locale) or loadLocale('en') or {}
    end
    return strings
end

function WarP.L(key, ...)
    local s = WarP.Strings()[key] or key
    if select('#', ...) > 0 then return s:format(...) end
    return s
end

-- ---------------------------------------------------------------- options
-- built-in values < Config.Games[game][difficulty] < what the calling script passed
function WarP.BuildOptions(game, opts)
    local def = Config.Games[game]
    if not def or def.enabled == false then return nil end
    opts = type(opts) == 'table' and opts or {}
    local diff = opts.difficulty
    if diff ~= 'easy' and diff ~= 'normal' and diff ~= 'hard' then diff = Config.DefaultDifficulty or 'normal' end
    local out = {}
    for k, v in pairs(def[diff] or def.normal or {}) do out[k] = v end
    for k, v in pairs(opts) do
        if k ~= 'anim' and type(v) ~= 'function' then out[k] = v end
    end
    out.difficulty = diff
    return out
end

function WarP.IsGame(game)
    local def = type(game) == 'string' and Config.Games[game]
    return def and def.enabled ~= false or false
end

function WarP.EnabledGames()
    local list = {}
    for _, g in ipairs(WarP.Order) do
        if WarP.IsGame(g) then list[#list + 1] = g end
    end
    return list
end

function WarP.Debug(...)
    if Config.Debug then print(('^5[WarP Minigames]^7 %s'):format(table.concat({ ... }, ' '))) end
end
