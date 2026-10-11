<img width="854" height="130" alt="upper-asset" src="https://github.com/user-attachments/assets/2ce5216a-c109-420e-9b6b-99738a60a270" />![Uploading upper-asset.svg…](
      <svg
        width="854"
        height="130"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        style="z-index:1;position:relative"
        viewBox="0 0 854 130"
      >
        <style>
      .text {   font-size: 70px;   font-weight: 700;   font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;  } .desc {   font-size: 20px;   font-weight: 500;   font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;  } 
      .text, .desc {   animation: fadeIn 1.2s ease-in-out forwards;  } @keyframes fadeIn {   from {     opacity: 0;   }   to {     opacity: 1;   }  } 
    </style>
        
        
      <g transform="translate(427, 65) scale(1, 1) translate(-427, -65)">
        <path d="" fill="#00ffaa" opacity="0.4" >
          <animate
              attributeName="d"
              dur="20s"
              repeatCount="indefinite"
              keyTimes="0;0.333;0.667;1"
              calcmod="spline"
              keySplines="0.2 0 0.2 1;0.2 0 0.2 1;0.2 0 0.2 1"
              begin="0s"
              values="M0 0L 0 50Q 213.5 90 427 60T 854 85L 854 0 Z;M0 0L 0 75Q 213.5 90 427 70T 854 60L 854 0 Z;M0 0L 0 95Q 213.5 65 427 95T 854 60L 854 0 Z;M0 0L 0 50Q 213.5 90 427 60T 854 85L 854 0 Z">
          </animate>
        </path>
        <path d="" fill="#00ffaa" opacity="0.4" >
          <animate
            attributeName="d"
            dur="20s"
            repeatCount="indefinite"
            keyTimes="0;0.333;0.667;1"
            calcmod="spline"
            keySplines="0.2 0 0.2 1;0.2 0 0.2 1;0.2 0 0.2 1"
            begin="-10s"
            values="M0 0L 0 65Q 213.5 110 427 80T 854 90L 854 0 Z;M0 0L 0 80Q 213.5 50 427 50T 854 70L 854 0 Z;M0 0L 0 75Q 213.5 55 427 80T 854 95L 854 0 Z;M0 0L 0 65Q 213.5 110 427 80T 854 90L 854 0 Z">
          </animate>
        </path>
      </g>
         
        
      </svg>
    )


# 🛠️ Luau & Lua Systems Engineer | zurai02 👋

<p align="center">
  <img src="https://komarev.com" alt="zurai02's Profile Views" />
  <a href="https://roblox.com"><img src="https://shields.io" alt="DevForum Profile"></a>
</p>

---

### 🚀 About Me
I am a Roblox developer specializing in backend systems, secure data handling, and optimized network structures. I write clean, modular, and memory-efficient **Luau** code designed to scale seamlessly in large-scale experiences.

- 💬 **Ask me about:** Roblox Luau, Client-Server Replication, Object-Oriented Programming (OOP).
- ⚙️ **Workflow Tools:** Roblox Studio, VS Code, Git, Rojo.

---

### 💻 Code Architecture Showcases
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

### 📊 Live GitHub Analytics

<p align="center">
  <img src="https://vercel.app" alt="zurai02's GitHub stats" height="160" />
  <img src="https://vercel.app" alt="Top Langs" height="160" />
</p>

---

### 🔗 Let's Connect
* 🌐 **Roblox Developer Forum:** Check my community updates on the [Roblox DevForum Profile](https://devforum.roblox.com/t/zurai02-scripting-portfolio/4679442)
* 💼 **Availability:** Open for freelance script optimization, framework design, and game system engineering.


<img width="854" height="120" alt="asets" src="https://github.com/user-attachments/assets/b3541b3f-bf98-410d-9209-1e5f846a2394" />
