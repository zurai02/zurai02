<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=FF6B35&height=130&section=header" width="100%" alt="Header Wave" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Monospace&size=27&duration=4800&pause=1000&color=FF6B35&center=true&vCenter=true&width=800&height=50&lines=zurai02+HERE!;Innovator+%7C+Optimizer+%7C+Scripter+and+Coder;Always+Building+Something+New" alt="Typing Animation" />
</p>

# Luau & Lua Systems Engineer | zurai02

<p align="center">
  <a href="https://zurai02.is-a.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/Website-zurai02.is--a.dev-FF6B35?style=flat-square&logo=google-chrome&logoColor=white" alt="Portfolio Website" />
  </a>
  <a href="https://zurai02.is-a.dev/portfolio" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/Roblox%20DevForum-zurai02-00A2FF?style=flat-square&logo=roblox&logoColor=white" alt="DevForum Profile" />
  </a>
  <a href="https://github.com/zurai02" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/GitHub-zurai02-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub Profile" />
  <img src="https://gitviews.com/user/zurai02.svg?style=modern&label-color=%23ff6b35&color=%23F9FAFB" alt="Github views." />

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
  <img src="https://github-readme-stats.vercel.app/api?username=zurai02&show_icons=true&title_color=FF6B35&text_color=5B514B&icon_color=FF6B35&bg_color=FFF7F2&hide_border=true&border_radius=12" alt="zurai02's GitHub stats" height="165" />
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=zurai02&layout=compact&title_color=FF6B35&text_color=5B514B&bg_color=FFF7F2&hide_border=true&border_radius=12&langs_count=6" alt="Top Languages" height="165" />
</p>
<p align="center">
  <img src="https://streak-stats.demolab.com/?user=zurai02&background=FFF7F2&border=FFF7F2&stroke=FF6B35&ring=FF6B35&fire=FF6B35&currStreakNum=FF6B35&sideNums=5B514B&currStreakLabel=5B514B&sideLabels=5B514B&dates=5B514B&hide_border=true&border_radius=12" alt="GitHub Streak Stats" height="165" />
</p>

---

### Let's Connect
* **Website & Portfolio:** [zurai02.is-a.dev](https://zurai02.is-a.dev)
* **Roblox Developer Forum:** [Roblox DevForum Portfolio](https://devforum.roblox.com/t/zurai02-scripting-portfolio/4679442)
* **Availability:** Open for freelance script optimization, framework design, and game system engineering.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=FF6B35&height=120&section=footer" width="100%" alt="Footer Wave" />
</p>
