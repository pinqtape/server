<?php require_once "setup.php";

$user = R::findOne("users", "email = ?", array($json->email)); // ищу польователя по имейлу

if ($user) { // если пользователь найден
    if (password_verify($json->password, $user->password)) { // если пороль совпадает с хешем в таблице

        $_SESSION["user"] = $user;
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