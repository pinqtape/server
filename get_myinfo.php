<?php require_once "setup.php";
$user = R::findOne("users", "id = ?", array($json->id));
if ($user) {
    echo json_encode([
        "type" => "AJAX",
        "url" => "get_myinfo",
        "action" => [
            "id" => $user->id,
            "lvl" => $user->lvl,
            "exp" => $user->exp,
            "money" => $user->money,
            "cash" => $user->cash
        ]
    ]);
}
?>