<?php require_once "setup.php";

$user = R::findOne("users", "id = ?", array($json->id));
if ($user) { 
    echo json_encode([
        "type" => "AJAX",
        "url" => "get_profile",
        "action" => [
            "id" => $user->id,
            "clan" => $user->clan,
            "nick" => $user->nick,
            "lvl" => $user->lvl,
            "exp" => $user->exp,
            "money" => $user->money,
            "cash" => $user->cash,
            "kills" => $user->kills,
            "deaths" => $user->deaths,
            "flags" => $user->flags,
            // "tours" => $user->tours,
            // "weapon" => $user->weapon
            ]
    ]);
}

?>