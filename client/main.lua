-- WarP Minigames · client  ·  discord.gg/w4p
--
--   local ok, info = exports.warp_minigames:Start('lock', { difficulty = 'hard', anim = 'lockpick' })
--   local ok, info = exports.warp_minigames:Sequence({ 'pipes', { 'arrows', { difficulty = 'hard' } } })
--   exports.warp_minigames:StartAsync('safe', {}, function(ok, info) end)
--
-- Every blocking call must run inside a thread (CreateThread / an event handler).
-- Full list of exports and options: README.md

local Active        -- { id, promise, game, started }
local Seq = 0
local Gallery = false

-- ---------------------------------------------------------------- NUI setup
local function sendInit()
    SendNUIMessage({
        action = 'init',
        theme  = Config.Theme,
        ui     = Config.UI,
        escape = Config.Cancel.escape,
        locale = Config.Locale,
        strings = WarP.Strings(),
    })
end

RegisterNUICallback('ready', function(_, cb)
    sendInit()
    cb('ok')
end)

CreateThread(function()
    Wait(1000)
    sendInit()          -- the page may have loaded before this script (resource restart)
end)

-- ---------------------------------------------------------------- animations
local Anim = {}

local function loadDict(dict)
    if HasAnimDictLoaded(dict) then return true end
    RequestAnimDict(dict)
    local t = GetGameTimer() + 3000
    while not HasAnimDictLoaded(dict) and GetGameTimer() < t do Wait(0) end
    return HasAnimDictLoaded(dict)
end

local function loadModel(model)
    model = type(model) == 'string' and joaat(model) or model
    if not IsModelInCdimage(model) then return nil end
    RequestModel(model)
    local t = GetGameTimer() + 3000
    while not HasModelLoaded(model) and GetGameTimer() < t do Wait(0) end
    return HasModelLoaded(model) and model or nil
end

-- anim = 'hack' (a preset from Config.Animations) or { dict, clip, flag, prop = { model, bone, pos, rot } }
function Anim.start(anim)
    if type(anim) == 'string' then anim = Config.Animations[anim] end
    if type(anim) ~= 'table' or not anim.dict then return nil end
    local ped = PlayerPedId()
    local h = { dict = anim.dict, clip = anim.clip }
    if loadDict(anim.dict) then
        TaskPlayAnim(ped, anim.dict, anim.clip, 3.0, 3.0, -1, anim.flag or 49, 0, false, false, false)
    end
    local p = anim.prop
    if p and p.model then
        local model = loadModel(p.model)
        if model then
            local c = GetEntityCoords(ped)
            h.prop = CreateObject(model, c.x, c.y, c.z + 0.2, true, true, false)
            local pos, rot = p.pos or vec3(0, 0, 0), p.rot or vec3(0, 0, 0)
            AttachEntityToEntity(h.prop, ped, GetPedBoneIndex(ped, p.bone or 57005), pos.x, pos.y, pos.z, rot.x, rot.y, rot.z, true, true, false, true, 1, true)
            SetModelAsNoLongerNeeded(model)
        end
    end
    return h
end

function Anim.stop(h)
    if not h then return end
    local ped = PlayerPedId()
    if h.dict then StopAnimTask(ped, h.dict, h.clip, 2.0) end
    if h.prop and DoesEntityExist(h.prop) then DeleteEntity(h.prop) end
end

-- ---------------------------------------------------------------- core
local function finish(id, ok, reason, time)
    if not Active or Active.id ~= id then return end
    Active.promise:resolve({ ok = ok == true, reason = reason, time = time })
end

local function notifyResult(ok)
    if not Config.Notify.onResult then return end
    Bridge.Notify(WarP.L(ok and 'notify.win' or 'notify.fail'), ok and 'success' or 'error')
end

---@param game string
---@param opts? table
---@return boolean ok, table info  { game, difficulty, reason, time }
local function Start(game, opts)
    if Active then return false, { game = game, reason = 'busy' } end
    local o = WarP.BuildOptions(game, opts)
    if not o then
        print(('^1[WarP Minigames]^7 unknown or disabled game: %s'):format(tostring(game)))
        return false, { game = game, reason = 'invalid' }
    end

    Seq = Seq + 1
    local id = Seq
    Active = { id = id, promise = promise.new(), game = game, started = GetGameTimer() }
    local anim = Anim.start(type(opts) == 'table' and opts.anim)

    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'open', id = id, game = game, opts = o })
    WarP.Debug('start', game, o.difficulty)

    local res = Citizen.Await(Active.promise)
    SetNuiFocus(false, false)
    Anim.stop(anim)
    Active = nil

    local info = {
        game = game,
        difficulty = o.difficulty,
        reason = res.reason or (res.ok and 'success' or 'fail'),
        time = res.time or 0.0,
    }
    WarP.Debug('result', game, tostring(res.ok), info.reason, ('%.2fs'):format(info.time))
    notifyResult(res.ok)
    TriggerEvent('warp_minigames:client:finished', game, res.ok, info)
    return res.ok, info
end

