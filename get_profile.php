<?php require_once "setup.php";

$user = R::findOne("users", "id = ?", array($json->id));
switch($json->type) {
    case "get_profile":
        if ($user) {
            echo json_encode([
                "type" => "get_profile",
                "action" => [
                    "id" => $user->id,
                    "clan" => $user->clan,
                    "nick" => $user->nickname,
                    "lvl" => $user->lvl,
                    "exp" => $user->exp,
                    "money" => $user->money,
                    "cash" => $user->cash,
                    "kills" => $user->kills,
                    "deaths" => $user->deaths,
                    "flags" => $user->flags,
                    // "tours" => $user->tours,
                    "weapon" => $user->weapon
            
                ]
            ]);
        } else {
            echo json_encode([
                "type" => "ERROR",
                "action" => "user not found"
            ]);
        }
    break;

    case "info":
        if ($user) {
            echo json_encode([
                "type" => "info",
                "action" => [
                    "id" => $user->id,
                    "lvl" => $user->lvl,
                    "exp" => $user->exp,
                    "money" => $user->money,
                    "cash" => $user->cash
                ]
            ]);
        }
    break;
}







?>