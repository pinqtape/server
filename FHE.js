const HyperExpress = require("hyper-express");
const server = new HyperExpress.Server();
server.listen(process.env.PORT || 7777 ) + console.log("server started, port 7777");
const request = require('request');

// process.on('uncaughtException', function(error) {
//     console.log(error)
// });


server.ws("/*", (ws) => {
    ws.on("message", (message) => { const json = JSON.parse(message);
        switch (json.type) {
            case "MOVE": {
                ws.publish(ws.topics[0], message);
                break;
            }

            case "FIRE": {
                ws.publish(ws.topics[0], message);
                break;
            }

            case "INFO": { 
                server.publish(ws.topics[0], message);
                break;
            }

            case "CREATE": {
                ROOMS.create_room(ws, json);
                break;
            }

            case "JOIN": {
                if (json.action in ROOMS) { // если комната есть 
                    if (ROOMS.is_full(json.action)) {
                        EVENTS.send(ws, "ERROR", "room is full");
                    }
                    else ROOMS.join_room(ws, json.action);
                }
                else EVENTS.send(ws, "ERROR", "there is no active room");
                break;
            }

            case "LEAVE": {
                ROOMS.leave_room(ws);
                break;
            }

            case "RESPAWN": {
                EVENTS.respawn(ws, json);
                break;
            }

            case "DEATH": {
                ROOMS.death(ws, json);
                break;
            }

            case "GET_ROOMS": {
                EVENTS.send(ws, "GET_ROOMS", ROOMS);
                break;
            }

            case "CONNECT": {
                USERS.add_user(ws, json);
                break;
            }

            case "PING": {
                EVENTS.send(ws, "PING", "")
                break;
            }

            case "CHAT": { // изменить на INFO
                CHAT.add_message(ws, json)
                break;
            }

            case "GET_CHAT": { // изменить на INFO
                EVENTS.send(ws, "GET_CHAT", CHAT.get_chat());
                break;
            }

            case "GET_PLAYERS": {
                EVENTS.send(ws, "GET_PLAYERS", USERS.get_users());
                break;
            }

            case "NEW_SPAWN": {
                setTimeout(() => EVENTS.respawn(ws, json) , 5000);
                break;
            }

            case "FLAG": {
                server.publish(ws.room_id, message);
                switch (json.action) {     
                    case "DONES_FLAG": {
                        ROOMS.dones_flag(ws, json);
                        break;
                    }

                    case "NNN": {
                        break;
                    }
                }
                break;
            }

            case "BOOST": {
                ROOMS.take_boost(ws.room_id, json);
                break;
            }

        };
    });
     
    ws.on("close", (code, message) => {
        EVENTS.disconnect(ws)
    });
});

const EVENTS = {
    ajax: (url, json) => {
        request.post({
            url: "http://localhost/" + url + ".php",
            form: JSON.stringify(json)
        })
        console.log("POST: " + JSON.stringify(json))
    },

    subscribe: (ws, room) => {
        ws.room_id = room;
        ws.alive = 0;

        ws.unsubscribe(ws.topics[0]);
        ws.subscribe(room);
    },

    disconnect: (ws) => {
        if (ws.id in USERS)  {
            if (ws.room_id != "LOBBY") { // если игрок находился в комнате
                ROOMS.leave_room(ws); // оповещение игроков о дисконекте игрока(если игрок в комнате)
                USERS.delete_user(ws); // удаление игрока из массива игроков
                console.log("user delete (was in room)");
            }
            else { // если игрок находился в лобби
                USERS.delete_user(ws);
                console.log("user delete (was in lobby)");
            };

        };
    },

    respawn: (ws, json) => {
        if (ws.topics[0] != "LOBBY") { // если игрок не в лобби
            json.type = "RESPAWN";
            server.publish(ws.topics[0], JSON.stringify(json));
            ws.room_alive = 0;
        }
    },

    message: (server, ws, json) => {
        setTimeout(() => { server.publish(ws.topics[0], JSON.stringify(json)); }, 250)
    },
    
    send: (ws, type, action) => { 
        const answer = {
            type: type,
            action: action
        }
        ws.send(JSON.stringify(answer));       
    },

    publish: (room, type, action) => {
        const answer = {
            type: type,
            action: action
        }
        server.publish(room, JSON.stringify(answer));
    },

};

class Users {
    constructor() {
        this.USERS = {};
        this.id = 0;
        this.ARRAY_USERS = {};
    }

