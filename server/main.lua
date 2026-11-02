-- WarP Minigames · server  ·  discord.gg/w4p
--
-- Server-authoritative starts: the result comes back with a one-time token and a time check,
-- so a modder cannot fake a win with a triggered event. Use these for rewards.
--
--   local ok, info = exports.warp_minigames:Start(source, 'lock', { difficulty = 'hard', anim = 'lockpick' })
--   local ok, info = exports.warp_minigames:Sequence(source, { 'pipes', 'safe' })
--
-- Must be called inside a thread / event handler (it waits for the player).

local Pending = {}      -- [src] = { token, promise, started, min, game }

local function token()
    return ('%08x%08x%04x'):format(math.random(0, 0x7fffffff), GetGameTimer() & 0x7fffffff, math.random(0, 0xffff))
end

-- ---------------------------------------------------------------- cheat log
local function flag(src, why)
    local name = GetPlayerName(src) or '?'
    print(('^1[WarP Minigames] suspicious result^7 from %s (%d): %s'):format(name, src, why))
    TriggerEvent('warp_minigames:server:suspicious', src, why)
    local hook = Config.Security.webhook
    if hook and hook ~= '' then
        local ids = table.concat(GetPlayerIdentifiers(src) or {}, '\n')
        PerformHttpRequest(hook, function() end, 'POST', json.encode({
            username = 'WarP Minigames',
            embeds = { {
                title = 'Suspicious minigame result',
                color = 16731486,
                description = ('**%s** (ID %d)\n%s\n```%s```'):format(name, src, why, ids),
                footer = { text = 'WarP Scripts · discord.gg/w4p' },
            } },
        }), { ['Content-Type'] = 'application/json' })
    end
    if Config.Security.kick then DropPlayer(src, 'WarP Minigames: invalid result') end
end

-- ---------------------------------------------------------------- core
local function run(src, game, opts, isSequence)
    src = tonumber(src)
    if not src or not GetPlayerName(src) then return false, { reason = 'invalid' } end
    if Pending[src] then return false, { reason = 'busy' } end

    local steps = 1
    if isSequence then
        if type(game) ~= 'table' or #game == 0 then return false, { reason = 'invalid' } end
        steps = #game
    elseif not WarP.IsGame(game) then
        return false, { reason = 'invalid' }
    end

    local t = token()
    local p = promise.new()
    Pending[src] = { token = t, promise = p, started = GetGameTimer(), min = Config.Security.minTime * steps, game = game }
    TriggerClientEvent('warp_minigames:client:serverStart', src, t, game, opts or {}, isSequence == true)

    SetTimeout(Config.Security.timeout * 1000, function()
        local pd = Pending[src]
        if pd and pd.token == t then
            Pending[src] = nil
            p:resolve({ ok = false, info = { reason = 'timeout' } })
        end
    end)

    local res = Citizen.Await(p)
    local info = type(res.info) == 'table' and res.info or {}
    TriggerEvent('warp_minigames:server:finished', src, isSequence and 'sequence' or game, res.ok, info)
    return res.ok, info
end

RegisterNetEvent('warp_minigames:server:result', function(t, ok, info)
    local src = source
    local pd = Pending[src]
    if not pd then return flag(src, 'result with no game running') end
    if pd.token ~= t then return flag(src, 'wrong token') end
    Pending[src] = nil

    info = type(info) == 'table' and info or {}
    local elapsed = (GetGameTimer() - pd.started) / 1000
    if ok == true and elapsed < pd.min then
        flag(src, ('won in %.2fs (minimum %.2fs)'):format(elapsed, pd.min))
        ok, info.reason = false, 'too_fast'
    end
    info.time = elapsed
    WarP.Debug('server result', tostring(src), tostring(ok), tostring(info.reason))
    pd.promise:resolve({ ok = ok == true, info = info })
end)

AddEventHandler('playerDropped', function()
    local pd = Pending[source]
    if pd then
        Pending[source] = nil
        pd.promise:resolve({ ok = false, info = { reason = 'dropped' } })
    end
end)

exports('Start', function(src, game, opts) return run(src, game, opts, false) end)
exports('Sequence', function(src, list, opts) return run(src, list, opts, true) end)
exports('IsBusy', function(src) return Pending[tonumber(src)] ~= nil end)

-- ---------------------------------------------------------------- /minigames preview
if Config.Command.enabled then
    RegisterCommand(Config.Command.name, function(src, args)
        if src == 0 then return print('[WarP Minigames] use this command in game') end
        if not Config.Command.everyone and not Bridge.HasPermission(src, Config.Command.permission) then
            return Bridge.Notify(src, WarP.L('notify.no_permission'), 'error')
        end
        local game = args[1] and args[1]:lower() or nil
        local diff = args[2] and args[2]:lower() or nil
        if game and not WarP.IsGame(game) then
            return Bridge.Notify(src, WarP.L('notify.unknown_game', game), 'error')
        end
        TriggerClientEvent('warp_minigames:client:preview', src, game, diff)
    end, false)
end

-- ---------------------------------------------------------------- banner
CreateThread(function()
    Wait(500)
    print(([[

^7   ██╗    ██╗ █████╗ ██████╗ ██████╗
^7   ██║    ██║██╔══██╗██╔══██╗██╔══██╗
^7   ██║ █╗ ██║███████║██████╔╝██████╔╝
^7   ██║███╗██║██╔══██║██╔══██╗██╔═══╝
^7   ╚███╔███╔╝██║  ██║██║  ██║██║
^7    ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝
^5   MINIGAMES ^7v%s  ·  %d games  ·  framework: ^2%s^7
^7   discord.gg/w4p  ·  warp-scripts.pages.dev
]]):format(GetResourceMetadata(WarP.Resource, 'version', 0) or '1.0.0', #WarP.EnabledGames(), WarP.Framework()))
end)
