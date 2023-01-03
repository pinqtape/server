const HyperExpress = require("hyper-express");
const server = new HyperExpress.Server();
server.listen(process.env.PORT || 6400) + console.log("server started, port 6400");
const axios = require('axios');

const ws_url = "http://localhost:7777/endless-conflict.online/my_php/";

// process.on('uncaughtException', function(error) {
//     console.log(error)
// });

server.ws("/*", (ws) => {
    setTimeout(() => USERS.not_auth(ws), 1000); // on connect
    ws.on("message", (message) => { const json = JSON.parse(message);
        switch (json.type) {
            case "MOVE": {
                ws.publish(ws.roomID, message);
                break;
            }

            case "FIRE": {
                ws.publish(ws.roomID, message);
                break;
            }

            case "INFO": { 
                server.publish(ws.roomID, message);
                break;
            }

            case "CREATE": {
                ROOMS.create_room(ws, json);
                break;
            }

            case "JOIN": {
                // json.action айди комнаты 
                // json.actino2 параметр вхождения
                if (json.action in ROOMS) { // если комната есть 
                    if (ROOMS.is_full(json.action, json.action2)) {
                        ROOMS.join_room(ws, json.action, json.action2);
                    } else {
                        EVENTS.send(ws, "ERROR", "room is full");
                    }
                } else EVENTS.send(ws, "ERROR", "room does not exist");
                break;
            }

            case "LEAVE": {
                ROOMS.leave_room(ws);
                break;
            }

            case "DEATH": {
                ROOMS.death(ws, json);
                break;
            }

            case "GET_ROOMS": {
                EVENTS.send(ws, "GET_ROOMS", ROOMS.get_rooms());
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

            case "PRIVATE_CHAT": { // изменить на INFO
                USERS.private_chat(ws, json);
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

            case "RESPAWN": {
                if (json.action == "RESPAWN") { // если зашел в комнату
                    EVENTS.respawn(ws, json); 
                } else {                       // если убили
                    setTimeout(() => EVENTS.respawn(ws, json) , Math.random() * (5000 - 2500) + 2500);
                }
                break;
            }

            case "FLAG": {
                ROOMS.flag(ws, json);
                break;
            }

            case "BOOST": {
                ROOMS.take_boost(ws.roomID, json);
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
        const POST = async () => { try {
            const answer = await axios.post(ws_url+url+".php", JSON.stringify(json));
            if (ws != "") { // если запрос нужно отправить игроку
                // console.log(answer.data)
                ws.send(JSON.stringify(answer.data))
                if (answer.data.type == "auth") {
                    USERS.add_user(ws, answer.data.action);
                }
            }
        } catch (err) {
            // console.error(err);
        }
    };
        POST();
        // console.log("POST: " + ws_url+url+".php" + JSON.stringify(json, 4, null))
    },

    subscribe: (ws, room) => {
        ws.topics.forEach(name => ws.unsubscribe(name));
        ws.subscribe(room);
        ws.roomID = room;
        // ws.alive = 0;
    },

    disconnect: (ws) => {
        if (ws.id in USERS)  {
            if (ws.roomID != "LOBBY") { // если игрок находился в комнате
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
        if (ws.roomID != "LOBBY") { // если игрок не в лобби
            json.type = "RESPAWN";
            server.publish(ws.roomID, JSON.stringify(json));
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
        this.online = 0;
        this.ARRAY_USERS = [];
    }

    add_user(ws, json) {
        // if (json.id in this) this.kick(this[json.id]); // кикает игрока если этот айди уже есть в массиве
        ws.id = json.id;
        this[ws.id] = ws;
        ws.roomID = "LOBBY";
        ws.nick = json.nick;
        ws.clan = json.clan;
        ws.lvl = json.lvl;
        ws.alive = 1; // 1 жив, 0 мёртв

        this.add_user_array(ws);
        EVENTS.subscribe(ws, "LOBBY");

        ws.send(JSON.stringify({
            type: "user_created",
            action: ws.id
        }));
    }

    add_user_array(ws) {
        this.ARRAY_USERS.push({
            id: ws.id,
            nick: ws.nick,
            lvl: ws.lvl,
            clan: ws.clan
        });
    }
 
    delete_user(ws) {
        delete this[ws.id];
        let index = 0;
        this.ARRAY_USERS.forEach(obj => {
            if (obj.id === ws.id) {
                this.ARRAY_USERS.splice(index, 1)
            };
            index++;
        });
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

    kick(ws) {
        EVENTS.send(ws, "ERROR", "kick");
        EVENTS.disconnect(ws);
        ws.destroy();
    }

    not_auth(ws) {
        if (String(ws.id) == "undefined") {
            ws.destroy();
            console.log("user session destroy(long deactive)");
        };
    }

    private_chat(ws, json) {
        if (json.action2 in this) {
            const user = this[json.action2];
            const msg = {
                id: ws.id,
                id_to: user.id,
                nick: ws.nick,
                nick_to: user.nick,
                msg: json.action
            };
            EVENTS.send(this[json.action2], "PRIVATE_CHAT", msg);
            EVENTS.send(ws, "PRIVATE_CHAT", msg);
        }
        else {
            EVENTS.send(ws, "ERROR", "the user has logged out of the game");
        };
    }
}; 
USERS = new Users();

class Rooms {
    create_room(ws, json) {
        const room_id = SERVER_INFO.add_room();
        const info = json.action; // обьект с настройками
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
            start: false,
            observers: 0
        };
        if (info.mode == "CTF") {
            this[room_id]["flag"] = {
                red: -1,
                blue: -1
            }
        }
        ROOMS.join_room(ws, room_id, "PLAYER") // вызываю метод войти в комнату после того как комната создана
    }

    join_room(ws, roomID, param) {
        if (param == "PLAYER") { // player
            const getTeam = this[roomID]["info"]["mode"] != "DM" ? this.get_team(roomID) : "red";
            this[roomID]["players"][ws.id] = { // создаю обьект игрока в комнате
                id: ws.id,
                clan: ws.clan,
                lvl: ws.lvl,
                nick: ws.nick,
                kills: 0,
                deaths: 0,
                team : getTeam
            };
            this.setANDget_countPlayers(roomID);
            EVENTS.subscribe(ws, roomID); // подписываю
            SERVER_INFO.add_object(roomID, ws.id); // добавляю обьект инфы игрока
            server.publish(roomID, JSON.stringify({
                    type: "joined",
                    action: this[roomID],
                    action2: ws.id,
                    date: getDate()
            }));
        } else { // spectator
            this[roomID]["observers"] += 1;
            EVENTS.subscribe(ws, roomID); // подписываю
            EVENTS.publish(roomID, "STATE", this[roomID]); // броадкаст инфы
            ws.send(JSON.stringify({
                type: "spectate",
                action: this[roomID],
                date: getDate()
            }));
        };
    }

    leave_room(ws) { 
        const roomID = ws.roomID;
        const answer = {
            type: "INFO",
            action: "LEAVE",
            action2: ws.id
        }; 
        if (roomID in this) {
            if (ws.id in this[roomID]["players"]) {
                delete this[roomID]["players"][ws.id];

                ws.send(JSON.stringify(answer));
                server.publish(roomID, JSON.stringify(answer)); 

                EVENTS.subscribe(ws, "LOBBY");
                SERVER_INFO.delete_object(roomID, ws.id);

                if (this.setANDget_countPlayers(roomID) < 1) {
                    // SERVER_INFO.delete_room(roomID);
                } 
            } else {
                if (this[roomID]["observers"] > 0) {
                    this[roomID]["observers"] -= 1;
                }
                EVENTS.subscribe(ws, "LOBBY");
                EVENTS.publish(roomID, "STATE", this[roomID]); // броадкаст инфы
                ws.send(JSON.stringify(answer));
            }
        } 
        else {
            ws.send(JSON.stringify(answer));
        }
    }
 
    is_full(roomID, mode) {
        if (mode == "PLAYER") {
            const curPlayers = this[roomID]["info"]["cur_players"];
            const maxPlayers = this[roomID]["info"]["max_players"];
            return curPlayers <  maxPlayers;
        } else {
            return this[roomID]["observers"] < 10; // если наблюдателей 9 или меньше то возвращает true
        }
    }

    get_team(roomID) {
        const TEAMS = this[roomID]["players"];
            let red = 0; // считает красных
            let blue = 0; // считает синих
            for (var index in TEAMS) {
                if (TEAMS[index].team == "red") red++;
                else blue++;
            };
            if (red <= blue) return "red"; // set red team
            return "blue";
    }

    death(ws, json) {
        const roomID = ws.roomID;
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
                    who_kill: USERS[playerKill]["id"],
                    who_dead: USERS[playerDead]["id"],
                    mnojitel: countKill
                });
        }
        else {
            EVENTS.ajax("", "add_info", {
                type: "add_dead",
                who_dead: USERS[playerDead]["id"]
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
            this.win_tour(roomID, teamKill);
            setTimeout(() => { SERVER_INFO.delete_room(roomID); }, 5000); // через 5 сек удаляется комната
        };
    }

    win_tour(roomID, teamKill) { // победители в команде
        EVENTS.ajax("", "add_info", {
            type: "win_tour",
            team_win: teamKill,
            money: this[roomID]["info"]["money"],
            cash: this[roomID]["info"]["cash"],
            players: this[roomID]["players"]
        });
    }

    flag(ws, json) {
        const roomID = ws.roomID;
        const playerID = ws.id;
        switch (json.action) {
            case "TAKE_FLAG": {
                // где не равно -1 значит флаг занят 
                if (this[roomID]["flag"][json.action3] == -1) {
                    this[roomID]["flag"][json.action3] = playerID;
                    server.publish(roomID, JSON.stringify(json));
                    // console.log("TAKE FLAG: " + JSON.stringify(this[roomID]["flag"]));
                } else {
                    // console.log("flag have own");
                };
                break;
            }

            case "LOST_FLAG": {
                this[roomID]["flag"][json.action3] = -1
                server.publish(roomID, JSON.stringify(json));
                // console.log("LOST FLAG: " + JSON.stringify(this[roomID]["flag"]));
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
                    who_flag: USERS[ws.id]["id"]
                });
                break;
            }

            case "RETURN_FLAG": {
                this[roomID]["flag"][json.action3] = -1
                server.publish(roomID, JSON.stringify(json));
                // console.log("LOST FLAG: " + JSON.stringify(this[roomID]["flag"]));
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

    get_rooms() {
        return this;
    }

    setANDget_countPlayers(roomID) {
        this[roomID]["info"]["cur_players"] = Object.keys(this[roomID]["players"]).length;
        return this[roomID]["info"]["cur_players"];
    }
};
ROOMS = new Rooms(); 

 class Chat {
    constructor() {
        this.CHAT = [{
            id: "WARNING",
            nick: "",
            msg: "[color=orangered]don't give your password to anyone! real moderators will never ask you for a password and other data of your account![/color]"
        }]
        this.chatevery = 0;
    }

    add_message(ws, json) { this.chatevery += 1;
        this.CHAT.push({
            id: ws.id,
            nick: ws.nick,
            msg: json.action
        });
        if (this.chatevery >= 10) {
            this.chatevery = 0;
            this.CHAT.push({
                id: "WARNING",
                nick: "",
                msg: "[color=orangered]Don't give your password to anyone! Real moderators will never ask you for a password and other data of your account![/color]"
            });
        }
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
        this.set_roomID = 0;
    }

    add_room() {
        const roomID = String(this.set_roomID++);
        this[roomID] = {};
        return roomID;
    }

    add_object(roomID, playerID) {
        this[roomID][playerID] = {
            LastKill: 0,
            countKill: 0
        };
    }

    delete_room(roomID) {
        if (roomID in ROOMS) {
            delete ROOMS[roomID];
            delete this[roomID];
        };
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

function getDate() {
    return new Date().toLocaleDateString();
};