    add_user(ws, json) {
        ws.id = this.id++; // присвоение айди
        this[ws.id] = ws
        
        ws.nick = json.nick;
        ws.id_base = json.id_base;
        ws.room_id = "LOBBY";
        ws.clan = json.clan;
        ws.lvl = json.lvl;
        ws.alive = 0;
         
        this.add_user_array(ws);
        ws.subscribe("LOBBY");

        ws.send(JSON.stringify({
            type: "complete",
            action: ws.id
        }))
        
    }

    add_user_array(ws) {
        this.ARRAY_USERS[ws.id] = {
            id_base: ws.id_base,
            nick: ws.nick,
            lvl: ws.lvl,
            clan: ws.clan
        }
        // console.log(this.ARRAY_USERS)
        console.log("new user (added)");
    }

    delete_user(ws) {
        delete this.USERS[ws.id];
        delete this.ARRAY_USERS[ws.id];
    }

    get_users() {
        return this.ARRAY_USERS;
    }

};
USERS = new Users();

class Rooms {
    constructor() {
        this.ID = 0;
    }

    create_room(ws, json) {
        const room_id = String(this.ID++);
        const info = json.action;

        this[room_id] = {
            info: {
                name: info.name,
                map: info.map, 
                mode: info.mode,
                cur_players: 1,
                max_players: info.max_players,
                points: info.points,
                money: info.money,
                cash: info.cash,
                allow_weapon: info.allow_weapon,
                boosts: info.boosts
            },
            players: {},
            score: {
                red: 0,
                blue: 0
            },
            start: false
        };
        SERVER_INFO.add_room(room_id)
        ROOMS.join_room(ws, room_id) // вызываю метод войти в комнату после того как комната создана
        console.log(this[room_id])
    }

    join_room(ws, roomID) {
        this[roomID]["players"][ws.id] = { // создаю обьект игрока в комнате
            clan: ws.clan,
            lvl: ws.lvl,
            nick: ws.nick,
            kills: 0,
            deaths: 0,
            team : this.get_team(roomID),
            id_base: ws.id_base
        };
        EVENTS.subscribe(ws, roomID); // подписываю
        SERVER_INFO.add_object(roomID, ws.id); // добавляю обьект инфы игрока
        server.publish(roomID, JSON.stringify({
                type: "joined",
                action: this[roomID],
                action2: ws.id
        }));
    }

    leave_room(ws) {
        const roomID = ws.room_id;
        const answer = {
            type: "INFO",
            action: "LEAVE",
            action2: ws.id
        };
        if (roomID in this) {
            delete this[roomID]["players"][ws.id];
            ws.send(JSON.stringify(answer));
            server.publish(roomID, JSON.stringify(answer));

            SERVER_INFO.delete_object(roomID, ws.id);
            EVENTS.subscribe(ws, "LOBBY");
            if (server.num_of_subscribers(roomID) < 1) { // если в комнате 0 человек комната удаляется (переделать под игроков в комнате без наблюдения)
                delete this[roomID]
                console.log("room delete (players was 0)")
            };
        }
        else {
            EVENTS.subscribe(ws, "LOBBY");
            ws.send(JSON.stringify(answer));
        };
    }
 
    is_full(roomID) {
        const curPlayers = server.num_of_subscribers(roomID);
        const maxPlayers = this[roomID]["info"]["max_players"];
        return curPlayers >=  maxPlayers;
    }

    get_team(roomID) {
        const TEAMS = this[roomID]["players"];
            let red = 0; // считает красных
            let blue = 0; // считает синих
            for (var s in TEAMS) {
                    if (TEAMS[s].team == "red") {
                        red++;
                    }
                    else {
                        blue++
                    }
            } 
            if (red <= blue) { // set red team
                return "red";
            }
            return "blue";

    }

    death(ws, json) {
        const roomID = ws.room_id;
        const playerDead = json.action;
        const playerKill = json.action2;
        if (playerDead != playerKill) { // если убитый игрок и игрок который убил не равны ID  
            const teamKill = this[roomID]["players"][playerKill]["team"]; // чья команда убила
            const countKill = SERVER_INFO.time_kill(roomID, playerKill); // добавление мультикила  тому кто убил
            
            if (this[roomID]["info"]["mode"] != "CTF") { // добавлять очко команде если режим не захват флага
                this.add_points(roomID, teamKill, playerKill);
            };
            this.is_room_end(roomID, teamKill);
            
            json.action4 = countKill;
            EVENTS.ajax("add_info", {
                type: "add_kill_dead",
                who_kill: USERS[playerKill]["id_base"],
                who_dead: USERS[playerDead]["id_base"],
                mnojitel: countKill
            });
        }
        else {
            EVENTS.ajax("add_info", {
                type: "add_dead",
                who_dead: USERS[playerDead]["id_base"]
            });
        };
        server.publish(roomID, JSON.stringify(json));

        this[roomID]["players"][playerDead]["deaths"] += 1; // +1 смерть
        EVENTS.publish(roomID, "STATE", this[roomID]); // броадкаст инфы
    }

