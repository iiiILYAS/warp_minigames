fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'warp_minigames'
author 'WarP Scripts · discord.gg/w4p'
description '16 minigames with one API - QBCore · Qbox · ESX · Standalone'
version '1.0.0'

shared_scripts {
    'config.lua',
    'shared/main.lua',
}

client_scripts {
    'bridge/client.lua',
    'client/main.lua',
}

server_scripts {
    'bridge/server.lua',
    'server/main.lua',
}

ui_page 'web/index.html'

files {
    'web/index.html',
    'web/css/*.css',
    'web/js/*.js',
    'web/fonts/*',
    'web/locales/*.json',
}

escrow_ignore {
    'config.lua',
    'bridge/*.lua',
    'web/locales/*.json',
}
