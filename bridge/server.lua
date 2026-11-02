-- WarP Minigames · server bridge  ·  discord.gg/w4p
-- Open file: permissions and notifications per framework.

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

function Bridge.HasPermission(src, group)
    if IsPlayerAceAllowed(src, 'warp_minigames.preview') or IsPlayerAceAllowed(src, 'command') then return true end
    local fw = WarP.Framework()
    local ok, allowed = pcall(function()
        if fw == 'qb' then
            return qb().Functions.HasPermission(src, group) or qb().Functions.HasPermission(src, 'god')
        elseif fw == 'qbx' then
            return IsPlayerAceAllowed(src, 'group.' .. group) or IsPlayerAceAllowed(src, 'group.god')
        elseif fw == 'esx' then
            local xPlayer = esx().GetPlayerFromId(src)
            local g = xPlayer and xPlayer.getGroup()
            return g == group or g == 'superadmin' or g == 'owner'
        end
        return IsPlayerAceAllowed(src, 'group.' .. group)
    end)
    return ok and allowed == true
end

function Bridge.Notify(src, message, kind)
    TriggerClientEvent('warp_minigames:client:notify', src, message, kind)
end