    add_points(roomID, teamKill, playerKill) {
        this[roomID]["players"][playerKill]["kills"] += 1; // +1 игроку
        this[roomID]["score"][teamKill] += 1; // +1 команде
    }

    is_room_end(roomID, teamPoints) { // если чьято команда выйграла
        const score = this[roomID]["score"][teamPoints];
        const points = this[roomID]["info"]["points"];
        if (score >= points) {
            EVENTS.publish(roomID, "TEAM_WIN", teamPoints);
            this.winner_players("win_tour", roomID, teamPoints);
            setTimeout(() => { SERVER_INFO.delete_room(roomID);; }, 5000); // через 5 сек удаляется комната
        };
    }

    winner_players(url, roomID, teamKill) { // победители в команде 
        const players_win = {};
        Object.values(this[roomID]["players"]).forEach(player => {
            if (player.team == teamKill) {
                players_win[player.id_base] = {
                    money: this[roomID]["info"]["money"],
                    cash: this[roomID]["info"]["cash"]
                } 
            }
        });
        console.log(players_win);

        EVENTS.ajax("add_info", {
            type: url,
            team_win: players_win
        });
    }

    dones_flag(ws, json) {
        const roomID = ws.room_id;
        const teamPoint = this[roomID]["players"][ws.id]["team"];
        this[roomID]["score"][teamPoint] += 1;
        this.is_room_end(roomID, teamPoint);
        EVENTS.publish(roomID, "STATE", this[roomID]); // броадкаст инфы
    }

    take_boost(roomID, json) {
        const roomBoosts = this[roomID]["info"]["boosts"];
        const takeBoost = json.action2;
        if (takeBoost in roomBoosts) {
            server.publish(roomID, JSON.stringify({
                type: "BOOST",
                action: "TAKE",
                id: takeBoost,
                frame: json.action3,
                value: json.action4,
                player: json.action5
            }));
            const boost = {
                id: takeBoost,
                frame: roomBoosts[takeBoost]
            };
            delete roomBoosts[takeBoost];
            this[roomID]["info"]["boosts"] = roomBoosts;
            setTimeout(() => ROOMS.spawn_boost(roomID, boost) , (8000 - 4000) + 4000);
        }

    }

    spawn_boost(roomID, boost) {
        if (roomID in this) {
            const roomBoosts = this[roomID]["info"]["boosts"];
            roomBoosts[boost["id"]] = boost["frame"];
            this[roomID]["info"]["boosts"] = roomBoosts;
            server.publish(roomID, JSON.stringify({
                type: "BOOST",
                action: "SPAWN",
                id: boost["id"],
                frame: boost["frame"]
            }));
        };
    }
};
ROOMS = new Rooms();

 class Chat {
    constructor() {
        this.CHAT = []
    }

    add_message(ws, json) {
        this.CHAT.push({
            id: ws.id,
            id_base: ws.id_base,
            nick: ws.nick,
            msg: json.action
        });
        if (this.CHAT.length > 49) {
            this.CHAT.splice(0, 1);
        };
        EVENTS.publish("LOBBY", "GET_CHAT", this.get_chat());
    }

    get_chat() {
        return Object.assign({}, this.CHAT);
    }
};
CHAT = new Chat();

class ServerInfo {
    constructor() {
        this.SERVER_INFO = {}
    }

    add_room(roomID) {
        this[roomID] = {};
    }

    add_object(roomID, playerID) {
        this[roomID][playerID] = {
            LastKill: 0,
            countKill: 0
        };
    }

    delete_room(roomID) {
        delete ROOMS[roomID];
        delete this[roomID];
        console.log(this, ROOMS)
    }

    delete_object(roomID, playerID) {
        if (roomID in this) {
            delete this[roomID][playerID];
        };
    }

    time_kill(roomID, playerID) {  
        if (this[roomID][playerID]["LastKill"] + 5000 > Date.now()) {
            this[roomID][playerID]["countKill"] += 1
            const count = this[roomID][playerID]["countKill"];
            this[roomID][playerID]["countKill"] = count; // добавляю +1 к мультикилу
            if (count > 10) {
                this[roomID][playerID]["countKill"] = 10;
            };
            this[roomID][playerID]["LastKill"] = Date.now();
            return this[roomID][playerID]["countKill"];
        }
        else {
            this[roomID][playerID]["countKill"] = 1;
            this[roomID][playerID]["LastKill"] = Date.now()
            return 1;
        };
    }
};
SERVER_INFO = new ServerInfo();
