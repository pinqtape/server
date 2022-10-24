<?php require_once "setup.php";

$user = R::findOne("users", "email = ?", array($json->email)); // ищу польователя по имейлу

if ($user) { // если пользователь найден
    if (password_verify($json->password, $user->password)) { // если пороль совпадает с хешем в таблице
        $_SESSION["user"] = $user;

        // $ip = "188.162.250.109";
        // $user->address = ip2long($ip);
        // R::store($user);

        $cur_ip = getenv('REMOTE_ADDR');
        $user_ip = long2ip($user->address);
        
        if ($cur_ip == $user_ip) {
            echo json_encode([
                "type" => "complete",
                "action" => [
                    "id" => $user->id,
                    "clan" => $user->clan,
                    "nick" => $user->nickname,
                    "lvl" => $user->lvl,
                    "exp" => $user->exp,
                    "money" => $user->money,
                    "cash" => $user->cash
                ]
            ]);
        }
        else {
            echo json_encode([
                "type" => "ERROR",
                "action" => "Your IP address is incorrect"
            ]);
        };
        
    }
    else {
        echo json_encode([
            "type" => "ERROR",
            "action" => "invalid password"
        ]);
    }

}

else {
    echo json_encode([
        "type" => "ERROR",
        "action" => "invalid email"
    ]);
}

?>