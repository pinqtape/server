const axios = require('axios');
const HyperExpress = require("hyper-express");
const server = new HyperExpress.Server();
//server.listen(process.env.PORT || 6400 ) + console.log("server started, port 6400");
//const ws_url = "http://localhost/my_php/";
const ws_url = "http://www.endless-conflict.online/";
server.listen("http://www.endless-conflict.online/" || 6400 ) + console.log("server started, port 6400");

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
                else EVENTS.send(ws, "ERROR", "room does not exist");
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

            case "GET_ONEROOM": {
                if (json.roomID in ROOMS) {
                    ws.send(JSON.stringify({
                        type: "GET_ONEROOM",
                        action: ROOMS[json.roomID]["players"],
                        action2: json.roomID
                    }))
                } 
                else EVENTS.send(ws, "ERROR", "room does not exist");
                break;
            }

            case "PING": {
                EVENTS.send(ws, "PING", json.action);
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
                ROOMS.flag(ws, json);
                break;
            }

            case "BOOST": {
                ROOMS.take_boost(ws.room_id, json);
                break;
            }

            case "CONNECT": {
                USERS.add_user(ws, json);
                break;
            }

            case "AJAX": {
                EVENTS.ajax(ws, json.url, json);
                break;
            }

            case "GET_ONLINE": {
                EVENTS.send(ws, "GET_ONLINE", USERS.get_online());
                break;
            }

        };
    });
     
    ws.on("close", (code, message) => {
        EVENTS.disconnect(ws)
    });
});
const EVENTS = {
    ajax: (ws, url, json) => { 
        const POST = async () => {
        try {
            const resp = await axios.post(ws_url+url+".php", JSON.stringify(json));
            if (ws != "") {
                ws.send(JSON.stringify(resp.data))
            }
            // console.log(resp.data);
        } catch (err) {
            console.error(err);
        }
    };
        POST();
        // console.log("POST: " + ws_url+url+".php")
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
            ws.alive = 1;
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
        this.online =0;
    }

    add_user(ws, json) {
        ws.id = GET_UID("player"); // присвоение айди
        this[ws.id] = ws
        
        ws.nick = json.nick;
        ws.id_base = json.id_base;
        ws.room_id = "LOBBY";
        ws.clan = json.clan;
        ws.lvl = json.lvl;
        ws.alive = 1; // 1 жив, 0 мёртв
         
        this.add_user_array(ws);
        ws.subscribe("LOBBY");

        ws.send(JSON.stringify({
            type: "user_created",
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
        this.online = Object.keys(this.ARRAY_USERS).length
        // console.log(this.ARRAY_USERS)
        // console.log(this.online)
        console.log("new user (added)");
    }

    delete_user(ws) {
        delete this.USERS[ws.id];
        delete this.ARRAY_USERS[ws.id]; // в лобби
    }

    get_users() {
        return this.ARRAY_USERS;
    }

    get_online() {
        return this.online;
    }

    is_alive(ID) {
        if (this[ID]["alive"] > 0) {
            this[ID]["alive"] = 0;
            return true;
        }
        else {
            return false;
        }; 
    }
};
USERS = new Users();

class Rooms {
    create_room(ws, json) {
        const room_id = GET_UID("room");
        const info = json.action;

        this[room_id] = {
            info: {
                name: info.name,
                map: info.map, 
                mode: info.mode,
                cur_players: 0,
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
        if (info.mode == "CTF") {
            this[room_id]["flag"] = {
                red: -1,
                blue: -1
            }
        }
        SERVER_INFO.add_room(room_id)
        ROOMS.join_room(ws, room_id) // вызываю метод войти в комнату после того как комната создана
        //console.log(this[room_id])
    }

    join_room(ws, roomID) {
        const getTeam = this[roomID]["info"]["mode"] != "DM" ? this.get_team(roomID) : "red"
        this[roomID]["players"][ws.id] = { // создаю обьект игрока в комнате
            clan: ws.clan,
            lvl: ws.lvl,
            nick: ws.nick,
            kills: 0,
            deaths: 0,
            team : getTeam,
            id_base: ws.id_base
        }
        this[roomID]["info"]["cur_players"] += 1;
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
            this[roomID]["info"]["cur_players"] -= 1;
            EVENTS.subscribe(ws, "LOBBY");

            ws.send(JSON.stringify(answer));
            server.publish(roomID, JSON.stringify(answer)); 

            SERVER_INFO.delete_object(roomID, ws.id);
            if (this[roomID]["info"]["cur_players"] < 1) {
                delete this[roomID]
                console.log("room delete (players was 0)")
            }
        }
        else {
            EVENTS.subscribe(ws, "LOBBY");
            ws.send(JSON.stringify(answer));
        };
    }
 
    is_full(roomID) {
        const curPlayers = this[roomID]["info"]["cur_players"];
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
        if (USERS.is_alive(playerDead)) {
            if (playerDead != playerKill) { // если убитый игрок и игрок который убил не равны ID 
                const teamKill = this[roomID]["players"][playerKill]["team"]; // чья команда убила
                const countKill = SERVER_INFO.time_kill(roomID, playerKill); // добавление мультикила  тому кто убил
                this.add_points(roomID, teamKill, playerKill);
                this.is_room_end(roomID, teamKill, playerKill);
                json.action4 = countKill;
                EVENTS.ajax("", "add_info", {
                    type: "add_kill_dead",
                    who_kill: USERS[playerKill]["id_base"],
                    who_dead: USERS[playerDead]["id_base"],
                    mnojitel: countKill
                });
        }
        else {
            EVENTS.ajax("", "add_info", {
                type: "add_dead",
                who_dead: USERS[playerDead]["id_base"]
            });
        };
            server.publish(roomID, JSON.stringify(json));
            this[roomID]["players"][playerDead]["deaths"] += 1; // +1 смерть
            EVENTS.publish(roomID, "STATE", this[roomID]); // броадкаст инфы
        }

    }

    add_points(roomID, teamKill, playerKill) {
        this[roomID]["players"][playerKill]["kills"] += 1; // +1 игроку
        if (this[roomID]["score"][teamKill] != "undefined") { // если есть путь к команде
            if (this[roomID]["info"]["mode"] != "CTF") {
                this[roomID]["score"][teamKill] += 1; // +1 команде
            }
        }
    }

    is_room_end(roomID, teamKill, playerKill) { // если чьято команда выйграла
        let score = 0;
        let points = this[roomID]["info"]["points"];
        if (this[roomID]["info"]["mode"] != "DM") {
            score = this[roomID]["score"][teamKill];
        } else {
            score = this[roomID]["players"][playerKill]["kills"];
        };
        if (score >= points) {
            if (this[roomID]["info"]["mode"] != "DM") {
                EVENTS.publish(roomID, "END_GAME", teamKill);
            } else {
                EVENTS.publish(roomID, "END_GAME", playerKill);
            };
            this.winner_players("win_tour", roomID, teamKill);
            setTimeout(() => { SERVER_INFO.delete_room(roomID); }, 5000); // через 5 сек удаляется комната
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

        EVENTS.ajax("", "add_info", {
            type: url,
            team_win: players_win
        });
    }

    flag(ws, json) {
        const roomID = ws.room_id;
        const playerID = ws.id;
        switch (json.action) {
            case "TAKE_FLAG": {
                // где не равно -1 значит флаг занят 
                if (this[roomID]["flag"][json.action3] == -1) {
                    this[roomID]["flag"][json.action3] = playerID;
                    server.publish(roomID, JSON.stringify(json));
                    console.log("TAKE FLAG: " + JSON.stringify(this[roomID]["flag"]));
                } else {
                    console.log("flag have own");
                };
                break;
            }

            case "LOST_FLAG": {
                this[roomID]["flag"][json.action3] = -1
                server.publish(roomID, JSON.stringify(json));
                console.log("LOST FLAG: " + JSON.stringify(this[roomID]["flag"]));
                break;
            }

            case "DONES_FLAG": {
                // json.action3 = команда игрока который донёс
                const fhe = json.action3 == "red" ? "blue" : "red";
                this[roomID]["flag"][fhe] = -1;

                const teamPoint = json.action3;
                this[roomID]["score"][teamPoint] += 1;

                this.is_room_end(roomID, teamPoint);

                server.publish(roomID, JSON.stringify(json));
                EVENTS.publish(roomID, "STATE", this[roomID]); // броадкаст инфы
                EVENTS.ajax("", "add_info", {
                    type: "add_flag",
                    who_flag: USERS[ws.id]["id_base"]
                });
                break;
            }

            case "RETURN_FLAG": {
                this[roomID]["flag"][json.action3] = -1
                server.publish(roomID, JSON.stringify(json));
                console.log("LOST FLAG: " + JSON.stringify(this[roomID]["flag"]));
                break;
            }
        }
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
            setTimeout(() => ROOMS.spawn_boost(roomID, boost) , (40000 - 30000) + 30000);
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
        this.chatevery = 0;
    }

    add_message(ws, json) {
        if (ws != "system") {
            this.chatevery += 1;
            this.CHAT.push({
                id: ws.id,
                id_base: ws.id_base,
                clan: ws.clan,
                nick: ws.nick,
                msg: json.action
            });
            if (this.chatevery >= 10) {
                this.add_message("system", "");
                this.chatevery = 0;
            };
        } else { 
            this.CHAT.push({
                id: -1,
                id_base: -1,
                clan: "MOD",
                nick: "",
                msg: "[color=red]Don't give your password to anyone! Real moderators will never ask you for a password![/color]"
            });
        };
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

function GET_UID(type) { // генерация айди
    function getRandInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function shuffle(list) {
        for (let i = list.length - 1; i > 0; i--) {
            const j = getRandInt(0, i);
            [list[i], list[j]] = [list[j], list[i]];
        } 
        return list;
}
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const list = shuffle(chars.split(""));
    let result = "";
    for (let i = 0; i < 4; i++) result += list[i];

    if (type == "player") {
        if (result in USERS) return GET_UID();
        else return result;
    }
    else {
        if (result in ROOMS) return GET_UID();
        else return result;
    }

}
