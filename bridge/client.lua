-- WarP Minigames · client bridge  ·  discord.gg/w4p
-- Open file: change how notifications look on your server without touching the core.

Bridge = {}

local core
local function qb()
    if not core then core = exports[WarP.CoreName('qb')]:GetCoreObject() end
    return core
end

local function esx()
    if not core then core = exports[WarP.CoreName('esx')]:getSharedObject() end
    return core
end

local function system()
    local s = Config.Notify.system
    if s ~= 'auto' then return s end
    if GetResourceState('ox_lib') == 'started' then return 'ox' end
    local fw = WarP.Framework()
    return fw == 'standalone' and 'native' or fw
end

-- kind: 'success' | 'error' | 'inform'
function Bridge.Notify(message, kind)
    local s = system()
    if s == 'custom' and Config.Notify.custom then
        return Config.Notify.custom(message, kind)
    elseif s == 'ox' then
        return exports.ox_lib:notify({ description = message, type = kind })
    elseif s == 'qbx' then
        return exports[WarP.CoreName('qbx')]:Notify(message, kind)
    elseif s == 'qb' then
        return qb().Functions.Notify(message, kind == 'inform' and 'primary' or kind)
    elseif s == 'esx' then
        return esx().ShowNotification(message)
    end
    BeginTextCommandThefeedPost('STRING')
    AddTextComponentSubstringPlayerName(message)
    EndTextCommandThefeedPostTicker(false, true)
end
