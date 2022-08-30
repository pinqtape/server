const HyperExpress = require("hyper-express");
const server = new HyperExpress.Server();
server.listen(process.env.PORT || 7777 ) + console.log("server started, port 7777");
const request = require('request');


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
                server.publish(ws.topics[0], message);
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
                setTimeout(() => EVENTS.respawn(ws, json) , Math.random() * (1000 - 500) + 500);
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
                weapon: info.weapon
            },
            players: {},
            score: {
                red: 0,
                blue: 0
            },
            start: false
        };

        ROOMS.join_room(ws, room_id) // вызываю метод войти в комнату после того как комната создана
    }

    join_room(ws, room) {
        this[room]["players"][ws.id] = { // создаю обьект игрока в комнате
            clan: ws.clan,
            lvl: ws.lvl,
            nick: ws.nick,
            kills: 0,
            deaths: 0,
            team : this.get_team(room),
            id_base: ws.id_base
        };
        EVENTS.subscribe(ws, room); // подписываю

        server.publish(room, JSON.stringify({
                type: "joined",
                action: this[room],
                action2: ws.id
        })); // броадкаст
        console.log(this[room])
    }

    leave_room(ws) {
        const roomID = ws.room_id;
        if (roomID in this) {
            delete this[roomID]["players"][ws.id];

            const answer = {
                type: "INFO",
                action: "LEAVE",
                action2: ws.id
            };
            ws.send(JSON.stringify(answer));
            server.publish(roomID, JSON.stringify(answer));

            EVENTS.subscribe(ws, "LOBBY");
            // if (server.num_of_subscribers(roomID) < 1) {
            //     delete this[roomID]
            //     console.log("room delete (players was 0)")
            // };
            
             
        }
        else EVENTS.subscribe(ws, "LOBBY");
    }
 
    is_full(room) {
        const curPlayers = server.num_of_subscribers(room);
        const maxPlayers = this[room]["info"]["max_players"];
        return curPlayers >=  maxPlayers;
    }

    get_team(room) {
        const TEAMS = this[room]["players"];
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
        const roomID = ws.topics[0];
        const playerDead = json.action;
        const playerKill = json.action2;

        if (playerDead != playerKill) { // если убитый игрок и игрок который убил не равны по ID  
            const teamKill = this[roomID]["players"][playerKill]["team"]; // чья команда убила
            this.add_points(roomID, teamKill, playerKill);
            this.is_room_end(roomID, teamKill) 
            EVENTS.publish(roomID, "STATE", this[roomID]);
            EVENTS.ajax("add_info", {
                type: "add_kill_dead",
                who_kill: USERS[playerKill]["id_base"],
                who_dead: USERS[playerDead]["id_base"],
                exp: json.action2
            });
        } 
        else {
            EVENTS.ajax("add_info", {
                type: "add_dead",
                who_dead: USERS[playerDead]["id_base"]
            })
        }

        this[roomID]["players"][playerDead]["deaths"] += 1; // +1 смерть
        EVENTS.publish(roomID, "STATE", this[roomID]); // броадкаст инфы
        
    }

    add_points(roomID, teamkill, playerKill) {
        this[roomID]["score"][teamkill] += 1; // +1 команде
        this[roomID]["players"][playerKill]["kills"] += 1; // +1 игроку
    }

    is_room_end(roomID, teamKill) { // если чьято команда выйграла
        const score = this[roomID]["score"][teamKill];
        const points = this[roomID]["info"]["points"];
        if (score >= points) {
            EVENTS.publish(roomID, "TEAM_WIN", teamKill);
            this.winner_players("win_tour", roomID, teamKill);
            setTimeout(() => { delete this[roomID]; }, 5000); // через 5 сек удаляется комната
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
        // console.log(players_win);

        EVENTS.ajax("add_info", {
            type: url,
            team_win: players_win
        });
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
