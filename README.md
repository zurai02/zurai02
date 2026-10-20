<img width="800" height="50" alt="typing-banner-orange (2)" src="https://github.com/user-attachments/assets/903ae8a0-d113-45e7-bfcb-4815b689cee6" /><img width="854" height="130" alt="banner-orange (3)" src="https://github.com/user-attachments/assets/cd253dd9-7d34-49a9-bbfc-bbc0c1443d03" />

![Uploadin<!-- https://github.com/DenverCoder1/readme-typing-svg/ -->
g typing-banner-orange (2).svg…]()

---

### About Me
I am a Roblox developer specializing in backend systems, secure data handling, and optimized network structures. I write clean, modular, and memory-efficient **Luau** code designed to scale seamlessly in large-scale experiences.

- **Ask me about:** Roblox Luau, Client-Server Replication, Object-Oriented Programming (OOP).
- **Workflow Tools:** Roblox Studio, VS Code, Git, Rojo.

### Portfolio

<a href="https://zurai02.is-a.dev" target="_blank" rel="noopener noreferrer">
  <img width="399" height="300" alt="Portfolio Preview" src="https://github.com/user-attachments/assets/13c320e4-0e43-47a9-b9ba-015795c4ab93" />
</a>

Visit the live site: **[zurai02.is-a.dev](https://zurai02.is-a.dev)**

---

### Code Architecture Showcases
*Since this is my primary portfolio page, here are the direct implementation structures of systems I design:*

#### 1. Modern ModuleScript Pattern (OOP)
```lua
--!strict
local PlayerService = {}
PlayerService.__index = PlayerService

type PlayerData = {
    UserId: number,
    Points: number,
    Inventory: {string}
}

function PlayerService.new(player: Player): PlayerData
    local self = setmetatable({}, PlayerService)
    
    self.UserId = player.UserId
    self.Points = 0
    self.Inventory = {}
    
    return self
end

function PlayerService:AddPoints(amount: number)
    self.Points += amount
    -- Fire secure RemoteEvent to replicate to client safely here
end

return PlayerService
```

#### 2. Network Replication & Event Safety
```lua
--!strict
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local NetworkEvent = ReplicatedStorage:WaitForChild("NetworkEvent") as RemoteEvent

-- Secure server-side validation handler
NetworkEvent.OnServerEvent:Connect(function(player: Player, actionType: string)
    if typeof(actionType) ~= "string" then return end -- Anti-exploit type check
    
    if actionType == "RequestPurchase" then
        -- Process server-validated transaction logic safely
        print(player.Name .. " requested a verified purchase.")
    end
end)
```

---

### Live GitHub Analytics

<p align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=zurai02&show_icons=true&theme=tokyonight" alt="zurai02's GitHub stats" height="160" />
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=zurai02&layout=compact&theme=tokyonight" alt="Top Languages" height="160" />
</p>

---

### Let's Connect
* **Website & Portfolio:** [zurai02.is-a.dev](https://zurai02.is-a.dev)
* **Roblox Developer Forum:** [Roblox DevForum Portfolio](https://devforum.roblox.com/t/zurai02-scripting-portfolio/4679442)
* **Availability:** Open for freelance script optimization, framework design, and game system engineering.

<img width="854" height="120" alt="asets" src="https://github.com/user-attachments/assets/b3541b3f-bf98-410d-9209-1e5f846a2394" />
