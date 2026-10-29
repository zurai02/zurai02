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
  </a>
  <img src="https://gitviews.com/user/zurai02.svg?style=flat-square&label-color=%23555555&color=%23ff6b35" alt="Profile Views" />
</p>

---

### About Me
I am a Roblox developer specializing in backend systems, secure data handling, and optimized network structures. I write clean, modular, and memory-efficient **Luau** code designed to scale seamlessly in large-scale experiences.

<iframe width="110" height="200" src="https://www.myinstants.com/instant/why-are-you-running-15312/embed/" frameborder="0" scrolling="no"></iframe>

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
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github-readme-stats.vercel.app/api?username=zurai02&show_icons=true&title_color=FF6B35&text_color=E5E7EB&icon_color=FF6B35&bg_color=00000000&border_color=FF6B354D&border_radius=12" />
    <source media="(prefers-color-scheme: light)" srcset="https://github-readme-stats.vercel.app/api?username=zurai02&show_icons=true&title_color=FF6B35&text_color=374151&icon_color=FF6B35&bg_color=00000000&border_color=FF6B354D&border_radius=12" />
    <img src="https://github-readme-stats.vercel.app/api?username=zurai02&show_icons=true&title_color=FF6B35&text_color=374151&icon_color=FF6B35&bg_color=00000000&border_color=FF6B354D&border_radius=12" alt="zurai02's GitHub stats" height="165" />
  </picture>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github-readme-stats.vercel.app/api/top-langs/?username=zurai02&layout=compact&title_color=FF6B35&text_color=E5E7EB&bg_color=00000000&border_color=FF6B354D&border_radius=12&langs_count=6" />
    <source media="(prefers-color-scheme: light)" srcset="https://github-readme-stats.vercel.app/api/top-langs/?username=zurai02&layout=compact&title_color=FF6B35&text_color=374151&bg_color=00000000&border_color=FF6B354D&border_radius=12&langs_count=6" />
    <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=zurai02&layout=compact&title_color=FF6B35&text_color=374151&bg_color=00000000&border_color=FF6B354D&border_radius=12&langs_count=6" alt="Top Languages" height="165" />
  </picture>
</p>
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://streak-stats.demolab.com/?user=zurai02&background=00000000&border=FF6B354D&stroke=FF6B35&ring=FF6B35&fire=FF6B35&currStreakNum=FF6B35&sideNums=E5E7EB&currStreakLabel=9CA3AF&sideLabels=9CA3AF&dates=9CA3AF&border_radius=12" />
    <source media="(prefers-color-scheme: light)" srcset="https://streak-stats.demolab.com/?user=zurai02&background=00000000&border=FF6B354D&stroke=FF6B35&ring=FF6B35&fire=FF6B35&currStreakNum=FF6B35&sideNums=374151&currStreakLabel=4B5563&sideLabels=4B5563&dates=6B7280&border_radius=12" />
    <img src="https://streak-stats.demolab.com/?user=zurai02&background=00000000&border=FF6B354D&stroke=FF6B35&ring=FF6B35&fire=FF6B35&currStreakNum=FF6B35&sideNums=374151&currStreakLabel=4B5563&sideLabels=4B5563&dates=6B7280&border_radius=12" alt="GitHub Streak Stats" height="165" />
  </picture>
</p>

---

### Let's Connect
* **Website & Portfolio:** [zurai02.is-a.dev](https://zurai02.is-a.dev)
* **Roblox Developer Forum:** [Roblox DevForum Portfolio](https://zurai02.is-a.dev/portfolio)
* **Availability:** Open for freelance script optimization, framework design, and game system engineering.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=FF6B35&height=120&section=footer" width="100%" alt="Footer Wave" />
</p>
