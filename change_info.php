<?php require_once "setup.php";
// $user = R::load('users', array($json->id));
$user = R::load('users', $json->id);
if ($user) {
    switch($json->change) {
        case "nick":
            $check_nick = R::count('users', 'nick = ?', array($json->new_nick));
            if (!$check_nick) { // если никнейм свободен
                if ($user->cash > 0) { // если cash больше чем 0
                    $user->nick = $json->new_nick;
                    $user->cash -= 1;
                    R::store(($user));
                    echo json_encode([
                        "type" => "AJAX",
                        "action" => "complete",
                        "action2" => "nickname has been changed"
                    ]);
                }
                else {
                    echo json_encode([
                        "type" => "ERROR",
                        // "action" => "not enough cash",
                        "action" => "че ахуел где бабосы"
                    ]);
                }

            }
            else {
                echo json_encode([
                    "type" => "ERROR",
                    "action" => "nickname is busy"
                ]);
            }

        break;
    }
}


?>