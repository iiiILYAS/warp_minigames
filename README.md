```
██╗    ██╗ █████╗ ██████╗ ██████╗
██║    ██║██╔══██╗██╔══██╗██╔══██╗
██║ █╗ ██║███████║██████╔╝██████╔╝
██║███╗██║██╔══██║██╔══██╗██╔═══╝
╚███╔███╔╝██║  ██║██║  ██║██║
 ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝   M I N I G A M E S
```

**16 minigames · one API · QBCore · Qbox · ESX · Standalone**
© WarP Scripts — [discord.gg/w4p](https://discord.gg/w4p) · [warp-scripts.pages.dev](https://warp-scripts.pages.dev)

---

## Install

1. Drop `warp_minigames` in your resources.
2. `ensure warp_minigames` in `server.cfg`.
3. Open `config.lua`: framework, language, colours, difficulty of every game.
4. In game: `/minigames` opens the gallery (admins), `/minigames safe hard` opens one game.

No SQL, no items, no dependencies. The framework is detected on its own.

## The games

| # | id | game | | # | id | game |
|---|----|------|-|---|----|------|
| 01 | `lock` | Lockpick | | 09 | `pipes` | Rewire |
| 02 | `circle` | Circle Lock | | 10 | `connect` | Patch The Line |
| 03 | `skill` | Skill Check | | 11 | `wires` | Wires |
| 04 | `thread` | Thread The Wire | | 12 | `knobs` | Calibration |
| 05 | `bars` | Other Side | | 13 | `safe` | Safe Cracker |
| 06 | `remember` | Remember | | 14 | `arrows` | Override |
| 07 | `count` | Count | | 15 | `pairs` | Match Pairs |
| 08 | `find` | Find Code | | 16 | `letters` | Firewall |

Every game has `easy`, `normal` and `hard` in `Config.Games`, and can be switched off with `enabled = false`.

---

## Linking it to your scripts

### Client — simple

```lua
-- inside a thread / event handler
local ok, info = exports.warp_minigames:Start('lock', { difficulty = 'hard', anim = 'lockpick' })
if ok then
    -- open the door
end
```

`info` = `{ game, difficulty, reason, time }` — `reason` is `success`, `fail`, `time`, `cancelled`, `died`, `busy` or `invalid`.

### Client — callback (no thread needed)

```lua
exports.warp_minigames:StartAsync('safe', { difficulty = 'easy' }, function(ok, info)
    print(ok, info.time)
end)
```

### Client — several games in a row

```lua
local ok, info = exports.warp_minigames:Sequence({
    'pipes',
    { 'arrows', { difficulty = 'hard' } },
    { game = 'safe', opts = { digits = 4 } },
}, { anim = 'hack' })
-- failed? info.step tells which one
```

### Client — a random game

```lua
local ok = exports.warp_minigames:Random({ 'lock', 'circle', 'skill' }, { difficulty = 'normal' })
```

### Server — for rewards (recommended)

The server sends the game with a one-time token and checks the time it took, so a modder cannot fake a win.

```lua
RegisterNetEvent('myheist:server:openVault', function()
    local src = source
    local ok, info = exports.warp_minigames:Start(src, 'safe', { difficulty = 'hard', anim = 'drill' })
    if not ok then return end
    -- give the reward here
end)

-- several in a row
local ok = exports.warp_minigames:Sequence(src, { 'pipes', 'wires', 'safe' }, { difficulty = 'hard' })
```

Forged results are logged in the console, sent to `Config.Security.webhook` and fire `warp_minigames:server:suspicious`.

### Every export

| side | export | returns |
|------|--------|---------|
| client | `Start(game, opts)` | `ok, info` |
| client | `StartAsync(game, opts, cb)` | — |
| client | `Sequence(list, opts)` | `ok, info` |
| client | `Random(pool, opts)` | `ok, info` |
| client | `Cancel()` | `true` if a game was closed |
| client | `IsBusy()` | `boolean` |
| client | `GetGames()` | list of enabled ids |
| client | `Play(game, opts)` | alias of `Start` |
| server | `Start(src, game, opts)` | `ok, info` |
| server | `Sequence(src, list, opts)` | `ok, info` |
| server | `IsBusy(src)` | `boolean` |

### Options you can pass

| key | what |
|-----|------|
| `difficulty` | `'easy'` / `'normal'` / `'hard'` |
| `anim` | a preset from `Config.Animations` (`hack`, `lockpick`, `keypad`, `phone`, `drill`, `mechanic`) or `{ dict, clip, flag, prop = { model, bone, pos, rot } }` |
| `title`, `hint`, `kicker` | your own texts on the card |
| `winText`, `winSub`, `failText` | your own texts on the result screen |
| `time` | seconds on the clock |
| `theme` | `{ accent = '#E6B04E' }` — any key of `Config.Theme`, for this game only |
| any game value | e.g. `pins = 8`, `digits = 4`, `rounds = 2` (see `Config.Games`) |

### Events

```lua
-- client: after every game
AddEventHandler('warp_minigames:client:finished', function(game, ok, info) end)
-- server: after every server-side start
AddEventHandler('warp_minigames:server:finished', function(src, game, ok, info) end)
-- client: start through an event instead of an export
TriggerEvent('warp_minigames:client:start', 'lock', { difficulty = 'easy' }, function(ok, info) end)
```

### Example — ox_target / qb-target

```lua
exports.ox_target:addBoxZone({
    coords = vec3(255.0, 225.0, 101.0), size = vec3(1, 1, 2),
    options = { {
        label = 'Hack the panel', icon = 'fas fa-laptop-code',
        onSelect = function()
            TriggerServerEvent('myheist:server:hackPanel')   -- the server calls exports.warp_minigames:Start(src, ...)
        end,
    } },
})
```

---

## Colours

Everything is in `Config.Theme`. Change `accent` only and the whole UI follows (text on the accent switches to black or white by itself).

## Languages

`web/locales/en.json` and `ar.json` (Arabic turns the card right-to-left). Copy one, translate it, set `Config.Locale` to its name.

## Preview in a browser

Serve the `web` folder with any local web server and open `index.html` — buttons for every game appear in the top-left.
Extra: `?g=safe&d=hard`, `?gallery=1`, `?lang=ar`, `?accent=E6B04E`.

## Fonts

Chakra Petch, Inter, JetBrains Mono and Tajawal — all under the SIL Open Font License (licence files in `web/fonts`).

---

**WarP Scripts** · Support & updates → **discord.gg/w4p**
