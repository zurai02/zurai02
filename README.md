<img width="399" height="300" alt="images" src="https://github.com/user-attachments/assets/13c320e4-0e43-47a9-b9ba-015795c4ab93" />

<img width="800" height="50" alt="zurai02-typing (1)" src="https://github.com/user-attachments/assets/c850244d-4fe2-4b66-a3d1-8448dc6112cc" /><!-- https://github.com/DenverCoder1/readme-typing-svg/ -->
<svg xmlns='http://www.w3.org/2000/svg'
    xmlns:xlink='http://www.w3.org/1999/xlink'
    viewBox='0 0 800 50'
    style='background-color: #00000000;'
    width='800px' height='50px'>


                <path id='path0'>
                            <!-- Single line -->
                                <animate id='d0' attributeName='d' begin='0s;d2.end'
                    dur='4800ms' fill='remove'
                    values='m0,25 h0 ; m0,25 h800 ; m0,25 h800 ; m0,25 h0' keyTimes='0;0.66666666666667;0.83333333333333;1' />
                    </path>
    <text font-family='"Monospace", monospace' fill='#00ffaa' font-size='30'
        dominant-baseline='middle'
        x='50%' text-anchor='middle'
        letter-spacing='normal'>
        <textPath xlink:href='#path0'>
            zurai02 HERE!
        </textPath>
    </text>
        <path id='path1'>
                            <!-- Single line -->
                                <animate id='d1' attributeName='d' begin='d0.end'
                    dur='4800ms' fill='remove'
                    values='m0,25 h0 ; m0,25 h800 ; m0,25 h800 ; m0,25 h0' keyTimes='0;0.66666666666667;0.83333333333333;1' />
                    </path>
    <text font-family='"Monospace", monospace' fill='#00ffaa' font-size='27'
        dominant-baseline='middle'
        x='50%' text-anchor='middle'
        letter-spacing='normal'>
        <textPath xlink:href='#path1'>
             Creator | Innovator | Optimizer | Scripter and Coder
        </textPath>
    </text>
        <path id='path2'>
                            <!-- Single line -->
                                <animate id='d2' attributeName='d' begin='d1.end'
                    dur='4800ms' fill='remove'
                    values='m0,25 h0 ; m0,25 h800 ; m0,25 h800 ; m0,25 h0' keyTimes='0;0.66666666666667;0.83333333333333;1' />
                    </path>
    <text font-family='"Monospace", monospace' fill='#00ffaa' font-size='30'
        dominant-baseline='middle'
        x='50%' text-anchor='middle'
        letter-spacing='normal'>
        <textPath xlink:href='#path2'>
            Always Building Something New
        </textPath>
    </text>
</svg>



<img width="854" height="130" alt="upper-asset" src="https://github.com/user-attachments/assets/0ba54ef0-0724-413e-a303-2834cf7fc79f" />



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