-- list = { 'lock', { 'pipes', { difficulty = 'hard' } }, { game = 'safe', opts = {} } }
-- opts = { difficulty, anim, gap } apply to every step unless the step sets its own
local function Sequence(list, opts)
    if type(list) ~= 'table' or #list == 0 then return false, { reason = 'invalid' } end
    opts = type(opts) == 'table' and opts or {}
    local anim = Anim.start(opts.anim)
    local total = #list
    local info
    for i, step in ipairs(list) do
        local game, o = step, {}
        if type(step) == 'table' then game, o = step[1] or step.game, step[2] or step.opts or {} end
        local merged = {}
        for k, v in pairs(opts) do if k ~= 'anim' and k ~= 'gap' then merged[k] = v end end
        for k, v in pairs(o) do merged[k] = v end
        merged.stage = merged.stage or ('%d / %d'):format(i, total)
        local ok
        ok, info = Start(game, merged)
        if not ok then
            Anim.stop(anim)
            info.step, info.steps = i, total
            return false, info
        end
        if i < total then Wait(opts.gap or Config.SequenceGap) end
    end
    Anim.stop(anim)
    return true, { reason = 'success', steps = total, step = total, game = info and info.game }
end

-- pool = { 'lock', 'circle' } or nil for every enabled game
local function Random(pool, opts)
    pool = type(pool) == 'table' and #pool > 0 and pool or WarP.EnabledGames()
    local valid = {}
    for _, g in ipairs(pool) do if WarP.IsGame(g) then valid[#valid + 1] = g end end
    if #valid == 0 then return false, { reason = 'invalid' } end
    return Start(valid[math.random(#valid)], opts)
end

local function StartAsync(game, opts, cb)
    CreateThread(function()
        local ok, info = Start(game, opts)
        if cb then cb(ok, info) end
    end)
end

local function Cancel()
    if not Active then return false end
    SendNUIMessage({ action = 'close' })
    finish(Active.id, false, 'cancelled', 0.0)
    return true
end

exports('Start', Start)
exports('StartAsync', StartAsync)
exports('Sequence', Sequence)
exports('Random', Random)
exports('Cancel', Cancel)
exports('IsBusy', function() return Active ~= nil end)
exports('GetGames', WarP.EnabledGames)
exports('Play', Start)                       -- alias

-- event API (for scripts that prefer events over exports)
--   TriggerEvent('warp_minigames:client:start', 'lock', { difficulty = 'easy' }, function(ok, info) end)
AddEventHandler('warp_minigames:client:start', function(game, opts, cb)
    local ok, info = Start(game, opts)
    if type(cb) == 'function' or type(cb) == 'table' then cb(ok, info) end
end)

RegisterNUICallback('done', function(d, cb)
    cb('ok')
    if type(d) == 'table' and d.id then finish(d.id, d.ok, d.reason, tonumber(d.time)) end
end)

-- ---------------------------------------------------------------- cancel rules
CreateThread(function()
    while true do
        if Active then
            local ped = PlayerPedId()
            local why = (Config.Cancel.onDeath and IsEntityDead(ped) and 'died')
                or (Config.Cancel.onRagdoll and IsPedRagdoll(ped) and 'ragdoll')
            if why then
                SendNUIMessage({ action = 'close' })
                finish(Active.id, false, why, 0.0)
            end
            Wait(200)
        else
            Wait(1000)
        end
    end
end)

AddEventHandler('onResourceStop', function(res)
    if res ~= WarP.Resource then return end
    if Active or Gallery then SetNuiFocus(false, false) end
end)

-- ---------------------------------------------------------------- server-side starts (exports on the server)
RegisterNetEvent('warp_minigames:client:serverStart', function(token, game, opts, isSequence)
    local ok, info
    if Active then
        ok, info = false, { reason = 'busy' }
    elseif isSequence then
        ok, info = Sequence(game, opts)
    else
        ok, info = Start(game, opts)
    end
    TriggerServerEvent('warp_minigames:server:result', token, ok == true, info)
end)

RegisterNetEvent('warp_minigames:client:notify', function(message, kind)
    Bridge.Notify(message, kind)
end)

-- ---------------------------------------------------------------- gallery (/minigames)
local function openGallery(last)
    local list = {}
    for _, g in ipairs(WarP.EnabledGames()) do list[#list + 1] = g end
    Gallery = true
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'gallery', games = list, last = last, difficulty = Config.DefaultDifficulty })
end

RegisterNUICallback('galleryPick', function(d, cb)
    cb('ok')
    if type(d) ~= 'table' or not WarP.IsGame(d.game) then return end
    CreateThread(function()
        local ok = Start(d.game, { difficulty = d.difficulty })
        openGallery({ game = d.game, ok = ok })
    end)
end)

RegisterNUICallback('galleryClose', function(_, cb)
    cb('ok')
    Gallery = false
    if not Active then SetNuiFocus(false, false) end
end)

RegisterNetEvent('warp_minigames:client:preview', function(game, difficulty)
    if Active then return end
    if game and WarP.IsGame(game) then
        CreateThread(function()
            local ok, info = Start(game, { difficulty = difficulty })
            print(('[WarP Minigames] %s (%s) -> %s in %.2fs'):format(game, info.difficulty or '-', ok and 'PASSED' or 'FAILED', info.time or 0))
        end)
    else
        openGallery()
    end
end)
